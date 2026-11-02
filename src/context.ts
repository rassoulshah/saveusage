import fs from 'node:fs';
import { bundledStatus } from '../integrations/contextpilot/runtime/bundle.mjs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig } from './config.js';
import { createRetrievalPlan, type TaskKind } from './policy.js';
import { repositoryIdentity } from './graphify.js';

export function classifyTask(prompt: string): TaskKind {
  if (/error|exception|stack trace|fails?\b|bug|خطا|اشکال/i.test(prompt)) return 'debugging';
  if (/review|audit|security|بازبینی|امنیت/i.test(prompt)) return 'review';
  if (/implement|refactor|fix|add\b|build|پیاده|اضافه|اصلاح/i.test(prompt)) return 'implementation';
  if (/architect|dependenc|call.?path|codebase|repository|module|معماری|وابستگی|مخزن/i.test(prompt)) return 'codebase-question';
  return 'simple';
}

export function cavemanSkill(mode = 'caveman', home = os.homedir()) {
  const candidates = [path.join(home, '.agents', 'skills', mode, 'SKILL.md'), path.join(home, '.claude', 'skills', mode, 'SKILL.md'), path.join(home, '.codex', 'skills', mode, 'SKILL.md')];
  const file = candidates.find(p => fs.existsSync(p)) ?? (mode === "caveman" ? bundledStatus().caveman.skill : undefined);
  return file ? { status: 'available', path: file, mechanism: 'Host executes installed skill instructions; no inference proxy or automatic lossy summarizer.' } : { status: 'unavailable', mechanism: 'Use ContextPilot built-in concise output and preservation rules; Caveman is optional.' };
}

export function prepareContext(prompt: string, task?: TaskKind, cwd?: string) {
  const config = loadConfig(); const kind = task ?? classifyTask(prompt);
  const plan = createRetrievalPlan(config, kind);
  const optimize = config.optimization.mode !== 'off' && config.caveman.enabled && config.caveman.mode !== 'off' && kind !== 'simple';
  return { task: kind, plan, repository: plan.useGraphify ? repositoryIdentity(cwd) : null,
    caveman: optimize ? cavemanSkill(config.caveman.mode) : { status: 'skipped' },
    graphify: plan.useGraphify ? { local: bundledStatus().graphify, endpoint: config.graphify.endpoint, backend: config.graphify.backend, action: config.graphify.backend === 'local' ? 'Use the bundled local Graphify runtime to query this repository graph. If runtime is missing, run explicit contextpilot setup. If no graph exists, use contextpilot graph index for code-only local AST indexing when appropriate. Read-only queries need no account or model call. Verify graph freshness against source; fall back to targeted reads.' : 'Discover host-native Graphify tool schemas and check index identity/freshness before targeted read-only retrieval. Never substitute another repository graph.', budget: plan.budget } : { action: 'skip' },
    preservation: 'Keep requirements, decisions, constraints, exact errors, code, uncertainty and verification evidence. Never truncate these to meet a budget; expand within max_budget or report insufficient context.' };
}
