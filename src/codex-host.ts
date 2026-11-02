import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

/** Native MCP RPC only. No model turns, credentials read, or durable conversations. */
export class CodexHost {
  private child;
  private id = 0;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
  constructor(command = 'codex', args = ['app-server']) {
    this.child = spawn(command, args, { stdio: ['pipe', 'pipe', 'ignore'] });
    createInterface({ input: this.child.stdout }).on('line', line => {
      try {
        const response = JSON.parse(line);
        const entry = this.pending.get(response.id);
        if (entry) {
          this.pending.delete(response.id); clearTimeout(entry.timer);
          response.error ? entry.reject(new Error('Codex native MCP request failed')) : entry.resolve(response.result);
        } else if (response.id !== undefined) {
          // Never auto-approve interactive elicitation or other server requests.
          this.child.stdin.write(JSON.stringify({ id: response.id, error: { code: -32601, message: 'Interactive requests unsupported' } }) + '\n');
        }
      } catch { /* Non-protocol output is not forwarded to logs. */ }
    });
    this.child.on('error', () => this.fail());
    this.child.on('exit', () => this.fail());
    this.child.stdin.on('error', () => this.fail());
  }
  private fail() {
    for (const entry of this.pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('Codex native MCP host unavailable')); }
    this.pending.clear();
  }
  request(method: string, params: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('Codex native MCP timeout')); }, 30000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
    });
  }
  async initialize() {
    await this.request('initialize', { clientInfo: { name: 'contextpilot', version: '0.2.0' }, capabilities: { experimentalApi: true } });
    this.child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
  }
  async graphify() {
    let cursor: string | undefined;
    do {
      const page = await this.request('mcpServerStatus/list', { detail: 'toolsAndAuthOnly', cursor });
      const server = page.data.find((s: any) => s.name === 'graphify');
      if (server) return server;
      cursor = page.nextCursor;
    } while (cursor);
    throw new Error('Graphify is not registered in Codex');
  }
  async call(tool: string, args: Record<string, unknown>, catalog?: any) {
    const graphify = catalog ?? await this.graphify();
    const schema = Object.values(graphify.tools).find((t: any) => t.name === tool) as any;
    if (!schema || schema.annotations?.readOnlyHint !== true) throw new Error('Only advertised read-only Graphify tools are allowed');
    const session = await this.request('thread/start', { ephemeral: true, cwd: process.cwd() });
    return this.request('mcpServer/tool/call', { threadId: session.thread.id, server: 'graphify', tool, arguments: args });
  }
  close() { this.fail(); this.child.stdin.end(); this.child.kill(); }
}

export async function withCodexHost<T>(run: (host: CodexHost) => Promise<T>) {
  const host = new CodexHost();
  try { await host.initialize(); return await run(host); }
  finally { host.close(); }
}

export async function codexGraphifyStatus(repository?: string | null, tool?: string) {
  return withCodexHost(async host => {
    const server = await host.graphify();
    const tools = Object.values(server.tools) as any[];
    let index: unknown = { status: 'unknown' };
    const list = tools.find(t => t.name === 'list_repositories' && t.annotations?.readOnlyHint === true);
    if (repository && list) {
      const result = await host.call(list.name, {}, server);
      let data = result.structuredContent;
      if (!data && result.content?.[0]?.type === 'text') {
        try { data = JSON.parse(result.content[0].text); } catch { /* Unknown upstream response. */ }
      }
      if (!result.isError && Array.isArray(data?.repositories)) {
        const match = data.repositories.find((r: any) => r.fullName === repository);
        index = match ? { status: match.queryable ? 'queryable' : 'not-ready', repository, freshness: 'unknown', dirtyWorkingTreeCovered: false } : { status: 'not-listed', repository, note: 'Not visible in the active workspace; another workspace or indexing may be required.' };
      }
    }
    return { status: tools.length && !server.toolsError ? 'connected' : 'unavailable', host: 'codex', auth: server.authStatus, index,
      tools: tools.filter(t => !tool || t.name === tool).map(t => ({ name: t.name, readOnly: t.annotations?.readOnlyHint === true, ...(tool ? { inputSchema: t.inputSchema, description: t.description } : {}) })),
      note: 'Native Codex OAuth; no tokens imported or model turn started. Index freshness requires separate evidence.' };
  });
}
