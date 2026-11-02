#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { createRetrievalPlan, formatPlan, type TaskKind } from "./policy.js";

const server = new McpServer({ name: "contextpilot", version: "0.1.0" });

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

await server.connect(new StdioServerTransport());
