import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

export const ConfigSchema = z.object({
  version: z.number().int().positive(),
  optimization: z.object({
    mode: z.enum(["off", "balanced", "aggressive"]),
    automation: z.enum(["automatic", "manual", "hybrid"]),
    preserve_reasoning: z.boolean(),
    preserve_errors: z.boolean(),
    preserve_requirements: z.boolean(),
    preserve_security_constraints: z.boolean()
  }),
  caveman: z.object({
    enabled: z.boolean(),
    mode: z.enum(["off", "caveman", "megacave", "ultracave"]),
    use_native_integrations: z.boolean()
  }),
  graphify: z.object({
    backend: z.enum(["local", "cloud"]).default("local"),
    enabled: z.boolean(),
    endpoint: z.string().url(),
    default_budget: z.number().int().min(500).max(50000),
    max_budget: z.number().int().min(500).max(50000),
    skeleton_first: z.boolean(),
    verify_index_freshness_for_critical_changes: z.boolean()
  }),
  applications: z.object({
    chatgpt: z.object({
      enabled: z.boolean(),
      integration: z.string(),
      automatic_all_chats: z.boolean()
    }),
    codex: z.object({ enabled: z.boolean(), integration: z.string() }),
    claude_code: z.object({ enabled: z.boolean(), integration: z.string() })
  }),
  privacy: z.object({
    store_conversation_content: z.boolean(),
    store_api_keys: z.boolean(),
    local_telemetry: z.boolean()
  })
}).refine(c => c.graphify.default_budget <= c.graphify.max_budget, { message: "default_budget must not exceed max_budget" });

export type ContextPilotConfig = z.infer<typeof ConfigSchema>;
export const configDir = path.join(os.homedir(), ".config", "contextpilot");
export const configPath = path.join(configDir, "config.yaml");

const defaults: ContextPilotConfig = {
  version: 1,
  optimization: {
    mode: "balanced",
    automation: "automatic",
    preserve_reasoning: true,
    preserve_errors: true,
    preserve_requirements: true,
    preserve_security_constraints: true
  },
  caveman: { enabled: true, mode: "caveman", use_native_integrations: true },
  graphify: {
    backend: "local",
    enabled: true,
    endpoint: "https://api.graphify.com/mcp",
    default_budget: 2000,
    max_budget: 5000,
    skeleton_first: true,
    verify_index_freshness_for_critical_changes: true
  },
  applications: {
    chatgpt: { enabled: true, integration: "mcp", automatic_all_chats: false },
    codex: { enabled: true, integration: "native-skill-and-hooks" },
    claude_code: { enabled: true, integration: "native-skill-and-hooks" }
  },
  privacy: {
    store_conversation_content: false,
    store_api_keys: false,
    local_telemetry: false
  }
};

export function loadConfig(): ContextPilotConfig {
  if (!fs.existsSync(configPath)) return defaults;
  return ConfigSchema.parse(YAML.parse(fs.readFileSync(configPath, "utf8")));
}

export function initializeConfig(): "created" | "exists" {
  fs.mkdirSync(configDir, { recursive: true });
  if (fs.existsSync(configPath)) return "exists";
  fs.writeFileSync(configPath, YAML.stringify(defaults), { flag: "wx", mode: 0o600 });
  return "created";
}
