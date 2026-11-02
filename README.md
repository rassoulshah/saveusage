# ContextPilot

**Free context optimization with bundled Caveman and local Graphify.**

ContextPilot helps agents read less irrelevant material, avoid repeated output,
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
/plugin marketplace add rassoulshah/contextpilot
/plugin install contextpilot@contextpilot-plugins
```

Restart Claude Code. `/contextpilot:contextpilot` invokes the skill explicitly.
The plugin supplies short once-per-session guidance through a native SessionStart
hook. It does not install an MCP server or change providers, credentials or other
plugins. Claude controls automatic skill selection.

## Codex or standalone skill

From the source checkout:

```sh
git clone https://github.com/rassoulshah/contextpilot.git
cd contextpilot
npm ci --ignore-scripts
npm run build
node dist/cli.js install codex --dry-run
node dist/cli.js install codex
```

Use `install claude` for a Claude skill without plugin hooks. Add `--project` to
install only in the current project. Existing different skills are left unchanged.
Restart the host to discover the skill. No host configuration files are edited.

Install the public GitHub release without an npm account:

```sh
npm install -g https://github.com/rassoulshah/contextpilot/releases/download/v0.3.0/rassoulshah-contextpilot-0.3.0.tgz
contextpilot setup codex
```

You can also install a downloaded file with `npm install -g /path/to/package.tgz`.
The intended npm package name is `@rassoulshah/contextpilot`; do not assume it exists
in the registry until an npm release is announced.

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

Run `node dist/cli.js mcp`, or `contextpilot mcp` after installing a tarball.
Register that command with your MCP host if you want these tools:

| Tool | Purpose |
| --- | --- |
| `contextpilot_optimize` | Local whole-block selection and measured token counts |
| `contextpilot_context` | Task classification and bounded retrieval guidance |
| `contextpilot_plan` | Explicit retrieval plan |
| `contextpilot_policy` | Current boundaries |
| `contextpilot_graph` | Bundled local read-only query/path/explain |
| `contextpilot_graphify_status` | Optional live Graphify discovery |
| `contextpilot_graphify_call` | Optional bounded, read-only Graphify calls |

MCP registration is optional; the native skill/plugin works independently. For
ChatGPT, availability depends on the account's MCP support and remote deployment;
it is not a universal ChatGPT plugin. See [deployment limitations](docs/DEPLOYMENT.md).

## Using the included plugins

No separate Caveman or Graphify plugin installation is required. Node >=22.13
is required; Graphify setup also needs Python >=3.10 (uv preferred, otherwise
venv/pip). Initial setup downloads parser dependencies into an isolated environment.
After installing the release:

```sh
contextpilot setup codex
# From the code repository you want to explore:
contextpilot graph index .
contextpilot graph query "authentication middleware"
contextpilot graph path "sourceSymbol" "targetSymbol"
contextpilot graph explain "symbolName"
contextpilot bundled
contextpilot caveman --help
```

Use `setup claude` for a standalone Claude skill, or `setup` to initialize only
the Graphify runtime. Claude marketplace users can ask the agent to run the
bundled `runtime/bundle.mjs setup` helper; npm/build is unnecessary for that path.
Indexing is code-only, local, and makes no model calls. It writes `graphify-out`.
Reindex after relevant code changes. Caveman's balanced skill guides concise
responses; its CLI distribution is included, but native compression-engine
binaries, inference proxy and login/routing installers are not enabled or bundled.
This is not every upstream feature in a single executable.

Fresh configurations enable both integrations with local Graphify. Existing YAML
settings are preserved, including explicit disabled settings. Existing different
installed skills are refused: back up your old ContextPilot skill directory and
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
