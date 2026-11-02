import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { z } from 'zod';
import { classifyTask, prepareContext, cavemanSkill } from '../dist/context.js';
import { graphifyStatus, graphifyCall, repositoryIdentity } from '../dist/graphify.js';
import { loadConfig, ConfigSchema } from '../dist/config.js';
import { createRetrievalPlan } from '../dist/policy.js';

test('classification and lightweight simple path', () => {
  for (const [prompt,kind] of [['hello','simple'],['architecture dependencies','codebase-question'],['fix error EADDRINUSE','debugging'],['implement feature','implementation'],['review auth','review'],['خطا در ورود','debugging']]) assert.equal(classifyTask(prompt), kind);
  const context=prepareContext('hello'); assert.equal(context.repository,null); assert.equal(context.caveman.status,'skipped');
  const c=structuredClone(loadConfig());c.optimization.mode='off';assert.equal(createRetrievalPlan(c,'implementation').useGraphify,false);
  c.graphify.default_budget=5000;c.graphify.max_budget=1000;assert.equal(ConfigSchema.safeParse(c).success,false);
  assert.equal(cavemanSkill('caveman','/nonexistent-contextpilot-home').status,'unavailable');
  assert.match(repositoryIdentity().repository,/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/);
});

test('real MCP Graphify discovery, bounded call, missing tools and authentication fallback', async () => {
  const connections=[];
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/auth'){res.writeHead(401);res.end();return;}
    const mcp=new McpServer({name:'graphify-fixture',version:'1'});
    mcp.registerTool('fixture_query',{description:'fixture, not an assumed upstream tool',inputSchema:{query:z.string()},annotations:{readOnlyHint:true}},async()=>({content:[{type:'text',text:'dependency '.repeat(300)}]}));
    const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});connections.push([mcp,transport]);
    await mcp.connect(transport);await transport.handleRequest(req,res);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r)); const url=`http://127.0.0.1:${server.address().port}`;
  try {
    const status=await graphifyStatus(url);assert.equal(status.status,'connected');assert.equal(status.index,'unknown');assert.equal(status.tools[0].name,'fixture_query');
    const result=await graphifyCall(url,'fixture_query',{query:'dependencies'},100);assert.equal(result.truncated,true);assert.ok(Buffer.byteLength(result.text)<=102);
    await assert.rejects(graphifyCall(url,'invented',{},100));
    assert.equal((await graphifyStatus(url+'/auth')).status,'authentication-required');
    assert.equal((await graphifyStatus('http://example.com')).status,'unavailable');
  } finally {for(const [m,t] of connections){await t.close();await m.close();}await new Promise(r=>server.close(r));}
});

test('stdio MCP tools operate end to end without writing conversations',async()=>{
  const client=new Client({name:'test',version:'1'});const transport=new StdioClientTransport({command:process.execPath,args:['dist/mcp-server.js'],stderr:'pipe'});
  try{await client.connect(transport);const {tools}=await client.listTools();assert.equal(tools.length,6);
    const r=await client.callTool({name:'contextpilot_context',arguments:{prompt:'hello'}});const c=JSON.parse(r.content[0].text);assert.equal(c.task,'simple');assert.equal(c.graphify.action,'skip');
    const selected=await client.callTool({name:'contextpilot_optimize',arguments:{budget:20,entries:[{id:'r',kind:'requirement',text:'Never remove authentication.'},{id:'duplicate',text:'Never remove authentication.'}]}});assert.equal(JSON.parse(selected.content[0].text).text,'Never remove authentication.');
    const p=await client.callTool({name:'contextpilot_policy',arguments:{}});assert.equal(JSON.parse(p.content[0].text).providerChangesAllowed,false);
  }finally{await client.close();}
});

test('remote server rejects unauthenticated requests and supports authenticated MCP',async()=>{
  const reserve=http.createServer();await new Promise(r=>reserve.listen(0,'127.0.0.1',r));const port=reserve.address().port;await new Promise(r=>reserve.close(r));
  const token='fixture-secret-'.repeat(4);const child=spawn(process.execPath,['dist/http-server.js'],{env:{...process.env,PORT:String(port),CONTEXTPILOT_MCP_TOKEN:token},stdio:['ignore','ignore','pipe']});
  const client=new Client({name:'http-test',version:'1'});
  try{
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('startup timeout')),5000);child.stderr.once('data',()=>{clearTimeout(timer);resolve();});child.once('error',reject);});
    const url=`http://127.0.0.1:${port}/mcp`;assert.equal((await fetch(url,{method:'POST'})).status,401);
    assert.equal((await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,Origin:'https://evil.example'}})).status,403);
    await client.connect(new StreamableHTTPClientTransport(new URL(url),{requestInit:{headers:{Authorization:`Bearer ${token}`}}}));assert.equal((await client.listTools()).tools.length,6);
  }finally{await client.close();child.kill();}
});
