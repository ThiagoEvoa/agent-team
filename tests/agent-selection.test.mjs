import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const home = mkdtempSync(join(tmpdir(), 'agent-selection-test-'));
const oldHome = process.env.HOME;
process.env.HOME = home;
mkdirSync(join(home, '.agents', 'agents'), { recursive: true });
for (const name of ['researcher', 'dart-senior-reviewer', 'flutter-qa-specialist', 'ui-ux-designer', 'flutter-senior-developer', 'firebase-agent', 'web-senior-developer', 'rust-senior-engineer']) {
  copyFileSync(new URL(`../agents/${name}.md`, import.meta.url), join(home, '.agents', 'agents', `${name}.md`));
}
copyFileSync(new URL('../agents/README.md', import.meta.url), join(home, '.agents', 'agents', 'README.md'));
writeFileSync(join(home, '.agents/agents/invalid.md'), '---\nname: wrong-name\ndescription: Invalid persona\n---\n# Invalid\n');
const { default: init } = await import('../extension/agent-switcher/agent-switcher.ts');
after(() => {
  if (oldHome === undefined) delete process.env.HOME; else process.env.HOME = oldHome;
  rmSync(home, { recursive: true, force: true });
});

function harness() {
  const handlers = new Map(), commands = new Map(), tools = new Map(), statuses = new Map();
  init({
    on: (name, fn) => handlers.set(name, fn),
    registerCommand: (name, command) => commands.set(name, command),
    registerTool: tool => tools.set(tool.name, tool),
  });
  const ctx = { ui: { setStatus: (key, text) => statuses.set(key, text), notify() {} } };
  return {
    statuses, commands, tools, ctx,
    emit: (name, event = {}) => handlers.get(name)?.(event, ctx),
    select: name => tools.get('selectAgent').execute('test', { agent: name }, undefined, undefined, ctx),
    begin: prompt => handlers.get('before_agent_start')({ prompt, systemPrompt: 'Base prompt' }, ctx),
  };
}

test('explicit selection loads instructions and updates status during task and after completion', async () => {
  const h = harness();
  await h.emit('session_start');
  const start = await h.begin('Review Flutter code');
  assert.match(start.systemPrompt, /selectAgent/);
  assert.ok(h.tools.has('selectAgent'));
  const result = await h.select('dart-senior-reviewer');
  assert.equal(result.details.agent, 'dart-senior-reviewer');
  assert.match(result.content[0].text, /Reviewer/);
  assert.match(h.statuses.get('agent'), /dart-senior-reviewer/);
  await h.emit('agent_end');
  assert.match(h.statuses.get('agent'), /dart-senior-reviewer/);
  const next = await h.begin('Unrelated next task');
  assert.equal(h.statuses.get('agent'), 'None');
  assert.doesNotMatch(next.systemPrompt, /## Active Agent: dart-senior-reviewer/);
});

test('explicit persona selection supports representative action/domain cases', async () => {
  for (const [prompt, agent] of [
    ['Review Flutter code', 'dart-senior-reviewer'],
    ['Write Flutter widget tests', 'flutter-qa-specialist'],
    ['Design a Flutter login screen', 'ui-ux-designer'],
    ['Implement designed login screen in Flutter', 'flutter-senior-developer'],
    ['Implement an Astro marketing website', 'web-senior-developer'],
    ['Implement Firestore Security Rules and indexes', 'firebase-agent'],
    ['Review Firebase Security Rules', 'dart-senior-reviewer'],
    ['Implement a Rust CLI command', 'rust-senior-engineer'],
    ['Review a Rust crate pull request', 'rust-senior-engineer'],
    ['Add Rust integration tests', 'rust-senior-engineer'],
    ['Research Firebase Authentication providers', 'researcher'],
    ['Implement Firebase login UI in Flutter', 'flutter-senior-developer'],
  ]) {
    const h = harness();
    await h.emit('session_start');
    await h.begin(prompt);
    assert.equal(h.statuses.get('agent'), 'None');
    await h.select(agent);
    assert.match(h.statuses.get('agent'), new RegExp(agent));
  }
});

test('manual selection persists; /agent auto restores per-task selection', async () => {
  const h = harness();
  await h.emit('session_start');
  await h.commands.get('agent').handler('flutter-senior-developer', h.ctx);
  assert.match((await h.begin('Task')).systemPrompt, /## Active Agent: flutter-senior-developer/);
  await h.emit('agent_end');
  assert.match(h.statuses.get('agent'), /flutter-senior-developer/);
  const locked = await h.select('researcher');
  assert.equal(locked.details.ok, false);
  assert.match(h.statuses.get('agent'), /flutter-senior-developer/);
  await h.commands.get('agent').handler('auto', h.ctx);
  await h.begin('Task');
  await h.select('researcher');
  assert.match(h.statuses.get('agent'), /researcher/);
});

test('invalid names and path traversal leave selected status intact', async () => {
  const h = harness();
  await h.emit('session_start');
  await h.begin('Task');
  await h.select('researcher');
  for (const name of ['missing-agent', '../extension/agent-switcher', '', 'research', 'README', 'invalid']) {
    const result = await h.select(name);
    assert.equal(result.details.ok, false);
    assert.match(h.statuses.get('agent'), /researcher/);
  }
});

test('extension instances do not share manual selection', async () => {
  const first = harness(), second = harness();
  await first.emit('session_start');
  await first.commands.get('agent').handler('researcher', first.ctx);
  await second.emit('session_start');
  assert.match((await first.begin('Task')).systemPrompt, /## Active Agent: researcher/);
  assert.equal(second.statuses.get('agent'), 'None');
});

// Exercise both extensions through Pi's real TypeScript loader and footer factory.
// Core tests above need only Node; integration needs an installed Pi CLI.
let loaderUrl;
try {
  loaderUrl = process.env.PI_EXTENSION_LOADER
    ? pathToFileURL(process.env.PI_EXTENSION_LOADER)
    : new URL('../core/extensions/loader.js', pathToFileURL(realpathSync(execFileSync('which', ['pi'], { encoding: 'utf8' }).trim())));
} catch {}

test('real Pi loader: footer follows selection, completion, manual changes, and reset', { skip: !loaderUrl && 'Pi not installed; set PI_EXTENSION_LOADER' }, async () => {
  const { loadExtensions } = await import(loaderUrl.href);
  const paths = ['agent-switcher/agent-switcher.ts', 'custom-tui/custom-tui.ts', 'subagent-spawner/subagent-spawner.ts'].map(name => fileURLToPath(new URL(`../extension/${name}`, import.meta.url)));
  const loaded = await loadExtensions(paths, fileURLToPath(new URL('..', import.meta.url)));
  assert.deepEqual(loaded.errors, []);
  assert.ok(loaded.extensions[2].tools.has('spawnSubagent'));
  const statuses = new Map();
  let footer, renders = 0;
  const tui = { requestRender() { renders++; } };
  const theme = { fg: (_color, text) => text };
  const ctx = {
    hasUI: true, getContextUsage: () => undefined,
    ui: {
      setStatus(key, text) { statuses.set(key, text); tui.requestRender(); },
      notify() {}, setHeader() {},
      setFooter(factory) { footer = factory(tui, theme, { getExtensionStatuses: () => statuses }); },
    },
  };
  const emit = async (name, event = {}) => {
    for (const ext of loaded.extensions) for (const fn of ext.handlers.get(name) || []) await fn(event, ctx);
  };
  const switcher = loaded.extensions[0];
  const tool = switcher.tools.get('selectAgent').definition;
  await emit('session_start');
  assert.match(footer.render(200)[0], /agent: none/);
  await emit('before_agent_start', { prompt: 'Review Flutter code', systemPrompt: 'Base' });
  const beforeSelection = renders;
  await tool.execute('test', { agent: 'dart-senior-reviewer' }, undefined, undefined, ctx);
  assert.ok(renders > beforeSelection);
  assert.match(footer.render(200)[0], /agent: dart-senior-reviewer/);
  await emit('agent_end');
  assert.match(footer.render(200)[0], /agent: dart-senior-reviewer/);
  await emit('before_agent_start', { prompt: 'Next task', systemPrompt: 'Base' });
  assert.match(footer.render(200)[0], /agent: none/);
  await switcher.commands.get('agent').handler('researcher', ctx);
  assert.match(footer.render(200)[0], /agent: researcher/);
  await switcher.commands.get('agent').handler('auto', ctx);
  assert.match(footer.render(200)[0], /agent: none/);
  await emit('session_start');
  assert.match(footer.render(200)[0], /agent: none/);
});

// Dataset integrity only; actual model-routing accuracy is evaluated separately.
test('routing evaluation cases reference installed personas and include web and Rust boundary cases', () => {
  const cases = JSON.parse(readFileSync(new URL('./routing-evaluation.json', import.meta.url), 'utf8'));
  for (const item of cases) {
    assert.ok(item.prompt.trim());
    assert.match(readFileSync(new URL(`../agents/${item.expectedAgent}.md`, import.meta.url), 'utf8'), /^---/);
  }
  assert.ok(cases.some(item => item.prompt.includes('Astro') && item.expectedAgent === 'web-senior-developer'));
  assert.ok(cases.some(item => item.prompt.includes('Review Firebase') && item.expectedAgent === 'dart-senior-reviewer'));
  assert.ok(cases.some(item => item.prompt.includes('Rust crate pull request') && item.expectedAgent === 'rust-senior-engineer'));
});
