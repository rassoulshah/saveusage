import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeContext, countTokens } from '../dist/optimizer.js';

test('deduplication preserves exact critical text and prioritizes relevant context', () => {
 const error="TypeError: Cannot read properties of undefined (reading 'id')";
 const r=optimizeContext({budget:60,entries:[
  {id:'error',kind:'error',text:error},
  {id:'copy',text:error},
  {id:'noise',priority:0,text:'unrelated '.repeat(300)},
  {id:'useful',priority:100,text:'Inspect user lookup before serialization.'}
 ]});
 assert.equal(r.text,error+'\n\nInspect user lookup before serialization.');
 assert.deepEqual(r.duplicates,[{id:'copy',keptId:'error'}]);
 assert.deepEqual(r.omitted.map(x=>x.id),['noise']);
 assert.ok(r.measurement.selectedTokens<=60);assert.ok(r.measurement.savedTokens>0);
});

test('all protected kinds survive budget overflow verbatim, including multilingual code',()=>{
 const entries=['requirement','decision','constraint','error','code','test'].map((kind,i)=>({id:String(i),kind,text:`${kind}: هرگز حذف نکنید \n\`\`\`js\nconst value = "${i}";\n\`\`\``}));
 const r=optimizeContext({budget:1,entries});
 assert.equal(r.text,entries.map(e=>e.text).join('\n\n'));
 assert.equal(r.measurement.budgetExceeded,true);assert.ok(r.warning);assert.equal(r.omitted.length,0);
});

test('later critical duplicate protects the earlier identical block; no hidden rewriting',()=>{
 const r=optimizeContext({budget:1,entries:[{id:'first',text:'Never remove this requirement.'},{id:'critical',text:'Never remove this requirement.',required:true}]});
 assert.equal(r.text,'Never remove this requirement.');assert.equal(r.measurement.budgetExceeded,true);
 assert.equal(r.duplicates[0].keptId,'first');
});

test('empty inputs, special token text and invalid budgets are handled explicitly',()=>{
 assert.equal(optimizeContext({entries:[]}).text,'');
 assert.ok(countTokens('<|endoftext|>')>0);
 assert.throws(()=>optimizeContext({budget:0,entries:[]}));
 assert.throws(()=>optimizeContext({entries:[{id:'same',text:'a'},{id:'same',text:'b'}]}));
});
