import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

type SpawnArgs = {
	prompt: string;
	agent?: string;
	model?: string;
	provider?: string;
	thinking?: "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
	tools?: string[];
	timeoutMs?: number;
	maxOutputChars?: number;
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

function parseSystemTriggerBlocks(systemMdContent: string): Array<{ agentName: string; keywords: string[] }> {
	const blocks = systemMdContent.split(/###\s+/);
	const mappings: Array<{ agentName: string; keywords: string[] }> = [];
	for (const block of blocks) {
		const loadMatch = block.match(/\*\*Load:\*\*\s*.*?agents\/([a-zA-Z0-9_-]+)\.(md|json)/);
		const triggersMatch = block.match(/\*\*Triggers:\*\*\s*(.+)/);
		if (!loadMatch || !triggersMatch) continue;
		const agentName = loadMatch[1];
		const keywords = Array.from(triggersMatch[1].matchAll(/"([^"]+)"/g)).map((m) => m[1].toLowerCase());
		if (keywords.length > 0) mappings.push({ agentName, keywords });
	}
	return mappings;
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
	const agentsDir = getAgentsDir();
	const mdPath = path.join(agentsDir, `${agentName}.md`);
	const jsonPath = path.join(agentsDir, `${agentName}.json`);

	if (fs.existsSync(mdPath)) {
		const instructions = fs.readFileSync(mdPath, "utf-8");
		return {
			instructions,
			sourcePath: mdPath,
			modelPreference: parseFrontmatterModel(instructions),
		};
	}
	if (fs.existsSync(jsonPath)) {
		try {
			const raw = fs.readFileSync(jsonPath, "utf-8");
			const parsed = JSON.parse(raw) as { instructions?: string; model?: string };
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

function resolveAgentForTask(taskPrompt: string, explicitAgent?: string): ResolvedAgent | null {
	const selectedName = typeof explicitAgent === "string" && explicitAgent.trim() ? explicitAgent.trim() : null;
	if (selectedName) {
		const loaded = loadAgentInstructions(selectedName);
		if (!loaded) return null;
		return {
			name: selectedName,
			instructions: loaded.instructions,
			triggers: [],
			sourcePath: loaded.sourcePath,
			modelPreference: loaded.modelPreference,
		};
	}

	const systemMdPath = path.join(getAgentBaseDir(), "SYSTEM.md");
	if (!fs.existsSync(systemMdPath)) return null;

	let systemMd = "";
	try {
		systemMd = fs.readFileSync(systemMdPath, "utf-8");
	} catch {
		return null;
	}

	const mappings = parseSystemTriggerBlocks(systemMd);
	if (mappings.length === 0) return null;

	const promptLower = taskPrompt.toLowerCase();
	for (const mapping of mappings) {
		if (!mapping.keywords.some((keyword) => promptLower.includes(keyword))) continue;
		const loaded = loadAgentInstructions(mapping.agentName);
		if (!loaded) continue;
		return {
			name: mapping.agentName,
			instructions: loaded.instructions,
			triggers: mapping.keywords,
			sourcePath: loaded.sourcePath,
			modelPreference: loaded.modelPreference,
		};
	}
	return null;
}

async function runSubagent(
	args: SpawnArgs,
	signal: AbortSignal | undefined,
	ctx: ExtensionContext,
	dispatchDefaults: DispatchDefaults,
) {
	const prompt = typeof args.prompt === "string" ? args.prompt.trim() : "";
	if (!prompt) {
		return toTextResult("spawnSubagent failed: `prompt` must be a non-empty string.", {
			ok: false,
			error: "invalid_prompt",
		});
	}

	const timeoutMs = clampPositiveInt(args.timeoutMs, 120_000);
	const maxOutputChars = clampPositiveInt(args.maxOutputChars, 20_000);
	const cwd = typeof ctx.cwd === "string" && ctx.cwd ? ctx.cwd : process.cwd();

	const activeModel = (ctx as ExtensionContext & { model?: ModelLike }).model;
	const inheritedModel = typeof activeModel?.id === "string" && activeModel.id.trim() ? activeModel.id.trim() : undefined;
	const inheritedProvider =
		typeof activeModel?.provider === "string" && activeModel.provider.trim() ? activeModel.provider.trim() : undefined;
	const resolvedAgent = resolveAgentForTask(prompt, args.agent);
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

	// The prompt is passed as an argument (no shell interpolation).
	let appendedPromptPath: string | null = null;
	let appendedPromptDir: string | null = null;
	if (resolvedAgent && resolvedAgent.instructions.trim()) {
		appendedPromptDir = fs.mkdtempSync(path.join(process.env.TMPDIR || "/tmp", "pi-subagent-spawner-"));
		appendedPromptPath = path.join(appendedPromptDir, `agent-${resolvedAgent.name}.md`);
		fs.writeFileSync(appendedPromptPath, resolvedAgent.instructions, { encoding: "utf-8", mode: 0o600 });
		cliArgs.push("--append-system-prompt", appendedPromptPath);
	}

	cliArgs.push(prompt);

	const invocation = getPiInvocation(cliArgs);
	const child = spawn(invocation.command, invocation.args, {
		cwd,
		stdio: ["ignore", "pipe", "pipe"],
		shell: false,
	});

	let stdout = "";
	let stderr = "";
	let timedOut = false;
	let aborted = false;
	let settled = false;

	const killChild = () => {
		if (settled || child.killed) return;
		try {
			child.kill("SIGTERM");
		} catch {
			// Ignore kill races.
		}
	};

	const timeout = setTimeout(() => {
		timedOut = true;
		killChild();
	}, timeoutMs);

	const onAbort = () => {
		aborted = true;
		killChild();
	};
	signal?.addEventListener("abort", onAbort, { once: true });

	child.stdout?.on("data", (chunk: Buffer | string) => {
		stdout += String(chunk);
	});

	child.stderr?.on("data", (chunk: Buffer | string) => {
		stderr += String(chunk);
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
	signal?.removeEventListener("abort", onAbort);
	if (appendedPromptPath) {
		try {
			fs.unlinkSync(appendedPromptPath);
		} catch {
			// Ignore cleanup races.
		}
	}
	if (appendedPromptDir) {
		try {
			fs.rmdirSync(appendedPromptDir);
		} catch {
			// Ignore cleanup races.
		}
	}

	const output = (stdout || stderr || "").trim();
	const trimmed = trimOutput(output, maxOutputChars);
	const metadata = {
		ok: !timedOut && !aborted && exitCode === 0,
		exitCode,
		timedOut,
		aborted,
		truncated: trimmed.truncated,
		cwd,
		timeoutMs,
		maxOutputChars,
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
			`spawnSubagent timed out after ${timeoutMs}ms.\n\n${trimmed.text || "(no output)"}`,
			metadata,
		);
	}

	if (aborted) {
		return toTextResult(`spawnSubagent was aborted.\n\n${trimmed.text || "(no output)"}`, metadata);
	}

	if (exitCode !== 0) {
		if (/No API key found/i.test(trimmed.text)) {
			return toTextResult(
				`spawnSubagent failed: missing API key for the selected model/provider.\n\n${trimmed.text}`,
				metadata,
			);
		}
		return toTextResult(
			`spawnSubagent failed (exit code ${exitCode ?? "unknown"}).\n\n${trimmed.text || "(no output)"}`,
			metadata,
		);
	}

	return toTextResult(trimmed.text || "(no output)", metadata);
}

export default function subagentSpawnerExtension(pi: ExtensionAPI) {
	(pi.registerTool as (tool: unknown) => unknown)({
		name: "spawnSubagent",
		label: "Spawn Subagent",
		description:
			"Run a child Pi agent for a focused task and return its output. Use when you need isolated subagent execution.",
		promptSnippet: "Spawn a child Pi subagent for an isolated task",
		parameters: {
			type: "object",
			required: ["prompt"],
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
					description: "Optional explicit agent name to load. If omitted, inferred from SYSTEM.md triggers and delegated task.",
				},
				timeoutMs: {
					type: "number",
					description: "Optional timeout in milliseconds (default 120000).",
				},
				maxOutputChars: {
					type: "number",
					description: "Optional output cap (default 20000 chars).",
				},
			},
		},
		async execute(
			_toolCallId: string,
			params: SpawnArgs,
			signal: AbortSignal | undefined,
			_onUpdate: unknown,
			ctx: ExtensionContext,
		) {
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
			});
		},
	});
}
