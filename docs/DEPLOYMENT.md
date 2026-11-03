# Remote MCP for ChatGPT

The stdio server remains the default. `node dist/http-server.js` starts stateless
Streamable HTTP at `/mcp`, bound to `127.0.0.1:8787` by default. It refuses startup
without `SAVEUSAGE_MCP_TOKEN` containing at least 32 bytes. Supply a random secret
through the deployment secret store, never a repository file or command argument.
Use `PORT` and `SAVEUSAGE_BIND` for your environment.

Run behind a trusted HTTPS reverse proxy. For containers set the bind address to
`0.0.0.0` and publish only on the proxy's private network. Add proxy body limits,
request-rate limits and access restrictions. Never log Authorization headers or
request bodies. Do not expose an unauthenticated port. The server denies browser
Origin headers; MCP clients using browser-origin requests need a separately
reviewed explicit origin allowlist rather than blanket CORS.

This endpoint uses static bearer authentication, not OAuth discovery. Connect it
only if the ChatGPT account's supported developer/MCP connection flow accepts that
transport and authentication method. If the host requires OAuth, deploy a trusted
OAuth gateway first; native ChatGPT OAuth compatibility is not implemented or
verified here. There is no universal connection recipe across accounts/plans.

Configure the HTTPS `/mcp` URL in the supported connector UI and keep the bearer
secret in its authentication fields. Verify tool listing, policy, simple task
skipping and an architecture task in the actual account before declaring support.
MCP cannot intercept or rewrite every conversation; the host controls invocation.

Deployment is single-tenant: tools expose the deployment's repository identity and
installed Caveman instructions. Mount only the intended repository and skill files,
never an entire home directory or host credentials. Remote repository identity is
that deployment's checkout, not the user's computer. Graphify OAuth remains in the
agent host; a service token, if provisioned, uses SAVEUSAGE_GRAPHIFY_TOKEN.
No remote service has been deployed by this change.
