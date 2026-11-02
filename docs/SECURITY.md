# Security

The local optimizer never sends data to a service, invokes inference, writes
memory, or stores transcripts. It only selects whole user-provided blocks and
removes exact duplicates. It does not identify secrets or guarantee correctness of
optional relevance labels; protect important input explicitly.

CLI skill installation writes one new skill file to the chosen user/project
location. It is idempotent for identical content and refuses different existing
content. No host settings, providers, models, credentials, or plugins are rewritten.
Claude plugin installation/removal is managed by Claude's own plugin mechanism.

Graphify and Caveman are optional. Never ship or log personal credentials. Graphify
requires HTTPS except loopback; endpoint credentials/query/fragment are rejected.
Only advertised read-only calls are allowed. Connection errors are sanitized and
graph content is untrusted data. Private source uploads require authorization.
The native Codex bridge keeps authentication in Codex and runs no model turns.

Remote HTTP requires a bearer secret of at least 32 bytes, defaults to loopback,
and rejects browser Origins. Deploy single-tenant behind HTTPS with body/rate limits,
no authorization/body logging, and a restricted repository/skill mount. Do not mount
an entire home directory or expose host-owned integrations to untrusted clients.
ChatGPT transport/authentication compatibility remains account-dependent.
