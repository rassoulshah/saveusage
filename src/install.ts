import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function installSkill(host: 'codex' | 'claude', scope: 'user' | 'project', options: { home?: string; cwd?: string; dryRun?: boolean } = {}) {
  const base = scope === 'user' ? options.home ?? os.homedir() : options.cwd ?? process.cwd();
  const target = path.join(base, host === 'codex' ? '.agents' : '.claude', 'skills', 'contextpilot', 'SKILL.md');
  const source = fs.readFileSync(fileURLToPath(new URL('../integrations/contextpilot/SKILL.md', import.meta.url)), 'utf8');
  if (fs.existsSync(target)) {
    if (fs.readFileSync(target, 'utf8') === source) return { status: 'already-installed', target };
    throw new Error(`Existing skill left unchanged: ${target}. Review it before replacing it.`);
  }
  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, source, { flag: 'wx', mode: 0o644 });
  }
  return { status: options.dryRun ? 'preview' : 'installed', target, changes: 'One skill file only; host configuration and providers untouched.' };
}
