import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth as tuiTruncateToWidth, visibleWidth as tuiVisibleWidth } from "@earendil-works/pi-tui";
import * as fs from "fs";
import { homedir } from "os";
import * as path from "path";

const ANSI_ESCAPE_REGEX = /\x1B\[[0-9;]*[a-zA-Z]/g;
const SINGLE_CELL_BLOCK_CHARS_REGEX = /[▰▱]/g;

// Strip ANSI escapes helper in case visibleWidth fails
function visibleWidth(str: string): number {
	const normalized = str.replace(SINGLE_CELL_BLOCK_CHARS_REGEX, "X");
	try {
		return tuiVisibleWidth(normalized);
	} catch {
		return normalized.replace(ANSI_ESCAPE_REGEX, "").length;
	}
}

// Safe fallback for truncateToWidth
function truncateToWidth(str: string, width: number): string {
	try {
		return tuiTruncateToWidth(str, width);
	} catch {
		const stripped = str.replace(ANSI_ESCAPE_REGEX, "");
		if (stripped.length <= width) return str;
		return stripped.slice(0, width);
	}
}

interface AgentConfig {
	name: string;
	description: string;
	model: string;
	instructions: string;
	triggers: string[];
}

export default function customTuiExtension(pi: ExtensionAPI) {
	let discovered: AgentConfig[] = [];
	let activeTui: any = null;

	// Telemetry State
	let startTime = 0;
	let turnStartTime: number | null = null;
	let firstTokenTime: number | null = null;
	let tokenCount = 0;
	let tokensPerSec = 0;
	let lastTokensPerSec = 0;
	let lastTtftMs: number | null = null;

	let taskStartTime: number | null = null;
	let taskEndTime: number | null = null;
	let lastTaskDurationMs = 0;
	let isTaskRunning = false;

	let isThinking = false;
	let thinkingStartTime: number | null = null;
	let thinkingDurationMs = 0;
	let lastThinkingDurationMs = 0;
	let thinkingTokenCount = 0;

	// Tool execution tracking
	const activeRunningTools = new Map<string, { toolName: string; startTime: number }>();
	let totalToolCalls = 0;
	let totalToolErrors = 0;
	let lastTurnToolCalls = 0;
	let lastTurnToolErrors = 0;

	// Cost & Cache & Session tracking
	let totalSessionCost = 0;
	let lastTurnCost = 0;
	let lastCacheHitRate: number | null = null;
	let sessionTurns = 0;
	let sessionCompactions = 0;

	function formatDuration(ms: number): string {
		if (ms <= 0) return "0.0s";
		const seconds = ms / 1000;
		if (seconds < 60) {
			return `${seconds.toFixed(1)}s`;
		}
		const totalSeconds = Math.floor(seconds);
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		if (mins < 60) {
			return `${mins}m ${secs}s`;
		}
		const hours = Math.floor(mins / 60);
		const remainingMins = mins % 60;
		return `${hours}h ${remainingMins}m ${secs}s`;
	}

	// Simple YAML Frontmatter Parser
	function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
		const frontmatter: Record<string, string> = {};
		let body = content;
		const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
		if (match) {
			body = match[2];
			const lines = match[1].split(/\r?\n/);
			for (const line of lines) {
				const idx = line.indexOf(":");
				if (idx !== -1) {
					const key = line.slice(0, idx).trim();
					const value = line.slice(idx + 1).trim();
					frontmatter[key] = value;
				}
			}
		}
		return { frontmatter, body };
	}

	// Load all agents
	function loadAgents(): AgentConfig[] {
		const baseDir = process.env.PI_CODING_AGENT_DIR || path.join(homedir(), ".pi", "agent");
		const primaryDir = path.join(homedir(), ".agents", "agents");
		const dir = fs.existsSync(primaryDir) ? primaryDir : path.join(baseDir, "agents");
		if (!fs.existsSync(dir)) return [];

		// Read triggers from SYSTEM.md
		const triggersMap = new Map<string, string[]>();
		const systemMdPath = path.join(baseDir, "SYSTEM.md");
		if (fs.existsSync(systemMdPath)) {
			try {
				const systemMdContent = fs.readFileSync(systemMdPath, "utf-8");
				const blocks = systemMdContent.split(/###\s+/);
				for (const block of blocks) {
					const loadMatch = block.match(/\*\*Load:\*\*\s*.*?agents\/([a-zA-Z0-9_-]+)\.(md|json)/);
					const triggersMatch = block.match(/\*\*Triggers:\*\*\s*(.+)/);
					if (loadMatch && triggersMatch) {
						const agentName = loadMatch[1];
						const keywords = Array.from(triggersMatch[1].matchAll(/"([^"]+)"/g)).map(m => m[1].toLowerCase());
						triggersMap.set(agentName, keywords);
					}
				}
			} catch (e) {
				// Ignore
			}
		}

		const files = fs.readdirSync(dir);
		const agents: AgentConfig[] = [];
		const seenNames = new Set<string>();

		for (const file of files) {
			const ext = path.extname(file);
			if (ext !== ".md" && ext !== ".json") continue;
			const filePath = path.join(dir, file);
			try {
				const content = fs.readFileSync(filePath, "utf-8");
				let name = "";
				let description = "";
				let model = "default";
				let instructions = "";

				if (ext === ".json") {
					const parsed = JSON.parse(content);
					name = parsed.name || path.basename(file, ext);
					description = parsed.description || "";
					model = parsed.model || "default";
					instructions = parsed.instructions || "";
				} else {
					const parsed = parseFrontmatter(content);
					name = parsed.frontmatter.name || path.basename(file, ext);
					description = parsed.frontmatter.description || "";
					model = parsed.frontmatter.model || "default";
					instructions = parsed.body || "";
				}

				if (name && !seenNames.has(name)) {
					seenNames.add(name);
					const triggers = triggersMap.get(name) || [];
					agents.push({ name, description, model, instructions, triggers });
				}
			} catch (e) {
				// Ignore
			}
		}
		return agents;
	}

	// Detect active agent based on system prompt
	function detectActiveAgent(systemPrompt: string, userPrompt?: string): string {
		if (userPrompt) {
			const promptLower = userPrompt.toLowerCase();
			for (const agent of discovered) {
				if (agent.triggers.some(trigger => promptLower.includes(trigger))) {
					return agent.name;
				}
			}
		}

		if (!systemPrompt) return "None";
		const normalizedPrompt = systemPrompt.replace(/\r\n/g, "\n");
		// 1. Match by agent instructions
		for (const agent of discovered) {
			const searchStr = agent.instructions.replace(/\r\n/g, "\n").trim().slice(0, 100);
			if (searchStr && normalizedPrompt.includes(searchStr)) {
				return agent.name;
			}
		}
		// 2. Fallback: Match by agent name in system prompt
		for (const agent of discovered) {
			const escapedName = agent.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			const nameRegex = new RegExp("(?<![\\w/.-])" + escapedName + "(?![_a-zA-Z0-9-])(?!\\.md\\b)(?!\\.json\\b)");
			if (nameRegex.test(normalizedPrompt)) {
				return agent.name;
			}
		}
		return "None";
	}

	// Retrieve dynamic active agent name
	function getActiveAgentName(): string {
		if ((global as any).activeAgentName && (global as any).activeAgentName !== "None") {
			return (global as any).activeAgentName;
		}
		return "none";
	}

	// Format model displayName
	function getModelName(model: any): string {
		if (!model) return "No model";
		if (model.id === "gemini-3.5-flash") {
			return "Gemini 3.5 Flash (Medium)";
		}
		return model.name || model.id || "No model";
	}

	// Extract version
	let version = "0.76.0";
	try {
		const pathsToTry = [
			path.join(homedir(), ".pi/agent/package.json"),
			"/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/package.json",
		];
		for (const p of pathsToTry) {
			if (fs.existsSync(p)) {
				const pkg = JSON.parse(fs.readFileSync(p, "utf-8"));
				if (pkg.version) {
					version = pkg.version;
					break;
				}
			}
		}
	} catch {
		// Ignore
	}

	// Register header and footer on session_start
	pi.on("session_start", async (_event, ctx) => {
		discovered = loadAgents();
		const detected = detectActiveAgent(ctx.getSystemPrompt());
		if (detected !== "None" && (!(global as any).activeAgentName || (global as any).activeAgentName === "None")) {
			(global as any).activeAgentName = detected;
		}

		if (ctx.hasUI) {
			// Customize Header
			ctx.ui.setHeader((tui, theme) => {
				activeTui = tui;
				return {
					render(width: number): string[] {
						const cwd = process.cwd();
						const home = homedir();
						const displayPath = cwd.startsWith(home) ? cwd.replace(home, "~") : cwd;

						const logoPart1 = theme.fg("accent", "██████   ██");
						const logoPart2 = theme.fg("accent", "██  ██     ");
						const logoPart3 = theme.fg("accent", "██████   ██");
						const logoPart4 = theme.fg("accent", "██       ██");

						const line1 = logoPart1 + " ".repeat(6) + theme.fg("borderAccent", `version ${version}`);
						const line2 = logoPart2;
						const line3 = logoPart3;
						const line4 = logoPart4 + " ".repeat(6) + theme.fg("muted", displayPath);

						return [line1, line2, line3, line4];
					},
					invalidate() { }
				};
			});

			// Customize Footer with Self-Descriptive & Intuitive Metrics
			ctx.ui.setFooter((tui, theme, _footerData) => {
				activeTui = tui;
				return {
					dispose() { },
					invalidate() { },
					render(width: number): string[] {
						const sep = theme.fg("dim", " | ");

						// 1. agent: <name>
						const activeAgentName = getActiveAgentName();
						const agentDisplay = `agent: ${activeAgentName}`;
						const agentPart = theme.fg("muted", agentDisplay);

						// 2. context: ▰▰▱▱ 14k/128k (11%)
						const usage = ctx.getContextUsage();
						const rawPercent = usage?.percent ?? 0;
						const percent = Math.min(100, Math.max(0, rawPercent));
						const pctStr = `${Math.round(percent)}%`;

						const formatTokens = (n: number) => {
							if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
							if (n >= 1000) return `${Math.round(n / 1000)}k`;
							return `${n}`;
						};

						const tokensUsed = usage?.tokens ? formatTokens(usage.tokens) : "0";
						const tokensMax = usage?.contextWindow ? formatTokens(usage.contextWindow) : "0";
						const tokenDetailsStr = (usage?.tokens && usage?.contextWindow)
							? `${tokensUsed}/${tokensMax} (${pctStr})`
							: pctStr;

						const barWidth = 6;
						const filledWidth = rawPercent > 0 ? Math.max(1, Math.min(barWidth, Math.floor((percent / 100) * barWidth))) : 0;
						const emptyWidth = Math.max(0, barWidth - filledWidth);
						const filledStr = "▰".repeat(filledWidth);
						const emptyStr = "▱".repeat(emptyWidth);
						const barColor = percent > 60 ? "error" : percent > 40 ? "warning" : "success";
						const barPart = theme.fg(barColor, filledStr) + theme.fg("dim", emptyStr);
						const contextPart = theme.fg("muted", "context: ") + barPart + " " + theme.fg("muted", tokenDetailsStr);

						// 3. Dynamic State Items
						const items: string[] = [agentPart, contextPart];

						if (activeRunningTools.size > 0) {
							// Active tool execution phase
							const runningList = Array.from(activeRunningTools.values());
							const primaryTool = runningList[0];
							const elapsed = Date.now() - primaryTool.startTime;
							const toolName = runningList.length > 1 ? `${primaryTool.toolName} (+${runningList.length - 1})` : primaryTool.toolName;
							items.push(theme.fg("accent", `running: ${toolName} (${formatDuration(elapsed)})`));
						} else if (isThinking) {
							// Thinking / Reasoning phase
							const thinkElapsed = thinkingStartTime ? Date.now() - thinkingStartTime : 0;
							items.push(theme.fg("accent", `thinking: ${formatDuration(thinkElapsed)}`));
						} else if (isTaskRunning && tokensPerSec > 0) {
							// Generation streaming phase
							items.push(theme.fg("muted", `speed: ${tokensPerSec.toFixed(1)} t/s`));
							if (lastTtftMs !== null && lastTtftMs > 0) {
								items.push(theme.fg("muted", `latency: ${lastTtftMs}ms`));
							}
						} else {
							// Idle / Task Completed Summary
							const durationMs = isTaskRunning && taskStartTime
								? Date.now() - taskStartTime
								: (lastTaskDurationMs > 0 ? lastTaskDurationMs : (taskStartTime && taskEndTime ? taskEndTime - taskStartTime : 0));
							if (durationMs > 0) {
								items.push(theme.fg("muted", `task: ${formatDuration(durationMs)}`));
							}

							if (totalSessionCost > 0) {
								items.push(theme.fg("muted", `cost: $${totalSessionCost.toFixed(3)}`));
							}

							if (lastCacheHitRate !== null) {
								items.push(theme.fg("muted", `cache: ${lastCacheHitRate}%`));
							}

							if (totalToolCalls > 0) {
								const toolSummary = totalToolErrors > 0
									? `tools: ${totalToolCalls} (${totalToolErrors} err)`
									: `tools: ${totalToolCalls} ok`;
								items.push(theme.fg(totalToolErrors > 0 ? "warning" : "muted", toolSummary));
							}
						}

						const modelName = getModelName(ctx.model);
						const rightSide = theme.fg("muted", `model: ${modelName}`);

						// Responsive truncation: drop tail items if width is constrained
						let leftSide = items.join(sep);
						while (items.length > 2 && visibleWidth(leftSide) + visibleWidth(rightSide) + 4 > width) {
							items.pop();
							leftSide = items.join(sep);
						}

						const padSize = width - visibleWidth(leftSide) - visibleWidth(rightSide);
						const footerLine = leftSide + " ".repeat(Math.max(1, padSize)) + rightSide;

						return [truncateToWidth(footerLine, width)];
					}
				};
			});
		}
	});

	// Life cycle event listeners for re-renders and telemetry
	pi.on("before_agent_start", (event, ctx) => {
		taskStartTime = Date.now();
		taskEndTime = null;
		isTaskRunning = true;
		lastTurnToolCalls = 0;
		lastTurnToolErrors = 0;

		const detected = detectActiveAgent(event.systemPrompt, event.prompt);
		if (detected !== "None" && (!(global as any).activeAgentName || (global as any).activeAgentName === "None")) {
			(global as any).activeAgentName = detected;
		}
		activeTui?.requestRender();
	});

	pi.on("agent_start", (_event, _ctx) => {
		if (!taskStartTime) {
			taskStartTime = Date.now();
		}
		taskEndTime = null;
		isTaskRunning = true;
		activeTui?.requestRender();
	});

	pi.on("turn_start", (_event, ctx) => {
		startTime = Date.now();
		turnStartTime = Date.now();
		firstTokenTime = null;
		tokenCount = 0;
		tokensPerSec = 0;
		isThinking = false;
		thinkingStartTime = null;
		thinkingTokenCount = 0;
		sessionTurns++;
		activeTui?.requestRender();
	});

	pi.on("message_update", (event, ctx) => {
		const type = event.assistantMessageEvent.type;

		if (type === "thinking_delta") {
			if (!thinkingStartTime) {
				thinkingStartTime = Date.now();
			}
			isThinking = true;
			if (firstTokenTime === null) {
				firstTokenTime = Date.now();
				if (turnStartTime) {
					lastTtftMs = firstTokenTime - turnStartTime;
				}
			}
			const delta = event.assistantMessageEvent.delta || "";
			const deltaTokens = Math.max(1, delta.length / 4);
			tokenCount += deltaTokens;
			thinkingTokenCount += deltaTokens;
			thinkingDurationMs = Date.now() - thinkingStartTime;
			lastThinkingDurationMs = thinkingDurationMs;
		} else if (type === "text_delta") {
			isThinking = false;
			if (firstTokenTime === null) {
				firstTokenTime = Date.now();
				if (turnStartTime) {
					lastTtftMs = firstTokenTime - turnStartTime;
				}
			}
			const delta = event.assistantMessageEvent.delta || "";
			tokenCount += Math.max(1, delta.length / 4);
		}

		if (firstTokenTime !== null) {
			const elapsed = (Date.now() - firstTokenTime) / 1000;
			if (elapsed > 0.05) {
				tokensPerSec = tokenCount / elapsed;
				lastTokensPerSec = tokensPerSec;
			}
		}
		activeTui?.requestRender();
	});

	pi.on("tool_execution_start", (event, _ctx) => {
		isThinking = false;
		if (event.toolCallId) {
			activeRunningTools.set(event.toolCallId, {
				toolName: event.toolName || "tool",
				startTime: Date.now()
			});
		}
		totalToolCalls++;
		lastTurnToolCalls++;
		activeTui?.requestRender();
	});

	pi.on("tool_execution_end", (event, _ctx) => {
		if (event.toolCallId) {
			activeRunningTools.delete(event.toolCallId);
		}
		if (event.isError) {
			totalToolErrors++;
			lastTurnToolErrors++;
		}
		activeTui?.requestRender();
	});

	pi.on("turn_end", (event, ctx) => {
		isThinking = false;
		if (event.message && event.message.role === "assistant") {
			const usage = event.message.usage;
			if (usage) {
				if (usage.cost?.total) {
					lastTurnCost = usage.cost.total;
					totalSessionCost += usage.cost.total;
				}
				const cacheRead = usage.cacheRead || 0;
				const totalPrompt = (usage.input || 0) + cacheRead + (usage.cacheWrite || 0);
				if (totalPrompt > 0 && cacheRead > 0) {
					lastCacheHitRate = Math.round((cacheRead / totalPrompt) * 100);
				}
				if (firstTokenTime !== null) {
					const elapsed = (Date.now() - firstTokenTime) / 1000;
					if (elapsed > 0.05 && usage.output) {
						tokensPerSec = usage.output / elapsed;
						lastTokensPerSec = tokensPerSec;
					}
				}
			}
		}
		activeTui?.requestRender();
	});

	pi.on("agent_end", (_event, ctx) => {
		if (taskStartTime) {
			taskEndTime = Date.now();
			lastTaskDurationMs = taskEndTime - taskStartTime;
		}
		isTaskRunning = false;
		isThinking = false;
		tokensPerSec = 0;
		activeRunningTools.clear();
		activeTui?.requestRender();
	});

	pi.on("session_compact", (_event, ctx) => {
		sessionCompactions++;
		activeTui?.requestRender();
	});

	pi.on("model_select", (event, ctx) => {
		activeTui?.requestRender();
	});

	// Register /stats and /metrics slash commands for detailed telemetry & legend
	const statsHandler = async (_args: string, ctx: any) => {
		const usage = ctx.getContextUsage();
		const tokensUsed = usage?.tokens ? usage.tokens.toLocaleString() : "0";
		const tokensMax = usage?.contextWindow ? usage.contextWindow.toLocaleString() : "unknown";
		const pctStr = usage?.percent ? `${Math.round(usage.percent)}%` : "0%";
		const activeAgent = getActiveAgentName();
		const modelName = getModelName(ctx.model);

		const taskDurationMs = isTaskRunning && taskStartTime
			? Date.now() - taskStartTime
			: (lastTaskDurationMs > 0 ? lastTaskDurationMs : (taskStartTime && taskEndTime ? taskEndTime - taskStartTime : 0));
		const taskStr = taskDurationMs > 0 ? formatDuration(taskDurationMs) : "0.0s";

		const speedVal = isTaskRunning && tokensPerSec > 0 ? tokensPerSec : lastTokensPerSec;
		const speedStr = speedVal > 0 ? `${speedVal.toFixed(1)} t/s` : "idle (0 t/s)";

		const latencyStr = lastTtftMs !== null ? `${lastTtftMs}ms` : "N/A";

		const thinkingMs = isThinking && thinkingStartTime ? Date.now() - thinkingStartTime : lastThinkingDurationMs;
		const thinkingStr = thinkingMs > 0 ? `${formatDuration(thinkingMs)}${thinkingTokenCount > 0 ? ` (~${Math.round(thinkingTokenCount)} tok)` : ""}` : "none";

		const runningStr = activeRunningTools.size > 0
			? Array.from(activeRunningTools.values()).map(t => `${t.toolName} (${formatDuration(Date.now() - t.startTime)})`).join(", ")
			: "idle (none)";

		const toolStats = `${totalToolCalls} executed (${totalToolCalls - totalToolErrors} ok, ${totalToolErrors} err)`;
		const costStr = totalSessionCost > 0 ? `$${totalSessionCost.toFixed(4)}` : "Free / Not reported";
		const cacheStr = lastCacheHitRate !== null ? `${lastCacheHitRate}%` : "No cache data";
		const turnsStr = `${sessionTurns} (compactions: ${sessionCompactions})`;

		const report = [
			"📊 \x1b[1mSession Telemetry\x1b[0m",
			`  • \x1b[36magent:\x1b[0m    ${activeAgent}`,
			`  • \x1b[36mmodel:\x1b[0m    ${modelName}`,
			`  • \x1b[36mcontext:\x1b[0m  ${tokensUsed} / ${tokensMax} (${pctStr})`,
			`  • \x1b[36mtask:\x1b[0m     ${taskStr}`,
			`  • \x1b[36mspeed:\x1b[0m    ${speedStr}`,
			`  • \x1b[36mlatency:\x1b[0m  ${latencyStr}`,
			`  • \x1b[36mthinking:\x1b[0m ${thinkingStr}`,
			`  • \x1b[36mrunning:\x1b[0m  ${runningStr}`,
			`  • \x1b[36mtools:\x1b[0m    ${toolStats}`,
			`  • \x1b[36mcost:\x1b[0m     ${costStr}`,
			`  • \x1b[36mcache:\x1b[0m    ${cacheStr}`,
			`  • \x1b[36mturns:\x1b[0m    ${turnsStr}`,
			"",
			"📖 \x1b[1mFooter Metrics Legend\x1b[0m",
			"  • \x1b[36magent:\x1b[0m    Active agent persona / role",
			"  • \x1b[36mmodel:\x1b[0m    AI model currently in use",
			"  • \x1b[36mcontext:\x1b[0m  Token usage vs model context window",
			"  • \x1b[36mtask:\x1b[0m     Wall-clock duration of current / last task",
			"  • \x1b[36mspeed:\x1b[0m    Generation throughput (tokens per second)",
			"  • \x1b[36mlatency:\x1b[0m  Time to First Token (TTFT) from provider",
			"  • \x1b[36mthinking:\x1b[0m Model reasoning / contemplation duration",
			"  • \x1b[36mrunning:\x1b[0m  Tool currently executing in background",
			"  • \x1b[36mtools:\x1b[0m    Completed tool calls and error count",
			"  • \x1b[36mcost:\x1b[0m     Cumulative session cost in USD",
			"  • \x1b[36mcache:\x1b[0m    Percentage of prompt served from cache",
			"  • \x1b[36mturns:\x1b[0m    Conversation turn count and compactions"
		].join("\n");

		ctx.ui.notify(report, "info");
	};

	pi.registerCommand("stats", {
		description: "Show session metrics breakdown and footer legend",
		handler: statsHandler
	});

	pi.registerCommand("metrics", {
		description: "Show session metrics breakdown and footer legend",
		handler: statsHandler
	});

	// Register /clear slash command to visually clear the chat history Container
	pi.registerCommand("clear", {
		description: "Clear screen output visually (keeps conversation context)",
		handler: async (args, ctx) => {
			if (activeTui) {
				const chatContainer = activeTui.children[1];
				if (chatContainer && typeof chatContainer.clear === "function") {
					chatContainer.clear();
					activeTui.requestRender();
				} else {
					ctx.ui.notify("❌ Failed to clear output: chat container not found", "error");
				}
			} else {
				ctx.ui.notify("❌ Failed to clear output: TUI not active", "error");
			}
		}
	});
}


