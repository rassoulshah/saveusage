// Local, static, once-per-session guidance. No transcript reads or network calls.
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: 'ContextPilot: keep prose concise; preserve requirements, decisions, code, exact errors, uncertainty and test evidence. Search first and read targeted regions. Skip graph/planning tools for simple questions. Do not repeat unchanged context or checks. Use ContextPilot’s bundled Caveman skill for concise coding responses and bundled local Graphify for targeted code relationships. Runtime setup is explicit; cloud access is optional. Never change provider settings, store transcripts, or claim fixed token savings.'
  }
}) + '\n');
