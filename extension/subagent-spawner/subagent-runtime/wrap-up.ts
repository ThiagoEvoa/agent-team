import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function registerWrapUp(pi: ExtensionAPI) {
	const wrapUpAt = Number(process.env.PI_SUBAGENT_WRAP_UP_AT);
	if (!Number.isSafeInteger(wrapUpAt) || wrapUpAt <= 0) return;

	let timer: ReturnType<typeof setTimeout> | undefined;
	let sent = false;
	const cancelTimer = () => clearTimeout(timer);

	pi.on("agent_start", (_event, ctx) => {
		cancelTimer();
		if (sent) return;
		timer = setTimeout(() => {
			if (ctx.isIdle()) return;
			sent = true;
			pi.sendUserMessage(
				"The assignment is approaching its hard timeout. Finish now. Save the final handoff to the supplied scratch path and return a concise summary of completed work, verification, pending or uncertain effects, and unfinished steps. Start no new implementation, publication, or long-running checks.",
				{ deliverAs: "steer" },
			);
		}, Math.max(0, wrapUpAt - Date.now()));
		timer.unref();
	});
	pi.on("agent_end", cancelTimer);
	pi.on("session_shutdown", cancelTimer);
}
