import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { join } from "node:path";

export type SttConfig = {
	recorder: string;
	whisper: string;
	model: string;
	language: string;
	maxSeconds: number;
};

const DEFAULT_CONFIG: SttConfig = {
	recorder: join(homedir(), ".pi", "agent", "extensions", "stt", "macos-recorder"),
	whisper: "whisper-cli",
	model: join(homedir(), ".cache", "whisper", "ggml-small.bin"),
	language: "auto",
	maxSeconds: 300,
};
const CONFIG_PATH = join(homedir(), ".pi", "agent", "stt.json");

export function normalizeTranscript(value: string): string {
	return value
		.split("\n")
		.map((line) => line.replace(/^\s*\[[^\]]+\]\s*/, "").replace(/^\s*[-|>]\s*/, "").trim())
		.filter((line) => line && !/^whisper_(?:print|cli)/i.test(line))
		.join(" ")
		.replace(/\s+/g, " ")
		.trim();
}

export function buildWhisperArgs(config: SttConfig, audioPath: string): string[] {
	const args = ["-m", config.model, "-f", audioPath, "-nt"];
	if (config.language && config.language !== "auto") args.push("-l", config.language);
	return args;
}

async function loadConfig(): Promise<SttConfig> {
	let file: Partial<SttConfig> = {};
	try {
		file = JSON.parse(await readFile(CONFIG_PATH, "utf8")) as Partial<SttConfig>;
	} catch {
		// Defaults are valid without a config file.
	}
	const env = process.env;
	return {
		recorder: env.PI_STT_RECORDER || file.recorder || DEFAULT_CONFIG.recorder,
		whisper: env.PI_STT_WHISPER || file.whisper || DEFAULT_CONFIG.whisper,
		model: env.PI_STT_MODEL || file.model || DEFAULT_CONFIG.model,
		language: env.PI_STT_LANGUAGE || file.language || DEFAULT_CONFIG.language,
		maxSeconds: Math.max(1, Number(env.PI_STT_MAX_SECONDS || file.maxSeconds || DEFAULT_CONFIG.maxSeconds)),
	};
}

function commandExists(command: string): boolean {
	return command.includes("/") ? existsSync(command) : Boolean(process.env.PATH?.split(":").some((dir) => existsSync(join(dir, command))));
}

async function checkSetup(ctx: ExtensionCommandContext, config: SttConfig): Promise<boolean> {
	if (platform() !== "darwin") {
		ctx.ui.notify("Speech-to-text supports macOS only.", "error");
		return false;
	}
	const missing: string[] = [];
	if (!commandExists(config.recorder)) missing.push(`recorder: ${config.recorder}`);
	if (!commandExists(config.whisper)) missing.push(`whisper.cpp: ${config.whisper}`);
	if (!existsSync(config.model)) missing.push(`model: ${config.model}`);
	if (missing.length > 0) {
		ctx.ui.notify(
			`STT setup incomplete:\n${missing.join("\n")}\n\nRun /stt-setup or see ~/.pi/agent/extensions/stt/README.md.`,
			"error",
		);
		return false;
	}
	return true;
}

async function setup(ctx: ExtensionCommandContext): Promise<void> {
	const config = await loadConfig();
	const lines = [
		`platform: ${platform()}`,
		`recorder: ${commandExists(config.recorder) ? "ok" : "missing"} (${config.recorder})`,
		`whisper: ${commandExists(config.whisper) ? "ok" : "missing"} (${config.whisper})`,
		`model: ${existsSync(config.model) ? "ok" : "missing"} (${config.model})`,
		"",
		`Recorder: ${join(homedir(), ".pi", "agent", "extensions", "stt", "build-macos.sh")} (macOS only)`,
		"Install: brew install whisper-cpp",
		`Model: mkdir -p ${join(homedir(), ".cache", "whisper")} && curl -L -o ${join(homedir(), ".cache", "whisper", "ggml-small.bin")} https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin`,
		"Microphone: allow Terminal (or Pi host) in System Settings > Privacy & Security > Microphone.",
	];
	ctx.ui.notify(lines.join("\n"), missingSetup(config) ? "warning" : "info");
}

function missingSetup(config: SttConfig): boolean {
	return !commandExists(config.recorder) || !commandExists(config.whisper) || !existsSync(config.model);
}

export default function sttExtension(pi: ExtensionAPI): void {
	let recording: ChildProcessWithoutNullStreams | undefined;
	let audioPath: string | undefined;
	let stopping = false;

	const finishRecording = (): void => {
		if (!recording || stopping) return;
		stopping = true;
		recording.stdin.write("stop\n");
	};

	const cancelRecording = async (): Promise<void> => {
		if (!recording) return;
		stopping = true;
		recording.stdin.write("cancel\n");
		recording.kill("SIGTERM");
		await rm(audioPath ?? "", { force: true }).catch(() => undefined);
		recording = undefined;
		audioPath = undefined;
	};

	const transcribe = async (ctx: ExtensionCommandContext, path: string, config: SttConfig): Promise<void> => {
		ctx.ui.setStatus("stt", "Transcribing locally…");
		try {
			const child = spawn(config.whisper, buildWhisperArgs(config, path), { shell: false, stdio: ["ignore", "pipe", "pipe"] });
			let stdout = "";
			let stderr = "";
			child.stdout.on("data", (chunk) => (stdout += String(chunk)));
			child.stderr.on("data", (chunk) => (stderr += String(chunk)));
			const code = await new Promise<number>((resolve, reject) => {
				child.once("error", reject);
				child.once("close", (value) => resolve(value ?? 1));
			});
			if (code !== 0) throw new Error(stderr.trim() || `whisper.cpp exited with code ${code}`);
			const transcript = normalizeTranscript(stdout);
			if (!transcript) {
				ctx.ui.notify("No speech detected. Prompt unchanged.", "info");
				return;
			}
			ctx.ui.pasteToEditor(transcript);
			ctx.ui.notify("Transcript inserted.", "info");
		} finally {
			ctx.ui.setStatus("stt", undefined);
			await rm(path, { force: true }).catch(() => undefined);
		}
	};

	const startRecording = async (ctx: ExtensionCommandContext, config: SttConfig): Promise<void> => {
		if (!(await checkSetup(ctx, config))) return;
		if (recording) return;
		const tempDir = join(process.env.TMPDIR || "/tmp", "pi-stt");
		await mkdir(tempDir, { recursive: true });
		audioPath = join(tempDir, `recording-${Date.now()}.wav`);
		stopping = false;
		recording = spawn(config.recorder, ["record", "--output", audioPath, "--max-seconds", String(config.maxSeconds)], {
			shell: false,
			stdio: ["pipe", "pipe", "pipe"],
		});
		const child = recording;
		child.stderr.on("data", (chunk) => ctx.ui.setStatus("stt", String(chunk).trim() || "Recording…"));
		child.once("error", (error) => ctx.ui.notify(`Recording failed: ${error.message}`, "error"));
		child.once("close", async (code) => {
			const pathToTranscribe = audioPath;
			recording = undefined;
			audioPath = undefined;
			stopping = false;
			if (code === 0 && pathToTranscribe && existsSync(pathToTranscribe)) await transcribe(ctx, pathToTranscribe, config);
			else if (pathToTranscribe) await rm(pathToTranscribe, { force: true }).catch(() => undefined);
		});
		ctx.ui.setStatus("stt", "Recording… /stt to stop");
		ctx.ui.notify("Recording started. Run /stt again to stop.", "info");
	};

	const toggle = async (args: string, ctx: ExtensionCommandContext): Promise<void> => {
		const command = args.trim().toLowerCase();
		if (command === "setup" || command === "status") {
			await setup(ctx);
			return;
		}
		if (command === "cancel") {
			await cancelRecording();
			ctx.ui.notify("Recording canceled. Prompt unchanged.", "info");
			return;
		}
		if (recording) finishRecording();
		else await startRecording(ctx, await loadConfig());
	};

	pi.registerCommand("stt", { description: "Start/stop local macOS speech-to-text", handler: toggle });
	pi.registerCommand("stt-setup", { description: "Check local speech-to-text dependencies", handler: async (_args, ctx) => setup(ctx) });
	pi.registerCommand("stt-cancel", { description: "Cancel speech-to-text recording", handler: async (_args, _ctx) => cancelRecording() });
}
