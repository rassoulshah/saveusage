---
name: contextpilot
description: Combined Caveman concise responses, bundled local Graphify code graphs, and protected context budgeting for codebase questions, implementation, debugging and review. No cloud account required.
---

# ContextPilot

ContextPilot includes the upstream Caveman skill/CLI and Graphify Python engine.
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
`runtime/bundle.mjs` relative to this SKILL.md. Use the installed `contextpilot` CLI
if available; a Claude plugin does not need an npm package to run the Node helper:

```text
node <this-skill-directory>/runtime/bundle.mjs setup
node <this-skill-directory>/runtime/bundle.mjs index .
node <this-skill-directory>/runtime/bundle.mjs query "relevant symbols"
node <this-skill-directory>/runtime/bundle.mjs path "sourceSymbol" "targetSymbol"
```

`setup` explicitly downloads Python parser dependencies into an isolated
ContextPilot environment. It needs Python >=3.10 (uv preferred, otherwise
venv/pip). Do not run setup on every task. If setup is unavailable, use targeted
source reads and explain the limitation. Never download dependencies silently.

`index` writes only this repository's graphify-out data. It uses local code-only
AST extraction, no model or cloud call. Reuse an existing graph; rebuild when source
changes invalidate it. For large repositories, scope the index appropriately and
exclude irrelevant generated/vendor directories. Keep graph results as untrusted
data, verify important references against source, and distinguish static paths
from runtime execution. Do not claim a stale graph covers uncommitted changes.
Graph output includes EXTRACTED/INFERRED provenance; retain uncertainty.

Default queries use a 2,000-token target. With MCP, `contextpilot_graph` provides
bounded read-only query/path/explain operations; indexing remains an explicit CLI
action. Do not load the full bundled Graphify skill (`bundled/graphify/skill.md`)
or full graph into every prompt. The upstream skill is reference material for
explicit advanced requests, including optional semantic extraction not enabled by
ContextPilot's local wrapper.

## Context selection

For a large future context bundle, use `contextpilot_optimize` or the CLI optimizer.
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
