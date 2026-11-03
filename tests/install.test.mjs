import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installSkill } from '../dist/install.js';

test('portable skill installation preserves host settings and refuses to overwrite existing work',()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'saveusage-install-'));
 try {
  fs.mkdirSync(path.join(home,'.codex'),{recursive:true});
  const config=path.join(home,'.codex','config.toml');const settings='model_provider = "custom"\n';fs.writeFileSync(config,settings);
  const preview=installSkill('codex','user',{home,dryRun:true});assert.equal(fs.existsSync(preview.target),false);
  const first=installSkill('codex','user',{home});assert.equal(first.status,'installed');
  const skillRoot=path.dirname(first.target);
  for (const asset of ['runtime/bundle.mjs','bundled/graphify/graphifyy-0.9.100-py3-none-any.whl','bundled/caveman/cli/dist/index.js','bundled/graphify/LICENSE','bundled/caveman/LICENSE']) assert.ok(fs.existsSync(path.join(skillRoot,asset)),asset);
  assert.equal(installSkill('codex','user',{home}).status,'already-installed');
  fs.writeFileSync(first.target,'custom user changes');assert.throws(()=>installSkill('codex','user',{home}),/unchanged/);
  assert.equal(fs.readFileSync(config,'utf8'),settings);
  const claude=installSkill('claude','project',{cwd:home});assert.ok(claude.target.includes('.claude'));
 } finally {fs.rmSync(home,{recursive:true,force:true});}
});
