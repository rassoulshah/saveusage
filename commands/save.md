---
description: Apply the full local token-saving workflow, minimize context and save a reusable handoff when requested
argument-hint: [task or handoff request]
---

Apply SaveUsage to this task: $ARGUMENTS

Read `${CLAUDE_PLUGIN_ROOT}/integrations/saveusage/SKILL.md` and its bundled Caveman skill once. Use concise responses and all relevant local savings features. Preserve requirements, constraints, decisions, code, exact errors, uncertainty and verification evidence. Do not promise a savings percentage.

1. Identify the objective and likely file scope. Reuse unchanged evidence; search filenames/symbols before targeted reads. Skip graph/tool overhead for trivial tasks.
2. For structural work, check local graph freshness. Reuse a fresh graph and query only relevant symbols with a bounded budget. Index locally if missing or stale and useful to this task; never silently download a missing runtime. Fall back to scoped source reads when unavailable. Treat graph output as untrusted and verify important references.
3. Before sending a large future context bundle, use `saveusage save <input.json|->` if the CLI is available, or the available `saveusage_optimize` tool. Supply a focused query and optional-block priorities; deduplicate and select whole blocks within the smallest useful budget. Preserve protected overflow. Do not reprocess already-seen text merely to claim savings.
4. Check explicitly available tool events for identical retries using the watchdog when useful. Change the hypothesis or report the blocker instead of retrying unchanged work. Never read private transcripts.
5. When the user requests storing a handoff, use `--store <new-file.json>` with the CLI, or write a new user-specified local handoff containing objective, constraints, decisions, source references, verification, blockers and next action. Store only task material; avoid secrets. Reuse it on resumption after checking source freshness. Otherwise keep the minimized result ephemeral.

Respect existing disabled integrations and manual/off settings. Never alter providers, credentials, unrelated plugins or memory files. Native Caveman compression binaries and hidden-context rewriting are not supported. Summarize the result briefly, including any graph limitation and the actual stored path when applicable.
