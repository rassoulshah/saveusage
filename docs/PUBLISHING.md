# Publishing SaveUsage for free

Original SaveUsage code is MIT-licensed; bundled upstream files are Apache-2.0.
Retain THIRD_PARTY_NOTICES.md and all upstream licenses. There is no license server, paid SaveUsage tier,
subscription, required API key, telemetry, or bundled inference service. Optional
third-party services have their own terms and pricing.

## GitHub distribution

Publish the source revision containing `.claude-plugin/marketplace.json` and
`.claude-plugin/plugin.json` to the public repository. Claude users can then use
`/plugin marketplace add rassoulshah/saveusage` and
`/plugin install saveusage@saveusage-plugins`.

Build and attach the output of `npm pack` to a tagged GitHub release. Users can
install that tarball with npm without an npm publishing account. Codex users then
run `saveusage install codex`. Claude skill-only installation is also supported.
All paths derive from the package location and the user's home/project directory.
No developer home directory or personal account credentials are required.

## Optional npm distribution

The intended public name is `@rassoulshah/saveusage`. Registry availability is
not proof of ownership. Authenticate as the owning npm account and enable the
required publishing security/2FA. Then:

```sh
npm ci --ignore-scripts
npm test
npm run verify:vendor
npm run benchmark
npm run benchmark:retrieval
npm pack --dry-run
npm publish --access public
```

Do not publish until the tarball contents and checks are reviewed. This repository
has no npm authentication configured. Never put npm tokens in source or docs.
Users can run `npm install -g @rassoulshah/saveusage` only after that release.

## Release checks

- Native Claude plugin validates and its hook emits valid SessionStart JSON.
- Fresh-home installation works, is idempotent, and refuses different existing skills.
- Tests cover protected-block preservation, budget overflow, exact deduplication,
  local MCP, bundled Graphify indexing/query/path, optional native Graphify, and HTTP authentication.
- npm tarball includes runtime output, license, skill and manifests, with no local
  audit snapshots, secrets, node_modules, or developer filesystem paths.
- Verify packed-package installation in a clean temporary directory.
- Report local measurements honestly. No fixed token-reduction percentage or
  unsupported claims about automatic ChatGPT interception.

## Removal

Claude plugin users: `/plugin uninstall saveusage@saveusage-plugins`.
Skill-only users can remove only the SaveUsage skill directory reported by the installer.
If installed globally with npm, use `npm uninstall -g @rassoulshah/saveusage`.
Remove a manually registered SaveUsage MCP server separately through its host.
No provider, model, gateway, or unrelated plugin settings need restoration.

A CI template is provided in docs/ci-workflow.yml. Enable it under
.github/workflows when your publishing credentials have workflow permission.

Vendor updates require a new pinned source/version, manifest file hashes, notices
and fresh runtime/package verification. Never silently replace upstream assets.

## Version 0.4.0

Release artifacts are prepared locally under `release/`. A local package is not
a published GitHub or npm release. Use local installation instructions until the new SaveUsage artifact is uploaded
and its live release URL is verified.
