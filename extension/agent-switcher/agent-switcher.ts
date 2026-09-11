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
let currentAgentIsManual = false;
const agentsDir = join(homedir(), ".agents/agents");

// Deterministic GUI routing. No match => no active agent.
// Product Owner requires explicit project-management intent.
const ROUTES: Array<{ agent: string; patterns: RegExp[] }> = [
  { agent: "researcher", patterns: [/\bresearch\b/i, /\bverify\b/i, /\binvestigate\b/i] },
  { agent: "dart-senior-reviewer", patterns: [/\breview\b/i, /\baudit\b/i, /\blint\b/i, /\bpull request\b/i] },
  { agent: "flutter-qa-specialist", patterns: [/\btest\b/i, /\bqa\b/i, /\bintegration test\b/i, /\bwidget test\b/i] },
  { agent: "devops-specialist", patterns: [/\bdeploy\b/i, /\bci\/cd\b/i, /\bdocker\b/i, /\bkubernetes\b/i, /\bgithub actions\b/i] },
  { agent: "dartfrog-senior-developer", patterns: [/\bdart frog\b/i, /\bapi endpoint\b/i, /\bbackend route\b/i, /\bmiddleware\b/i] },
  { agent: "ui-ux-designer", patterns: [/\bdesign\b/i, /\bfigma\b/i, /\bux\b/i, /\bvisual design\b/i] },
  { agent: "senior-architect", patterns: [/\barchitecture\b/i, /\brefactor\b/i, /\bmodule design\b/i, /\bseam\b/i] },
  { agent: "spec-specialist", patterns: [/\brequirements?\b/i, /\bspecification\b/i, /\bscope\b/i, /\bdiscovery\b/i] },
  { agent: "product-owner", patterns: [/\bgithub project(?:s)?\b/i, /\bbacklog\b/i, /\bissues?\b/i, /\bprioriti[sz](?:e|ation|ing)\b/i, /\bboard state\b/i] },
  { agent: "rubber-duck", patterns: [/\bbrainstorm\b/i, /\bstrategy\b/i, /\bedge cases?\b/i] },
  { agent: "orchestrator", patterns: [/\bmulti-agent\b/i, /\borchestrat(?:e|ion)\b/i, /\bsdd lifecycle\b/i] },
  { agent: "flutter-senior-developer", patterns: [/\bflutter\b/i, /\bwidget\b/i, /\bmobile screen\b/i] },
];

function routeAgent(prompt: string): string | null {
  const matches = ROUTES.filter((route) => route.patterns.some((pattern) => pattern.test(prompt)));
  return matches.length === 1 ? matches[0].agent : null;
}

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
      try {
        const parsed = JSON.parse(content);
        description = parsed.description || parsed.name || agentName;
        content = parsed.instructions || content;
      } catch {}
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
      .filter((file) => /\.(md|json)$/.test(file) && file !== ".DS_Store")
      .map((file) => file.replace(/\.(md|json)$/, ""));
    const uniqueNames = [...new Set(names)];
    const agents = await Promise.all(uniqueNames.map(loadAgent));
    return agents.filter((agent): agent is AgentMeta => agent !== null).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function setAgentStatus(ctx: any, name: string | null, manual = false): void {
  const label = name ? `Using: ${name}${manual ? "" : " (auto)"}` : "None";
  ctx.ui.setStatus("agent", label);
  (global as any).activeAgentName = name ?? "None";
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    currentAgent = null;
    currentAgentIsManual = false;
    setAgentStatus(ctx, null);
    ctx.ui.notify("Agent Switcher loaded. Use `/agent` to switch agents.", "info");
  });

  pi.registerCommand("agent", {
    description: "Switch to a specialized agent",
    handler: async (args, ctx) => {
      const agents = await listAgents();
      if (!agents.length) {
        ctx.ui.notify("❌ No agents found in ~/.agents/agents/", "error");
        return;
      }

      let selected: string | undefined = args?.trim();
      if (!selected) selected = await ctx.ui.select("Select Agent", agents.map((agent) => agent.name));
      if (!selected) return;

      const agent = agents.find((candidate) => candidate.name.toLowerCase().includes(selected!.toLowerCase()));
      if (!agent) {
        ctx.ui.notify(`❌ Agent "${selected}" not found`, "error");
        return;
      }

      currentAgent = agent;
      currentAgentIsManual = true;
      setAgentStatus(ctx, agent.name, true);
      ctx.ui.notify(`✅ Loaded agent: ${agent.name}\n\n${agent.description}`, "info");
    },
  });

  // Route every turn. Auto-selected agents never persist as defaults.
  pi.on("before_agent_start", async (event, ctx) => {
    let agentToLoad = currentAgentIsManual ? currentAgent : null;
    if (!agentToLoad && event.prompt) {
      const routedName = routeAgent(event.prompt);
      agentToLoad = routedName ? await loadAgent(routedName) : null;
      currentAgent = agentToLoad;
      currentAgentIsManual = false;
    }

    if (!agentToLoad) {
      currentAgent = null;
      setAgentStatus(ctx, null);
      return;
    }

    setAgentStatus(ctx, agentToLoad.name, currentAgentIsManual);
    return {
      systemPrompt: `${event.systemPrompt}\n\n## Active Agent: ${agentToLoad.name}\n\n${agentToLoad.content}`,
    };
  });

  pi.on("agent_end", async (_event, ctx) => {
    if (!currentAgentIsManual) {
      currentAgent = null;
      setAgentStatus(ctx, null);
    } else {
      setAgentStatus(ctx, currentAgent?.name ?? null, true);
    }
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    currentAgent = null;
    currentAgentIsManual = false;
    setAgentStatus(ctx, null);
  });
}
