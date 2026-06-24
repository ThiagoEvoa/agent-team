import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import agentSwitcher from "./agent-switcher";
import agentDashboard from "./agent-dashboard";
import customTui from "./custom-tui";

export default function agentTeamExtension(pi: ExtensionAPI) {
  agentSwitcher(pi);
  agentDashboard(pi);
  customTui(pi);
}
