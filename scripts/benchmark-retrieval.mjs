import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { rankByQuery } from '../dist/relevance.js';
import { countTokens } from '../dist/optimizer.js';

// Explicit small, project-specific evaluation; not a held-out general benchmark.
const cases = [
  ['deduplicate protected blocks budget overflow', 'src/optimizer.ts'],
  ['classifyTask prepareContext', 'src/context.ts'],
  ['installSkill existing skill asset', 'src/install.ts'],
  ['StreamableHTTPServerTransport bearer', 'src/http-server.ts'],
  ['codex initialize experimentalApi', 'src/codex-host.ts'],
  ['BM25 matchedTerms frequency', 'src/relevance.ts']
];
const files = fs.readdirSync('src').filter(file => file.endsWith('.ts')).sort().map(file => `src/${file}`);
const texts = files.map(file => fs.readFileSync(file, 'utf8'));
const results = cases.map(([query, expected]) => {
  const start = performance.now();
  const ranks = rankByQuery(texts, query).map((score, index) => ({...score, file: files[index], index})).sort((a,b) => b.score-a.score || a.index-b.index);
  const top = ranks.filter(row => row.score > 0).slice(0,3);
  return {query, expected, top3:top.map(row => row.file), hit:top.some(row => row.file === expected),
    milliseconds: Number((performance.now()-start).toFixed(3)),
    top3Tokens:countTokens(top.map(row => texts[row.index]).join('\n\n'))};
});
console.log(JSON.stringify({scope:'Six hand-authored queries over current project source. Lexical file retrieval only; no agent task execution or billing measurement.',
  files:files.length, allSourceTokens:countTokens(texts.join('\n\n')), recallAt3:results.filter(row=>row.hit).length/results.length, results},null,2));
if(results.some(row=>!row.hit)) process.exitCode=1;
