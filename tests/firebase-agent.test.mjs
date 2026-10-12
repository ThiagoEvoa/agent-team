import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Firebase agent activates matching skill and follows persona format', () => {
  const agent = read('agents/firebase-agent.md');
  const skill = read('skills/firebase-workflow/SKILL.md');
  assert.match(agent, /^---\nname: firebase-agent\ndescription: .+\ntools:\n/);
  assert.match(agent, /\nmodel: inherit\ntemperature: 0\.1\n---\n/);
  assert.match(agent, /`activate_skill` for `firebase-workflow`/);
  assert.match(skill, /^---\nname: firebase-workflow\ndescription: .+\n---\n/);
  assert.match(skill, /### 0\. Tool Availability Gate/);
  assert.match(skill, /### 3\. Validate Before Remote Changes/);
  assert.match(skill, /### 4\. Authorized Remote Execution/);
});

test('Firebase MCP preset matches documented stdio command', () => {
  const config = JSON.parse(read('pi-config/mcp.json'));
  assert.deepEqual(config.mcpServers.firebase, {
    command: 'npx',
    args: ['-y', 'firebase-tools@latest', 'mcp'],
  });
});

test('Firebase persona and workflow are documented in catalogs and routing', () => {
  for (const path of ['README.md', 'agents/README.md', 'pi-config/SYSTEM.md', 'skills/orchestration-workflow/SKILL.md']) {
    assert.ok(read(path).includes('firebase-agent'), `${path} must document Firebase agent`);
  }
  for (const path of ['README.md', 'skills/README.md']) {
    assert.ok(read(path).includes('firebase-workflow'), `${path} must document Firebase workflow`);
  }
  const system = read('pi-config/SYSTEM.md');
  assert.match(system, /Review Firebase Security Rules` → Dart Senior Reviewer/);
  assert.match(system, /Research Firebase Authentication providers` → Researcher/);
  assert.match(system, /Implement Firebase login UI in Flutter` → Flutter Senior Developer/);
});
