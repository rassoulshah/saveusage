# Changelog

## 0.4.0 - 2026-11-03

- Rename the project, package, CLI, plugin, MCP tools and configuration to SaveUsage.
- Store graph/cache data in `saveusage/` and local runtime data under the SaveUsage name.

- Detect stale Git-visible graph snapshots, expose graph status, and refuse stale queries until reindexing.
- Add optional query-aware BM25 context selection with matched-term and omission explanations.
- Add a stateless exact-repeat watchdog through MCP, CLI, and the portable skill runtime.
- Teach scoped searches, changed-hypothesis retries, and concise explicit handoffs.
- Add a source-based retrieval evaluation and public save-tokens topic design review.
- Preserve existing priority selection when no query is supplied and all protected-text guarantees.

## 0.3.0

- Bundle official Caveman 4.0.1 skill/CLI and Graphify 0.9.100 wheel/references.
- Preserve upstream Apache-2.0 notices and verify pinned asset hashes.
- Add explicit isolated Python setup and local code-only graph index/query/path/explain.
- Add bounded read-only local graph MCP tool, enabled local defaults, and complete skill-tree installation.
- Keep Caveman native engine binaries and inference proxy outside this release.

## 0.2.0

- Public MIT-licensed Claude Code plugin and marketplace; portable Codex/Claude skill installer.
- Local whole-block context selection, exact deduplication, priority budgeting and cl100k_base token counts.
- Verbatim protection for requirements, decisions, constraints, errors, code and test evidence; explicit budget overflow.
- Standalone CLI and optional six-tool MCP service.
- Optional Graphify and Caveman adapters; no account or API key needed for local operation.
- Package installation, transport, settings preservation and optimizer regression tests; reproducible synthetic benchmark.

Measured text reduction is not a guarantee of task quality, provider billing savings,
or interception of hidden model context. No fixed savings percentage is claimed.
