# Security

The initial release is deliberately non-invasive:
- Writes only `~/.config/contextpilot/config.yaml`.
- Does not edit `~/.codex/config.toml`, `~/.claude/settings.json`, shell startup files, environment variables, or provider settings.
- Does not store conversation transcripts, API keys, or OAuth credentials.
- Local MCP uses stdio and does not expose an HTTP listener.
- Third-party hooks and skills must be reviewed before installation.
- Never place NSEC tokens or private credentials in ContextPilot config or logs.

ChatGPT integration cannot globally intercept all chats; availability and invocation are controlled by the host application.
