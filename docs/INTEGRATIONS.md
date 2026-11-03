# Usage and integrations

SaveUsage includes Caveman 4.0.1 and Graphify 0.9.100. No separate upstream
plugin or cloud account is required. See the README for installation and setup.
Caveman instructions are read once for substantial tasks; local Graphify supplies
structural retrieval. The context selector preserves protected text.

## MCP in Codex and Claude Code

After globally installing a SaveUsage release tarball, inspect the host's MCP
list, back up host configuration, then add only if the name is absent:

```sh
codex mcp add saveusage -- saveusage mcp
claude mcp add --scope user saveusage -- saveusage mcp
```

Use an absolute installed executable path if your GUI host has a different PATH.
Do not replace existing same-name entries or change providers, models, credentials,
gateway environment, or other plugins. Native skill/plugin installation does not
require these registrations. Registering MCP exposes seven tools, which also consume
schema context; omit MCP if skill-only guidance fits your workflow.

## Optional Graphify Cloud

Local Graphify is the default. Set graphify.backend to cloud only for cloud planning.
Configure your own Graphify MCP server and account; no personal credentials or
repository configuration are shipped with SaveUsage. The code Graphify service
is https://graphify.com and its console is https://app.graphify.com.
getgraphify.com is a different product and is not this integration.

```sh
# Only if Graphify is absent from that host:
codex mcp add graphify --url https://api.graphify.com/mcp
codex mcp login graphify
claude mcp add --scope user --transport http graphify https://api.graphify.com/mcp
```

Claude has independent authentication; use its `/mcp` UI. Never copy tokens between
hosts. Standalone direct access uses an optional operator-provided
SAVEUSAGE_GRAPHIFY_TOKEN environment secret; it does not import host tokens.

```sh
saveusage graphify-status --host codex
saveusage graphify-status --host codex --tool graph_stats
```

The native adapter uses the installed `codex app-server` experimental JSON-RPC
inventory and tool-call APIs, verified with Codex 0.154.0. No model turn runs;
no OAuth store is read or copied. Calls use an ephemeral runtime handle. Older
unsupported versions fail rather than changing settings or provider configuration.
The native `graphify` registration may differ from the direct YAML endpoint.

MCP status/call tools accept `host: "codex"`. Request `tool` in status to inspect
one real input schema. Native status checks whether the checkout is listed in the
active workspace; it does not infer index freshness from successful authentication.
Validate the indexed commit and any dirty working tree before relying on results.
Do not substitute another repository's graph. Missing/stale indexes fall back to
relevant local source. Index private repositories only with authorization.

Both native and direct calls require readOnlyHint=true. Some live Graphify search,
query, recall and trace tools record intent in remote memory and are refused.
Read-only symbols, callers/callees and paths remain available where advertised.
Upstream call edges describe static indexed coverage, not runtime execution proof.

## Caveman

The original balanced skill and official CLI distribution are bundled. The host
reads the skill when needed; it is not injected in full on every MCP call.
`saveusage caveman --help`, `--version`, and `tools` expose the CLI safely.
Native caveman-engine binaries are not included; proxy, login, routing and hook
installation commands are not exposed. No native-engine compression is claimed.
An existing native Caveman skill can take precedence over the bundled fallback.

## Local Graphify

Run `saveusage setup` once, then `saveusage graph index .` in your project.
Use `graph query "symbols"`, `graph path "from" "to"`, or `graph explain "symbol"`.
The index uses AST extraction with code-only/no-cluster options and no model calls.
The MCP server must run with the indexed repository as its working directory.
`saveusage_graph` offers query/path/explain with measured output bounds; setup
and indexing stay explicit CLI operations. Refresh stale indexes after changes.
If setup is unavailable, targeted source reads remain available.

## ChatGPT

ChatGPT can invoke SaveUsage's MCP tools where its account supports them. See
DEPLOYMENT.md for the optional remote transport. The package does not intercept
all chats, install a browser extension, or rewrite a hidden context window.
