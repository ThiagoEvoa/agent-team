import { promises as fs } from "node:fs";
import path from "node:path";

import type { Model, TextContent } from "@earendil-works/pi-ai";
import { uuidv7 } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

type NoteReference = {
	id: string;
	description: string;
	path: string;
	relatedNotes: string[];
};

type NoteIndex = {
	version: 1;
	notes: NoteReference[];
};

type TakeNoteFlags = {
	dryRun: boolean;
	forceNew: boolean;
	updateId?: string;
	relatedOverride: string[];
	focus: string;
};

type SynthesisResult = {
	shouldCreate: boolean;
	description: string;
	content: string;
	relatedNotes: string[];
};

type Candidate = {
	note: NoteReference;
	score: number;
};

const NOTES_ROOT = ["agent", "notes"];
const INDEX_FILE = "index.json";
const INDEX_VERSION = 1 as const;
const MAX_DESCRIPTION_LENGTH = 96;
const MAX_CONTENT_LENGTH = 320;
const MAX_SESSION_CHARS = 20_000;

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

const slugify = (value: string): string =>
	normalize(value)
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 48) || "note";

const tokenize = (value: string): Set<string> => new Set(normalize(value).split(" ").filter((v) => v.length >= 3));

const jaccard = (left: Set<string>, right: Set<string>): number => {
	if (left.size === 0 || right.size === 0) return 0;
	let intersection = 0;
	for (const token of left) {
		if (right.has(token)) intersection += 1;
	}
	const union = left.size + right.size - intersection;
	return union === 0 ? 0 : intersection / union;
};

const nowIdPrefix = (): string => {
	const iso = new Date().toISOString();
	return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
};

const parseTokens = (raw: string): string[] => {
	const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
	const tokens: string[] = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(raw)) !== null) {
		tokens.push(match[1] ?? match[2] ?? match[3]);
	}
	return tokens;
};

const parseFlags = (args: string): TakeNoteFlags => {
	const tokens = parseTokens(args);
	const flags: TakeNoteFlags = {
		dryRun: false,
		forceNew: false,
		relatedOverride: [],
		focus: "",
	};
	const focusTokens: string[] = [];

	for (let i = 0; i < tokens.length; i += 1) {
		const token = tokens[i];
		if (token === "--dry-run") {
			flags.dryRun = true;
			continue;
		}
		if (token === "--force-new") {
			flags.forceNew = true;
			continue;
		}
		if (token === "--update") {
			flags.updateId = tokens[i + 1];
			i += 1;
			continue;
		}
		if (token === "--related") {
			const next = tokens[i + 1] ?? "";
			flags.relatedOverride = next
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean);
			i += 1;
			continue;
		}
		focusTokens.push(token);
	}

	flags.focus = focusTokens.join(" ").trim();
	return flags;
};

const ensureDir = async (directory: string): Promise<void> => {
	await fs.mkdir(directory, { recursive: true });
};

const getPaths = (cwd: string): { notesDir: string; indexPath: string } => {
	const notesDir = path.join(cwd, ...NOTES_ROOT);
	return { notesDir, indexPath: path.join(notesDir, INDEX_FILE) };
};

const validateReference = (ref: NoteReference): void => {
	if (!ref.id || !ref.description || !ref.path || !Array.isArray(ref.relatedNotes)) {
		throw new Error("Invalid note reference detected in index.json");
	}
};

const readIndex = async (cwd: string): Promise<NoteIndex> => {
	const { notesDir, indexPath } = getPaths(cwd);
	await ensureDir(notesDir);

	try {
		const raw = await fs.readFile(indexPath, "utf8");
		const parsed = JSON.parse(raw) as NoteIndex;
		if (!parsed || parsed.version !== INDEX_VERSION || !Array.isArray(parsed.notes)) {
			throw new Error("Invalid index format");
		}
		for (const ref of parsed.notes) validateReference(ref);
		return parsed;
	} catch (error) {
		const notFound = (error as NodeJS.ErrnoException).code === "ENOENT";
		if (!notFound) throw error;
		const empty: NoteIndex = { version: INDEX_VERSION, notes: [] };
		await writeIndexAtomic(cwd, empty);
		return empty;
	}
};

const writeIndexAtomic = async (cwd: string, index: NoteIndex): Promise<void> => {
	const { notesDir, indexPath } = getPaths(cwd);
	await ensureDir(notesDir);
	const tempPath = `${indexPath}.tmp`;
	await fs.writeFile(tempPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
	await fs.rename(tempPath, indexPath);
};

const safeResolveNotePath = (cwd: string, relativePath: string): string => {
	const { notesDir } = getPaths(cwd);
	const resolved = path.resolve(notesDir, relativePath);
	const root = path.resolve(notesDir) + path.sep;
	if (!resolved.startsWith(root)) {
		throw new Error("Rejected unsafe note path");
	}
	return resolved;
};

const readNoteContent = async (cwd: string, ref: NoteReference): Promise<string> => {
	const absolute = safeResolveNotePath(cwd, ref.path);
	return fs.readFile(absolute, "utf8");
};

const extractTextParts = (content: unknown): string[] => {
	if (typeof content === "string") return [content];
	if (!Array.isArray(content)) return [];
	const textParts: string[] = [];
	for (const block of content) {
		if (!block || typeof block !== "object") continue;
		const value = block as { type?: string; text?: string };
		if (value.type === "text" && typeof value.text === "string") textParts.push(value.text);
	}
	return textParts;
};

const buildSessionTranscript = (ctx: ExtensionCommandContext): string => {
	const sections: string[] = [];
	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type !== "message") continue;
		const role = entry.message.role;
		if (role !== "user" && role !== "assistant") continue;
		const text = extractTextParts(entry.message.content).join("\n").trim();
		if (!text) continue;
		sections.push(`${role === "user" ? "User" : "Assistant"}: ${text}`);
	}
	const transcript = sections.join("\n\n");
	if (transcript.length <= MAX_SESSION_CHARS) return transcript;
	return transcript.slice(transcript.length - MAX_SESSION_CHARS);
};

const extractTextFromCompletion = (content: ReadonlyArray<{ type: string; text?: string }>): string =>
	content
		.filter((item): item is TextContent => item.type === "text" && typeof item.text === "string")
		.map((item) => item.text)
		.join("\n")
		.trim();

const findFirstJSONObject = (value: string): string | undefined => {
	let depth = 0;
	let inString = false;
	let escaped = false;
	let start = -1;

	for (let i = 0; i < value.length; i += 1) {
		const char = value[i];
		if (inString) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (char === "\\") {
				escaped = true;
				continue;
			}
			if (char === '"') inString = false;
			continue;
		}
		if (char === '"') {
			inString = true;
			continue;
		}
		if (char === "{") {
			if (depth === 0) start = i;
			depth += 1;
			continue;
		}
		if (char === "}") {
			if (depth > 0) depth -= 1;
			if (depth === 0 && start >= 0) return value.slice(start, i + 1);
		}
	}
	return undefined;
};

const parseJsonFromModel = <T>(text: string): T => {
	const fenced = text.match(/```json\s*([\s\S]*?)```/i)?.[1] ?? text;
	const objectText = findFirstJSONObject(fenced) ?? fenced;
	return JSON.parse(objectText) as T;
};

const validateSynthesis = (raw: SynthesisResult): SynthesisResult => {
	const description = (raw.description ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_DESCRIPTION_LENGTH);
	const content = (raw.content ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_CONTENT_LENGTH);
	const relatedNotes = Array.isArray(raw.relatedNotes)
		? raw.relatedNotes.map((noteId) => noteId.trim()).filter(Boolean)
		: [];
	const shouldCreate = Boolean(raw.shouldCreate);
	if (!shouldCreate) return { shouldCreate: false, description: "", content: "", relatedNotes: [] };
	if (!description) throw new Error("Synthesis returned empty description");
	if (!content) throw new Error("Synthesis returned empty content");
	return { shouldCreate, description, content, relatedNotes };
};

const buildSynthesisPrompt = (transcript: string, focus: string, index: NoteIndex): string => {
	const noteContext = index.notes
		.slice(-80)
		.map((note) => `- ${note.id} | ${note.description} | related: ${note.relatedNotes.join(",") || "none"}`)
		.join("\n");

	return [
		"You are extracting one durable lesson from this session.",
		"Return JSON only.",
		"If no durable lesson exists, set shouldCreate=false.",
		"Keep output minimal and factual.",
		"Do not include greetings, chronology, or speculative text.",
		focus ? `Focus: ${focus}` : "Focus: strongest durable lesson.",
		"JSON schema:",
		'{"shouldCreate": boolean, "description": string, "content": string, "relatedNotes": string[]}',
		"Rules:",
		"- description: 3-10 words, very short searchable label.",
		"- content: 1-2 short sentences, compact.",
		"- relatedNotes: only IDs from Existing Notes list.",
		"",
		"Existing Notes:",
		noteContext || "(none)",
		"",
		"Session transcript:",
		`<session>\n${transcript}\n</session>`,
	].join("\n");
};

const completeWithModel = async (ctx: ExtensionCommandContext, prompt: string): Promise<string> => {
	const model = ctx.model;
	if (!model) throw new Error("No active model in session");

	const response = await ctx.modelRegistry.complete(
		model as Model<any>,
		{
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: prompt }],
					timestamp: Date.now(),
				},
			],
		},
		{
			reasoningEffort: "medium",
			cacheRetention: "none",
			sessionId: uuidv7(),
		},
	);

	const text = extractTextFromCompletion(response.content);
	if (!text) throw new Error("Model returned empty synthesis");
	return text;
};

const buildDuplicateCandidates = async (
	cwd: string,
	index: NoteIndex,
	synthesis: SynthesisResult,
): Promise<Candidate[]> => {
	const targetDesc = tokenize(synthesis.description);
	const targetBody = tokenize(synthesis.content);
	const candidates: Candidate[] = [];

	for (const note of index.notes) {
		let existingBody = "";
		try {
			existingBody = await readNoteContent(cwd, note);
		} catch {
			// ignore unreadable note; keep description-only score
		}
		const descScore = jaccard(targetDesc, tokenize(note.description));
		const bodyScore = jaccard(targetBody, tokenize(existingBody.slice(0, 400)));
		const exactDescBoost = normalize(note.description) === normalize(synthesis.description) ? 0.4 : 0;
		const score = Math.min(1, descScore * 0.65 + bodyScore * 0.35 + exactDescBoost);
		if (score >= 0.65) candidates.push({ note, score });
	}

	return candidates.sort((a, b) => b.score - a.score);
};

const chooseDuplicateResolution = async (
	ctx: ExtensionCommandContext,
	candidate: Candidate,
): Promise<"update" | "new" | "cancel"> => {
	const message = `Existing note found: \"${candidate.note.description}\" (score ${(candidate.score * 100).toFixed(0)}%)`;
	if (ctx.hasUI) {
		const option = await ctx.ui.select(message, ["Update existing", "Create new", "Cancel"]);
		if (option === "Update existing") return "update";
		if (option === "Create new") return "new";
		return "cancel";
	}
	throw new Error(`${message}. Use --update <id> or --force-new in non-UI mode.`);
};

const mergeSynthesisForUpdate = async (
	ctx: ExtensionCommandContext,
	existingContent: string,
	synthesis: SynthesisResult,
): Promise<SynthesisResult> => {
	const prompt = [
		"Merge existing note and new lesson into one compact note.",
		"Return JSON only with {description, content}.",
		"Keep shortest useful result.",
		"Preserve concrete constraints and decisions.",
		"",
		"Existing note:",
		existingContent,
		"",
		"New lesson:",
		synthesis.content,
		"",
		"Preferred description:",
		synthesis.description,
	].join("\n");

	try {
		const mergedText = await completeWithModel(ctx, prompt);
		const parsed = parseJsonFromModel<{ description: string; content: string }>(mergedText);
		const description = (parsed.description ?? synthesis.description).trim().slice(0, MAX_DESCRIPTION_LENGTH);
		const content = (parsed.content ?? synthesis.content).trim().slice(0, MAX_CONTENT_LENGTH);
		if (!description || !content) return synthesis;
		return { ...synthesis, description, content };
	} catch {
		return synthesis;
	}
};

const ensureKnownRelatedIds = (index: NoteIndex, ids: string[]): string[] => {
	const available = new Set(index.notes.map((note) => note.id));
	return [...new Set(ids.filter((id) => available.has(id)))];
};

const buildMarkdown = (description: string, content: string): string => `# ${description}\n\n${content}\n`;

const upsertReference = (index: NoteIndex, ref: NoteReference): void => {
	const position = index.notes.findIndex((item) => item.id === ref.id);
	if (position >= 0) index.notes[position] = ref;
	else index.notes.push(ref);
};

const ensureBidirectionalRelations = (index: NoteIndex, sourceId: string, related: string[]): void => {
	for (const relatedId of related) {
		const target = index.notes.find((note) => note.id === relatedId);
		if (!target) continue;
		if (!target.relatedNotes.includes(sourceId)) target.relatedNotes.push(sourceId);
	}
};

const persistNewNote = async (
	cwd: string,
	index: NoteIndex,
	synthesis: SynthesisResult,
): Promise<{ created: NoteReference }> => {
	const id = `${nowIdPrefix()}-${slugify(synthesis.description)}`;
	const filename = `${id}.md`;
	const { notesDir } = getPaths(cwd);
	const absolute = path.join(notesDir, filename);

	try {
		await fs.access(absolute);
		throw new Error(`Refusing to overwrite existing note file: ${filename}`);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
	}

	const related = ensureKnownRelatedIds(index, synthesis.relatedNotes);
	const reference: NoteReference = {
		id,
		description: synthesis.description,
		path: filename,
		relatedNotes: related,
	};

	await fs.writeFile(absolute, buildMarkdown(synthesis.description, synthesis.content), "utf8");
	upsertReference(index, reference);
	ensureBidirectionalRelations(index, reference.id, related);
	await writeIndexAtomic(cwd, index);
	return { created: reference };
};

const persistUpdateNote = async (
	cwd: string,
	index: NoteIndex,
	noteId: string,
	synthesis: SynthesisResult,
): Promise<{ updated: NoteReference }> => {
	const target = index.notes.find((note) => note.id === noteId);
	if (!target) throw new Error(`Note not found: ${noteId}`);
	const absolute = safeResolveNotePath(cwd, target.path);
	const related = ensureKnownRelatedIds(index, [...target.relatedNotes, ...synthesis.relatedNotes]);

	target.description = synthesis.description;
	target.relatedNotes = related;
	await fs.writeFile(absolute, buildMarkdown(synthesis.description, synthesis.content), "utf8");
	ensureBidirectionalRelations(index, target.id, related);
	await writeIndexAtomic(cwd, index);
	return { updated: target };
};

const registerTools = (pi: ExtensionAPI): void => {
	pi.registerTool({
		name: "search_notes",
		label: "Search Notes",
		description: "Search note references by description or note content.",
		promptSnippet: "search_notes(query): find relevant notes before reading full note files.",
		parameters: Type.Object({
			query: Type.String({ description: "Search query" }),
			limit: Type.Optional(Type.Number({ minimum: 1, maximum: 20, description: "Maximum results" })),
			includeContent: Type.Optional(Type.Boolean({ description: "Include compact content preview" })),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const index = await readIndex(ctx.cwd);
			const query = normalize(params.query ?? "");
			if (!query) {
				return { content: [{ type: "text", text: "[]" }], details: { count: 0 } };
			}

			const limit = Math.max(1, Math.min(20, Number(params.limit ?? 8)));
			const includeContent = Boolean(params.includeContent);
			const queryTokens = tokenize(query);
			const scored: Array<{ note: NoteReference; score: number; preview?: string }> = [];

			for (const note of index.notes) {
				const descScore = jaccard(queryTokens, tokenize(note.description));
				let preview = undefined as string | undefined;
				let bodyScore = 0;
				if (includeContent || descScore < 0.4) {
					try {
						const content = await readNoteContent(ctx.cwd, note);
						preview = content.replace(/\s+/g, " ").trim().slice(0, 200);
						bodyScore = jaccard(queryTokens, tokenize(content));
					} catch {
						bodyScore = 0;
					}
				}
				const score = descScore * 0.65 + bodyScore * 0.35;
				if (score > 0) scored.push({ note, score, preview });
			}

			const results = scored
				.sort((a, b) => b.score - a.score)
				.slice(0, limit)
				.map((item) => ({
					id: item.note.id,
					description: item.note.description,
					path: path.join(...NOTES_ROOT, item.note.path),
					relatedNotes: item.note.relatedNotes,
					score: Number(item.score.toFixed(3)),
					preview: item.preview,
				}));

			return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }], details: { count: results.length } };
		},
	});

	pi.registerTool({
		name: "read_note",
		label: "Read Note",
		description: "Read note content and related notes by ID.",
		promptSnippet: "read_note(id): load note when reference from search_notes is relevant.",
		parameters: Type.Object({
			id: Type.String({ description: "Note ID" }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const index = await readIndex(ctx.cwd);
			const note = index.notes.find((item) => item.id === params.id);
			if (!note) {
				return { content: [{ type: "text", text: `Note not found: ${params.id}` }], details: { found: false } };
			}
			const content = await readNoteContent(ctx.cwd, note);
			const payload = {
				id: note.id,
				description: note.description,
				path: path.join(...NOTES_ROOT, note.path),
				relatedNotes: note.relatedNotes,
				content,
			};
			return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], details: { found: true } };
		},
	});
};

const runTakeNote = async (args: string, ctx: ExtensionCommandContext): Promise<void> => {
	if (!ctx.isIdle()) {
		ctx.ui.notify("Agent busy. Wait completion before /takenote.", "warning");
		return;
	}

	const flags = parseFlags(args);
	const index = await readIndex(ctx.cwd);
	const transcript = buildSessionTranscript(ctx);
	if (!transcript.trim()) {
		ctx.ui.notify("No session content found for synthesis.", "warning");
		return;
	}

	ctx.ui.notify("Synthesizing compact session note...", "info");
	const modelText = await completeWithModel(ctx, buildSynthesisPrompt(transcript, flags.focus, index));
	let synthesis = validateSynthesis(parseJsonFromModel<SynthesisResult>(modelText));

	if (!synthesis.shouldCreate) {
		ctx.ui.notify("No durable lesson detected. No note created.", "info");
		return;
	}

	if (flags.relatedOverride.length > 0) {
		synthesis.relatedNotes = flags.relatedOverride;
	}
	synthesis.relatedNotes = ensureKnownRelatedIds(index, synthesis.relatedNotes);

	if (flags.dryRun) {
		ctx.ui.notify(`Dry run:\n${JSON.stringify(synthesis, null, 2)}`, "info");
		return;
	}

	if (flags.updateId) {
		const updated = await persistUpdateNote(ctx.cwd, index, flags.updateId, synthesis);
		ctx.ui.notify(`Updated note: ${updated.updated.id}`, "info");
		return;
	}

	let selectedAction: "new" | "update" | "cancel" = "new";
	let selectedCandidate: Candidate | undefined;

	if (!flags.forceNew) {
		const duplicates = await buildDuplicateCandidates(ctx.cwd, index, synthesis);
		if (duplicates.length > 0) {
			selectedCandidate = duplicates[0];
			selectedAction = await chooseDuplicateResolution(ctx, selectedCandidate);
		}
	}

	if (selectedAction === "cancel") {
		ctx.ui.notify("Note creation canceled.", "info");
		return;
	}

	if (selectedAction === "update" && selectedCandidate) {
		const existing = await readNoteContent(ctx.cwd, selectedCandidate.note);
		synthesis = await mergeSynthesisForUpdate(ctx, existing, synthesis);
		synthesis.relatedNotes = ensureKnownRelatedIds(index, [
			...synthesis.relatedNotes,
			...selectedCandidate.note.relatedNotes,
		]);
		const result = await persistUpdateNote(ctx.cwd, index, selectedCandidate.note.id, synthesis);
		ctx.ui.notify(`Updated note: ${result.updated.id}`, "info");
		return;
	}

	if (selectedCandidate && selectedAction === "new") {
		synthesis.relatedNotes = ensureKnownRelatedIds(index, [...synthesis.relatedNotes, selectedCandidate.note.id]);
	}

	const created = await persistNewNote(ctx.cwd, index, synthesis);
	ctx.ui.notify(`Created note: ${path.join(...NOTES_ROOT, created.created.path)}`, "info");
};

export default function notesExtension(pi: ExtensionAPI): void {
	registerTools(pi);

	pi.registerCommand("takenote", {
		description: "Synthesize smallest durable lesson from current session and store it in agent/notes/",
		handler: async (args, ctx) => {
			try {
				await runTakeNote(args, ctx);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				ctx.ui.notify(`takenote failed: ${message}`, "error");
			}
		},
	});
}
