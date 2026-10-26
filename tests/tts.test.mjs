import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { after, before, mock, test } from "node:test";
import ttsExtension from "../extension/tts-extension/tts.ts";
import { DEFAULT_CONFIG, finalAnswerText, loadConfig, normalizeOllamaUrl, saveConfig, speak, speechText, splitSpeech } from "../extension/tts-extension/tts/core.ts";

let root;
let log;
const originalHome = process.env.HOME;
const originalPath = process.env.PATH;
const answer = (text, extra = {}) => ({ role: "assistant", stopReason: "stop", content: [{ type: "text", text }], ...extra });
const wav = ()=> {
	const bytes = Buffer.alloc(48);
	bytes.write("RIFF", 0); bytes.writeUInt32LE(40, 4); bytes.write("WAVEfmt ", 8);
	bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
	bytes.writeUInt32LE(24000, 24); bytes.writeUInt32LE(48000, 28);
	bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write("data", 36); bytes.writeUInt32LE(4, 40);
	return new Uint8Array(bytes);
};

before(async () => {
	root = await fs.mkdtemp(path.join(tmpdir(), "pi-tts-tests-"));
	log = path.join(root, "played.jsonl");
	process.env.HOME = root;
	process.env.PATH = `${root}${path.delimiter}${originalPath}`;
	process.env.PI_TTS_TEST_LOG = log;
	await fs.writeFile(path.join(root, "afplay"), `#!${process.execPath}
const fs = require('node:fs');
const file = process.argv[2];
fs.appendFileSync(process.env.PI_TTS_TEST_LOG, JSON.stringify({file, bytes: fs.readFileSync(file).length}) + '\\n');
if (process.env.PI_TTS_TEST_HOLD === '1') setInterval(() => {}, 1000);
`, { mode: 0o700 });
	assert.equal(homedir(), root, "tests must never use the real home directory");
});
after(async () => {
	if (originalHome === undefined) delete process.env.HOME; else process.env.HOME = originalHome;
	if (originalPath === undefined) delete process.env.PATH; else process.env.PATH = originalPath;
	delete process.env.PI_TTS_TEST_LOG;
	delete process.env.PI_TTS_TEST_HOLD;
	await fs.rm(root, { recursive: true, force: true });
});

async function eventually(check){
	const deadline = Date.now() + 4000;
	while (!(await check())) {
		assert.ok(Date.now() < deadline, "background work did not finish");
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
}
async function played(){
	try { return (await fs.readFile(log, "utf8")).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line)); }
	catch (error) { if ((error).code === "ENOENT") return []; throw error; }
}
function harness() {
	const handlers = new Map();
	const commands = new Map();
	const notices= [];
	const statuses = new Map();
	const ctx = {
		hasUI: true, mode: "tui", model: { id: "some-task-model", provider: "other-provider" },
		ui: {
			notify: (text, level) => { notices.push({ text, level }); },
			setStatus: (key, value) => { statuses.set(key, value); },
		},
	};
	ttsExtension({
		on: (name, handler) => { handlers.set(name, handler); return () => {}; },
		registerCommand: (name, command) => { commands.set(name, command); },
	});
	return {
		ctx, notices, statuses,
		emit: async (name, event = {}) => { await handlers.get(name)?.(event, ctx); },
		command: async (name, args = "") => { await commands.get(name).handler(args, ctx); },
	};
}

test("URL settings accept /v1 and reject credentials, queries, paths, and non-HTTP schemes", () => {
	assert.equal(normalizeOllamaUrl("http://192.168.1.20:11434/v1/"), "http://192.168.1.20:11434");
	assert.equal(normalizeOllamaUrl("https://example.com"), "https://example.com");
	for (const url of ["bad", "file:///tmp/server", "http://user:pass@host", "http://host/api/chat", "http://host?secret=x", "http://host/#x"]) {
		assert.throws(() => normalizeOllamaUrl(url));
	}
});

test("only completed final assistant text is eligible; thinking and tool content are excluded", () => {
	assert.equal(finalAnswerText(answer("The answer", { content: [
		{ type: "thinking", thinking: "private reasoning" }, { type: "text", text: "The answer" },
	] })), "The answer");
	for (const stopReason of ["pending", "length", "toolUse", "error", "aborted", "deferred"]) {
		assert.equal(finalAnswerText(answer("Never speak", { stopReason })), "");
	}
	assert.equal(finalAnswerText(answer("Tool preamble", { content: [{ type: "text", text: "Preamble" }, { type: "toolCall" }] })), "");
	assert.equal(finalAnswerText({ role: "toolResult", content: [{ type: "text", text: "tool output" }] }), "");
	assert.equal(finalAnswerText(null), "");
	assert.equal(speechText("<think>secret</think>\n# **Hello** [world](https://example.com)\n```ts\nconst x = 1;\n```"), "Hello world\n\nconst x = 1;");
	assert.equal(speechText("Visible. <analysis>unfinished secret"), "Visible.");
	assert.equal(speechText("<thinking>secret</thinking><reasoning>more secret</reasoning>Visible"), "Visible");
});

test("long answers fit the API limit without dropping words or splitting emoji", () => {
	const text = Array.from({ length: 1800 }, (_, i) => `Word${i}.`).join(" ");
	const chunks = splitSpeech(text);
	assert.ok(chunks.length > 1);
	assert.ok(chunks.every((chunk) => chunk.length <= 4096));
	assert.equal(chunks.join(" "), text);
	const emoji = "a" + "🙂".repeat(5000);
	const emojiChunks = splitSpeech(emoji);
	assert.equal(emojiChunks.join(""), emoji);
	assert.ok(emojiChunks.every((chunk) => chunk.length <= 4096 && !/[\uD800-\uDBFF]$/.test(chunk)));
});

test("settings persist independently, defaults are off, and invalid config is reported", async () => {
	assert.deepEqual(await loadConfig(), DEFAULT_CONFIG);
	const config = { ...DEFAULT_CONFIG, enabled: true, ollamaUrl: "http://server:11434", model: "another-tts", voice: "Another Voice" };
	await saveConfig(config);
	assert.deepEqual(await loadConfig(), config);
	const file = path.join(root, ".pi/agent/tts.json");
	assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
	await fs.writeFile(file, '{"enabled":"yes"}');
	await assert.rejects(loadConfig, /Invalid TTS config/);
	await fs.writeFile(file, "{broken");
	await assert.rejects(loadConfig, /Cannot read/);
	await saveConfig({ ...DEFAULT_CONFIG });
});

test("speech uses the configured model/voice/URL, chunks in order, and deletes WAV files", { skip: process.platform !== "darwin" }, async () => {
	const requests= [];
	const fetchMock = mock.method(globalThis, "fetch", async (url, init) => {
		requests.push({ url, body: JSON.parse(String(init.body)) });
		return new Response(wav(), { headers: { "Content-Type": "audio/wav" } });
	});
	try {
		const count = (await played()).length;
		const config = { ...DEFAULT_CONFIG, ollamaUrl: "http://remote:11434", model: "my-speech-model", voice: "My Voice" };
		const text = "A complete sentence. ".repeat(400).trim();
		await speak(text, config, new AbortController().signal);
		assert.equal(requests.map((r) => r.body.input).join(" "), text);
		assert.ok(requests.length > 1);
		for (const request of requests) {
			assert.equal(request.url, "http://remote:11434/v1/audio/speech");
			assert.equal(request.body.model, "my-speech-model");
			assert.equal(request.body.voice, "My Voice");
			assert.equal(request.body.response_format, "wav");
			assert.ok(request.body.input.length <= 4096);
		}
		const files = (await played()).slice(count);
		assert.equal(files.length, requests.length);
		for (const item of files) await assert.rejects(fs.stat(item.file), { code: "ENOENT" });
	} finally { fetchMock.mock.restore(); }
});

test("HTTP errors, invalid audio, and canceled synthesis never play audio", async () => {
	const count = (await played()).length;
	let mode = "http";
	const fetchMock = mock.method(globalThis, "fetch", async (_url, init) => {
		if (mode === "http") return new Response("unknown voice", { status: 400 });
		if (mode === "invalid") return new Response("not audio");
		return await new Promise((_resolve, reject) => {
			init.signal .addEventListener("abort", () => reject(init.signal .reason), { once: true });
		});
	});
	try {
		await assert.rejects(speak("hello", DEFAULT_CONFIG, new AbortController().signal), /HTTP 400.*unknown voice/);
		mode = "invalid";
		await assert.rejects(speak("hello", DEFAULT_CONFIG, new AbortController().signal), /no valid WAV/);
		mode = "abort";
		const controller = new AbortController();
		const pending = speak("hello", DEFAULT_CONFIG, controller.signal);
		await eventually(() => fetchMock.mock.callCount() === 3);
		controller.abort();
		await assert.rejects(pending, { name: "AbortError" });
		assert.equal((await played()).length, count);
	} finally { fetchMock.mock.restore(); }
});

test("toggle and lifecycle read the final settled answer only, independently of the task model", { skip: process.platform !== "darwin" }, async () => {
	await saveConfig({ ...DEFAULT_CONFIG });
	const spoken= [];
	const fetchMock = mock.method(globalThis, "fetch", async (_url, init) => {
		spoken.push(JSON.parse(String(init.body)).input);
		return new Response(wav());
	});
	const h = harness();
	try {
		await h.emit("session_start");
		await h.emit("agent_end", { messages: [answer("Off")] });
		await h.emit("agent_settled", { aborted: false });
		assert.deepEqual(spoken, []);
		await h.command("tts", "on");
		assert.equal((await loadConfig()).enabled, true);
		await h.emit("agent_start");
		await h.emit("agent_end", { messages: [answer("Intermediate")] });
		assert.deepEqual(spoken, [], "agent_end alone must never trigger speech");
		await h.emit("agent_start");
		await h.emit("agent_end", { messages: [answer("Final", { content: [
			{ type: "thinking", thinking: "Secret" }, { type: "text", text: "Final" },
		] })] });
		await h.emit("agent_settled", { aborted: false });
		await eventually(() => spoken.length === 1);
		await eventually(() => h.statuses.get("tts") === "TTS: on");
		assert.deepEqual(spoken, ["Final"]);
		await h.emit("agent_settled", { aborted: false });
		assert.equal(spoken.length, 1, "duplicate settlement cannot repeat speech");
		await h.emit("agent_start");
		await h.emit("agent_end", { messages: [answer("Canceled")] });
		await h.emit("agent_settled", { aborted: true });
		assert.equal(spoken.length, 1);
		await h.emit("agent_start");
		await h.emit("agent_end", { messages: [answer("Error", { stopReason: "error" })] });
		await h.emit("agent_settled", { aborted: false });
		assert.equal(spoken.length, 1);
		h.ctx.hasUI = false;
		await h.emit("agent_end", { messages: [answer("Headless")] });
		await h.emit("agent_settled", { aborted: false });
		assert.equal(spoken.length, 1);
		h.ctx.hasUI = true;
		await h.command("tts-url", "http://other-server:11434/v1");
		await h.command("tts-model", "custom-speech-model");
		assert.equal((await loadConfig()).ollamaUrl, "http://other-server:11434");
		assert.equal((await loadConfig()).model, "custom-speech-model");
		await h.command("tts-url", "http://user:secret@server");
		assert.equal((await loadConfig()).ollamaUrl, "http://other-server:11434");
		assert.equal(h.notices.at(-1).level, "error");
		await h.command("tts", "off");
		assert.equal((await loadConfig()).enabled, false);
		assert.equal(h.statuses.get("tts"), undefined);
	} finally { await h.emit("session_shutdown"); fetchMock.mock.restore(); }
});

test("stop, disable, new runs, and shutdown cancel active playback without leaking audio", { skip: process.platform !== "darwin" }, async () => {
	await saveConfig({ ...DEFAULT_CONFIG, enabled: true });
	process.env.PI_TTS_TEST_HOLD = "1";
	const fetchMock = mock.method(globalThis, "fetch", async () => new Response(wav()));
	const h = harness();
	try {
		await h.emit("session_start");
		for (const action of ["stop", "new-run", "off", "shutdown"]) {
			if (action === "shutdown") await h.command("tts", "on");
			const count = (await played()).length;
			await h.command("tts", "test");
			await eventually(async () => (await played()).length > count);
			const file = (await played()).at(-1).file;
			if (action === "new-run") await h.emit("agent_start");
			else if (action === "shutdown") await h.emit("session_shutdown");
			else await h.command("tts", action);
			await eventually(async () => { try { await fs.stat(file); return false; } catch { return true; } });
			assert.equal(h.notices.some((notice) => notice.level === "error"), false);
			if (action === "stop") assert.equal((await loadConfig()).enabled, true);
			if (action === "off") assert.equal((await loadConfig()).enabled, false);
		}
	} finally { await h.emit("session_shutdown"); delete process.env.PI_TTS_TEST_HOLD; fetchMock.mock.restore(); }
});

test("invalid startup config fails closed and /tts reset recovers", async () => {
	await fs.writeFile(path.join(root, ".pi/agent/tts.json"), "null");
	const h = harness();
	await h.emit("session_start");
	assert.equal(h.statuses.get("tts"), "TTS: config error");
	await h.command("tts", "on");
	assert.equal(h.notices.at(-1).level, "error");
	await h.command("tts", "reset");
	assert.deepEqual(await loadConfig(), DEFAULT_CONFIG);
	assert.equal(h.statuses.get("tts"), undefined);
	await h.emit("session_shutdown");
});
