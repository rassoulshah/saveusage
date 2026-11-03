# SaveUsage 0.4.0

Release prepared 2026-11-03. This document describes the local release package;
public GitHub/npm publication is separate.

## Added

- Rename to SaveUsage: package `@rassoulshah/saveusage`, CLI `saveusage`,
  MCP tools `saveusage_*`, plugin `saveusage@saveusage-plugins`, and graph data
  in `<repository>/saveusage/`. Existing host registrations require updating.

- Optional query-aware BM25 ranking for context bundles, with Unicode and code
  identifier tokenization, matched terms, scores and omission reasons.
- Exact-repeat watchdog for explicitly supplied tool events through MCP, CLI,
  and a portable Node helper. Progress markers reset the detection window.
- Git-visible graph snapshots, read-only freshness status, and refusal to query
  a known stale graph until explicit reindexing.
- Scoped-search, changed-hypothesis retry and explicit handoff guidance.
- A documented comparison of the 11 save-tokens topic repositories and a small
  reproducible source-retrieval evaluation.

## Compatibility

Existing optimizer requests without `query` keep priority-based behavior.
Protected requirements, decisions, constraints, errors, code and test evidence
remain verbatim, including when they exceed the budget. The graph status operation
needs no Python runtime. Existing graphs without snapshots report unknown freshness;
reindex to establish a snapshot. Ignored files and symlink target contents are
outside freshness coverage. No new runtime dependency, account, model call,
provider changes, transcript capture or automatic memory writes were added.

## Validation

- 24 tests pass, including real local Graphify, stale-query refusal, stdio MCP,
  authenticated HTTP MCP, multilingual preservation and standalone watchdog.
- All 56 pinned upstream asset hashes verify.
- Six hand-authored project-source retrieval queries found their expected file
  in the top three. This is a narrow retrieval check, not an agent-quality or
  provider-billing benchmark.
- Tarball installation is checked in an isolated temporary npm project, including
  CLI version, graph status, optimizer, watchdog and portable skill installation.

## Install the local package

```sh
npm install -g /absolute/path/to/rassoulshah-saveusage-0.4.0.tgz
saveusage --version
```

Existing differing skill directories are deliberately preserved by the installer.
Review and back up that specific SaveUsage directory before replacing it;
leave unrelated skills and host settings intact. Restart the host after updating
its installed plugin/skill. Source-checkout changes do not update a running plugin.
