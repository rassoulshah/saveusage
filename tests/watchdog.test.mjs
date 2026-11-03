import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inspectLoops } from '../integrations/saveusage/runtime/watchdog.mjs';
const repeated = {operation:'test',input:'npm test',output:'same failure'};

test('detects interleaved exact repetitions without echoing tool content',()=>{
 const result=inspectLoops({events:[repeated,{operation:'read',input:'a',output:'b'},repeated,repeated]});
 assert.equal(result.status,'repetition-detected');
 assert.deepEqual(result.repetitions,[{operation:'test',indices:[0,2,3]}]);
 assert.ok(!JSON.stringify(result).includes('same failure'));
 assert.equal(inspectLoops({events:[]}).status,'no-repetition-detected');
});
test('progress resets detection; changed results and inputs are distinct',()=>{
 assert.equal(inspectLoops({events:[repeated,repeated,repeated,{...repeated,progress:true},repeated]}).status,'no-repetition-detected');
 assert.equal(inspectLoops({events:[repeated,{...repeated,input:'other'},{...repeated,output:'new failure'}]}).status,'no-repetition-detected');
 assert.throws(()=>inspectLoops({events:[{operation:'test'}]}));
 assert.throws(()=>inspectLoops({events:[],threshold:1}));
 assert.throws(()=>inspectLoops({events:[{...repeated,output:'x'.repeat(1000001)}]}));
});
test('standalone plugin runtime and CLI accept stdin, reject malformed events',()=>{
 for(const args of [['integrations/saveusage/runtime/watchdog.mjs','-'],['dist/cli.js','watchdog','-']]) {
  const child=spawnSync(process.execPath,args,{input:JSON.stringify({events:[repeated,repeated,repeated]}),encoding:'utf8'});
  assert.equal(child.status,0,child.stderr);assert.equal(JSON.parse(child.stdout).status,'repetition-detected');
 }
 assert.equal(spawnSync(process.execPath,['dist/cli.js','watchdog','-'],{input:'{}'}).status,1);
});
