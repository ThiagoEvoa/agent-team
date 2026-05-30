import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { visibleWidth as tuiVisibleWidth, truncateToWidth as tuiTruncateToWidth } from "@earendil-works/pi-tui";
import { homedir } from "os";
import * as path from "path";
import * as fs from "fs";

// Strip ANSI escapes helper in case visibleWidth fails
function visibleWidth(str: string): number {
	try {
		return tuiVisibleWidth(str);
	} catch {
		return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "").length;
	}
}

// Safe fallback for truncateToWidth
function truncateToWidth(str: string, width: number): string {
	try {
		return tuiTruncateToWidth(str, width);
	} catch {
		const stripped = str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
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
	let startTime = 0;
	let tokenCount = 0;
	let tokensPerSec = 0;

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
		const dir = path.join(baseDir, "agents");
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
		return "None";
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
						const activeAgentName = getActiveAgentName();
						const cwd = process.cwd();
						const home = homedir();
						const displayPath = cwd.startsWith(home) ? cwd.replace(home, "~") : cwd;

						const usage = ctx.getContextUsage();
						const percent = usage?.percent ?? 0;
						const pctStr = `${Math.round(percent)}%`;

						const barWidth = 8;
						const filledWidth = Math.min(barWidth, Math.round((percent / 100) * barWidth));
						const emptyWidth = Math.max(0, barWidth - filledWidth);
						const filledStr = "█".repeat(filledWidth);
						const emptyStr = "░".repeat(emptyWidth);

						const logoPart1 = theme.fg("accent", "██████   ██");
						const logoPart2 = theme.fg("accent", "██  ██     ");
						const logoPart3 = theme.fg("accent", "██████   ██");
						const logoPart4 = theme.fg("accent", "██       ██");

						const line1 = logoPart1 + " ".repeat(6) + theme.fg("borderAccent", `version ${version}`);
						const agentDisplay = (activeAgentName && activeAgentName !== "None") ? `agent: ${activeAgentName}` : "agent: ";
						const line2 = logoPart2 + " ".repeat(6) + theme.fg("muted", agentDisplay);
						
						const barPart = theme.fg("success", filledStr) + theme.fg("dim", emptyStr);
						const line3 = logoPart3 + " ".repeat(6) + theme.fg("muted", "context  ") + barPart + " " + theme.fg("muted", pctStr);
						const line4 = logoPart4 + " ".repeat(6) + theme.fg("muted", displayPath);

						return [line1, line2, line3, line4];
					},
					invalidate() {}
				};
			});

			// Customize Footer
			ctx.ui.setFooter((tui, theme, footerData) => {
				activeTui = tui;
				return {
					dispose() {},
					invalidate() {},
					render(width: number): string[] {
						const speedStr = `${tokensPerSec.toFixed(2)} T/s`;
						const left = theme.fg("muted", speedStr);
						const modelName = getModelName(ctx.model);
						const right = theme.fg("muted", modelName);

						const padSize = width - visibleWidth(left) - visibleWidth(right);
						const footerLine = left + " ".repeat(Math.max(1, padSize)) + right;

						return [truncateToWidth(footerLine, width)];
					}
				};
			});
		}
	});

	// Life cycle event listeners for re-renders and telemetry
	pi.on("before_agent_start", (event, ctx) => {
		const detected = detectActiveAgent(event.systemPrompt, event.prompt);
		if (detected !== "None" && (!(global as any).activeAgentName || (global as any).activeAgentName === "None")) {
			(global as any).activeAgentName = detected;
		}
		activeTui?.requestRender();
	});

	pi.on("turn_start", (_event, ctx) => {
		startTime = Date.now();
		tokenCount = 0;
		tokensPerSec = 0;
		activeTui?.requestRender();
	});

	pi.on("message_update", (event, ctx) => {
		if (event.assistantMessageEvent.type === "text_delta" || event.assistantMessageEvent.type === "thinking_delta") {
			const delta = event.assistantMessageEvent.delta || "";
			tokenCount += delta.length / 4; // estimate tokens from text delta
		}

		const elapsed = (Date.now() - startTime) / 1000;
		if (elapsed > 0.1) {
			tokensPerSec = tokenCount / elapsed;
		}
		activeTui?.requestRender();
	});

	pi.on("turn_end", (event, ctx) => {
		const elapsed = (Date.now() - startTime) / 1000;
		if (elapsed > 0.1) {
			if (event.message && event.message.role === "assistant") {
				const usage = event.message.usage;
				if (usage && usage.output) {
					tokensPerSec = usage.output / elapsed;
				}
			}
		}
		activeTui?.requestRender();
	});

	pi.on("agent_end", (_event, ctx) => {
		tokensPerSec = 0;
		activeTui?.requestRender();
	});

	pi.on("session_compact", (_event, ctx) => {
		activeTui?.requestRender();
	});

	pi.on("model_select", (event, ctx) => {
		activeTui?.requestRender();
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
