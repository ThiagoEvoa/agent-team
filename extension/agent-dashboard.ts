import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { visibleWidth as tuiVisibleWidth, truncateToWidth as tuiTruncateToWidth } from "@earendil-works/pi-tui";
import { homedir } from "os";
import * as path from "path";
import * as fs from "fs";

interface AgentConfig {
	name: string;
	description: string;
	model: string;
	instructions: string;
	triggers: string[];
}

interface AgentState {
	name: string;
	status: "idle" | "running";
	contextPercent: number;
	model: string;
	tokensPerSec: number;
}

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

export default function agentDashboardExtension(pi: ExtensionAPI) {
	let discovered: AgentConfig[] = [];
	const agentStateMap = new Map<string, AgentState>();
	let activeAgentName = "";
	let startTime = 0;
	let tokenCount = 0;
	let scrollOffset = 0;
	let lastActiveAgentName = "";

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

	// Load all agents from the ~/.pi/agent/agents directory
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
				// Ignore errors parsing SYSTEM.md
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
				// Ignore errors reading individual files
			}
		}
		return agents;
	}

	// Detect which agent is currently active based on the system prompt and/or user prompt triggers
	function detectActiveAgent(systemPrompt: string, userPrompt?: string) {
		if (userPrompt) {
			const promptLower = userPrompt.toLowerCase();
			for (const agent of discovered) {
				if (agent.triggers.some(trigger => promptLower.includes(trigger))) {
					activeAgentName = agent.name;
					return;
				}
			}
		}

		if (!systemPrompt) return;
		const normalizedPrompt = systemPrompt.replace(/\r\n/g, "\n");
		// 1. Match by agent instructions
		for (const agent of discovered) {
			const searchStr = agent.instructions.replace(/\r\n/g, "\n").trim().slice(0, 100);
			if (searchStr && normalizedPrompt.includes(searchStr)) {
				activeAgentName = agent.name;
				return;
			}
		}
		// 2. Fallback: Match by agent name in system prompt (preventing false positives)
		for (const agent of discovered) {
			const escapedName = agent.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			const nameRegex = new RegExp("(?<![\\w/.-])" + escapedName + "(?![_a-zA-Z0-9-])(?!\\.md\\b)(?!\\.json\\b)");
			if (nameRegex.test(normalizedPrompt)) {
				activeAgentName = agent.name;
				return;
			}
		}
	}

	// Main widget renderer
	function renderDashboard(ctx: any) {
		if (!ctx.hasUI) return;

		const termWidth = process.stdout.columns || 80;
		const cards: string[][] = [];
		const theme = ctx.ui.theme;

		// Calculate dynamic card width based on the longest agent name to prevent overflow
		const longestNameLength = discovered.reduce((max, a) => Math.max(max, a.name.length), 0);
		const cardWidth = Math.max(28, longestNameLength + 6); // Add padding for layout spacing

		for (const state of agentStateMap.values()) {
			// Resolve model display name
			let displayModel = state.model;
			if (state.name === activeAgentName && ctx.model?.id) {
				displayModel = ctx.model.id;
			}
			if (displayModel === "inherit" || displayModel === "default") {
				displayModel = ctx.model?.id || "default";
			}

			// Shorten model name if too long to keep alignment
			if (displayModel.length > 15) {
				displayModel = displayModel.slice(0, 12) + "...";
			}

			// Render progress bar using block characters
			const barWidth = 8;
			const filledWidth = Math.min(barWidth, Math.round((state.contextPercent / 100) * barWidth));
			const emptyWidth = Math.max(0, barWidth - filledWidth);
			const filledStr = "█".repeat(filledWidth);
			const emptyStr = "░".repeat(emptyWidth);
			const formattedPercent = Math.round(state.contextPercent * 100) / 100;
			const progressBar = `[${theme.fg("success", filledStr)}${theme.fg("dim", emptyStr)}] ${formattedPercent}%`;

			const statusStr = state.status === "running"
				? theme.fg("success", "running")
				: theme.fg("dim", "idle");

			const speedStr = state.status === "running" && state.tokensPerSec > 0
				? theme.fg("accent", `${state.tokensPerSec.toFixed(1)} T/s`)
				: theme.fg("dim", "0.0 T/s");

			const title = theme.fg("accent", theme.bold(state.name));

			// Helper to pad key-value pairs horizontally and guarantee strict line width
			const visPad = (leftText: string, rightText: string) => {
				const leftVis = visibleWidth(leftText);
				const rightVis = visibleWidth(rightText);
				const totalVis = leftVis + rightVis;
				const targetInnerWidth = cardWidth - 4; // Width inside the borders

				if (totalVis <= targetInnerWidth) {
					const padSize = targetInnerWidth - totalVis;
					return leftText + " ".repeat(padSize) + rightText;
				} else {
					const availableWidth = targetInnerWidth - rightVis;
					const truncatedLeft = truncateToWidth(leftText, availableWidth);
					const padSize = Math.max(0, targetInnerWidth - visibleWidth(truncatedLeft) - rightVis);
					return truncatedLeft + " ".repeat(padSize) + rightText;
				}
			};

			const cardLines = [
				`┌${"─".repeat(cardWidth - 2)}┐`,
				`│ ${visPad(title, "")} │`,
				`│ ${visPad("Status:", statusStr)} │`,
				`│ ${visPad("Context:", progressBar)} │`,
				`│ ${visPad("Model:", theme.fg("muted", displayModel))} │`,
				`│ ${visPad("Speed:", speedStr)} │`,
				`└${"─".repeat(cardWidth - 2)}┘`
			];

			cards.push(cardLines);
		}

		if (cards.length === 0) return;

		// Calculate columns to lay out side-by-side (using available width with scroll margins)
		const spacing = 2;
		const cardStride = cardWidth + spacing;
		const availableWidth = termWidth - 6; // Room for left/right scroll arrow indicators
		const numCols = Math.max(1, Math.floor((availableWidth + spacing) / cardStride));

		const isScrolling = numCols < cards.length;
		const maxOffset = Math.max(0, cards.length - numCols);

		// Clamp scrollOffset to valid range
		scrollOffset = Math.min(maxOffset, Math.max(0, scrollOffset));

		// Auto-scroll to ensure active agent is always visible when it changes
		if (activeAgentName && activeAgentName !== lastActiveAgentName) {
			const activeIndex = Array.from(agentStateMap.keys()).indexOf(activeAgentName);
			if (activeIndex !== -1) {
				if (activeIndex < scrollOffset) {
					scrollOffset = activeIndex;
				} else if (activeIndex >= scrollOffset + numCols) {
					scrollOffset = activeIndex - numCols + 1;
				}
			}
			lastActiveAgentName = activeAgentName;
		}

		const visibleCards = cards.slice(scrollOffset, scrollOffset + numCols);
		const cardHeight = visibleCards[0].length;
		const widgetLines: string[] = [];

		// 1. Build the card row first (just cards joined by spacing)
		const cardRowLines: string[] = [];
		for (let lineIdx = 0; lineIdx < cardHeight; lineIdx++) {
			const rowParts: string[] = [];
			for (const card of visibleCards) {
				rowParts.push(card[lineIdx]);
			}
			cardRowLines.push(rowParts.join(" ".repeat(spacing)));
		}

		// 2. Prepend left indicator and append right indicator with symmetric spacing
		for (let lineIdx = 0; lineIdx < cardHeight; lineIdx++) {
			let prefix = "";
			let suffix = "";

			if (isScrolling) {
				const arrowSpacing = 2; // Symmetric spacing around arrows
				const arrowGap = " ".repeat(arrowSpacing);
				if (lineIdx === 3) {
					const leftColor = scrollOffset > 0 ? "accent" : "dim";
					const rightColor = scrollOffset < maxOffset ? "accent" : "dim";
					prefix = theme.fg(leftColor, "◀") + arrowGap;
					suffix = arrowGap + theme.fg(rightColor, "▶");
				} else {
					prefix = " " + arrowGap;
					suffix = arrowGap + " ";
				}
			}

			const lineStr = prefix + cardRowLines[lineIdx] + suffix;
			const visW = visibleWidth(lineStr);
			const padding = Math.max(0, Math.floor((termWidth - visW) / 2) - 3);
			widgetLines.push(" ".repeat(padding) + lineStr);
		}

		ctx.ui.setWidget("agent-dashboard", widgetLines, { placement: "belowEditor" });
	}

	// Scroll handler function
	function scroll(direction: "left" | "right", ctx: any) {
		const termWidth = process.stdout.columns || 80;
		const longestNameLength = discovered.reduce((max, a) => Math.max(max, a.name.length), 0);
		const cardWidth = Math.max(28, longestNameLength + 6);
		const spacing = 2;
		const cardStride = cardWidth + spacing;
		const availableWidth = termWidth - 6;
		const numCols = Math.max(1, Math.floor((availableWidth + spacing) / cardStride));
		const maxOffset = Math.max(0, discovered.length - numCols);

		if (direction === "left") {
			scrollOffset = Math.max(0, scrollOffset - 1);
		} else {
			scrollOffset = Math.min(maxOffset, scrollOffset + 1);
		}
		renderDashboard(ctx);
	}

	// Register scroll slash commands
	pi.registerCommand("dashboard-next", {
		description: "Scroll the agent dashboard carousel right",
		handler: async (_args, ctx) => {
			scroll("right", ctx);
		}
	});

	pi.registerCommand("dashboard-prev", {
		description: "Scroll the agent dashboard carousel left",
		handler: async (_args, ctx) => {
			scroll("left", ctx);
		}
	});

	pi.registerCommand("scroll-right", {
		description: "Scroll the agent dashboard carousel right",
		handler: async (_args, ctx) => {
			scroll("right", ctx);
		}
	});

	pi.registerCommand("scroll-left", {
		description: "Scroll the agent dashboard carousel left",
		handler: async (_args, ctx) => {
			scroll("left", ctx);
		}
	});

	// Register shorter aliases for quick typing
	pi.registerCommand("sr", {
		description: "Scroll dashboard carousel right",
		handler: async (_args, ctx) => {
			scroll("right", ctx);
		}
	});

	pi.registerCommand("sl", {
		description: "Scroll dashboard carousel left",
		handler: async (_args, ctx) => {
			scroll("left", ctx);
		}
	});

	pi.registerCommand("dn", {
		description: "Scroll dashboard carousel right (alias for dashboard-next)",
		handler: async (_args, ctx) => {
			scroll("right", ctx);
		}
	});

	pi.registerCommand("dp", {
		description: "Scroll dashboard carousel left (alias for dashboard-prev)",
		handler: async (_args, ctx) => {
			scroll("left", ctx);
		}
	});

	// Register multiple redundant shortcut combinations to maximize compatibility
	const scrollRightKeys = ["ctrl+shift+right", "ctrl+alt+right", "ctrl+shift+l", "ctrl+alt+l"];
	const scrollLeftKeys = ["ctrl+shift+left", "ctrl+alt+left", "ctrl+shift+h", "ctrl+alt+h"];

	for (const key of scrollRightKeys) {
		pi.registerShortcut(key as any, {
			description: "Scroll agent dashboard right",
			handler: (ctx) => {
				scroll("right", ctx);
			}
		});
	}

	for (const key of scrollLeftKeys) {
		pi.registerShortcut(key as any, {
			description: "Scroll agent dashboard left",
			handler: (ctx) => {
				scroll("left", ctx);
			}
		});
	}

	// 1. Session Start event handler
	pi.on("session_start", (_event, ctx) => {
		discovered = loadAgents();
		agentStateMap.clear();
		lastActiveAgentName = "";

		for (const agent of discovered) {
			agentStateMap.set(agent.name, {
				name: agent.name,
				status: "idle",
				contextPercent: 0,
				model: agent.model,
				tokensPerSec: 0
			});
		}

		detectActiveAgent(ctx.getSystemPrompt());

		// Pull current context usage if available
		const usage = ctx.getContextUsage();
		if (usage && activeAgentName) {
			const state = agentStateMap.get(activeAgentName);
			if (state) {
				state.contextPercent = usage.percent ?? 0;
			}
		}

		renderDashboard(ctx);

		// Re-render when terminal is resized
		const handleResize = () => renderDashboard(ctx);
		process.stdout.on("resize", handleResize);

		// Clean up listener when session ends
		pi.on("session_shutdown", () => {
			process.stdout.removeListener("resize", handleResize);
		});
	});

	// 2. Before Agent Start event handler
	pi.on("before_agent_start", (event, ctx) => {
		detectActiveAgent(event.systemPrompt, event.prompt);
		for (const [name, state] of agentStateMap.entries()) {
			if (name === activeAgentName) {
				state.status = "running";
				state.model = ctx.model?.id || state.model;
			} else {
				state.status = "idle";
				state.tokensPerSec = 0;
			}
		}
		renderDashboard(ctx);
	});

	// 3. Turn Start handler
	pi.on("turn_start", (_event, ctx) => {
		startTime = Date.now();
		tokenCount = 0;
		for (const [name, state] of agentStateMap.entries()) {
			if (name === activeAgentName) {
				state.status = "running";
				state.tokensPerSec = 0;
			} else {
				state.status = "idle";
				state.tokensPerSec = 0;
			}
		}
		renderDashboard(ctx);
	});

	// 4. Message Streaming updates
	pi.on("message_update", (event, ctx) => {
		if (event.assistantMessageEvent.type === "text_delta" || event.assistantMessageEvent.type === "thinking_delta") {
			const delta = event.assistantMessageEvent.delta || "";
			tokenCount += delta.length / 4; // estimate tokens from text delta
		}

		const elapsed = (Date.now() - startTime) / 1000;
		if (activeAgentName && elapsed > 0.1) {
			const state = agentStateMap.get(activeAgentName);
			if (state) {
				state.tokensPerSec = tokenCount / elapsed;
			}
		}
		renderDashboard(ctx);
	});

	// 5. Turn End handler
	pi.on("turn_end", (event, ctx) => {
		const elapsed = (Date.now() - startTime) / 1000;
		if (activeAgentName && elapsed > 0.1) {
			const state = agentStateMap.get(activeAgentName);
			if (state) {
				if (event.message && event.message.role === "assistant") {
					const usage = event.message.usage;
					if (usage && usage.output) {
						state.tokensPerSec = usage.output / elapsed;
					}
				}
			}
		}
		renderDashboard(ctx);
	});

	// 6. Agent End handler
	pi.on("agent_end", (_event, ctx) => {
		if (activeAgentName) {
			const state = agentStateMap.get(activeAgentName);
			if (state) {
				state.status = "idle";
				state.tokensPerSec = 0;
			}
		}

		// Refresh context percentage usage
		const usage = ctx.getContextUsage();
		if (usage && activeAgentName) {
			const state = agentStateMap.get(activeAgentName);
			if (state) {
				state.contextPercent = usage.percent ?? 0;
			}
		}
		renderDashboard(ctx);
	});

	// 7. Context compaction handler
	pi.on("session_compact", (_event, ctx) => {
		const usage = ctx.getContextUsage();
		if (usage && activeAgentName) {
			const state = agentStateMap.get(activeAgentName);
			if (state) {
				state.contextPercent = usage.percent ?? 0;
			}
		}
		renderDashboard(ctx);
	});

	// 8. Model change selection
	pi.on("model_select", (event, ctx) => {
		if (activeAgentName) {
			const state = agentStateMap.get(activeAgentName);
			if (state) {
				state.model = event.model.id;
			}
		}
		renderDashboard(ctx);
	});
}
