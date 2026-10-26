import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

export type TtsConfig = { enabled: boolean; ollamaUrl: string; model: string; voice: string };
export const DEFAULT_CONFIG: TtsConfig = {
	enabled: false,
	ollamaUrl: "http://127.0.0.1:11434",
	model: "phonon:40m-multilingual",
	voice: "default",
};

const configPath = () => path.join(homedir(), ".pi", "agent", "tts.json");
export const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

export function normalizeOllamaUrl(value: string): string {
	let url: URL;
	try { url = new URL(value); } catch { throw new Error("Use an Ollama HTTP(S) URL, e.g. http://192.168.1.20:11434."); }
	if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password ||
		!["/", "/v1", "/v1/"].includes(url.pathname) || url.search || url.hash) {
		throw new Error("Use an HTTP(S) server address, optionally ending in /v1, without credentials or a query.");
	}
	return url.origin;
}

export async function loadConfig(): Promise<TtsConfig> {
	let file: unknown;
	try { file = JSON.parse(await fs.readFile(configPath(), "utf8")); }
	catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return { ...DEFAULT_CONFIG };
		throw new Error(`Cannot read ${configPath()}: ${errorMessage(error)}`);
	}
	if (!file || typeof file !== "object" || Array.isArray(file)) throw new Error(`Invalid TTS config at ${configPath()}. Run /tts reset.`);
	const config = { ...DEFAULT_CONFIG, ...file } as TtsConfig;
	if (typeof config.enabled !== "boolean" || typeof config.ollamaUrl !== "string" ||
		typeof config.model !== "string" || !config.model.trim() || typeof config.voice !== "string" || !config.voice.trim()) {
		throw new Error(`Invalid TTS config at ${configPath()}. Run /tts reset.`);
	}
	return { enabled: config.enabled, ollamaUrl: normalizeOllamaUrl(config.ollamaUrl), model: config.model.trim(), voice: config.voice.trim() };
}

export async function saveConfig(config: TtsConfig): Promise<void> {
	const target = configPath();
	await fs.mkdir(path.dirname(target), { recursive: true });
	const staged = `${target}.${randomUUID()}.tmp`;
	try {
		await fs.writeFile(staged, JSON.stringify(config, null, 2) + "\n", { flag: "wx", mode: 0o600 });
		await fs.rename(staged, target);
	} finally { await fs.rm(staged, { force: true }); }
}

/** Only accept a successfully completed assistant answer, never tool or thinking blocks. */
export function finalAnswerText(message: unknown): string {
	if (!message || typeof message !== "object") return "";
	const value = message as { role?: unknown; stopReason?: unknown; content?: unknown };
	if (value.role !== "assistant" || value.stopReason !== "stop" || !Array.isArray(value.content)) return "";
	if (value.content.some((block) => block?.type === "toolCall")) return "";
	return value.content.filter((block) => block?.type === "text" && typeof block.text === "string")
		.map((block) => block.text).join("\n\n");
}

/** Keep the answer's words (including code) while removing presentation markup. */
export function speechText(text: string): string {
	return text
		.replace(/<(think|thinking|analysis|reasoning)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, "")
		.replace(/<!--[^]*?(?:-->|$)/g, "")
		.replace(/^\s*(`{3,}|~{3,})[^\n]*$/gm, "")
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-+*]\s+)/gm, "")
		.replace(/(\*\*|__|~~|`)/g, "")
		.replace(/\n{3,}/g, "\n\n").trim();
}

/** Ollama accepts at most 4096 characters per speech request. Never truncate an answer. */
export function splitSpeech(text: string): string[] {
	const chunks: string[] = [];
	let rest = text.trim();
	while (rest.length > 4096) {
		const window = rest.slice(0, 4097);
		let end = window.lastIndexOf("\n\n", 4096);
		if (end < 2048) {
			end = 0;
			for (const match of window.matchAll(/[.!?]\s+/g)) {
				const boundary = match.index + 1;
				if (boundary <= 4096) end = boundary;
			}
		}
		if (end < 2048) end = Math.max(window.lastIndexOf(" ", 4096), window.lastIndexOf("\n", 4096));
		if (end < 2048) end = 4096;
		// Do not split a UTF-16 surrogate pair when a long word has no boundary.
		if (/[\uD800-\uDBFF]/.test(rest[end - 1])) end--;
		chunks.push(rest.slice(0, end).trim());
		rest = rest.slice(end).trim();
	}
	if (rest) chunks.push(rest);
	return chunks;
}

async function playWav(file: string, signal: AbortSignal): Promise<void> {
	signal.throwIfAborted();
	if (process.platform !== "darwin") throw new Error("TTS playback currently supports macOS (afplay) only.");
	await new Promise<void>((resolve, reject) => {
		const child = spawn("afplay", [file], { shell: false, stdio: ["ignore", "ignore", "pipe"], signal });
		let stderr = "";
		child.stderr.setEncoding("utf8");
		child.stderr.on("data", (chunk: string) => { stderr = (stderr + chunk).slice(-1000); });
		// Wait for close before deleting the file, including when cancellation kills the player.
		let failure: Error | undefined;
		child.once("error", (error) => { failure = error; });
		child.once("close", (code) => {
			if (signal.aborted) reject(signal.reason);
			else if (failure) reject(new Error(`Cannot start afplay: ${failure.message}`));
			else if (code !== 0) reject(new Error(`Audio playback failed: ${stderr.trim() || `afplay exited with ${code}`}`));
			else resolve();
		});
	});
}

export async function speak(text: string, config: TtsConfig, signal: AbortSignal): Promise<void> {
	signal.throwIfAborted();
	const directory = await fs.mkdtemp(path.join(tmpdir(), "pi-tts-"));
	try {
		for (const input of splitSpeech(speechText(text))) {
			signal.throwIfAborted();
			const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(300_000)]);
			const response = await fetch(`${config.ollamaUrl}/v1/audio/speech`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ model: config.model, voice: config.voice, input, response_format: "wav" }),
				signal: requestSignal,
			});
			if (!response.ok) {
				const detail = (await response.text()).slice(0, 500);
				throw new Error(`Ollama speech failed at ${config.ollamaUrl} (HTTP ${response.status})${detail ? `: ${detail}` : "."}`);
			}
			const audio = Buffer.from(await response.arrayBuffer());
			signal.throwIfAborted();
			if (audio.length <= 44 || audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") {
				throw new Error("Ollama returned no valid WAV audio. Check the speech model and server version.");
			}
			const file = path.join(directory, "answer.wav");
			await fs.writeFile(file, audio, { mode: 0o600 });
			await playWav(file, signal);
		}
	} finally { await fs.rm(directory, { recursive: true, force: true }); }
}
