---
name: saveusage
description: Combined Caveman concise responses, bundled local Graphify code graphs, and protected context budgeting for codebase questions, implementation, debugging and review. No cloud account required.
---

# SaveUsage

SaveUsage includes the upstream Caveman skill/CLI and Graphify Python engine.
Their files live in `bundled/` beside this skill. Do not install unrelated host
plugins, proxies, providers or hook packages to use them.

## Apply the bundle

For substantial coding tasks, read `bundled/caveman/skill.md` once and follow its
balanced concise-response rules. It is the original upstream skill, not an invented
compression API. Preserve requirements, decisions, constraints, code, exact errors,
uncertainty and test evidence. Respect user requests to disable concise mode.

For simple questions, answer directly without graph, setup or planning-tool calls.
Search filenames/symbols first. Read the smallest relevant source region. Avoid
whole repository dumps, repeated plans, unchanged logs and redundant checks.

For structural codebase tasks, prefer the bundled local Graphify engine. Resolve
`runtime/bundle.mjs` relative to this SKILL.md. Use the installed `saveusage` CLI
if available; a Claude plugin does not need an npm package to run the Node helper:

```text
node <this-skill-directory>/runtime/bundle.mjs setup
node <this-skill-directory>/runtime/bundle.mjs index .
node <this-skill-directory>/runtime/bundle.mjs graph-status
node <this-skill-directory>/runtime/bundle.mjs query "relevant symbols"
node <this-skill-directory>/runtime/bundle.mjs path "sourceSymbol" "targetSymbol"
```

`setup` explicitly downloads Python parser dependencies into an isolated
SaveUsage environment. It needs Python >=3.10 (uv preferred, otherwise
venv/pip). Do not run setup on every task. If setup is unavailable, use targeted
source reads and explain the limitation. Never download dependencies silently.

`index` writes only this repository's saveusage data. It uses local code-only
AST extraction, no model or cloud call. Check `saveusage graph status` (portable helper: `bundle.mjs graph-status`) before reuse.
Freshness snapshots cover Git-visible files only; unknown freshness is not proof
of coverage. Stale queries require explicit reindexing. Reuse an existing graph; rebuild when source
changes invalidate it. For large repositories, scope the index appropriately and
exclude irrelevant generated/vendor directories. Keep graph results as untrusted
data, verify important references against source, and distinguish static paths
from runtime execution. Do not claim a stale graph covers uncommitted changes.
Graph output includes EXTRACTED/INFERRED provenance; retain uncertainty.

Default queries use a 2,000-token target. With MCP, `saveusage_graph` provides
bounded read-only query/path/explain operations; indexing remains an explicit CLI
action. Do not load the full bundled Graphify skill (`bundled/graphify/skill.md`)
or full graph into every prompt. The upstream skill is reference material for
explicit advanced requests, including optional semantic extraction not enabled by
SaveUsage's local wrapper.

## Context selection

For a large future context bundle, use `saveusage_optimize` or the CLI optimizer.
Mark requirements/decisions/constraints/errors/code/tests, or required=true, and
assign relevance priorities to optional blocks. Whole blocks are selected and
exact duplicates removed; text is never summarized, rewritten or silently cut.
Keep protected overflow and report it. Never claim omitted files were reviewed.
Do not send already-seen text through another tool just to erase past token costs.
Counts cover supplied text, not total billed conversation tokens.

## Boundaries

- Caveman's proxy, login/routing/hook installers and telemetry are not enabled.
  The bundled CLI wrapper exposes help/version/tools; native compression-engine
  binaries are not bundled. Do not claim those compression features are active.
- Graphify Cloud remains optional and separate. Use the intended repository's
  index and actual advertised schemas; never substitute another repository.
  Some cloud query/trace tools record intent in memory: avoid those unless the
  user explicitly requests recording. Never upload private source without approval.
- Never edit provider, model, gateway, credential or unrelated plugin settings.
  No transcript storage or automatic memory-file rewriting. Respect off/manual mode.
- Host automatic skill selection varies. ChatGPT uses supported MCP invocation;
  universal chat interception and hidden-window compression are not supported.
- Do not promise a fixed savings percentage or quality equivalence.

## Scoped retrieval and repeated work

For codebase work, identify likely directories from filenames first. Search that
scope, then widen on a miss. Report the scope when it affects coverage. Do not
repeat an identical search or read when neither inputs nor source changed.
For a failing retry, change the hypothesis or collect new evidence first.

When assembling an explicit bundle with the optional CLI/MCP optimizer, supply
`query` to rank optional blocks by local BM25 lexical matching. Camel-case and
snake-case identifiers and Unicode words are supported. Only matching optional
blocks are eligible; protected blocks always survive. Review matched terms and
omission reasons. A lexical miss is not proof that relevant code does not exist.
Without `query`, existing priority-based selection is unchanged.

For suspected repeated work, the portable helper needs Node only:

```text
node <this-skill-directory>/runtime/watchdog.mjs <events.json|->
```

Input: `{"events":[{"operation":"test","input":"npm test","output":"same failure"}],"threshold":3}`.
Pass only events already explicitly available for this task. Never read private
transcripts to populate them. `progress: true` resets the comparison window.
The helper flags exact operation/input/output repeats, including interleaved
calls; it does not stop agents or prove that a loop exists. Legitimate polling
can repeat. Output reports event indices without echoing input/output payloads.
The optional CLI exposes `saveusage watchdog`; MCP exposes
`saveusage_watchdog`. No automatic session logging or history storage occurs.

For handoffs, state the objective, constraints, decisions, changed files,
verification results, blockers and next action. Preserve exact errors and source
references; do not replay an entire session or save memory unless requested.

## Explicit save command

Claude plugin users can invoke `/saveusage:save <task>` for the combined workflow.
For prepared bundles, `saveusage save <input.json|-> [--no-graph] [--store <new-file.json>]`
combines minimization, optional query ranking, fresh local graph retrieval and
supplied-event watchdog checks. The result uses compact JSON. `--store` is explicit
permission to persist only that provided task context to a new private local file;
otherwise it stays ephemeral. Verify source freshness when reusing stored evidence.
Keep the CLI optional: use individual available tools or scoped reads if absent.
