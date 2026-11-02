import {createInterface} from 'node:readline';
for await(const line of createInterface({input:process.stdin})) {
 const r=JSON.parse(line);if(r.id===undefined)continue;
 const tools={ graph_stats:{name:'graph_stats',inputSchema:{type:'object'},annotations:{readOnlyHint:true}}, remember:{name:'remember',annotations:{readOnlyHint:false}} };
 let result;
 if(r.method==='initialize')result={};
 else if(r.method==='mcpServerStatus/list')result={data:[{name:'graphify',authStatus:'oAuth',tools,toolsError:null}]};
 else if(r.method==='thread/start') {
  if(r.params.ephemeral!==true)throw Error('Must use ephemeral session');
  result={thread:{id:'test-ephemeral'}};
 }
 else if(r.method==='mcpServer/tool/call') {
  if(r.params.threadId!=='test-ephemeral'||r.params.server!=='graphify'||r.params.tool!=='graph_stats')throw Error('Unexpected call');
  result={content:[{type:'text',text:'fixture graph stats'}],isError:false};
 }
 else throw Error('Forbidden RPC method: '+r.method);
 process.stdout.write(JSON.stringify({id:r.id,result})+'\n');
}
