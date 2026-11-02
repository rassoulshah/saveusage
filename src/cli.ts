#!/usr/bin/env node
import fs from "node:fs";
import { installSkill } from "./install.js";
import { optimizeContext } from "./optimizer.js";
import { codexGraphifyStatus } from "./codex-host.js";
import { repositoryIdentity } from "./graphify.js";
import { prepareContext, cavemanSkill } from "./context.js";
import { graphifyStatus } from "./graphify.js";
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
  out(`ContextPilot 0.2.0

Usage:
  contextpilot init
  contextpilot install <codex|claude> [--project] [--dry-run]
  contextpilot optimize <input.json|->
  contextpilot mcp
  contextpilot doctor
  contextpilot status
  contextpilot plan <${tasks.join("|")}>
  contextpilot context <prompt>
  contextpilot graphify-status [--host codex] [--tool name]
  contextpilot integrations

Config: ${configPath}`);
}

try {
  switch (command) {
    case "--version":
    case "-v":
      out("0.2.0");
      break;
    case "help":
    case "--help":
    case "-h":
      help();
      break;
    case "install": {
      const host = args[0];
      if (host !== "codex" && host !== "claude") throw new Error("Choose codex or claude");
      if (args.slice(1).some(a => !["--project", "--dry-run"].includes(a))) throw new Error("Unknown install option");
      out(JSON.stringify(installSkill(host, args.includes("--project") ? "project" : "user", { dryRun: args.includes("--dry-run") }), null, 2));
      break;
    }
    case "optimize": {
      if (args.length !== 1) throw new Error("Provide an input JSON file, or - for stdin");
      const input = fs.readFileSync(args[0] === "-" ? 0 : args[0], "utf8");
      if (Buffer.byteLength(input) > 2000000) throw new Error("Input exceeds 2 MB");
      out(JSON.stringify(optimizeContext(JSON.parse(input)), null, 2));
      break;
    }
    case "mcp": {
      const { createServer } = await import("./mcp-server.js");
      const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
      await createServer().connect(new StdioServerTransport());
      break;
    }
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
      out(`Caveman native skill: ${cavemanSkill(config.caveman.mode).status}`);
      out("Run contextpilot graphify-status for live connectivity; repository indexing remains separately verified.");
      out("! Existing provider and credential settings are not modified.");
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
    case "context":
      if (!args.length) throw new Error("Provide a task prompt");
      out(JSON.stringify(prepareContext(args.join(" ")), null, 2));
      break;
    case "graphify-status": {
      const config = loadConfig();
      const result = config.graphify.enabled ? (args.includes("--host") && args[args.indexOf("--host") + 1] === "codex" ? await codexGraphifyStatus(repositoryIdentity().repository?.replace("https://github.com/", ""), args.includes("--tool") ? args[args.indexOf("--tool") + 1] : undefined) : await graphifyStatus(config.graphify.endpoint)) : { status: "disabled" };
      out(JSON.stringify(result, null, 2));
      if (result.status !== "connected" && result.status !== "disabled") process.exitCode = 1;
      break;
    }
    case "integrations":
      out(`See docs/INTEGRATIONS.md for additive host setup and rollback.
Check MCP lists before adding any server. Preserve existing provider/model/auth settings.
Caveman and Graphify are optional; the local core needs no account or API key.
Run contextpilot graphify-status for a real MCP handshake. Host OAuth remains separate.`);
      break;
    default:
      help();
      process.exitCode = 1;
  }
} catch (error) {
  out(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
