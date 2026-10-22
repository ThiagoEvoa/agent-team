import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const CONFIG_PATH = () => path.join(homedir(), ".pi", "agent", "pdf-img-ocr.json");
const INSTRUCTION = "Transcribe all readable text in this image. Preserve reading order and line breaks where possible. Do not summarize, explain, or invent missing text.";
const MAX_INLINE_CHARS = 32_000;
const PREVIEW_CHARS = 2_000;

function cancelled(signal?: AbortSignal): void {
	if (signal?.aborted) throw new Error("OCR cancelled.");
}

function message(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function normalizeOllamaUrl(value: string): string {
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error("Invalid Ollama URL. Use an address such as http://192.168.1.20:11434.");
	}
	if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password ||
		!["/", "/v1", "/v1/"].includes(url.pathname) || url.search || url.hash) {
		throw new Error("Invalid Ollama URL. Use an HTTP(S) server address, optionally ending in /v1, without credentials or a query.");
	}
	// Pi model configs often use Ollama's OpenAI-compatible /v1 URL. OCR calls native /api endpoints.
	return url.origin;
}

async function loadOllamaUrl(modelBaseUrl: string): Promise<string> {
	const configPath = CONFIG_PATH();
	let config: unknown;
	try {
		config = JSON.parse(await fs.readFile(configPath, "utf8"));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return normalizeOllamaUrl(modelBaseUrl);
		throw new Error(`Cannot read OCR config at ${configPath}: ${message(error)}`);
	}
	if (!config || typeof config !== "object" || typeof (config as { ollamaUrl?: unknown }).ollamaUrl !== "string") {
		throw new Error(`Invalid OCR config at ${configPath}. Run /ocr-url reset to restore the default.`);
	}
	return normalizeOllamaUrl((config as { ollamaUrl: string }).ollamaUrl);
}

async function saveOllamaUrl(url: string): Promise<void> {
	const configPath = CONFIG_PATH();
	await fs.mkdir(path.dirname(configPath), { recursive: true });
	const staged = `${configPath}.${randomUUID()}.tmp`;
	try {
		await fs.writeFile(staged, JSON.stringify({ ollamaUrl: url }, null, 2) + "\n", { flag: "wx", mode: 0o600 });
		await fs.rename(staged, configPath);
	} finally {
		await fs.rm(staged, { force: true });
	}
}

async function ollamaRequest(ollamaUrl: string, endpoint: string, init: RequestInit, signal?: AbortSignal, timeoutMs = 10_000): Promise<unknown> {
	cancelled(signal);
	let response: Response;
	try {
		response = await fetch(`${ollamaUrl}${endpoint}`, {
			...init,
			signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(timeoutMs)]),
		});
	} catch (error) {
		if (signal?.aborted) throw new Error("OCR cancelled.");
		if (error instanceof Error && error.name === "TimeoutError") throw new Error(`Ollama timed out at ${ollamaUrl}.`);
		throw new Error(`Cannot reach Ollama at ${ollamaUrl}. Check the server address and network access. (${message(error)})`);
	}
	if (!response.ok) {
		const detail = (await response.text()).slice(0, 500);
		throw new Error(`Ollama ${endpoint} failed (HTTP ${response.status})${detail ? `: ${detail}` : "."}`);
	}
	try {
		return await response.json();
	} catch {
		throw new Error(`Ollama ${endpoint} returned invalid JSON.`);
	}
}

function selectedModel(ctx: Pick<ExtensionContext, "model">): { id: string; baseUrl: string } {
	const model = ctx.model;
	if (!model) throw new Error("No Pi model is selected. Select an image-capable Ollama model first.");
	if (model.provider !== "ollama") throw new Error(`Selected Pi model ${model.provider}/${model.id} is not an Ollama model.`);
	if (!model.input.includes("image")) throw new Error(`Selected Pi model ${model.id} does not accept images. Select a vision model.`);
	return { id: model.id, baseUrl: model.baseUrl };
}

async function checkOllama(ollamaUrl: string, modelId: string, signal?: AbortSignal): Promise<void> {
	const data = await ollamaRequest(ollamaUrl, "/api/tags", { method: "GET" }, signal);
	if (!data || typeof data !== "object" || !Array.isArray((data as { models?: unknown }).models)) {
		throw new Error("Ollama /api/tags returned an invalid model list.");
	}
	const models = (data as { models: unknown[] }).models;
	if (!models.some((entry) => entry && typeof entry === "object" &&
		["name", "model"].some((key) => {
			const value = (entry as Record<string, unknown>)[key];
			return value === modelId || (modelId.endsWith(":latest") && value === modelId.slice(0, -7));
		}))) {
		throw new Error(`Selected Pi model ${modelId} is unavailable at ${ollamaUrl}. Check the model ID in Pi and the models installed on that Ollama server.`);
	}
}

async function transcribeImage(imagePath: string, label: string, ollamaUrl: string, modelId: string, signal?: AbortSignal): Promise<string> {
	cancelled(signal);
	let image: Buffer;
	try {
		image = await fs.readFile(imagePath);
	} catch (error) {
		throw new Error(`Cannot read ${label}: ${message(error)}`);
	}
	cancelled(signal);
	const data = await ollamaRequest(ollamaUrl, "/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			model: modelId,
			messages: [{ role: "user", content: INSTRUCTION, images: [image.toString("base64")] }],
			stream: false,
		}),
	}, signal, 300_000);
	const content = data && typeof data === "object" && (data as { message?: { content?: unknown } }).message?.content;
	if (typeof content !== "string" || !content.trim()) throw new Error(`Ollama returned no OCR text for ${label}.`);
	return content.trim();
}

async function renderPdf(pdfPath: string, outputPrefix: string, signal?: AbortSignal): Promise<void> {
	cancelled(signal);
	await new Promise<void>((resolve, reject) => {
		const child = spawn("pdftoppm", ["-r", "200", "-png", pdfPath, outputPrefix], {
			stdio: ["ignore", "ignore", "pipe"], shell: false, signal,
		});
		let stderr = "";
		child.stderr.setEncoding("utf8");
		child.stderr.on("data", (chunk: string) => { stderr = (stderr + chunk).slice(-2_000); });
		child.once("error", (error: NodeJS.ErrnoException) => {
			if (signal?.aborted) reject(new Error("OCR cancelled."));
			else if (error.code === "ENOENT") reject(new Error("pdftoppm is missing. Install Poppler (macOS: brew install poppler)."));
			else reject(new Error(`Could not start pdftoppm: ${error.message}`));
		});
		child.once("close", (code) => {
			if (signal?.aborted) reject(new Error("OCR cancelled."));
			else if (code !== 0) reject(new Error(`Could not render PDF ${pdfPath}: ${stderr.trim() || `pdftoppm exited with code ${code}`}`));
			else resolve();
		});
	});
}

/** Full transcription or a path to the complete text plus a preview. */
export async function ocrFile(inputPath: string, cwd: string, modelId: string, signal?: AbortSignal, serverUrl = DEFAULT_OLLAMA_URL): Promise<string> {
	if (!modelId.trim()) throw new Error("No Pi model is selected. Select an image-capable Ollama model first.");
	const ollamaUrl = normalizeOllamaUrl(serverUrl);
	const filePath = path.resolve(cwd, inputPath);
	const extension = path.extname(filePath).toLowerCase();
	if (![".png", ".jpg", ".jpeg", ".pdf"].includes(extension)) {
		throw new Error(`Unsupported OCR file: ${filePath}. Use .png, .jpg, .jpeg, or .pdf.`);
	}
	let stat;
	try {
		stat = await fs.stat(filePath);
	} catch (error) {
		throw new Error(`OCR file not found or inaccessible: ${filePath}. (${message(error)})`);
	}
	if (!stat.isFile()) throw new Error(`OCR path is not a regular file: ${filePath}`);
	await checkOllama(ollamaUrl, modelId, signal);

	let transcript: string;
	if (extension === ".pdf") {
		const renderDir = await fs.mkdtemp(path.join(tmpdir(), "pi-ocr-pages-"));
		try {
			await renderPdf(filePath, path.join(renderDir, "page"), signal);
			const pages = (await fs.readdir(renderDir))
				.map((name) => ({ name, match: /^page-(\d+)\.png$/.exec(name) }))
				.filter((entry): entry is { name: string; match: RegExpExecArray } => entry.match !== null)
				.sort((a, b) => Number(a.match[1]) - Number(b.match[1]));
			if (!pages.length) throw new Error(`PDF rendered no pages: ${filePath}`);
			const parts: string[] = [];
			for (const page of pages) {
				const number = Number(page.match[1]);
				try {
					parts.push(`Page ${number}\n${await transcribeImage(path.join(renderDir, page.name), `page ${number} of ${filePath}`, ollamaUrl, modelId, signal)}`);
				} catch (error) {
					throw new Error(`OCR failed on page ${number} of ${filePath}: ${message(error)}`);
				}
			}
			transcript = parts.join("\n\n");
		} finally {
			await fs.rm(renderDir, { recursive: true, force: true });
		}
	} else {
		transcript = await transcribeImage(filePath, filePath, ollamaUrl, modelId, signal);
	}

	if (transcript.length <= MAX_INLINE_CHARS) return transcript;
	const outputPath = path.join(tmpdir(), `pi-ocr-${randomUUID()}.txt`);
	await fs.writeFile(outputPath, transcript, { encoding: "utf8", flag: "wx", mode: 0o600 });
	return `Full OCR transcription: ${outputPath}\n\nPreview:\n${transcript.slice(0, PREVIEW_CHARS)}\n\nThe preview is partial; read the file for the complete text.`;
}

export default function pdfImgOcr(pi: ExtensionAPI): void {
	(pi.registerTool as (tool: unknown) => void)({
		name: "ocr",
		label: "Local OCR",
		description: "Transcribe a local PNG, JPEG, or PDF with Pi's selected Ollama vision model. Returns page labels for PDFs.",
		parameters: {
			type: "object",
			required: ["path"],
			additionalProperties: false,
			properties: { path: { type: "string", description: "Local image or PDF path, relative to Pi's working directory or absolute" } },
		},
		async execute(_toolCallId: string, params: { path: string }, signal: AbortSignal | undefined, _onUpdate: unknown, ctx: { cwd: string; model: ExtensionContext["model"] }) {
			try {
				const model = selectedModel(ctx);
				const result = await ocrFile(params.path, ctx.cwd, model.id, signal, await loadOllamaUrl(model.baseUrl));
				return { content: [{ type: "text", text: result }] };
			} catch (error) {
				return { content: [{ type: "text", text: `OCR failed: ${message(error)}` }], isError: true };
			}
		},
	});

	pi.registerCommand("ocr", {
		description: "Transcribe a local image or PDF: /ocr <path>",
		handler: async (args, ctx) => {
			const inputPath = args.trim();
			if (!inputPath) {
				ctx.ui.notify("Usage: /ocr <path-to.png|jpg|jpeg|pdf>", "info");
				return;
			}
			try {
				const model = selectedModel(ctx);
				const result = await ocrFile(inputPath, ctx.cwd, model.id, ctx.signal, await loadOllamaUrl(model.baseUrl));
				pi.sendMessage({ customType: "pdf-img-ocr", content: result, display: true });
			} catch (error) {
				ctx.ui.notify(`OCR failed: ${message(error)}`, "error");
			}
		},
	});

	pi.registerCommand("ocr-url", {
		description: "Show or set the Ollama server URL: /ocr-url <http://host:11434[/v1]|reset>",
		handler: async (args, ctx) => {
			const value = args.trim();
			try {
				if (!value) {
					ctx.ui.notify(`OCR Ollama URL: ${await loadOllamaUrl(ctx.model?.baseUrl ?? DEFAULT_OLLAMA_URL)}`, "info");
				} else if (value === "reset") {
					await fs.rm(CONFIG_PATH(), { force: true });
					ctx.ui.notify(`OCR Ollama URL reset to ${normalizeOllamaUrl(ctx.model?.baseUrl ?? DEFAULT_OLLAMA_URL)}`, "info");
				} else {
					const url = normalizeOllamaUrl(value);
					await saveOllamaUrl(url);
					ctx.ui.notify(`OCR Ollama URL set to ${url}`, "info");
				}
			} catch (error) {
				ctx.ui.notify(`OCR URL error: ${message(error)}`, "error");
			}
		},
	});
}
