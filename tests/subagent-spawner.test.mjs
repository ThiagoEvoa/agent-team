import assert from 'node:assert/strict';
import { test, after, beforeEach } from 'node:test';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'subagent-test-'));
const oldHome = process.env.HOME;
const oldAgentDir = process.env.PI_CODING_AGENT_DIR;
process.env.HOME = home;
const agentDir = join(home, 'pi-config');
process.env.PI_CODING_AGENT_DIR = agentDir;
const configPath = join(agentDir, 'subagent.json');
mkdirSync(join(home, '.agents/agents'), { recursive: true });
copyFileSync(new URL('../agents/researcher.md', import.meta.url), join(home, '.agents/agents/researcher.md'));
copyFileSync(new URL('../agents/README.md', import.meta.url), join(home, '.agents/agents/README.md'));
for (const agent of ['compact-orchestrator', 'product-lead', 'software-engineer']) {
  copyFileSync(new URL(`../compact-team/agents/${agent}.md`, import.meta.url), join(home, `.agents/agents/${agent}.md`));
}
const fake = join(home, 'fake-pi.mjs');
writeFileSync(fake, `import {readFileSync} from 'node:fs';
const args=process.argv.slice(2), prompt=args.at(-1);
if(prompt==='hang') { process.on('SIGTERM',()=>{}); console.log('ready'); setInterval(()=>{},100); }
else if(prompt==='large') console.log('x'.repeat(10000));
else if(prompt==='context-probe') console.log(JSON.stringify({pid:process.pid,args}));
else console.log(readFileSync(args[args.indexOf('--append-system-prompt')+1],'utf8'));
`);
const { default: init } = await import('../extension/subagent-spawner/subagent-spawner.ts');
beforeEach(() => rmSync(agentDir, { recursive: true, force: true }));
after(() => {
  if (oldHome === undefined) delete process.env.HOME; else process.env.HOME = oldHome;
  if (oldAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR; else process.env.PI_CODING_AGENT_DIR = oldAgentDir;
  rmSync(home, { recursive: true, force: true });
});
async function harness(enabled = true) {
  const commands = new Map(), tools = new Map(), handlers = new Map(), notifications = [];
  init({ on: (n,h) => handlers.set(n,h), registerCommand: (n,c) => commands.set(n,c), registerTool: t => tools.set(t.name,t), getActiveTools: () => ['read','spawnSubagent'] });
  const ctx = { cwd: home, ui: { notify: (text, level) => notifications.push({ text, level }) } };
  const emit = async name => handlers.get(name)?.({},ctx);
  await emit('session_start');
  const command = args => commands.get('subagent').handler(args,ctx);
  if(enabled) await commands.get('subagent').handler('on',ctx);
  return { command, notifications, emit, tool: tools.get('spawnSubagent'), run: async (args,signal) => {
    const old = process.argv[1]; process.argv[1] = fake;
    try { return await tools.get('spawnSubagent').execute('test',args,signal,undefined,ctx); }
    finally { process.argv[1] = old; }
  }};
}
test('disabled spawning stays disabled', async () => {
  const h = await harness(false);
  assert.equal((await h.run({prompt:'test',agent:'researcher'})).details.disabled,true);
  assert.equal(existsSync(configPath),false);
});

test('on and off survive separate process restarts', () => {
  const moduleUrl = new URL('../extension/subagent-spawner/subagent-spawner.ts', import.meta.url).href;
  const restart = action => execFileSync(process.execPath, ['--input-type=module', '-e', `
    import init from ${JSON.stringify(moduleUrl)};
    const commands = new Map(), handlers = new Map();
    init({ on: (name, fn) => handlers.set(name, fn), registerCommand: (name, value) => commands.set(name, value), registerTool() {} });
    const ctx = { ui: { notify(text) { console.log(text); } } };
    await handlers.get('session_start')({}, ctx);
    await commands.get('subagent').handler(${JSON.stringify(action)}, ctx);
  `], { encoding: 'utf8' });
  assert.match(restart('status'),/disabled/);
  assert.equal(existsSync(configPath),false);
  assert.match(restart('on'),/enabled/);
  assert.match(restart('status'),/enabled/);
  assert.match(restart('off'),/disabled/);
  assert.match(restart('status'),/disabled/);
  assert.deepEqual(JSON.parse(readFileSync(configPath,'utf8')),{enabled:false});
});

test('toggle and aliases persist; status and invalid commands do not write settings', async () => {
  const h = await harness(false);
  await h.command('status');
  await h.command('unknown');
  assert.equal(existsSync(configPath),false);
  for (const [action, enabled] of [['',true],['',false],['enable',true],['disable',false],['1',true],['0',false]]) {
    await h.command(action);
    assert.deepEqual(JSON.parse(readFileSync(configPath,'utf8')),{enabled});
    const next = await harness(false);
    await next.command('status');
    assert.match(next.notifications.at(-1).text,enabled ? /enabled/ : /disabled/);
  }
  const saved = readFileSync(configPath,'utf8');
  await h.command('status');
  await h.command('unknown');
  assert.equal(readFileSync(configPath,'utf8'),saved);
  assert.deepEqual(readdirSync(agentDir),['subagent.json']);
});

test('invalid settings disable spawning and explicit on repairs the file', async () => {
  mkdirSync(agentDir,{recursive:true});
  for (const invalid of ['{', 'null', '[]', '{}', '{"enabled":"true"}', '{"enabled":1}']) {
    writeFileSync(configPath,invalid);
    const h = await harness(false);
    assert.equal((await h.run({prompt:'test',agent:'researcher'})).details.disabled,true);
    assert.equal(h.notifications[0].level,'error');
    assert.match(h.notifications[0].text,/Cannot load subagent settings/);
    assert.equal(readFileSync(configPath,'utf8'),invalid);
    await h.command('on');
    assert.deepEqual(JSON.parse(readFileSync(configPath,'utf8')),{enabled:true});
  }
});

test('read and write failures are reported without falsely claiming success', async () => {
  const h = await harness();
  rmSync(configPath);
  mkdirSync(configPath);
  await h.command('off');
  assert.equal(h.notifications.at(-1).level,'error');
  assert.match(h.notifications.at(-1).text,/Cannot save.*Setting unchanged/);
  await h.command('status');
  assert.match(h.notifications.at(-1).text,/enabled/);
  assert.deepEqual(readdirSync(agentDir),['subagent.json']);
  const next = await harness(false);
  assert.match(next.notifications[0].text,/Cannot load/);
  assert.equal((await next.run({prompt:'test',agent:'researcher'})).details.disabled,true);
});

test('default config lives under HOME when PI_CODING_AGENT_DIR is unset', async () => {
  delete process.env.PI_CODING_AGENT_DIR;
  const defaultConfig = join(home,'.pi/agent/subagent.json');
  try {
    const h = await harness(false);
    await h.command('on');
    assert.deepEqual(JSON.parse(readFileSync(defaultConfig,'utf8')),{enabled:true});
    assert.equal(existsSync(configPath),false);
    const next = await harness(false);
    await next.command('status');
    assert.match(next.notifications.at(-1).text,/enabled/);
  } finally {
    rmSync(defaultConfig,{force:true});
    process.env.PI_CODING_AGENT_DIR = agentDir;
  }
});
test('delegation requires explicit valid persona, not legacy trigger guessing', async () => {
  const h = await harness();
  assert.ok(h.tool.parameters.required.includes('agent'));
  for(const agent of [undefined,'missing','README','../README']) {
    const r = await h.run({prompt:'test',agent});
    assert.equal(r.details.ok,false);
    assert.equal(r.details.error,'invalid_agent');
  }
  const r = await h.run({prompt:'test',agent:'researcher'});
  assert.equal(r.details.ok,true);
  assert.equal(r.details.agent.name,'researcher');
  assert.match(r.content[0].text,/Researcher/);
});
test('timeout kills SIGTERM-resistant child within bounded grace period', {timeout:5000}, async () => {
  const h = await harness(); const start=Date.now();
  const r=await h.run({prompt:'hang',agent:'researcher',timeoutMs:500});
  assert.equal(r.details.timedOut,true);
  assert.equal(r.details.ok,false);
  assert.ok(Date.now()-start<3500);
});
test('already aborted signal prevents launching child', async () => {
  const h=await harness(); const c=new AbortController(); c.abort();
  const r=await h.run({prompt:'test',agent:'researcher'},c.signal);
  assert.equal(r.details.aborted,true);
  assert.equal(r.details.ok,false);
});
test('abort stops running child', {timeout:5000}, async () => {
  const h=await harness(); const c=new AbortController();
  const timer=setTimeout(()=>c.abort(),500);
  try {
    const r=await h.run({prompt:'hang',agent:'researcher',timeoutMs:10000},c.signal);
    assert.equal(r.details.aborted,true);
    assert.equal(r.details.ok,false);
  } finally {clearTimeout(timer);}
});
test('output cap records truncation', async () => {
  const h=await harness(); const r=await h.run({prompt:'large',agent:'researcher',maxOutputChars:100});
  assert.equal(r.details.truncated,true);
  assert.ok(r.content[0].text.length<200);
});

test('compact coordinator resolves by its distinct persona name', async () => {
  const h = await harness();
  const result = await h.run({prompt:'test',agent:'compact-orchestrator'});
  assert.equal(result.details.ok,true);
  assert.equal(result.details.agent.name,'compact-orchestrator');
  assert.equal(result.details.modelSource,'agent:inherit');
});

test('compact worker assignments launch separate processes with explicit worker tools', async () => {
  const h = await harness();
  const processes = [];
  for (const agent of ['product-lead','software-engineer']) {
    const result = await h.run({prompt:'context-probe',agent,tools:['read','write','edit','bash']});
    assert.equal(result.details.ok,true);
    assert.equal(result.details.agent.name,agent);
    const invocation = JSON.parse(result.content[0].text);
    processes.push(invocation.pid);
    assert.equal(invocation.args.at(-1),'context-probe');
    assert.equal(invocation.args[invocation.args.indexOf('--tools')+1],'read,write,edit,bash');
    assert.ok(!invocation.args.includes('--continue'));
    assert.ok(!invocation.args.includes('--resume'));
    assert.ok(!invocation.args.includes('--session'));
    assert.ok(!invocation.args.includes('inherit'));
  }
  assert.notEqual(processes[0],processes[1]);
});
