import { Tiktoken } from 'js-tiktoken/lite';
import ranks from 'js-tiktoken/ranks/cl100k_base';
import { z } from 'zod';
import { rankByQuery, terms } from './relevance.js';

export const ContextEntrySchema = z.object({
  id: z.string().min(1).max(200),
  text: z.string().max(100000),
  kind: z.enum(['context', 'requirement', 'decision', 'constraint', 'error', 'code', 'test']).default('context'),
  required: z.boolean().default(false),
  priority: z.number().int().min(0).max(100).default(50)
});
export const OptimizeInputSchema = z.object({
  query: z.string().min(1).max(4000).refine(value => terms(value).length > 0, "Query must contain letters or numbers").optional(),
  entries: z.array(ContextEntrySchema).max(500),
  budget: z.number().int().min(1).max(50000).default(2000)
}).superRefine((input, ctx) => {
  if (input.entries.reduce((sum, entry) => sum + entry.text.length, 0) > 1000000)
    ctx.addIssue({ code: 'custom', message: 'Combined text exceeds 1,000,000 characters' });
  if (new Set(input.entries.map(entry => entry.id)).size !== input.entries.length)
    ctx.addIssue({ code: 'custom', message: 'Entry ids must be unique' });
});
let tokenizer: Tiktoken | undefined;
export function countTokens(text: string) {
  tokenizer ??= new Tiktoken(ranks);
  return tokenizer.encode(text, [], []).length;
}

/** Select whole blocks; never summarize, rewrite, or truncate their contents. */
export function optimizeContext(value: unknown) {
  const input = OptimizeInputSchema.parse(value);
  const render = (entries: typeof input.entries) => entries.map(e => e.text).join('\n\n');
  const originalTokens = countTokens(render(input.entries));
  const groups = new Map<string, { entry: typeof input.entries[number]; ids: string[]; index: number }>();
  input.entries.forEach((entry, index) => {
    const group = groups.get(entry.text);
    if (group) {
      group.ids.push(entry.id);
      group.entry.required ||= entry.required || entry.kind !== 'context';
      group.entry.priority = Math.max(group.entry.priority, entry.priority);
    } else groups.set(entry.text, { entry: { ...entry, required: entry.required || entry.kind !== 'context' }, ids: [entry.id], index });
  });
  const rawBlocks = [...groups.values()];
  const relevance = input.query ? rankByQuery(rawBlocks.map(b => b.entry.text), input.query) : null;
  const blocks = rawBlocks.map((block, i) => ({ ...block, score: relevance?.[i].score ?? 0, matchedTerms: relevance?.[i].matchedTerms ?? [] }));
  const selected = blocks.filter(block => block.entry.required);
  const ordered = () => [...selected].sort((a, b) => a.index - b.index).map(block => block.entry);
  const protectedOverflow = countTokens(render(ordered())) > input.budget;
  for (const block of (protectedOverflow ? [] : blocks).filter(b => !b.entry.required && (!input.query || b.score > 0)).sort((a, b) => b.score - a.score || b.entry.priority - a.entry.priority || a.index - b.index)) {
    const candidate = [...selected, block].sort((a, b) => a.index - b.index).map(b => b.entry);
    if (countTokens(render(candidate)) <= input.budget) selected.push(block);
  }
  const entries = ordered();
  const text = render(entries);
  const selectedTokens = countTokens(text);
  const picked = new Set(selected.map(b => b.index));
  return { text, selectedIds: entries.map(e => e.id),
    omitted: blocks.filter(b => !picked.has(b.index)).map(b => ({ id: b.entry.id, reason: input.query && b.score === 0 ? 'no-query-match' : 'budget', tokens: countTokens(b.entry.text) })),
    duplicates: blocks.flatMap(b => b.ids.slice(1).map(id => ({ id, keptId: b.entry.id }))),
    ...(input.query ? { retrieval: { method: 'BM25 lexical matching; not semantic relevance', query: input.query,
      blocks: blocks.map(b => ({ id: b.entry.id, score: b.score, matchedTerms: b.matchedTerms,
        reason: b.entry.required ? 'protected' : picked.has(b.index) ? 'query-match' : b.score === 0 ? 'no-query-match' : 'budget' })) } } : {}),
    measurement: { tokenizer: 'cl100k_base', originalTokens, selectedTokens, savedTokens: originalTokens - selectedTokens,
      budget: input.budget, budgetExceeded: selectedTokens > input.budget, scope: 'Provided text only; excludes tool schemas, wrappers, reasoning and output. Other model tokenizers and billed usage may differ.' },
    warning: selectedTokens > input.budget ? 'Protected blocks exceed budget; kept verbatim. Increase the budget or ask the user to narrow scope.' : null };
}
