# Architecture

ContextPilot is a free local plugin/skill plus an optional CLI/MCP service.

## Local core

The native skill guides targeted reads and concise output. Claude's SessionStart
hook adds short guidance once per session, with no dependencies beyond Node and no
transcript reads or network. Codex uses a user/project skill installed explicitly.
Native host skill selection is host-controlled, not an every-message guarantee.

`optimizeContext` takes whole blocks with protection labels and priorities. It
merges exact duplicate text, always retains protected blocks, and greedily fits
optional blocks in relevance order. Output preserves original order and block
contents; overflow is explicit. It never edits input files or calls a model.
Counts use the bundled cl100k_base tokenizer and include separators. They measure
the supplied plain text, not tools, prompts, billed usage or model reasoning.

The context planner uses a small bilingual keyword heuristic. Bundled integrations
are enabled with a local Graphify backend in fresh defaults. Existing explicit YAML settings are retained.
Caveman paths are returned without repeatedly injecting its entire skill.

## Optional adapters

MCP exposes seven tools via stdio or authenticated single-tenant HTTP. HTTP requires
separate TLS deployment; actual ChatGPT compatibility is account-dependent.
Graphify direct access uses real MCP initialize/list/call with bounded timeouts.
The Codex-native bridge uses experimental app-server RPC and host-owned OAuth,
without credential imports or inference. Only advertised read-only tools are
allowed. Index identity/revision must be checked separately from authentication.
Graph results are untrusted data; targeted local reads are the fallback.
Graph output has a conservative UTF-8 byte bound, not a tokenizer guarantee.

No inference proxy, transcript persistence, analytics, subscription validation,
provider replacement or automatic host configuration edits exist in the core.

## Bundled runtimes

The skill tree includes pinned, unmodified upstream Caveman CLI/skill and Graphify
wheel/reference files. manifest.json records sources, versions and file SHA256s.
The standalone Node runtime helper verifies the wheel and explicitly creates an
owned Python environment. Dependencies use upstream ranges and binary wheels;
transitive Python packages are not fully locked. No existing environment is replaced.
Graph indexing is local code-only AST extraction. Local MCP graph output is checked
with cl100k_base and returns overflow explicitly. Caveman child telemetry is disabled;
only help/version/tools are exposed. Native engine binaries are not included.
