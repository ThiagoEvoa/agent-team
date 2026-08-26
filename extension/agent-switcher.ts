import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

interface AgentMeta {
  name: string;
  description: string;
  path: string;
  content: string;
}

let currentAgent: AgentMeta | null = null;
const agentsDir = join(homedir(), ".agents/agents");

async function loadAgent(agentName: string): Promise<AgentMeta | null> {
  try {
    let path = join(agentsDir, `${agentName}.md`);
    let content = "";
    try {
      content = await readFile(path, "utf-8");
    } catch {
      path = join(agentsDir, `${agentName}.json`);
      content = await readFile(path, "utf-8");
    }

    // Extract description from first markdown h1 or content
    let desc = agentName;
    if (path.endsWith(".json")) {
      try {
        const parsed = JSON.parse(content);
        desc = parsed.description || parsed.name || agentName;
        content = parsed.instructions || content;
      } catch {}
    } else {
      const descMatch = content.match(/^#\s+(.+)/m);
      if (descMatch) desc = descMatch[1];
    }

    return { name: agentName, description: desc, path, content };
  } catch (error) {
    return null;
  }
}

async function listAgents(): Promise<AgentMeta[]> {
  try {
    const files = await readdir(agentsDir);
    const validFiles = files.filter((f) => (f.endsWith(".md") || f.endsWith(".json")) && f !== ".DS_Store");
    
    const agents: AgentMeta[] = [];
    const seenNames = new Set<string>();
    for (const file of validFiles) {
      const name = file.replace(/\.(md|json)$/, "");
      if (seenNames.has(name)) continue;
      seenNames.add(name);
      const agent = await loadAgent(name);
      if (agent) agents.push(agent);
    }
    return agents.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    return [];
  }
}

export default function (pi: ExtensionAPI) {
  // Notify on extension load
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("Agent Switcher loaded. Use `/agent` to switch agents.", "info");
    currentAgent = null;
    (global as any).activeAgentName = "None";
  });

  // Register /agent command
  pi.registerCommand("agent", {
    description: "Switch to a specialized agent",
    handler: async (args, ctx) => {
      const agents = await listAgents();

      if (!agents.length) {
        ctx.ui.notify("❌ No agents found in ~/.agents/agents/", "error");
        return;
      }

      // If arg provided, try direct load
      if (args && args.trim()) {
        const target = args.trim();
        const agent = agents.find((a) =>
          a.name.toLowerCase().includes(target.toLowerCase())
        );

        if (!agent) {
          ctx.ui.notify(`❌ Agent "${target}" not found`, "error");
          return;
        }

        currentAgent = agent;
        (global as any).activeAgentName = agent.name;
        ctx.ui.notify(
          `✅ Loaded agent: ${agent.name}\n\n${agent.description}`,
          "info"
        );
        ctx.ui.setStatus("agent", `Using: ${agent.name}`);
        return;
      }

      // Show selection menu
      const selected = await ctx.ui.select(
        "Select Agent",
        agents.map((a) => a.name)
      );

      if (selected) {
        const agent = agents.find((a) => a.name === selected);
        if (agent) {
          currentAgent = agent;
          (global as any).activeAgentName = agent.name;
          ctx.ui.notify(
            `✅ Loaded agent: ${agent.name}\n\n${agent.description}`,
            "info"
          );
          ctx.ui.setStatus("agent", `Using: ${agent.name}`);
        }
      }
    },
  });

  // Inject agent context into system prompt before each turn
  pi.on("before_agent_start", async (event, ctx) => {
    let agentToLoad = currentAgent;

    if (!agentToLoad && event.prompt) {
      // Try to auto-load based on triggers in SYSTEM.md
      const systemMdPath = join(homedir(), ".pi/agent/SYSTEM.md");
      try {
        const systemMdContent = await readFile(systemMdPath, "utf-8");
        const blocks = systemMdContent.split(/###\s+/);
        const promptLower = event.prompt.toLowerCase();

        for (const block of blocks) {
          const loadMatch = block.match(/\*\*Load:\*\*\s*.*?agents\/([a-zA-Z0-9_-]+)\.(md|json)/);
          const triggersMatch = block.match(/\*\*Triggers:\*\*\s*(.+)/);
          if (loadMatch && triggersMatch) {
            const agentName = loadMatch[1];
            const keywords = Array.from(triggersMatch[1].matchAll(/"([^"]+)"/g)).map(m => m[1].toLowerCase());
            
            // Check if any keyword matches the prompt
            if (keywords.some(keyword => promptLower.includes(keyword))) {
              const loaded = await loadAgent(agentName);
              if (loaded) {
                agentToLoad = loaded;
                (global as any).activeAgentName = agentName;
                ctx.ui.notify(`ℹ️ Auto-loaded agent "${agentName}" based on prompt keywords`, "info");
                ctx.ui.setStatus("agent", `Using: ${agentName} (auto)`);
                break;
              }
            }
          }
        }
      } catch (err) {
        // Ignore parsing/reading errors
      }
    }

    if (!agentToLoad) return;

    const agentContext = `\n\n## Active Agent: ${agentToLoad.name}\n\n${agentToLoad.content}`;

    return {
      systemPrompt: event.systemPrompt + agentContext,
    };
  });

  // Track when agent is loaded on session start
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setStatus("agent", currentAgent ? `Using: ${currentAgent.name}` : "None");
    (global as any).activeAgentName = currentAgent ? currentAgent.name : "None";
  });

  // Reset status bar when agent loop ends if it was auto-loaded
  pi.on("agent_end", async (_event, ctx) => {
    ctx.ui.setStatus("agent", currentAgent ? `Using: ${currentAgent.name}` : "None");
    (global as any).activeAgentName = currentAgent ? currentAgent.name : "None";
  });

  // Clear on shutdown
  pi.on("session_shutdown", async (_event, _ctx) => {
    currentAgent = null;
    (global as any).activeAgentName = "None";
  });
}
