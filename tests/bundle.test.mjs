import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundledStatus, cavemanCommand, graphCommand, setupGraphify } from '../integrations/contextpilot/runtime/bundle.mjs';
import { cavemanSkill } from '../dist/context.js';

test('the package contains real upstream skills and CLI without external installations',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contextpilot-bundle-'));
 try {
  const status=bundledStatus(root);
  assert.equal(status.caveman.version,'4.0.1');assert.equal(status.graphify.version,'0.9.100');
  assert.equal(status.graphify.setupComplete,false);
  const skill=cavemanSkill('caveman',root);assert.equal(skill.status,'available');
  assert.match(fs.readFileSync(skill.path,'utf8'),/Every fact survives/);
  const help=await cavemanCommand(['--help'],{dataDir:root});assert.equal(help.code,0);assert.match(help.stdout,/caveman/);
  await assert.rejects(cavemanCommand(['run'],{dataDir:root}),/not enabled/);
  await assert.rejects(graphCommand('query',['missing graph'],{dataDir:root}),/setup/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('setup refuses to overwrite an unrelated runtime',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contextpilot-unowned-'));
 try {
  const environment=path.join(root,'graphify-0.9.100');fs.mkdirSync(environment);fs.writeFileSync(path.join(environment,'user-data'),'keep');
  await assert.rejects(setupGraphify({dataDir:root}),/unowned/);
  assert.equal(fs.readFileSync(path.join(environment,'user-data'),'utf8'),'keep');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('bundled local Graphify indexes code and resolves a genuine call path', {skip:!bundledStatus().graphify.setupComplete}, async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contextpilot-graph-test-'));
 try {
  fs.writeFileSync(path.join(root,'index.js'),'export function greet(name) { return format(name); }\nexport function format(name) { return `Hello ${name}`; }\n');
  fs.writeFileSync(path.join(root,'notes.md'),'This document is intentionally skipped by the code-only wrapper.');
  const indexed=await graphCommand('index',['.'],{cwd:root});assert.equal(indexed.code,0,indexed.stderr);
  const graph=JSON.parse(fs.readFileSync(path.join(root,'graphify-out/graph.json'),'utf8'));
  assert.ok(graph.nodes.length>=3);
  const query=await graphCommand('query',['greet format'],{cwd:root});assert.equal(query.code,0);assert.match(query.stdout,/greet/);
  const route=await graphCommand('path',['greet','format'],{cwd:root});assert.equal(route.code,0);assert.match(route.stdout,/greet\(\).*calls.*format\(\)/);
  const explain=await graphCommand('explain',['greet'],{cwd:root});assert.equal(explain.code,0);assert.match(explain.stdout,/greet/);
  await assert.rejects(graphCommand('extract',['.'],{cwd:root}),/Choose graph/);
  await assert.rejects(graphCommand('query',['greet'],{cwd:root,budget:9000}),/budget/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
