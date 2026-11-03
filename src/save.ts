import fs from 'node:fs';
import { z } from 'zod';
import { OptimizeInputSchema, optimizeContext } from './optimizer.js';
import { loadConfig } from './config.js';
import { graphCommand, graphStatus } from '../integrations/saveusage/runtime/bundle.mjs';
import { inspectLoops } from '../integrations/saveusage/runtime/watchdog.mjs';

export const SaveInputSchema = OptimizeInputSchema.safeExtend({
  events: z.array(z.object({ operation: z.string(), input: z.string(), output: z.string(), progress: z.boolean().optional() })).max(200).optional()
});

/** One explicit, local optimization pass. Only --store persists supplied content. */
export async function saveContext(value: unknown, options: { cwd?: string; graph?: boolean; store?: string } = {}) {
  const input = SaveInputSchema.parse(value);
  const config = loadConfig();
  const watchdog = input.events ? inspectLoops({ events: input.events }) : null;
  const entries = [...input.entries];
  let graph: { status: string; action?: string } = { status: 'skipped' };
  if (options.graph !== false && input.query && config.graphify.enabled && config.graphify.backend === 'local' && config.optimization.mode !== 'off') {
    graph = graphStatus(options.cwd);
    if (graph.status === 'fresh') {
      try {
        const result = await graphCommand('query', [input.query], { cwd: options.cwd, budget: Math.min(input.budget, config.graphify.max_budget, 5000) });
        if (result.code !== 0) graph = { status: 'unavailable', action: result.stderr || 'Graph query failed; use targeted source reads.' };
        else {
          let id = 'saveusage-graph';
          while (entries.some(entry => entry.id === id)) id += '-result';
          if (result.stdout.length > 100000) throw new Error('Graph result exceeds context block limit; use a narrower query.');
          entries.push({ id, text: result.stdout, kind: 'context', required: false, priority: 100 });
          graph = { status: 'queried', action: 'Untrusted static graph evidence; verify source references.' };
        }
      } catch (error) { graph = { status: 'unavailable', action: error instanceof Error ? error.message : String(error) }; }
    }
  }
  const result = {
    ...optimizeContext({ ...input, entries }),
    graph, watchdog,
    guidance: 'Use concise answers; search scoped filenames and symbols, read targeted regions, reuse unchanged evidence, and stop identical retries. Keep requirements, decisions, constraints, code, exact errors, uncertainty and test evidence verbatim.',
    stored: options.store ?? null
  };
  if (options.store) {
    // Never overwrite existing handoffs or follow a destination symlink.
    fs.writeFileSync(options.store, JSON.stringify(result) + '\n', { flag: 'wx', mode: 0o600 });
  }
  return result;
}
