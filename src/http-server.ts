#!/usr/bin/env node
import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './mcp-server.js';

const token = process.env.SAVEUSAGE_MCP_TOKEN;
if (!token || Buffer.byteLength(token) < 32) throw new Error('Set SAVEUSAGE_MCP_TOKEN to a random secret of at least 32 bytes');
const secret = Buffer.from(`Bearer ${token}`);
const port = Number(process.env.PORT ?? 8787);
const host = process.env.SAVEUSAGE_BIND ?? '127.0.0.1';
const server = http.createServer(async (req, res) => {
  const provided = Buffer.from(req.headers.authorization ?? '');
  if (provided.length !== secret.length || !timingSafeEqual(provided, secret)) { res.writeHead(401); res.end(); return; }
  // Intended for a trusted TLS reverse proxy. Browser origins are denied by default.
  if (req.headers.origin || req.url !== '/mcp') { res.writeHead(403); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }); res.end(); return; }
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const mcp = createServer();
  res.on('close', () => { void transport.close(); void mcp.close(); });
  try { await mcp.connect(transport); await transport.handleRequest(req, res); }
  catch { if (!res.headersSent) res.writeHead(500); if (!res.writableEnded) res.end(); }
});
server.requestTimeout = 20000;
server.headersTimeout = 10000;
server.listen(port, host, () => process.stderr.write(`SaveUsage MCP listening on ${host}:${port}\n`));
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => server.close());
