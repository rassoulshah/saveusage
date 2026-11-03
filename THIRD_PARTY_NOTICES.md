# Bundled upstream components

SaveUsage's own code is MIT-licensed. Bundled upstream components retain their
original licenses, copyright and notices. The combined distribution's SPDX
expression is **MIT AND Apache-2.0**. Neither upstream project endorses this bundle.

## Caveman 4.0.1 — Julius Brussee

Source: https://github.com/JuliusBrussee/caveman

Pinned source commit: d0be14f2dc92a99d12e717465d6908723ab9bfdb.
The original balanced Caveman skill is included unchanged as
`integrations/saveusage/bundled/caveman/skill.md` (filename relocated).
The official @caveman-ai/cli 4.0.1 npm distribution is copied unchanged under
`integrations/saveusage/bundled/caveman/cli/`.

Apache-2.0 license and original NOTICE/LICENSE-MIT are preserved. The CLI's
additional upstream NOTICE includes embedded MIT dependencies and their terms.
No Caveman native engine binaries, fonts, inference proxy service, account or
subscription are supplied by SaveUsage. SaveUsage does not activate proxy,
routing/login/installer features. Its wrapper disables Caveman telemetry and uses
SaveUsage-owned state only for the child command; user settings stay unchanged.

## Graphify 0.9.100 — Graphify Labs contributors

Source: https://github.com/Graphify-Labs/graphify

Pinned source commit: cb103fb4356d0a9deaaf61dfc4530e4106a8c0a9.
The official graphifyy 0.9.100 Python wheel is bundled unchanged under
`integrations/saveusage/bundled/graphify/`. Its Apache-2.0 LICENSE and NOTICE
are copied alongside it. The original skill and Claude references are extracted
unchanged for reference; only their placement/skill filename differs.

Setup installs this wheel in an isolated environment and resolves its parser
runtime dependencies from the configured Python package index. Those dependencies
retain their own licenses and are not embedded in the npm tarball. Runtime setup
needs Python >=3.10 and network access for dependencies; later code-only indexing
and graph queries run locally. Graphify Cloud is a separate optional service and
is not bundled or made free by this redistribution.

## Integrity and integration changes

`integrations/saveusage/bundled/manifest.json` records pinned distribution
URLs, upstream commits, npm integrity, wheel SHA-256 and every vendored file's
SHA-256. Run `npm run verify:vendor` before packaging. The original upstream code
is unmodified; SaveUsage adds its own installer, Node adapter, bounded MCP
wrapper, provenance records and documentation outside those upstream files.
Updating a pinned version requires rechecking licenses, integrity and local
end-to-end behavior. No floating update or automatic upstream reinstall occurs.
