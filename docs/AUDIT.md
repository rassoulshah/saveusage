# Release validation

The public 0.3 implementation extends the original scaffold. The current local
suite passes 17 tests, covering context protection/overflow, exact deduplication,
portable installation with settings preservation, MCP stdio/HTTP, optional native
Codex RPC and authentication fallbacks. npm audit reports zero vulnerabilities.
Claude plugin and marketplace manifests pass the installed validator.

A synthetic benchmark removes duplicate and explicitly low-priority material.
It is not evidence of a percentage reduction in real coding sessions, task quality,
or provider bills. The test fixture and command are public and reproducible.

Optional authenticated Graphify discovery and a caller lookup have been exercised
against the repository's initial commit. Local development changes are not covered
by that index. No public user needs this account or index to use the local plugin.

A cross-platform CI workflow template is included in docs/ci-workflow.yml.
It is not enabled by this release; no remote runner results are claimed.
No npm registry publication or real ChatGPT remote connection is implied by these
local checks. Release tarball installation is checked before distribution.

The bundled Graphify runtime was exercised on a temporary JavaScript project:
indexing produced three nodes and three edges, and query/path/explain resolved an
actual greet-to-format call. All 56 vendored file hashes passed verification.
The real-runtime test skips on systems where explicit setup has not been run.
Caveman help and bundled skill availability work without an external installation.

A clean temporary home installed the 0.3 tarball and initialized a separate Python
environment. The installed skill helper queried its local graph successfully.
The stdio MCP local graph tool returned a genuine call path and explicitly rejected
a one-token output budget. Production npm audit found zero vulnerabilities.
