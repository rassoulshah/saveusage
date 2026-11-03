import test from 'node:test';
import assert from 'node:assert/strict';
import {CodexHost} from '../dist/codex-host.js';

test('Codex native bridge discovers and calls MCP without inference or durable history',async()=>{
 const h=new CodexHost(process.execPath,['tests/fixtures/codex-host.mjs']);
 try {
  await h.initialize();assert.equal((await h.graphify()).authStatus,'oAuth');
  assert.equal((await h.call('graph_stats',{repository_id:'fixture/repo'})).isError,false);
  await assert.rejects(h.call('remember',{text:'do not save'}),/read-only/);
  await assert.rejects(h.call('invented',{}),/read-only/);
 } finally {h.close();}
});

test('missing native executable fails cleanly',async()=>{
 const h=new CodexHost('/nonexistent-saveusage-codex');
 try {await assert.rejects(h.initialize(),/unavailable/);}finally{h.close();}
});
