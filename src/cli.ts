#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { configPath, initializeConfig, loadConfig } from "./config.js";
import { createRetrievalPlan, formatPlan, type TaskKind } from "./policy.js";

const [command = "help", ...args] = process.argv.slice(2);
const tasks: TaskKind[] = [
  "simple",
  "codebase-question",
  "implementation",
  "debugging",
  "review"
];

function out(message = ""): void {
  process.stdout.write(message + "\n");
}

function existsOnPath(binary: string): boolean {
  return (process.env.PATH ?? "").split(path.delimiter).some((dir) => {
    try {
      fs.accessSync(path.join(dir, binary), fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

function help(): void {
  out(`ContextPilot 0.1.0

Usage:
  contextpilot init
  contextpilot doctor
  contextpilot status
  contextpilot plan <${tasks.join("|")}>
  contextpilot integrations

Config: ${configPath}`);
}

try {
  switch (command) {
    case "help":
    case "--help":
    case "-h":
      help();
      break;
    case "init":
      out(
        initializeConfig() === "created"
          ? `Created ${configPath}`
          : `Config already exists; left unchanged: ${configPath}`
      );
      break;
    case "doctor": {
      const config = loadConfig();
      out("✓ ContextPilot configuration valid");
      out(`✓ Node.js ${process.versions.node}`);
      for (const binary of ["codex", "claude"]) {
        out(
          `${existsOnPath(binary) ? "✓" : "·"} ${binary} CLI ${
            existsOnPath(binary) ? "found" : "not found"
          }`
        );
      }
      out(
        `${config.graphify.enabled ? "✓" : "·"} Graphify configured: ${
          config.graphify.endpoint
        }`
      );
      out("! OAuth, repository indexing, and remote MCP connectivity are not tested.");
      out("! Existing NSEC provider configuration was not read or modified.");
      break;
    }
    case "status": {
      const c = loadConfig();
      out(`Optimization: ${c.optimization.mode} / ${c.optimization.automation}`);
      out(`Caveman: ${c.caveman.enabled ? c.caveman.mode : "disabled"}`);
      out(`Graphify: ${c.graphify.enabled ? c.graphify.endpoint : "disabled"}`);
      out(
        `ChatGPT: ${
          c.applications.chatgpt.enabled
            ? "MCP tool (not global interception)"
            : "disabled"
        }`
      );
      out(`Codex: ${c.applications.codex.enabled ? "enabled; native setup separate" : "disabled"}`);
      out(
        `Claude Code: ${
          c.applications.claude_code.enabled
            ? "enabled; native setup separate"
            : "disabled"
        }`
      );
      out(
        `Conversation storage: ${
          c.privacy.store_conversation_content ? "enabled" : "disabled"
        }`
      );
      break;
    }
    case "plan": {
      const task = (args[0] ?? "codebase-question") as TaskKind;
      if (!tasks.includes(task)) {
        throw new Error(`Unknown task. Choose: ${tasks.join(", ")}`);
      }
      out(formatPlan(createRetrievalPlan(loadConfig(), task)));
      break;
    }
    case "integrations":
      out(`Graphify for Codex (additive MCP registration):
  codex mcp add graphify --url https://api.graphify.com/mcp
  codex mcp login graphify
  codex mcp list

Caveman for Codex (review upstream instructions/hooks first):
  npx -y github:JuliusBrussee/caveman -- --only codex

Caveman CLI:
  npm install -g @caveman-ai/cli@latest
  caveman doctor
  caveman status

For Claude Code, use the current native Caveman integration and Graphify HTTP MCP/OAuth instructions for your installed versions.

These commands are informational only; ContextPilot does not execute them or edit agent configuration.
Back up existing agent settings before adding integrations. Preserve NSEC provider/model/auth settings.`);
      break;
    default:
      help();
      process.exitCode = 1;
  }
} catch (error) {
  out(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
