import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

interface AgentMeta {
  name: string;
  description: string;
  path: string;
  content: string;
}

const agentsDir = join(homedir(), ".agents/agents");
const selectionInstructions = `## Agent selection and TUI synchronization
Select primary agent semantically using SYSTEM.md routing rules (action first, domain second).
Before doing task work, call selectAgent with the exact agent filename stem. This loads
its instructions and updates the TUI. Reading a file or announcing a role alone does
not select an agent. Follow the returned instructions for this task. If no agent fits,
ask for clarification instead of guessing. Do not use spawnSubagent to select your own role.
Auto selections apply only to this task; manual /agent selections stay pinned.`;

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

    let description = agentName;
    if (path.endsWith(".json")) {
      const parsed = JSON.parse(content);
      description = parsed.description || parsed.name || agentName;
      content = parsed.instructions || content;
    } else {
      const match = content.match(/^#\s+(.+)/m);
      if (match) description = match[1];
    }
    return { name: agentName, description, path, content };
  } catch {
    return null;
  }
}

async function listAgents(): Promise<AgentMeta[]> {
  try {
    const files = await readdir(agentsDir);
    const names = files
      .filter((file) => /\.(md|json)$/.test(file))
      .map((file) => file.replace(/\.(md|json)$/, ""));
    const agents = await Promise.all([...new Set(names)].map(loadAgent));
    return agents.filter((agent): agent is AgentMeta => agent !== null).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function setAgentStatus(ctx: ExtensionContext, name: string | null, manual = false): void {
  ctx.ui.setStatus("agent", name ? `Using: ${name}${manual ? "" : " (auto)"}` : "None");
}

export default function (pi: ExtensionAPI) {
  // Instance-local state: concurrent sessions must not share persona selection.
  let currentAgent: AgentMeta | null = null;
  let currentAgentIsManual = false;

  pi.on("session_start", async (_event, ctx) => {
    currentAgent = null;
    currentAgentIsManual = false;
    setAgentStatus(ctx, null);
  });

  pi.registerCommand("agent", {
    description: "Switch to a specialized agent; /agent auto unpins manual selection",
    handler: async (args, ctx) => {
      let selected: string | undefined = args?.trim();
      if (selected?.toLowerCase() === "auto") {
        currentAgent = null;
        currentAgentIsManual = false;
        setAgentStatus(ctx, null);
        ctx.ui.notify("Per-task semantic agent selection enabled.", "info");
        return;
      }
      const agents = await listAgents();
      if (!agents.length) {
        ctx.ui.notify("No agents found in ~/.agents/agents/", "error");
        return;
      }
      if (!selected) selected = await ctx.ui.select("Select Agent", agents.map((agent) => agent.name));
      if (!selected) return;
      const agent = agents.find((candidate) => candidate.name.toLowerCase() === selected!.toLowerCase());
      if (!agent) {
        ctx.ui.notify(`Agent "${selected}" not found. Use an exact name from /agent.`, "error");
        return;
      }
      currentAgent = agent;
      currentAgentIsManual = true;
      setAgentStatus(ctx, agent.name, true);
      ctx.ui.notify(`Loaded agent: ${agent.name}\n\n${agent.description}`, "info");
    },
  });

  // Explicit semantic selection replaces the second, conflicting keyword router.
  (pi.registerTool as (tool: unknown) => unknown)({
    name: "selectAgent",
    label: "Select Agent",
    description: "Select your primary agent for this task, load its instructions, and update the TUI. Use semantic action-first routing from SYSTEM.md. Not a child agent.",
    promptSnippet: "Select primary agent before task work; loads instructions and updates TUI",
    parameters: {
      type: "object",
      required: ["agent"],
      additionalProperties: false,
      properties: {
        agent: { type: "string", description: "Exact filename stem from ~/.agents/agents/, e.g. researcher or dart-senior-reviewer." },
      },
    },
    async execute(_toolCallId: string, params: { agent: string }, _signal: AbortSignal | undefined, _onUpdate: unknown, ctx: ExtensionContext) {
      const agents = await listAgents();
      const agent = agents.find((candidate) => candidate.name === params.agent);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Unknown agent "${params.agent}". Available: ${agents.map((candidate) => candidate.name).join(", ") || "none"}.` }],
          details: { ok: false },
        };
      }
      if (currentAgentIsManual && currentAgent?.name !== agent.name) {
        return {
          content: [{ type: "text", text: `Manual agent ${currentAgent?.name} is pinned. Follow its instructions. User can run /agent auto to unpin.` }],
          details: { ok: false },
        };
      }
      currentAgent = agent;
      setAgentStatus(ctx, agent.name, currentAgentIsManual);
      return {
        content: [{ type: "text", text: `## Active Agent: ${agent.name}\n\n${agent.content}` }],
        details: { ok: true, agent: agent.name, path: agent.path },
      };
    },
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (!currentAgentIsManual) {
      currentAgent = null;
      setAgentStatus(ctx, null);
    }
    const persona = currentAgent ? `\n\n## Active Agent: ${currentAgent.name}\n\n${currentAgent.content}` : "";
    return { systemPrompt: `${event.systemPrompt}\n\n${selectionInstructions}${persona}` };
  });

  pi.on("agent_end", async (_event, _ctx) => {
    // Keep last-used status visible, but never reuse an auto persona next task.
    if (!currentAgentIsManual) currentAgent = null;
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    currentAgent = null;
    currentAgentIsManual = false;
    setAgentStatus(ctx, null);
  });
}
