# Save-tokens topic review

Reviewed 2026-11-03: public READMEs of the 11 repositories listed on
https://github.com/topics/save-tokens at review time. This is a design review,
not a security audit or independent reproduction of upstream benchmarks.
No upstream code was copied and no additional dependency was installed.

| Repository | Relevant idea | SaveUsage decision |
| --- | --- | --- |
| [code-context-engine](https://github.com/elara-labs/code-context-engine) | Query-driven retrieval and explicit retrieval evaluation | Add optional BM25 context selection and a source-based retrieval evaluation |
| [mcp-sophon](https://github.com/lacausecrypto/mcp-sophon) | Deterministic compression and measured tool traffic | Keep selection deterministic and report omissions; do not rewrite source or exact errors |
| [Loop-Watchdog](https://github.com/bevinkatti/Loop-Watchdog) | Detect repeated work without progress | Add a stateless exact-repeat advisory over explicitly supplied events |
| [dsh-micro-inversion-standard](https://github.com/Shizuku-keop/dsh-micro-inversion-standard) | Small stable instructions and bounded tool output | Add scoped-search guidance; avoid host-specific interception and hidden-context edits |
| [context-io](https://github.com/bevinkatti/context-io) | Small explicit handoff frames | Document handoff essentials; leave automatic session capture outside current privacy boundaries |
| [PasteCB](https://github.com/macosfy/PasteCB) | Reduce image payload before model ingestion | Outside this code-context plugin's current scope |
| [brevity](https://github.com/nsalloums/brevity) | Compact agent communication with identifier checks | Preserve exact identifiers and decisions; avoid encoded message formats that need a dictionary |
| [codex-model-router-gpt-6-1](https://github.com/alanliuc-a11y/codex-model-router-gpt-6-1) | Match task complexity to workflow | Retain simple-task fast path; model selection remains the user's choice |
| [prefixer](https://github.com/Albisourous/prefixer) | Scope searches before widening | Add explicit scope, widen-on-miss, and no unchanged-retry guidance to plugin instructions |
| [fork-it.skill](https://github.com/GDWhisper/fork-it.skill) | Compare existing solutions before building | Record this comparison and adapt ideas without bundling unrelated products |
| [codeskope](https://github.com/RuchiPurohit/codeskope) | Source-linked graph queries and index freshness | Add conservative Git-visible content-hash snapshots, graph status and stale-query refusal; retain source verification |

Upstream savings percentages use different baselines. None are claimed as
SaveUsage results. `npm run benchmark:retrieval` measures only six explicit,
hand-authored file-retrieval queries on this project's current source. The existing
`npm run benchmark` remains a synthetic context-selection demonstration.
