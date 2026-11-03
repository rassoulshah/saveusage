import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {sourceSnapshot,recordSnapshot,graphStatus} from '../integrations/saveusage/runtime/freshness.mjs';
import {graphCommand} from '../integrations/saveusage/runtime/bundle.mjs';
test('Git snapshots detect edits, additions, deletions and graph changes without persisting source',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'saveusage-fresh-'));
 try {
  execFileSync('git',['init','--quiet',root]);fs.writeFileSync(path.join(root,'a.js'),'export const a=1;');
  assert.equal(graphStatus(root).status,'missing');
  fs.mkdirSync(path.join(root,'saveusage'));fs.writeFileSync(path.join(root,'saveusage/graph.json'),'{}');
  assert.equal(graphStatus(root).status,'unknown');
  const before=sourceSnapshot(root);assert.equal(recordSnapshot(root,before),true);assert.equal(graphStatus(root).status,'fresh');
  fs.writeFileSync(path.join(root,'a.js'),'export const a=2;');assert.equal(graphStatus(root).status,'stale');
  assert.ok(!fs.readFileSync(path.join(root,'saveusage/saveusage-snapshot.json'),'utf8').includes('export const'));
  recordSnapshot(root,sourceSnapshot(root));fs.writeFileSync(path.join(root,'new.js'),'new');assert.equal(graphStatus(root).status,'stale');
  recordSnapshot(root,sourceSnapshot(root));fs.unlinkSync(path.join(root,'new.js'));assert.equal(graphStatus(root).status,'stale');
  recordSnapshot(root,sourceSnapshot(root));fs.writeFileSync(path.join(root,'saveusage/graph.json'),'changed');assert.equal(graphStatus(root).status,'stale');
  const result=await graphCommand('status',[],{cwd:root,dataDir:path.join(root,'no-runtime')});assert.equal(JSON.parse(result.stdout).status,'stale');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('non-Git directories and changed-during-index snapshots stay unknown',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'saveusage-unknown-'));
 try {
  assert.equal(sourceSnapshot(root),null);fs.mkdirSync(path.join(root,'saveusage'));fs.writeFileSync(path.join(root,'saveusage/graph.json'),'{}');assert.equal(graphStatus(root).status,'unknown');
  execFileSync('git',['init','--quiet',root]);const before=sourceSnapshot(root);fs.writeFileSync(path.join(root,'new.js'),'changed');assert.equal(recordSnapshot(root,before),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
