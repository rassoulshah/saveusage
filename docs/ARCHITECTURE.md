# Architecture

ContextPilot coordinates existing agent integrations; it is not an inference proxy.

## Data flow

Agent host -> ContextPilot policy tool -> task-aware retrieval plan -> host-native Graphify and Caveman integrations -> agent.

## Boundaries
- ContextPilot config is local and contains no secrets.
- Graphify OAuth is managed by the MCP host and Graphify.
- Caveman remains a native third-party skill/CLI.
- Existing NSEC provider and model settings are outside ContextPilot's write scope.
- ChatGPT invocation and availability are host-controlled.

## Next milestones
1. Version-aware Codex and Claude Code hooks.
2. Structured TOML/JSON config patching with diff preview, backup, and rollback.
3. Host-provided token usage measurement without transcript collection.
4. Authenticated remote MCP deployment option for ChatGPT.
5. End-to-end integration and regression tests.
