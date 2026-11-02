import { optimizeContext } from '../dist/optimizer.js';
const requirement = 'Preserve the existing API response format and authentication checks.';
const error = "TypeError: Cannot read properties of undefined (reading 'id')";
const optional = 'Historical discussion about unrelated UI preferences. '.repeat(160);
const result = optimizeContext({ budget: 300, entries: [
  { id: 'requirement', kind: 'requirement', text: requirement },
  { id: 'error', kind: 'error', text: error },
  { id: 'error-copy', kind: 'error', text: error },
  { id: 'relevant', priority: 100, text: 'The current failure occurs in user lookup before serialization.' },
  { id: 'history', priority: 0, text: optional },
  { id: 'history-copy', priority: 0, text: optional }
] });
if (!result.text.includes(requirement) || !result.text.includes(error)) throw Error('Protected text lost');
console.log(JSON.stringify({ fixture: 'Synthetic context selection demonstration; not a real coding session', ...result.measurement,
  protectedTextPreserved: true, duplicatesRemoved: result.duplicates.length, omittedBlocks: result.omitted.length }, null, 2));
