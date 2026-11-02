import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { execFileSync } from 'node:child_process';

export function repositoryIdentity(cwd = process.cwd()) {
  const git = (...args: string[]) => {
    try { return execFileSync('git', args, { cwd, encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { return null; }
  };
  const root = git('rev-parse', '--show-toplevel');
  const raw = git('remote', 'get-url', 'origin');
  // Never disclose embedded remote credentials, query strings, or local paths.
  const match = raw?.match(/^(?:https?:\/\/|ssh:\/\/)?(?:[^/@]+@)?(github\.com)[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?$/);
  return { root, repository: match ? `https://${match[1]}/${match[2]}` : null, commit: git('rev-parse', 'HEAD'), dirty: root ? Boolean(git('status', '--porcelain')) : null };
}

export async function withGraphify<T>(endpoint: string, run: (client: Client) => Promise<T>, token = process.env.CONTEXTPILOT_GRAPHIFY_TOKEN): Promise<T> {
  const url = new URL(endpoint);
  if (url.username || url.password || url.search || url.hash) throw new Error('Graphify endpoint must not contain credentials, query, or fragment');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))) throw new Error('Graphify requires HTTPS except loopback');
  const client = new Client({ name: 'contextpilot', version: '0.3.0' });
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.any([AbortSignal.timeout(10000), ...(init?.signal ? [init.signal] : [])]) })
  });
  try { await client.connect(transport, { timeout: 10000 }); return await run(client); }
  finally { await client.close(); }
}

export function graphifyFailure(error: unknown) {
  const code = (error as { code?: number })?.code;
  return { status: code === 401 || code === 403 || (error as Error)?.name === 'UnauthorizedError' ? 'authentication-required' : 'unavailable', message: 'Use the host-native Graphify OAuth connection; credentials are not imported from host configuration.', index: 'unknown', fallback: 'Read relevant local files and verify dependencies directly. Do not claim graph evidence.' };
}

export async function graphifyStatus(endpoint: string) {
  try { return await withGraphify(endpoint, async client => {
    const tools = []; let cursor: string | undefined;
    do { const page = await client.listTools({ cursor }, { timeout: 10000 }); tools.push(...page.tools); cursor = page.nextCursor; } while (cursor && tools.length < 200);
    return { status: 'connected', index: 'unknown', tools: tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })), note: 'Connectivity is verified; indexing and freshness require repository-specific evidence from discovered tools.' };
  }); } catch (error) { return graphifyFailure(error); }
}

export async function graphifyCall(endpoint: string, name: string, args: Record<string, unknown>, budget: number) {
  return withGraphify(endpoint, async client => {
    const { tools } = await client.listTools({}, { timeout: 10000 });
    const tool = tools.find(t => t.name === name);
    if (!tool || tool.annotations?.readOnlyHint !== true) throw new Error('Only advertised read-only Graphify tools are allowed');
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 15000 });
    // Byte bound is conservative for common text tokenizers, not a measured token count.
    const text = JSON.stringify(result); const bytes = Buffer.from(text); const limit = Math.max(0, Math.floor(budget));
    return { text: new TextDecoder().decode(bytes.subarray(0, limit), { stream: true }), truncated: bytes.length > limit, byteLimit: limit, untrusted: true, isError: Boolean(result.isError) };
  });
}
