import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { DEFAULT_CONFIG, errorMessage, finalAnswerText, loadConfig, normalizeOllamaUrl, saveConfig, speak, type TtsConfig } from "./tts/core.ts";

export default function ttsExtension(pi: ExtensionAPI): void {
	let config: TtsConfig = { ...DEFAULT_CONFIG };
	let configError: string | undefined;
	let finalAnswer = "";
	let active: { controller: AbortController; done: Promise<void> } | undefined;

	const status = (ctx: ExtensionContext, activity?: string): void => {
		if (ctx.hasUI) ctx.ui.setStatus("tts", configError ? "TTS: config error" : config.enabled ? `TTS: ${activity ?? "on"}` : undefined);
	};
	const stop = (): void => {
		finalAnswer = "";
		active?.controller.abort();
	};
	const report = (ctx: ExtensionContext, error: unknown): void => {
		if (ctx.hasUI) ctx.ui.notify(`TTS: ${errorMessage(error)}`, "error");
	};
	const update = async (ctx: ExtensionContext, next: TtsConfig): Promise<void> => {
		await saveConfig(next);
		stop();
		config = next;
		configError = undefined;
		status(ctx);
	};
	const startSpeech = (text: string, ctx: ExtensionContext): void => {
		const previous = active;
		stop();
		const controller = new AbortController();
		const job = { controller, done: Promise.resolve() };
		active = job;
		const snapshot = { ...config };
		status(ctx, "speaking…");
		// Return immediately: speech must never block Pi's settlement or the next prompt.
		job.done = (async () => {
			try {
				await previous?.done;
				controller.signal.throwIfAborted();
				await speak(text, snapshot, controller.signal);
			} catch (error) {
				if (!controller.signal.aborted) report(ctx, error);
			} finally {
				if (active === job) { active = undefined; status(ctx); }
			}
		})();
	};

	pi.on("session_start", async (_event, ctx) => {
		stop();
		try { config = await loadConfig(); configError = undefined; }
		catch (error) { config = { ...DEFAULT_CONFIG }; configError = errorMessage(error); report(ctx, error); }
		status(ctx);
	});
	pi.on("agent_start", (_event, ctx) => { stop(); status(ctx); });
	pi.on("agent_end", (event) => {
		// Use only the last message of the latest run; never search back through old answers.
		finalAnswer = finalAnswerText(event.messages.at(-1));
	});
	pi.on("agent_settled", (event, ctx) => {
		const text = finalAnswer;
		finalAnswer = "";
		if (config.enabled && !configError && ctx.hasUI && !event.aborted && text.trim()) startSpeech(text, ctx);
	});
	pi.on("session_shutdown", async () => { stop(); await active?.done; });

	pi.registerCommand("tts", {
		description: "Toggle final-answer speech: /tts [on|off|status|stop|test|reset]",
		handler: async (args, ctx) => {
			const action = args.trim().toLowerCase();
			try {
				if (action === "stop") {
					stop(); status(ctx); ctx.ui.notify("Speech stopped. The TTS setting is unchanged.", "info"); return;
				}
				if (action === "reset") {
					await update(ctx, { ...DEFAULT_CONFIG }); ctx.ui.notify("TTS reset to defaults (off).", "info"); return;
				}
				if (configError) throw new Error(`${configError} Run /tts reset to restore defaults.`);
				if (action === "status") {
					ctx.ui.notify(`TTS: ${config.enabled ? "on" : "off"}\nOllama URL: ${config.ollamaUrl}\nSpeech model: ${config.model}\nVoice: ${config.voice}`, "info"); return;
				}
				if (action === "test") { startSpeech("Hello! Pi text to speech is ready.", ctx); return; }
				if (!["", "on", "off"].includes(action)) {
					ctx.ui.notify("Usage: /tts [on|off|status|stop|test|reset]", "info"); return;
				}
				await update(ctx, { ...config, enabled: action ? action === "on" : !config.enabled });
				ctx.ui.notify(`Final-answer speech ${config.enabled ? "enabled" : "disabled"}.`, "info");
			} catch (error) { report(ctx, error); }
		},
	});

	for (const field of ["url", "model", "voice"] as const) {
		const key = field === "url" ? "ollamaUrl" : field;
		pi.registerCommand(`tts-${field}`, {
			description: `Show or set the TTS ${field}: /tts-${field} [value|reset]`,
			handler: async (args, ctx) => {
				try {
					if (configError) throw new Error(`${configError} Run /tts reset to restore defaults.`);
					const value = args.trim();
					if (!value) { ctx.ui.notify(`TTS ${field}: ${config[key]}`, "info"); return; }
					const next = value === "reset" ? DEFAULT_CONFIG[key] : field === "url" ? normalizeOllamaUrl(value) : value;
					await update(ctx, { ...config, [key]: next });
					ctx.ui.notify(`TTS ${field} set to ${next}`, "info");
				} catch (error) { report(ctx, error); }
			},
		});
	}
}
