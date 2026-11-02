import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function installSkill(host: 'codex' | 'claude', scope: 'user' | 'project', options: { home?: string; cwd?: string; dryRun?: boolean } = {}) {
  const base = scope === 'user' ? options.home ?? os.homedir() : options.cwd ?? process.cwd();
  const root = path.join(base, host === 'codex' ? '.agents' : '.claude', 'skills', 'contextpilot');
  const sourceRoot = fileURLToPath(new URL('../integrations/contextpilot/', import.meta.url));
  const files: string[] = [];
  function collect(directory: string) {
    for (const item of fs.readdirSync(path.join(sourceRoot, directory), { withFileTypes: true })) {
      const relative = path.join(directory, item.name);
      if (item.isDirectory()) collect(relative);
      else if (item.isFile()) files.push(relative);
      else throw new Error('Unexpected symlink in bundled assets');
    }
  }
  collect('');
  const missing: string[] = [];
  // Check every destination before writing anything, including upstream assets.
  for (const file of files) {
    const target = path.join(root, file);
    if (fs.existsSync(target)) {
      if (!fs.readFileSync(target).equals(fs.readFileSync(path.join(sourceRoot, file)))) throw new Error(`Existing skill asset left unchanged: ${target}. Review it before replacing it.`);
    } else missing.push(file);
  }
  if (!options.dryRun) for (const file of missing) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, fs.readFileSync(path.join(sourceRoot, file)), { flag: 'wx', mode: 0o644 });
  }
  return { status: options.dryRun ? 'preview' : missing.length ? 'installed' : 'already-installed', target: path.join(root, 'SKILL.md'), files: files.length, changes: 'ContextPilot skill and bundled Caveman/Graphify assets only; host configuration and providers untouched.' };
}
