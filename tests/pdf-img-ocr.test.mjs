import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import init, { ocrFile } from '../extension/pdf-img-ocr/pdf-img-ocr.ts';

const MODEL_ID = 'qwen3.8-27b:latest';
const MODEL = { id: MODEL_ID, provider: 'ollama', baseUrl: 'http://127.0.0.1:11434/v1', input: ['text', 'image'] };

function withTemp(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'pi-ocr-test-'));
  const previousHome = process.env.HOME;
  process.env.HOME = dir;
  return Promise.resolve().then(() => fn(dir)).finally(() => {
    if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
    rmSync(dir, { recursive: true, force: true });
  });
}

function mockOllama(transcribe = () => 'recognized text', models = [{ name: MODEL_ID }], baseUrl = 'http://127.0.0.1:11434') {
  const previous = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    assert.ok(String(url).startsWith(`${baseUrl}/`));
    if (String(url).endsWith('/api/tags')) return Response.json({ models });
    const request = JSON.parse(init.body);
    calls.push(request);
    return Response.json({ message: { content: transcribe(request, calls.length) } });
  };
  return { calls, restore: () => { globalThis.fetch = previous; } };
}

test('registers an ocr tool and /ocr command with the same transcription', async () => {
  await withTemp(async dir => {
    writeFileSync(join(dir, 'sample.png'), 'image bytes');
    const mocked = mockOllama();
    try {
      const tools = new Map(), commands = new Map(), messages = [], notices = [];
      init({ registerTool: tool => tools.set(tool.name, tool), registerCommand: (name, command) => commands.set(name, command), sendMessage: message => messages.push(message) });
      const ctx = { cwd: dir, model: MODEL, ui: { notify: (...args) => notices.push(args) } };
      assert.deepEqual(tools.get('ocr').parameters.required, ['path']);
      const result = await tools.get('ocr').execute('test', { path: 'sample.png' }, undefined, undefined, ctx);
      assert.equal(result.content[0].text, 'recognized text');
      assert.equal(mocked.calls[0].model, MODEL_ID);
      assert.equal(mocked.calls[0].stream, false);
      assert.equal(mocked.calls[0].messages[0].images[0], Buffer.from('image bytes').toString('base64'));
      await commands.get('ocr').handler('sample.png', ctx);
      assert.equal(messages[0].content, result.content[0].text);
      await commands.get('ocr').handler('', ctx);
      assert.match(notices[0][0], /Usage: \/ocr/);
    } finally { mocked.restore(); }
  });
});

test('/ocr-url persists a remote server for the tool and command', async () => {
  await withTemp(async dir => {
    writeFileSync(join(dir, 'sample.png'), 'image bytes');
    const tools = new Map(), commands = new Map(), notices = [], messages = [];
    init({ registerTool: tool => tools.set(tool.name, tool), registerCommand: (name, command) => commands.set(name, command), sendMessage: message => messages.push(message) });
    const ctx = { cwd: dir, model: MODEL, ui: { notify: (...args) => notices.push(args) } };
    const mocked = mockOllama(() => 'remote text', [{ name: MODEL_ID }], 'http://192.168.1.20:11434');
    try {
      await commands.get('ocr-url').handler('http://192.168.1.20:11434/v1', ctx);
      assert.match(notices.at(-1)[0], /set to http:\/\/192.168.1.20:11434/);
      assert.deepEqual(JSON.parse(readFileSync(join(dir, '.pi/agent/pdf-img-ocr.json'), 'utf8')), { ollamaUrl: 'http://192.168.1.20:11434' });
      await commands.get('ocr-url').handler('', ctx);
      assert.match(notices.at(-1)[0], /192\.168\.1\.20/);
      assert.equal((await tools.get('ocr').execute('test', { path: 'sample.png' }, undefined, undefined, ctx)).content[0].text, 'remote text');
      await commands.get('ocr').handler('sample.png', ctx);
      assert.equal(messages[0].content, 'remote text');
      await commands.get('ocr-url').handler('http://example.com/api', ctx);
      assert.match(notices.at(-1)[0], /Invalid Ollama URL/);
      await commands.get('ocr-url').handler('reset', ctx);
      assert.match(notices.at(-1)[0], /reset to http:\/\/127\.0\.0\.1:11434/);
      assert.equal(readdirSync(join(dir, '.pi/agent')).includes('pdf-img-ocr.json'), false);
    } finally {
      mocked.restore();
    }
  });
});

test('uses the selected Pi model address without an OCR URL override', async () => {
  await withTemp(async dir => {
    writeFileSync(join(dir, 'sample.png'), 'image bytes');
    const tools = new Map();
    init({ registerTool: tool => tools.set(tool.name, tool), registerCommand() {} });
    const model = { ...MODEL, id: 'glm-ocr:bf16', baseUrl: 'http://100.105.111.48:11434/v1' };
    const mocked = mockOllama(() => 'selected model text', [{ name: model.id }], 'http://100.105.111.48:11434');
    try {
      const result = await tools.get('ocr').execute('test', { path: 'sample.png' }, undefined, undefined, { cwd: dir, model });
      assert.equal(result.content[0].text, 'selected model text');
      assert.equal(mocked.calls[0].model, model.id);
    } finally { mocked.restore(); }
  });
});

test('requires a selected Ollama model that accepts images', async () => {
  await withTemp(async dir => {
    writeFileSync(join(dir, 'sample.png'), 'image bytes');
    const tools = new Map();
    init({ registerTool: tool => tools.set(tool.name, tool), registerCommand() {} });
    const execute = model => tools.get('ocr').execute('test', { path: 'sample.png' }, undefined, undefined, { cwd: dir, model });
    assert.match((await execute(undefined)).content[0].text, /No Pi model is selected/);
    assert.match((await execute({ ...MODEL, input: ['text'] })).content[0].text, /does not accept images/);
    assert.match((await execute({ ...MODEL, provider: 'openai' })).content[0].text, /is not an Ollama model/);
  });
});

test('PDF pages are OCRed in numeric order and render files are removed', async () => {
  await withTemp(async dir => {
    writeFileSync(join(dir, 'document.pdf'), 'fake pdf');
    const bin = join(dir, 'bin');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(bin);
    const script = join(bin, 'pdftoppm');
    writeFileSync(script, '#!/bin/sh\nprintf one > "$5-1.png"\nprintf ten > "$5-10.png"\nprintf two > "$5-2.png"\n');
    chmodSync(script, 0o755);
    const previousPath = process.env.PATH;
    process.env.PATH = `${bin}:${previousPath}`;
    const before = new Set(readdirSync(tmpdir()).filter(name => name.startsWith('pi-ocr-pages-')));
    const mocked = mockOllama(request => Buffer.from(request.messages[0].images[0], 'base64').toString());
    try {
      const result = await ocrFile('document.pdf', dir, MODEL_ID);
      assert.equal(result, 'Page 1\none\n\nPage 2\ntwo\n\nPage 10\nten');
      assert.equal(mocked.calls.length, 3);
      const after = readdirSync(tmpdir()).filter(name => name.startsWith('pi-ocr-pages-'));
      assert.deepEqual(after.filter(name => !before.has(name)), []);
    } finally {
      mocked.restore();
      process.env.PATH = previousPath;
    }
  });
});

test('missing inputs, model, renderer, and empty OCR output report useful errors', async () => {
  await withTemp(async dir => {
    await assert.rejects(ocrFile('missing.png', dir, MODEL_ID), /not found/);
    writeFileSync(join(dir, 'bad.txt'), 'text');
    await assert.rejects(ocrFile('bad.txt', dir, MODEL_ID), /Unsupported/);
    writeFileSync(join(dir, 'photo.jpg'), 'bytes');
    let mocked = mockOllama(() => '', []);
    try { await assert.rejects(ocrFile('photo.jpg', dir, MODEL_ID), /Selected Pi model .* is unavailable/); }
    finally { mocked.restore(); }
    mocked = mockOllama(() => '');
    try { await assert.rejects(ocrFile('photo.jpg', dir, MODEL_ID), /returned no OCR text/); }
    finally { mocked.restore(); }
    writeFileSync(join(dir, 'document.pdf'), 'fake pdf');
    const previousPath = process.env.PATH;
    process.env.PATH = dir;
    mocked = mockOllama();
    try { await assert.rejects(ocrFile('document.pdf', dir, MODEL_ID), /pdftoppm is missing/); }
    finally { mocked.restore(); process.env.PATH = previousPath; }
  });
});

test('long text remains complete in a returned private file', async () => {
  await withTemp(async dir => {
    writeFileSync(join(dir, 'photo.jpeg'), 'bytes');
    const text = 'A'.repeat(33_000);
    const mocked = mockOllama(() => text);
    try {
      const result = await ocrFile('photo.jpeg', dir, MODEL_ID);
      const output = /^Full OCR transcription: (.+\.txt)$/m.exec(result)?.[1];
      assert.ok(output);
      assert.equal(readFileSync(output, 'utf8'), text);
      assert.match(result, /preview is partial/);
      rmSync(output);
    } finally { mocked.restore(); }
  });
});

test('cancelled PDF OCR removes rendered images', async () => {
  await withTemp(async dir => {
    writeFileSync(join(dir, 'document.pdf'), 'fake pdf');
    const bin = join(dir, 'bin');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(bin);
    const script = join(bin, 'pdftoppm');
    writeFileSync(script, '#!/bin/sh\nprintf one > "$5-1.png"\n');
    chmodSync(script, 0o755);
    const previousPath = process.env.PATH;
    process.env.PATH = `${bin}:${previousPath}`;
    const previousFetch = globalThis.fetch;
    const before = new Set(readdirSync(tmpdir()).filter(name => name.startsWith('pi-ocr-pages-')));
    const controller = new AbortController();
    globalThis.fetch = async (url) => {
      if (String(url).endsWith('/api/tags')) return Response.json({ models: [{ name: MODEL_ID }] });
      controller.abort();
      throw new Error('aborted');
    };
    try {
      await assert.rejects(ocrFile('document.pdf', dir, MODEL_ID, controller.signal), /OCR cancelled/);
      const after = readdirSync(tmpdir()).filter(name => name.startsWith('pi-ocr-pages-'));
      assert.deepEqual(after.filter(name => !before.has(name)), []);
    } finally { globalThis.fetch = previousFetch; process.env.PATH = previousPath; }
  });
});
