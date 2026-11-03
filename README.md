# SaveUsage

**Free context optimization with bundled Caveman and local Graphify.**

SaveUsage helps agents read less irrelevant material, avoid repeated output,
and keep important information intact. It includes a portable skill for Codex and
Claude Code, a native Claude plugin, a local CLI, and an optional MCP server.
No account, API key, paid service, inference proxy, or conversation storage is
required. Your existing provider, model, gateway and other plugins stay yours.

## What it does

- Guides agents to search first, read targeted regions, and skip expensive tooling
  for simple questions.
- Selects whole context blocks within a token budget, removes exact duplicates,
  and prioritizes material you label relevant.
- Keeps marked requirements, decisions, constraints, errors, code and test evidence
  verbatim. If those exceed the budget, it reports overflow instead of deleting them.
- Reports before/after counts using `cl100k_base`, with no model calls or uploads.
- Includes Caveman 4.0.1 concise-response skill/CLI and Graphify 0.9.100 local code graph engine.

This is context selection and concise workflow guidance. It cannot rewrite a
model's hidden context window, intercept every ChatGPT message, or guarantee lower
bills. Tokenizers differ. Smaller selected input is measurable; task quality and
end-to-end savings need real workload evaluation.

## Claude Code plugin

Run inside Claude Code:

```text
/plugin marketplace add rassoulshah/saveusage
/plugin install saveusage@saveusage-plugins
```

Restart Claude Code. `/saveusage:saveusage` invokes the skill explicitly.
The plugin supplies short once-per-session guidance through a native SessionStart
hook. It does not install an MCP server or change providers, credentials or other
plugins. Claude controls automatic skill selection.

## Codex or standalone skill

From the source checkout:

```sh
git clone https://github.com/rassoulshah/saveusage.git
cd saveusage
npm ci --ignore-scripts
npm run build
node dist/cli.js install codex --dry-run
node dist/cli.js install codex
```

Use `install claude` for a Claude skill without plugin hooks. Add `--project` to
install only in the current project. Existing different skills are left unchanged.
Restart the host to discover the skill. No host configuration files are edited.

Install the locally prepared SaveUsage release:

```sh
npm install -g ./release/rassoulshah-saveusage-0.4.0.tgz
saveusage setup codex
```

You can also install a downloaded file with `npm install -g /path/to/package.tgz`.
The intended npm package name is `@rassoulshah/saveusage`; do not assume it exists
in the registry until an npm release is announced.

## One-command saving workflow

In Claude Code, run `/saveusage:save <task>` to apply concise responses, scoped
reads, graph retrieval, context minimization, and repetition checks where useful.
Ask it to save a handoff when you want local persistence.

For a prepared context bundle, run:

```sh
saveusage save examples/context.json
saveusage save context.json --store handoff.json
saveusage save context.json --no-graph
```

`save` combines exact deduplication, whole-block token budgeting, optional BM25
`query` ranking, fresh local graph retrieval when a query is supplied, and watchdog
checks when the JSON contains `events`. It uses the optimizer input format below;
optional events use the watchdog format. Output is compact JSON with minimized
`text`, measured counts, omissions, graph status and repetition advice. A missing,
stale or unavailable graph is reported with a fallback; setup/indexing is explicit.
Existing disabled graph settings are respected. No cloud calls or downloads occur.

`--store` explicitly saves that result to a new file with owner-only permissions;
it refuses to overwrite an existing path. Without it, no context is stored. On
resumption, load the saved text and verify source freshness before reusing evidence.
Keep handoffs outside version control if they contain private project material.
This composes the available local features; it does not enable unbundled native
compression engines or rewrite the host's hidden context. Adjust `budget` to the
smallest useful value; protected blocks survive even if they overflow it.

## Local context selection

```sh
node dist/cli.js optimize examples/context.json
```

Input format:

```json
{
  "budget": 2000,
  "entries": [
    { "id": "requirement", "kind": "requirement", "text": "Preserve the API format." },
    { "id": "error", "kind": "error", "text": "TypeError: user is undefined" },
    { "id": "relevant", "priority": 100, "text": "Relevant source excerpt or notes." },
    { "id": "optional", "priority": 0, "text": "Unrelated historical discussion." }
  ]
}
```

`required: true` also protects a block. Default `kind` is `context`, and priority
ranges from 0 to 100. Protected kinds are requirement, decision, constraint, error,
code and test. Text is never summarized or rewritten. Identical text is kept once,
with duplicate ids reported. Different blocks keep their original relative order.
Results list omitted ids, reasons, token counts and any protected-context overflow.
Relevance comes from the supplied priorities; it is not inferred by another model.

Optimize a bundle **before** giving it to an agent. Sending text the model already
saw through another tool adds input overhead and cannot erase prior token costs.

## Optional MCP

Run `node dist/cli.js mcp`, or `saveusage mcp` after installing a tarball.
Register that command with your MCP host if you want these tools:

| Tool | Purpose |
| --- | --- |
| `saveusage_optimize` | Local whole-block selection, optional BM25 query ranking, and measured token counts |
| `saveusage_watchdog` | Stateless advisory for explicitly supplied repeated tool events |
| `saveusage_context` | Task classification and bounded retrieval guidance |
| `saveusage_plan` | Explicit retrieval plan |
| `saveusage_policy` | Current boundaries |
| `saveusage_graph` | Bundled local read-only query/path/explain |
| `saveusage_graphify_status` | Optional live Graphify discovery |
| `saveusage_graphify_call` | Optional bounded, read-only Graphify calls |

MCP registration is optional; the native skill/plugin works independently. For
ChatGPT, availability depends on the account's MCP support and remote deployment;
it is not a universal ChatGPT plugin. See [deployment limitations](docs/DEPLOYMENT.md).

## Using the included plugins

No separate Caveman or Graphify plugin installation is required. Node >=22.13
is required; Graphify setup also needs Python >=3.10 (uv preferred, otherwise
venv/pip). Initial setup downloads parser dependencies into an isolated environment.
After installing the release:

```sh
saveusage setup codex
# From the code repository you want to explore:
saveusage graph index .
saveusage graph query "authentication middleware"
saveusage graph path "sourceSymbol" "targetSymbol"
saveusage graph explain "symbolName"
saveusage bundled
saveusage caveman --help
```

Use `setup claude` for a standalone Claude skill, or `setup` to initialize only
the Graphify runtime. Claude marketplace users can ask the agent to run the
bundled `runtime/bundle.mjs setup` helper; npm/build is unnecessary for that path.
Indexing is code-only, local, and makes no model calls. It writes `saveusage`.
Reindex after relevant code changes. Caveman's balanced skill guides concise
responses; its CLI distribution is included, but native compression-engine
binaries, inference proxy and login/routing installers are not enabled or bundled.
This is not every upstream feature in a single executable.

Fresh configurations enable both integrations with local Graphify. Existing YAML
settings are preserved, including explicit disabled settings. Existing different
installed skills are refused: back up your old SaveUsage skill directory and
remove that directory before installing the new version. Never remove other skills.
Graphify Cloud is optional and has separate account requirements and pricing.
See the [usage and integration guide](docs/INTEGRATIONS.md).

## Verify and contribute

```sh
npm test
npm run benchmark
npm pack --dry-run
```

The benchmark is a synthetic demonstration of duplicate/noise removal, not a
coding-agent billing or quality benchmark. Do not advertise its percentage as
expected savings. Bugs, tests and real workload evaluations are welcome.

[Core MIT license](LICENSE) · [Bundled Apache-2.0 notices](THIRD_PARTY_NOTICES.md) · [Publishing guide](docs/PUBLISHING.md)

## Query-aware selection and repetition checks

Add `"query": "refreshToken authentication"` to optimizer JSON to rank optional
blocks by lexical BM25 relevance. Matching blocks compete by score, then priority,
within the budget. Unmatched optional blocks are omitted with `no-query-match`.
Protected blocks remain verbatim even without a match or within budget overflow.
Results include matched terms, scores and selection reasons. Without a query,
priority selection is unchanged. This is lexical retrieval, not semantic inference;
check source before concluding that a no-match result means no relevant code.

```sh
saveusage optimize context.json
saveusage watchdog events.json
npm run benchmark:retrieval
```

Watchdog input contains an `events` array of `{operation, input, output}` strings
and an optional `threshold` (default 3). `progress: true` clears prior repetition
counts. It detects exact repeats, returns indices, and provides advice. It neither
reads transcripts nor stops processes. Legitimate polling may trigger it. The
portable skill includes a Node-only `runtime/watchdog.mjs` helper, so marketplace
users can run it without building the npm CLI.

See the [repository review](docs/TOPIC-REVIEW.md) for sources, adopted ideas and
benchmark limitations. These changes are available from this source checkout;
version 0.4.0 is packaged locally until published to the new SaveUsage repository.

## Graph freshness (0.4.0)

```sh
saveusage graph index .
saveusage graph status
saveusage graph query "authentication middleware"
```

Indexing records a content-hash snapshot of Git-visible files and the graph.
Source edits, additions, deletions or graph changes mark it stale; graph queries,
paths and explanations then require explicit reindexing. Status runs without a
Python runtime. MCP's `saveusage_graph` also accepts `operation: "status"` and
returns freshness alongside query results.

This is conservative change detection, not AST coverage: documentation changes
may invalidate the snapshot too. Ignored files and symlink target contents are outside the snapshot. Non-Git
repositories, legacy graphs, inputs above 10,000 files or 64 MB, or source changes
during indexing yield unknown freshness. Verify source references in every case.
Snapshots store hashes and counts, never source text or conversation history.

## SaveUsage naming and data paths

The project, CLI, portable skill, plugin marketplace and MCP tools now use
`saveusage`. The package is `@rassoulshah/saveusage` and the repository is
`git@github.com:rassoulshah/saveusage.git`.

- Repository graph and cache: `<repository>/saveusage/`.
- Local runtime: `$XDG_DATA_HOME/saveusage/` (default `~/.local/share/saveusage/`).
- Settings: `~/.config/saveusage/config.yaml`.
- HTTP MCP settings: `SAVEUSAGE_MCP_TOKEN` and `SAVEUSAGE_BIND`.

Existing registrations using the previous name need to be updated to the new CLI
and `saveusage_*` MCP tools, then the host restarted. Previous installations are
preserved. To retain prior settings, copy the reviewed config into the new path.
Bundled Graphify and Caveman retain their upstream names, licenses and hashes.
