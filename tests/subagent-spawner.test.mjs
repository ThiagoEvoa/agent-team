import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const home = mkdtempSync(join(tmpdir(), 'subagent-test-'));
const oldHome = process.env.HOME;
process.env.HOME = home;
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
after(() => {
  if (oldHome === undefined) delete process.env.HOME; else process.env.HOME = oldHome;
  rmSync(home, { recursive: true, force: true });
});
async function harness(enabled = true) {
  const commands = new Map(), tools = new Map();
  init({ registerCommand: (n,c) => commands.set(n,c), registerTool: t => tools.set(t.name,t), getActiveTools: () => ['read','spawnSubagent'] });
  const ctx = { cwd: home, ui: { notify() {} } };
  if(enabled) await commands.get('subagent').handler('on',ctx);
  return { tool: tools.get('spawnSubagent'), run: async (args,signal) => {
    const old = process.argv[1]; process.argv[1] = fake;
    try { return await tools.get('spawnSubagent').execute('test',args,signal,undefined,ctx); }
    finally { process.argv[1] = old; }
  }};
}
test('disabled spawning stays disabled', async () => {
  const h = await harness(false);
  assert.equal((await h.run({prompt:'test',agent:'researcher'})).details.disabled,true);
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
