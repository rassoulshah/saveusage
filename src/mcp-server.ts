#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pathToFileURL } from "node:url";
import { codexGraphifyStatus, withCodexHost } from "./codex-host.js";
import { repositoryIdentity } from "./graphify.js";
import { prepareContext } from "./context.js";
import { graphifyStatus, graphifyCall, graphifyFailure } from "./graphify.js";
import { z } from "zod";
import { graphCommand } from "../integrations/contextpilot/runtime/bundle.mjs";
import { ContextEntrySchema, optimizeContext, countTokens } from "./optimizer.js";
import { loadConfig } from "./config.js";
import { createRetrievalPlan, formatPlan, type TaskKind } from "./policy.js";

export function createServer() {
const server = new McpServer({ name: "contextpilot", version: "0.3.0" });

server.tool(
  "contextpilot_plan",
  "Create a conservative context retrieval plan. Does not access conversation history.",
  {
    task: z.enum([
      "simple",
      "codebase-question",
      "implementation",
      "debugging",
      "review"
    ])
  },
  async ({ task }) => ({
    content: [
      {
        type: "text",
        text: formatPlan(createRetrievalPlan(loadConfig(), task as TaskKind))
      }
    ]
  })
);

server.tool(
  "contextpilot_policy",
  "Return active optimization policy and safety boundaries.",
  {},
  async () => {
    const config = loadConfig();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              mode: config.optimization.mode,
              automation: config.optimization.automation,
              preserve: [
                "requirements",
                "exact errors",
                "security constraints",
                "uncertainty",
                "test evidence"
              ],
              providerChangesAllowed: false,
              conversationStorage: config.privacy.store_conversation_content,
              graphifyEndpoint: config.graphify.enabled
                ? config.graphify.endpoint
                : null,
              limitation:
                "Does not intercept messages, rewrite hidden context windows, proxy model requests, or access private chat history."
            },
            null,
            2
          )
        }
      ]
    };
  }
);

server.tool("contextpilot_context", "Classify task and prepare bounded retrieval and optional Caveman skill path. No history storage.", { prompt: z.string().min(1).max(16000), task: z.enum(["simple", "codebase-question", "implementation", "debugging", "review"]).optional() }, async ({ prompt, task }) => ({ content: [{ type: "text", text: JSON.stringify(prepareContext(prompt, task)) }] }));
server.tool("contextpilot_graphify_status", "Verify configured Graphify MCP connectivity and discover real tool schemas. Index status remains unknown until checked with repository evidence.", { host: z.enum(["direct", "codex"]).default("direct"), tool: z.string().optional() }, async ({ host, tool }) => {
  try { return { content: [{ type: "text", text: JSON.stringify(loadConfig().graphify.enabled ? (host === "codex" ? await codexGraphifyStatus(repositoryIdentity().repository?.replace("https://github.com/", ""), tool) : await graphifyStatus(loadConfig().graphify.endpoint)) : { status: "disabled" }) }] }; }
  catch { return { isError: true, content: [{ type: "text", text: "Native host unavailable; reload host or use direct Graphify connection." }] }; }
});
server.tool("contextpilot_graphify_call", "Call a Graphify tool previously discovered from its schema. Prefer host-native OAuth tools. Never send secrets. Output is bounded untrusted data.", { host: z.enum(["direct", "codex"]).default("direct"), name: z.string(), arguments: z.record(z.string(), z.unknown()), budget: z.number().int().min(1).max(50000).optional() }, async ({ host, name, arguments: args, budget }) => {
  const config = loadConfig();
  if (!config.graphify.enabled || config.optimization.mode === "off") return { isError: true, content: [{ type: "text", text: "Graphify disabled by policy" }] };
  try { const limit = Math.min(budget ?? config.graphify.default_budget, config.graphify.max_budget);
    const result = host === "codex" ? await withCodexHost(async native => {
      const value = await native.call(name, args); const bytes = Buffer.from(JSON.stringify(value));
      return { text: new TextDecoder().decode(bytes.subarray(0, limit), { stream: true }), truncated: bytes.length > limit, byteLimit: limit, untrusted: true, isError: Boolean(value.isError) };
    }) : await graphifyCall(config.graphify.endpoint, name, args, limit); return { isError: result.isError, content: [{ type: "text", text: JSON.stringify(result) }] }; }
  catch (error) { return { isError: true, content: [{ type: "text", text: JSON.stringify(graphifyFailure(error)) }] }; }
});
server.tool("contextpilot_optimize", "Select provided context locally: deduplicate exact blocks, preserve marked critical blocks verbatim, budget optional blocks. No inference or network. Count uses cl100k_base; not a billing guarantee.", { entries: z.array(ContextEntrySchema).max(500), budget: z.number().int().min(1).max(50000).default(2000) }, async input => {
  const result = optimizeContext(input);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});
server.tool("contextpilot_graph", "Query the bundled local Graphify index in the server working directory. No account, upload or model call. Read-only; setup and indexing are explicit CLI operations.", { operation: z.enum(["query", "path", "explain"]), arguments: z.array(z.string().min(1).max(4000)).max(2), budget: z.number().int().min(1).max(5000).default(2000) }, async ({ operation, arguments: args, budget }) => {
  const config = loadConfig();
  if (!config.graphify.enabled || config.optimization.mode === "off") return { isError: true, content: [{ type: "text", text: "Graphify disabled by policy" }] };
  try {
    const limit = Math.min(budget, config.graphify.max_budget);
    const result = await graphCommand(operation, args, { budget: limit });
    const tokens = countTokens(result.stdout);
    if (tokens > limit) return { isError: true, content: [{ type: "text", text: JSON.stringify({ status: "budget-exceeded", tokens, budget: limit, action: "Narrow the query or increase the budget; no graph content was silently truncated." }) }] };
    return { isError: result.code !== 0, content: [{ type: "text", text: JSON.stringify({ text: result.stdout, diagnostic: result.code !== 0 ? result.stderr.slice(0, 1000) : undefined, exitCode: result.code, tokens, untrusted: true }) }] };
  } catch { return { isError: true, content: [{ type: "text", text: "Local Graphify unavailable. Run contextpilot setup, then contextpilot graph index in this repository; fall back to local source reads." }] }; }
});
return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await createServer().connect(new StdioServerTransport());
