import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundledStatus, graphCommand } from '../integrations/saveusage/runtime/bundle.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
import { saveContext } from '../dist/save.js';

const input = { query: 'authentication', budget: 15, entries: [
  { id: 'rule', kind: 'requirement', text: 'Keep authentication.' },
  { id: 'duplicate', text: 'Keep authentication.' },
  { id: 'noise', text: 'Paint everything blue.' }
] };

test('save combines ranking, preservation, deduplication, watchdog and private exclusive storage', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saveusage-save-'));
  const store = path.join(dir, 'handoff.json');
  try {
    const event = { operation: 'read', input: 'file', output: 'same' };
    const result = await saveContext({ ...input, events: [event, event, event] }, { graph: false, store });
    assert.equal(result.text, 'Keep authentication.');
    assert.equal(result.duplicates.length, 1);
    assert.equal(result.omitted[0].reason, 'no-query-match');
    assert.equal(result.watchdog.status, 'repetition-detected');
    assert.equal(result.graph.status, 'skipped');
    assert.deepEqual(JSON.parse(fs.readFileSync(store, 'utf8')), result);
    assert.equal(fs.statSync(store).mode & 0o777, 0o600);
    await assert.rejects(saveContext(input, { graph: false, store }), /EEXIST/);
    assert.equal(fs.readdirSync(dir).length, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('save reports missing graph without setup or source writes and protects overflow', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saveusage-save-'));
  try {
    const result = await saveContext({ ...input, budget: 1 }, { cwd: dir });
    assert.notEqual(result.graph.status, 'queried');
    assert.equal(result.measurement.budgetExceeded, true);
    assert.equal(result.text, 'Keep authentication.');
    assert.deepEqual(fs.readdirSync(dir), []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('save CLI reads stdin and rejects malformed options without writes', () => {
  const run = (...args) => spawnSync(process.execPath, ['dist/cli.js', 'save', ...args], { input: JSON.stringify(input), encoding: 'utf8' });
  const result = run('-', '--no-graph');
  assert.equal(result.status, 0, result.stdout);
  assert.equal(JSON.parse(result.stdout).text, 'Keep authentication.');
  for (const args of [[], ['-', '--store'], ['-', '--unknown'], ['-', 'extra']]) assert.equal(run(...args).status, 1);
});

test('save retrieves a fresh local graph and falls back after source changes', { skip: !bundledStatus().graphify.setupComplete }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'saveusage-save-graph-'));
  try {
    execFileSync('git', ['init', '--quiet', dir]);
    fs.writeFileSync(path.join(dir, 'index.js'), 'export function authenticate() { return true; }');
    const indexed = await graphCommand('index', ['.'], { cwd: dir });
    assert.equal(indexed.code, 0, indexed.stderr);
    const bundle = { query: 'authenticate', budget: 1000, entries: [] };
    const result = await saveContext(bundle, { cwd: dir });
    assert.equal(result.graph.status, 'queried');
    assert.match(result.text, /authenticate/);
    fs.appendFileSync(path.join(dir, 'index.js'), '\nexport const changed = 1;');
    const stale = await saveContext(bundle, { cwd: dir });
    assert.equal(stale.graph.status, 'stale');
    assert.equal(stale.text, '');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
