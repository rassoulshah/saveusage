# Optional integrations

The public ContextPilot skill/plugin works with no Graphify, Caveman, MCP server,
or account. Use the README installation first. These are optional extensions.

## MCP in Codex and Claude Code

After globally installing a ContextPilot release tarball, inspect the host's MCP
list, back up host configuration, then add only if the name is absent:

```sh
codex mcp add contextpilot -- contextpilot mcp
claude mcp add --scope user contextpilot -- contextpilot mcp
```

Use an absolute installed executable path if your GUI host has a different PATH.
Do not replace existing same-name entries or change providers, models, credentials,
gateway environment, or other plugins. Native skill/plugin installation does not
require these registrations. Registering MCP exposes six tools, which also consume
schema context; omit MCP if skill-only guidance fits your workflow.

## Graphify

Enable graphify in ContextPilot's YAML only if you want graph-aware planning.
Configure your own Graphify MCP server and account; no personal credentials or
repository configuration are shipped with ContextPilot. The code Graphify service
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
CONTEXTPILOT_GRAPHIFY_TOKEN environment secret; it does not import host tokens.

```sh
contextpilot graphify-status --host codex
contextpilot graphify-status --host codex --tool graph_stats
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

Caveman is separately installed upstream software; it is not bundled. Enable it
in YAML only if desired. ContextPilot returns the installed skill's path, not its
entire instructions on each call. The host reads the skill when needed. Core
concise-output guidance works without it. Never invent a compression API or rewrite
memory files automatically; follow upstream workflows and explicit user intent.

## ChatGPT

ChatGPT can invoke ContextPilot's MCP tools where its account supports them. See
DEPLOYMENT.md for the optional remote transport. The package does not intercept
all chats, install a browser extension, or rewrite a hidden context window.
