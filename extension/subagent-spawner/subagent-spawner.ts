import type { AgentToolUpdateCallback, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir, tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

type SpawnArgs = {
	prompt: string;
	agent: string;
	model?: string;
	provider?: string;
	thinking?: "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
	tools?: string[];
	timeoutMs?: number;
	maxOutputChars?: number;
	progressIntervalMs?: number;
	recoverHandoff?: boolean;
	wrapUpMs?: number;
};

type ModelLike = {
	id?: string;
	name?: string;
	provider?: string;
};

type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

interface DispatchDefaults {
	model?: string;
	provider?: string;
	thinking?: ThinkingLevel;
	tools?: string[];
}

type ResolvedAgent = {
	name: string;
	instructions: string;
	triggers: string[];
	sourcePath: string;
	modelPreference?: string;
};

type ModelsConfig = {
	providers?: Record<string, { models?: Array<{ id?: string }> }>;
};

function toTextResult(text: string, details: Record<string, unknown> = {}) {
	return {
		content: [{ type: "text" as const, text }],
		details,
	};
}

function clampPositiveInt(value: unknown, fallback: number): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
	const intValue = Math.floor(value);
	return intValue > 0 ? intValue : fallback;
}

function trimOutput(text: string, maxChars: number): { text: string; truncated: boolean } {
	if (text.length <= maxChars) return { text, truncated: false };
	return {
		text: `${text.slice(0, maxChars)}\n\n[output truncated to ${maxChars} chars]`,
		truncated: true,
	};
}

function readRecoveryFile(filePath: string, maxChars: number) {
	let fd: number | undefined;
	try {
		const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0) | (fs.constants.O_NONBLOCK ?? 0);
		if (!fs.lstatSync(filePath).isFile()) return undefined;
		fd = fs.openSync(filePath, flags);
		const stat = fs.fstatSync(fd);
		if (!stat.isFile() || !stat.size) return undefined;
		const buffer = Buffer.alloc(Math.min(stat.size, maxChars * 4, 1024 * 1024));
		const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
		const preview = trimOutput(buffer.toString("utf8", 0, bytes).trim(), maxChars);
		if (!preview.text) return undefined;
		return { ...preview, truncated: preview.truncated || stat.size > bytes };
	} catch {
		return undefined;
	} finally {
		if (fd !== undefined) fs.closeSync(fd);
	}
}

function getPiInvocation(args: string[]): { command: string; args: string[] } {
	const currentScript = process.argv[1];
	const isBunVirtualScript = currentScript?.startsWith("/$bunfs/root/");
	if (currentScript && !isBunVirtualScript && fs.existsSync(currentScript)) {
		return { command: process.execPath, args: [currentScript, ...args] };
	}

	const execName = path.basename(process.execPath).toLowerCase();
	const isGenericRuntime = /^(node|bun)(\.exe)?$/.test(execName);
	if (!isGenericRuntime) {
		return { command: process.execPath, args };
	}
	return { command: "pi", args };
}

function getAgentBaseDir(): string {
	return process.env.PI_CODING_AGENT_DIR || path.join(homedir(), ".pi", "agent");
}

function getAgentsDir(): string {
	const userAgentsDir = path.join(homedir(), ".agents", "agents");
	if (fs.existsSync(userAgentsDir)) return userAgentsDir;
	return path.join(getAgentBaseDir(), "agents");
}

function getModelsConfigPath(): string {
	return path.join(getAgentBaseDir(), "models.json");
}

function loadSubagentEnabled(): boolean {
	const target = path.join(getAgentBaseDir(), "subagent.json");
	let config: unknown;
	try {
		config = JSON.parse(fs.readFileSync(target, "utf8"));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
		throw error;
	}
	if (!config || typeof config !== "object" || Array.isArray(config) ||
		typeof (config as { enabled?: unknown }).enabled !== "boolean") {
		throw new Error(`Invalid config at ${target}: expected { "enabled": true | false }.`);
	}
	return (config as { enabled: boolean }).enabled;
}

function saveSubagentEnabled(enabled: boolean): void {
	const target = path.join(getAgentBaseDir(), "subagent.json");
	fs.mkdirSync(path.dirname(target), { recursive: true });
	const staged = `${target}.${randomUUID()}.tmp`;
	try {
		fs.writeFileSync(staged, JSON.stringify({ enabled }, null, 2) + "\n", { flag: "wx", mode: 0o600 });
		fs.renameSync(staged, target);
	} finally {
		fs.rmSync(staged, { force: true });
	}
}

function normalizeProviderName(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function loadProviderIndex(): {
	byNormalizedName: Map<string, string>;
	configuredProviders: Set<string>;
	modelToProviders: Map<string, string[]>;
	modelAliasToCanonical: Map<string, string | null>;
} {
	const byNormalizedName = new Map<string, string>();
	const configuredProviders = new Set<string>();
	const modelToProviders = new Map<string, string[]>();
	const modelAliasToCanonical = new Map<string, string | null>();
	const registerAlias = (alias: string, canonical: string) => {
		const key = alias.trim().toLowerCase();
		if (!key) return;
		const existing = modelAliasToCanonical.get(key);
		if (existing === undefined) {
			modelAliasToCanonical.set(key, canonical);
			return;
		}
		if (existing !== canonical) {
			modelAliasToCanonical.set(key, null);
		}
	};
	const modelsPath = getModelsConfigPath();
	if (!fs.existsSync(modelsPath)) {
		return { byNormalizedName, configuredProviders, modelToProviders, modelAliasToCanonical };
	}
	try {
		const parsed = JSON.parse(fs.readFileSync(modelsPath, "utf-8")) as ModelsConfig;
		const providers = parsed.providers ?? {};
		for (const [providerName, cfg] of Object.entries(providers)) {
			byNormalizedName.set(normalizeProviderName(providerName), providerName);
			configuredProviders.add(providerName);
			for (const entry of cfg.models ?? []) {
				const modelId = typeof entry?.id === "string" ? entry.id.trim() : "";
				if (!modelId) continue;
				const existing = modelToProviders.get(modelId) ?? [];
				existing.push(providerName);
				modelToProviders.set(modelId, existing);
				registerAlias(modelId, modelId);
				const slashIndex = modelId.indexOf("/");
				if (slashIndex > 0 && slashIndex + 1 < modelId.length) {
					registerAlias(modelId.slice(slashIndex + 1), modelId);
				}
			}
		}
	} catch {
		// Ignore malformed config and fall back to runtime defaults.
	}
	return { byNormalizedName, configuredProviders, modelToProviders, modelAliasToCanonical };
}

function resolveModelProvider(
	modelInput: string | undefined,
	providerInput: string | undefined,
	options?: { providerPinned?: boolean },
): { model: string | undefined; provider: string | undefined } {
	const { byNormalizedName, configuredProviders, modelToProviders, modelAliasToCanonical } = loadProviderIndex();
	const normalizeProviderFromInput = (value: string | undefined): string | undefined => {
		if (!value) return undefined;
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		return byNormalizedName.get(normalizeProviderName(trimmed)) ?? trimmed;
	};

	const providerPinned = options?.providerPinned === true;
	let model = modelInput?.trim() || undefined;
	let provider = normalizeProviderFromInput(providerInput);
	if (!model) return { model, provider };

	const canonical = modelAliasToCanonical.get(model.toLowerCase());
	if (typeof canonical === "string" && canonical) {
		model = canonical;
	}

	const slashIndex = model.indexOf("/");
	if (slashIndex > 0) {
		const prefix = model.slice(0, slashIndex).trim();
		const remainder = model.slice(slashIndex + 1).trim();
		const normalizedPrefix = normalizeProviderFromInput(prefix);
		const prefixIsKnownProvider =
			normalizedPrefix !== undefined &&
			byNormalizedName.get(normalizeProviderName(prefix)) === normalizedPrefix;
		if (remainder && prefixIsKnownProvider) {
			model = remainder;
			if (!provider) provider = normalizedPrefix;
		}
	}

	if (!provider && model) {
		const providers = modelToProviders.get(model);
		if (providers && providers.length === 1) {
			provider = providers[0];
		}
	}

	if (model && provider && !providerPinned) {
		const modelProviders = modelToProviders.get(model) ?? [];
		const providerIsConfigured = configuredProviders.has(provider);
		const providerSupportsModel = modelProviders.includes(provider);
		if (modelProviders.length === 1 && (!providerIsConfigured || !providerSupportsModel)) {
			provider = modelProviders[0];
		}
	}

	return { model, provider };
}

function parseFrontmatterModel(markdown: string): string | undefined {
	const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
	if (!match) return undefined;
	for (const rawLine of match[1].split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim().toLowerCase();
		if (key !== "model") continue;
		const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
		return value || undefined;
	}
	return undefined;
}

function loadAgentInstructions(agentName: string): { instructions: string; sourcePath: string; modelPreference?: string } | null {
	if (!/^[a-z0-9][a-z0-9_-]*$/.test(agentName)) return null;
	const agentsDir = getAgentsDir();
	const mdPath = path.join(agentsDir, `${agentName}.md`);
	const jsonPath = path.join(agentsDir, `${agentName}.json`);

	if (fs.existsSync(mdPath)) {
		const instructions = fs.readFileSync(mdPath, "utf-8");
        const frontmatter = instructions.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
        if (!frontmatter || frontmatter[1].match(/^name:\s*([a-z0-9_-]+)\s*$/m)?.[1] !== agentName || !/^description:\s*\S.+$/m.test(frontmatter[1])) return null;
		return {
			instructions,
			sourcePath: mdPath,
			modelPreference: parseFrontmatterModel(instructions),
		};
	}
	if (fs.existsSync(jsonPath)) {
		try {
			const raw = fs.readFileSync(jsonPath, "utf-8");
			const parsed = JSON.parse(raw) as { name?: string; description?: string; instructions?: string; model?: string };
            if (parsed.name !== agentName || !parsed.description?.trim() || !parsed.instructions?.trim()) return null;
			const instructions = typeof parsed.instructions === "string" ? parsed.instructions : raw;
			return {
				instructions,
				sourcePath: jsonPath,
				modelPreference: typeof parsed.model === "string" ? parsed.model : undefined,
			};
		} catch {
			return null;
		}
	}
	return null;
}

function resolveAgentForTask(explicitAgent?: string): ResolvedAgent | null {
    const name = explicitAgent?.trim();
    if (!name) return null;
    const loaded = loadAgentInstructions(name);
    return loaded ? { name, ...loaded, triggers: [] } : null;
}

async function runSubagent(
	args: SpawnArgs,
	signal: AbortSignal | undefined,
	ctx: ExtensionContext,
	dispatchDefaults: DispatchDefaults,
	onUpdate?: AgentToolUpdateCallback,
) {
	const prompt = typeof args.prompt === "string" ? args.prompt.trim() : "";
	if (!prompt) {
		return toTextResult("spawnSubagent failed: `prompt` must be a non-empty string.", {
			ok: false,
			error: "invalid_prompt",
		});
	}

	const timeoutMs = Math.min(clampPositiveInt(args.timeoutMs, 120_000), 2_147_483_647);
	const maxOutputChars = clampPositiveInt(args.maxOutputChars, 20_000);
	const progressIntervalMs = Math.min(60_000, Math.max(1_000, clampPositiveInt(args.progressIntervalMs, 10_000)));
	const cwd = typeof ctx.cwd === "string" && ctx.cwd ? ctx.cwd : process.cwd();

	const activeModel = (ctx as ExtensionContext & { model?: ModelLike }).model;
	const inheritedModel = typeof activeModel?.id === "string" && activeModel.id.trim() ? activeModel.id.trim() : undefined;
	const inheritedProvider =
		typeof activeModel?.provider === "string" && activeModel.provider.trim() ? activeModel.provider.trim() : undefined;
	const resolvedAgent = resolveAgentForTask(args.agent);
    if (!resolvedAgent) {
        return toTextResult("spawnSubagent failed: supply an explicit valid `agent` filename stem selected using semantic SYSTEM.md routing.", { ok: false, error: "invalid_agent" });
    }
    if (signal?.aborted) return toTextResult("spawnSubagent was aborted before launch.", { ok: false, aborted: true });
	const explicitModel = typeof args.model === "string" && args.model.trim() ? args.model.trim() : undefined;
	const agentModelPreference =
		typeof resolvedAgent?.modelPreference === "string" && resolvedAgent.modelPreference.trim()
			? resolvedAgent.modelPreference.trim()
			: undefined;
	const agentRequestsInherit = typeof agentModelPreference === "string" && agentModelPreference.toLowerCase() === "inherit";
	const resolvedModel =
		explicitModel ??
		(agentModelPreference && !agentRequestsInherit ? agentModelPreference : undefined) ??
		dispatchDefaults.model ??
		inheritedModel;
	const resolvedProvider =
		typeof args.provider === "string" && args.provider.trim()
			? args.provider.trim()
			: (dispatchDefaults.provider ?? inheritedProvider);
	const normalized = resolveModelProvider(resolvedModel, resolvedProvider, {
		providerPinned: typeof args.provider === "string" && args.provider.trim().length > 0,
	});
	const finalModel = normalized.model;
	const finalProvider = normalized.provider;
	const resolvedThinking =
		typeof args.thinking === "string" && args.thinking.trim()
			? (args.thinking.trim() as ThinkingLevel)
			: dispatchDefaults.thinking;
	const resolvedTools =
		Array.isArray(args.tools) && args.tools.length > 0
			? args.tools
			: dispatchDefaults.tools;

	const recoverHandoff = args.recoverHandoff === true;
	const defaultWrapUpMs = Math.min(300_000, Math.floor(timeoutMs / 5));
	const wrapUpMs = recoverHandoff
		? Math.min(timeoutMs - 1, clampPositiveInt(args.wrapUpMs, defaultWrapUpMs))
		: 0;
	const cliArgs: string[] = ["-p", "--mode", "text"];
	if (finalProvider) {
		cliArgs.push("--provider", finalProvider);
	}
	if (finalModel) {
		cliArgs.push("--model", finalModel);
	}
	if (resolvedThinking) {
		cliArgs.push("--thinking", resolvedThinking);
	}
	if (Array.isArray(resolvedTools) && resolvedTools.length > 0) {
		const filtered = resolvedTools
			.filter((value): value is string => typeof value === "string")
			.map((value) => value.trim())
			.filter(Boolean);
		if (filtered.length > 0) {
			cliArgs.push("--tools", filtered.join(","));
		}
	}

	const scratchDir = fs.mkdtempSync(path.join(tmpdir(), "pi-subagent-spawner-"));
	const appendedPromptPath = path.join(scratchDir, `agent-${resolvedAgent.name}.md`);
	const checkpointPath = path.join(scratchDir, "checkpoint.md");
	const handoffPath = path.join(scratchDir, "handoff.md");
	const recoveryInstructions = recoverHandoff ? [
		"\n## Assignment recovery",
		`Initialize the checkpoint at ${checkpointPath} after loading required workflow instructions and before long-running work. Record the assignment, known state, and next action.`,
		"Update the checkpoint after meaningful steps. Record pending external changes before attempting them and the observed outcome afterward.",
		`Save the final report to ${handoffPath} before replying. Include completed work, exact revisions and checks when relevant, and any unfinished work or blockers. Keep the reply concise.`,
		"Write both scratch files atomically when supported. Use these spawner-supplied paths for this assignment. Keep credentials and sensitive logs out of both files.",
	].join("\n") : "";
	fs.writeFileSync(appendedPromptPath, `${resolvedAgent.instructions}\n\n## Delegated persona\nParent assigned ${resolvedAgent.name} for this task. Follow this persona; if selectAgent is available, select exactly ${resolvedAgent.name} to synchronize TUI before work. Do not infer another role from incidental task keywords.\n${recoveryInstructions}`, { encoding: "utf-8", mode: 0o600 });
	cliArgs.push("--append-system-prompt", appendedPromptPath);
	if (wrapUpMs) {
		cliArgs.push("--extension", fileURLToPath(new URL("./subagent-runtime/wrap-up.ts", import.meta.url)));
	}

	// The prompt is passed as an argument (no shell interpolation).
	cliArgs.push(prompt);

	const invocation = getPiInvocation(cliArgs);
	const startedAt = Date.now();
	const child = spawn(invocation.command, invocation.args, {
		cwd,
		stdio: ["ignore", "pipe", "pipe"],
		shell: false,
		env: wrapUpMs ? { ...process.env, PI_SUBAGENT_WRAP_UP_AT: String(startedAt + timeoutMs - wrapUpMs) } : undefined,
        detached: process.platform !== "win32",
	});

	let stdout = "";
	let stderr = "";
	let timedOut = false;
	let aborted = false;
	let settled = false;
	let stdoutChars = 0;
	let stderrChars = 0;
	let lastOutputAt: number | null = null;

    let escalation: ReturnType<typeof setTimeout> | undefined;
    let stopRequested = false;
    let outputTruncated = false;
	const reportProgress = () => {
		if (!onUpdate || settled) return;
		const elapsedMs = Date.now() - startedAt;
		const remainingMs = Math.max(0, timeoutMs - elapsedMs);
		const state = stopRequested ? "stopping" : "running";
		const activity = lastOutputAt === null ? "no output yet" : `last output ${Math.floor((Date.now() - lastOutputAt) / 1000)}s ago`;
		try {
			onUpdate(toTextResult(
				`${resolvedAgent.name}: ${state} (process activity only; task progress unverified). Elapsed ${Math.floor(elapsedMs / 1000)}s; timeout remaining ${Math.ceil(remainingMs / 1000)}s; stdout ${stdoutChars} chars, stderr ${stderrChars} chars; ${activity}.`,
				{ state, elapsedMs, remainingMs, timeoutMs, stdoutChars, stderrChars, lastOutputAt, timedOut, aborted, cwd,
					agent: { name: resolvedAgent.name, sourcePath: resolvedAgent.sourcePath },
					...(recoverHandoff ? { checkpointPath, handoffPath, wrapUpMs } : {}) },
			));
		} catch {
			// A progress renderer must not interrupt process management or lose the handoff.
		}
	};
    const sendSignal = (name: NodeJS.Signals) => {
        try {
            if (process.platform !== "win32" && child.pid) process.kill(-child.pid, name);
            else child.kill(name);
        } catch { /* Process already exited. */ }
    };
    const killChild = () => {
        if (settled || stopRequested) return;
        stopRequested = true;
        sendSignal("SIGTERM");
        escalation = setTimeout(() => sendSignal("SIGKILL"), 1000);
		reportProgress();
    };
    const timeout = setTimeout(() => {
        timedOut = true;
        killChild();
    }, Math.max(0, startedAt + timeoutMs - Date.now()));
    const onAbort = () => {
        aborted = true;
        killChild();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    if (signal?.aborted) onAbort();
	reportProgress();
	const progressTimer = onUpdate ? setInterval(reportProgress, progressIntervalMs) : undefined;
    child.stdout?.on("data", (chunk: Buffer | string) => {
        const text = String(chunk);
		stdoutChars += text.length;
		lastOutputAt = Date.now();
        if (stdout.length + text.length > maxOutputChars) outputTruncated = true;
        stdout += text.slice(0, Math.max(0, maxOutputChars - stdout.length));
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
        const text = String(chunk);
		stderrChars += text.length;
		lastOutputAt = Date.now();
        if (stderr.length + text.length > maxOutputChars) outputTruncated = true;
        stderr += text.slice(0, Math.max(0, maxOutputChars - stderr.length));
    });

	const exitCode = await new Promise<number | null>((resolve) => {
		child.on("close", (code) => {
			settled = true;
			resolve(code);
		});
		child.on("error", () => {
			settled = true;
			resolve(1);
		});
	});

	clearTimeout(timeout);
	if (progressTimer) clearInterval(progressTimer);
    if (stopRequested) sendSignal("SIGKILL"); // Reap remaining POSIX process-group members.
    if (escalation) clearTimeout(escalation);
	signal?.removeEventListener("abort", onAbort);
	try {
		fs.rmSync(appendedPromptPath, { force: true });
		fs.rmdirSync(scratchDir); // An assignment with saved evidence keeps its directory.
	} catch {
		// Cleanup is best-effort. Leave recovery files available to the coordinator.
	}

	const output = (stdout || stderr || "").trim();
	const trimmed = trimOutput(output, maxOutputChars);
    if (outputTruncated) {
        trimmed.truncated = true;
        trimmed.text += `\n\n[output truncated to ${maxOutputChars} chars]`;
    }
	const finalHandoff = recoverHandoff ? readRecoveryFile(handoffPath, maxOutputChars) : undefined;
	const checkpoint = recoverHandoff && !finalHandoff ? readRecoveryFile(checkpointPath, maxOutputChars) : undefined;
	const recovery = finalHandoff ?? checkpoint;
	const recoveryKind = finalHandoff ? "handoff" : "checkpoint";
	const recoveryPath = finalHandoff ? handoffPath : checkpointPath;
	const useRecovery = !!recovery && (timedOut || aborted || exitCode !== 0 || trimmed.truncated || !stdout.trim());
	const resultText = useRecovery && recovery
		? `Recovered ${recoveryKind} at ${recoveryPath}.${recovery.truncated ? " Preview is capped. Read the file for the full report." : ""}\n\n${recovery.text}`
		: trimmed.text || "(no output)";
	const metadata = {
		state: "exited",
		elapsedMs: Date.now() - startedAt,
		stdoutChars,
		stderrChars,
		lastOutputAt,
		ok: !timedOut && !aborted && exitCode === 0,
		exitCode,
		timedOut,
		aborted,
		truncated: trimmed.truncated,
		cwd,
		timeoutMs,
		maxOutputChars,
		...(recoverHandoff ? {
			checkpointPath,
			handoffPath,
			wrapUpMs,
			recovery: recovery ? { kind: recoveryKind, path: recoveryPath, truncated: recovery.truncated, used: useRecovery } : null,
		} : {}),
		model: finalModel ?? null,
		modelSource: explicitModel
			? "args"
			: agentModelPreference
				? (agentRequestsInherit ? "agent:inherit" : "agent:model")
				: (dispatchDefaults.model || inheritedModel ? "parent" : "none"),
		provider: finalProvider ?? null,
		thinking: resolvedThinking ?? null,
		tools: resolvedTools ?? null,
		agent: resolvedAgent
			? {
				name: resolvedAgent.name,
				sourcePath: resolvedAgent.sourcePath,
				triggers: resolvedAgent.triggers,
				modelPreference: resolvedAgent.modelPreference ?? null,
			}
			: null,
	};

	if (timedOut) {
		return toTextResult(
			`spawnSubagent timed out after ${timeoutMs}ms.\n\n${resultText}`,
			metadata,
		);
	}

	if (aborted) {
		return toTextResult(`spawnSubagent was aborted.\n\n${resultText}`, metadata);
	}

	if (exitCode !== 0) {
		if (/No API key found/i.test(trimmed.text)) {
			return toTextResult(
				`spawnSubagent failed: missing API key for the selected model/provider.\n\n${resultText}`,
				metadata,
			);
		}
		return toTextResult(
			`spawnSubagent failed (exit code ${exitCode ?? "unknown"}).\n\n${resultText}`,
			metadata,
		);
	}

	return toTextResult(resultText, metadata);
}

export default function subagentSpawnerExtension(pi: ExtensionAPI) {
	let subagentEnabled = false;

	pi.on("session_start", async (_event, ctx) => {
		try {
			subagentEnabled = loadSubagentEnabled();
		} catch (error) {
			subagentEnabled = false;
			ctx.ui.notify(`Cannot load subagent settings: ${error instanceof Error ? error.message : String(error)} Subagents are disabled. Use /subagent on or off to save a valid setting.`, "error");
		}
	});

	pi.registerCommand("subagent", {
		description: "Toggle or check saved subagent spawning status (on/off)",
		handler: async (args, ctx) => {
			const subcmd = (args || "").trim().toLowerCase();
			let nextEnabled = subagentEnabled;
			if (subcmd === "on" || subcmd === "enable" || subcmd === "1") {
				nextEnabled = true;
			} else if (subcmd === "off" || subcmd === "disable" || subcmd === "0") {
				nextEnabled = false;
			} else if (subcmd === "status") {
				// keep current state
			} else if (!subcmd) {
				nextEnabled = !subagentEnabled;
			} else {
				ctx.ui.notify(`Unknown argument: "${subcmd}". Usage: /subagent [on|off|status]`, "warning");
				return;
			}

			if (subcmd !== "status") {
				try {
					saveSubagentEnabled(nextEnabled);
				} catch (error) {
					ctx.ui.notify(`Cannot save subagent settings: ${error instanceof Error ? error.message : String(error)} Setting unchanged.`, "error");
					return;
				}
				subagentEnabled = nextEnabled;
			}

			const stateStr = subagentEnabled ? "enabled" : "disabled";
			ctx.ui.notify(`Subagent execution is now ${stateStr}.`, subagentEnabled ? "info" : "warning");
		},
	});

	(pi.registerTool as (tool: unknown) => unknown)({
		name: "spawnSubagent",
		label: "Spawn Subagent",
		description:
			"Run a child Pi agent for a focused task and return its output on exit. Reports process activity while waiting; updates are not completion evidence. Set an explicit timeout for slow/local models; timeout terminates the child.",
		promptSnippet: "Spawn a child Pi subagent for an isolated task",
		parameters: {
			type: "object",
			required: ["prompt", "agent"],
			properties: {
				prompt: {
					type: "string",
					description: "Instruction sent to the child Pi agent.",
				},
				model: {
					type: "string",
					description: "Optional model ID/pattern for the child agent.",
				},
				provider: {
					type: "string",
					description: "Optional provider for the child agent.",
				},
				thinking: {
					type: "string",
					enum: ["off", "minimal", "low", "medium", "high", "xhigh", "max"],
					description: "Optional thinking level.",
				},
				tools: {
					type: "array",
					items: { type: "string" },
					description: "Optional tool allowlist for the child agent (e.g. ['read','grep']).",
				},
				agent: {
					type: "string",
					description: "Required explicit agent filename stem. Choose semantically using SYSTEM.md; no keyword inference.",
				},
				timeoutMs: {
					type: "number",
					description: "Hard execution timeout in milliseconds (fallback 120000, maximum 2147483647). Set explicitly for the task and model speed; expiration terminates the child, not just the wait.",
				},
				maxOutputChars: {
					type: "number",
					description: "Optional output cap (default 20000 chars).",
				},
				progressIntervalMs: {
					type: "number",
					description: "Process activity update interval in milliseconds (default 10000, clamped to 1000–60000). Does not extend the execution timeout or create a background job.",
				},
			},
			recoverHandoff: {
				type: "boolean",
				description: "Enable for long assignments. Supplies private scratch paths for an initial checkpoint and final handoff, recovers saved evidence after exit if needed, and sends a wrap-up message before the hard timeout.",
			},
			wrapUpMs: {
				type: "number",
				description: "Optional lead time in milliseconds for the wrap-up message with recoverHandoff enabled. Defaults to 20% of timeoutMs, capped at five minutes. The hard timeout still applies.",
			},
		},
		async execute(
			_toolCallId: string,
			params: SpawnArgs,
			signal: AbortSignal | undefined,
			onUpdate: AgentToolUpdateCallback | undefined,
			ctx: ExtensionContext,
		) {
			if (!subagentEnabled) {
				return toTextResult(
					"spawnSubagent is currently disabled. Use `/subagent on` in interactive mode to enable it.",
					{ ok: false, disabled: true },
				);
			}

			const model = (ctx.model && (ctx.model as unknown as ModelLike).provider && (ctx.model as unknown as ModelLike).id)
				? String((ctx.model as unknown as ModelLike).id)
				: undefined;
			const provider = (ctx.model && (ctx.model as unknown as ModelLike).provider)
				? String((ctx.model as unknown as ModelLike).provider)
				: undefined;
			const thinking = (ctx.thinkingLevel as ThinkingLevel | undefined) ?? undefined;
			const tools = pi.getActiveTools().filter((name) => name !== "spawnSubagent");
			return runSubagent(params, signal, ctx, {
				model,
				provider,
				thinking,
				tools,
			}, onUpdate);
		},
	});
}
