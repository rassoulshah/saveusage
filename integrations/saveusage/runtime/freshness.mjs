import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const snapshotName = 'saveusage-snapshot.json';

// Conservative Git-visible input snapshot, not a claim about AST extractor coverage.
export function sourceSnapshot(cwd) {
  const root = fs.realpathSync(cwd);
  const result = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '.', ':!:saveusage/**'], {cwd:root,encoding:'utf8',maxBuffer:4000000});
  if (result.status !== 0) return null;
  const files = [...new Set(result.stdout.split('\0').filter(Boolean))].sort();
  if (files.length > 10000) return null;
  const digest = crypto.createHash('sha256');
  let bytes = 0;
  for (const file of files) {
    const target = path.join(root,file);
    let stat;
    try { stat = fs.lstatSync(target); } catch { digest.update(JSON.stringify([file,'missing'])); continue; }
    if (stat.isSymbolicLink()) { digest.update(JSON.stringify([file,'symlink',fs.readlinkSync(target)])); continue; }
    if (!stat.isFile()) { digest.update(JSON.stringify([file,'unsupported'])); continue; }
    bytes += stat.size;
    if (bytes > 64000000) return null;
    digest.update(JSON.stringify([file,hash(fs.readFileSync(target))]));
  }
  return {root,digest:digest.digest('hex'),files:files.length};
}
export function recordSnapshot(cwd, before) {
  const after = sourceSnapshot(cwd);
  const graph = path.join(cwd,'saveusage','graph.json');
  if (!before || !after || before.digest !== after.digest || !fs.existsSync(graph)) return false;
  fs.writeFileSync(path.join(cwd,'saveusage',snapshotName),JSON.stringify({version:1,...after,graphHash:hash(fs.readFileSync(graph))},null,2)+'\n');
  return true;
}
export function graphStatus(cwd = process.cwd()) {
  const root = fs.realpathSync(cwd);
  const graph = path.join(root,'saveusage','graph.json');
  const scope = 'Conservative snapshot of Git-visible files, including untracked non-ignored files; not AST coverage. Maximum 10,000 files / 64 MB. Ignored files are not checked.';
  if (!fs.existsSync(graph)) return {status:'missing',scope,action:'Run saveusage graph index .'};
  try {
    const saved = JSON.parse(fs.readFileSync(path.join(root,'saveusage',snapshotName),'utf8'));
    const current = sourceSnapshot(root);
    if (saved.version !== 1 || !current) throw new Error('No supported snapshot');
    const fresh = saved.root === root && saved.digest === current.digest && saved.graphHash === hash(fs.readFileSync(graph));
    return {status:fresh ? 'fresh' : 'stale',files:current.files,scope,action:fresh ? 'Verify important graph references against source.' : 'Source or graph changed. Run saveusage graph index . before querying.'};
  } catch { return {status:'unknown',scope,action:'Reindex to record a freshness snapshot. Legacy graphs and non-Git directories cannot be verified.'}; }
}
