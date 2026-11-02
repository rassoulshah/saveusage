import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const skillRoot = fileURLToPath(new URL('../', import.meta.url));
const bundleRoot = path.join(skillRoot, 'bundled');
export const manifest = JSON.parse(fs.readFileSync(path.join(bundleRoot, 'manifest.json'), 'utf8'));
export function dataRoot() {
  return path.join(process.env.XDG_DATA_HOME || (process.platform === 'win32' ? process.env.LOCALAPPDATA : '') || path.join(os.homedir(), '.local', 'share'), 'contextpilot');
}
export function runtimePaths(root = dataRoot()) {
  const environment = path.join(root, `graphify-${manifest.graphify.version}`);
  return { root: environment, python: path.join(environment, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python') };
}
export function capture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: options.env ?? process.env, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
    let stdout = '', stderr = '', size = 0;
    const timer = setTimeout(() => { child.kill(); reject(new Error('Bundled command timed out')); }, options.timeout ?? 30000);
    child.on('error', () => { clearTimeout(timer); reject(new Error(`Cannot start ${path.basename(command)}`)); });
    const collect = (stream, text) => {
      size += Buffer.byteLength(text);
      if (size > 4000000) { child.kill(); reject(new Error('Bundled command output exceeded 4 MB')); }
      else if (stream === 'out') stdout += text;
      else stderr += text;
    };
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', text => collect('out', text)); child.stderr.on('data', text => collect('err', text));
    child.on('close', code => { clearTimeout(timer); resolve({ code: code ?? 1, stdout, stderr }); });
  });
}
async function checked(command, args, options) {
  const result = await capture(command, args, options);
  // Do not forward package-manager diagnostics: index URLs may include credentials.
  if (result.code !== 0) throw new Error(`${path.basename(command)} failed (exit ${result.code}); check Python, uv/pip and platform wheel availability. No provider settings were changed.`);
  return result;
}
export function bundledStatus(root = dataRoot()) {
  const runtime = runtimePaths(root);
  return { caveman: { version: manifest.caveman.version, skill: path.join(bundleRoot, 'caveman', 'skill.md'), cli: path.join(bundleRoot, 'caveman', 'cli', 'dist', 'index.js'), engineBinariesBundled: false },
    graphify: { version: manifest.graphify.version, wheelBundled: true, python: runtime.python, setupComplete: fs.existsSync(path.join(runtime.root, '.contextpilot-ready.json')), requires: 'Python >=3.10; uv preferred, otherwise venv/pip. Setup downloads Python dependencies, never repository content.' } };
}
export async function setupGraphify(options = {}) {
  const runtime = runtimePaths(options.dataDir);
  const wheel = path.join(bundleRoot, 'graphify', `graphifyy-${manifest.graphify.version}-py3-none-any.whl`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(wheel)).digest('hex');
  if (actual !== manifest.graphify.sha256) throw new Error('Bundled Graphify wheel integrity check failed');
  if (fs.existsSync(runtime.python)) {
    const version = await checked(runtime.python, ['-I', '-c', 'import importlib.metadata; print(importlib.metadata.version("graphifyy"))']).catch(() => null);
    if (version?.stdout.trim() === manifest.graphify.version && fs.existsSync(path.join(runtime.root, '.contextpilot-ready.json'))) return { status: 'ready', ...runtime, version: manifest.graphify.version };
  }
  fs.mkdirSync(path.dirname(runtime.root), { recursive: true });
  const owner = runtime.root + '.owner.json';
  if (fs.existsSync(runtime.root) && !fs.existsSync(owner)) throw new Error('Refusing to change an unowned runtime directory');
  const lock = runtime.root + '.lock';
  const lockFd = fs.openSync(lock, 'wx', 0o600);
  try {
    fs.writeFileSync(owner, JSON.stringify({ product: 'contextpilot', graphify: manifest.graphify.version }), { mode: 0o600 });
    const candidates = process.env.CONTEXTPILOT_PYTHON ? [process.env.CONTEXTPILOT_PYTHON] : process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
    let python;
    for (const candidate of candidates) {
      const result = await capture(candidate, ['-c', 'import sys; print(sys.executable); raise SystemExit(0 if sys.version_info >= (3,10) else 1)']).catch(() => null);
      if (result?.code === 0) { python = result.stdout.trim(); break; }
    }
    if (!python) throw new Error('Python >=3.10 is required. Install Python, then rerun setup.');
    const uv = await capture('uv', ['--version']).catch(() => null);
    if (!fs.existsSync(runtime.python)) {
      if (uv?.code === 0) await checked('uv', ['venv', '--no-project', '--no-python-downloads', '--allow-existing', '--python', python, runtime.root], { timeout: 60000 });
      else await checked(python, ['-m', 'venv', runtime.root], { timeout: 60000 });
    }
    if (uv?.code === 0) await checked('uv', ['pip', 'install', '--python', runtime.python, '--only-binary', ':all:', wheel], { timeout: 300000 });
    else await checked(runtime.python, ['-I', '-m', 'pip', 'install', '--only-binary=:all:', wheel], { timeout: 300000 });
    const version = await checked(runtime.python, ['-I', '-c', 'import importlib.metadata; print(importlib.metadata.version("graphifyy"))']);
    if (version.stdout.trim() !== manifest.graphify.version) throw new Error('Graphify runtime version mismatch');
    fs.writeFileSync(path.join(runtime.root, '.contextpilot-ready.json'), JSON.stringify({ version: manifest.graphify.version, wheelSha256: actual }), { mode: 0o600 });
    return { status: 'ready', ...runtime, version: manifest.graphify.version };
  } finally { fs.closeSync(lockFd); fs.unlinkSync(lock); }
}
export async function graphCommand(operation, args = [], options = {}) {
  const runtime = runtimePaths(options.dataDir);
  if (!fs.existsSync(path.join(runtime.root, '.contextpilot-ready.json'))) throw new Error('Run contextpilot setup to initialize the bundled Graphify runtime.');
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const graph = path.join(cwd, 'graphify-out', 'graph.json');
  let command;
  if (operation === 'index') {
    if (args.length > 1) throw new Error('Index accepts one directory');
    const target = path.resolve(cwd, args[0] ?? '.');
    command = ['extract', target, '--code-only', '--no-cluster', '--max-workers', '1'];
  } else if (operation === 'query') {
    if (args.length !== 1 || !args[0]) throw new Error('Provide one quoted graph question');
    const budget = options.budget ?? 2000;
    if (!Number.isInteger(budget) || budget < 1 || budget > 5000) throw new Error('Graph budget must be between 1 and 5000');
    command = ['query', args[0], '--budget', String(budget), '--graph', graph];
  } else if (operation === 'path') {
    if (args.length !== 2 || args.some(a => !a || a.startsWith('-'))) throw new Error('Provide two symbol names');
    command = ['path', ...args, '--graph', graph];
  } else if (operation === 'explain') {
    if (args.length !== 1 || !args[0] || args[0].startsWith('-')) throw new Error('Provide one symbol name');
    command = ['explain', args[0], '--graph', graph];
  } else throw new Error('Choose graph index, query, path or explain');
  return capture(runtime.python, ['-I', '-m', 'graphify', ...command], { cwd, timeout: operation === 'index' ? 180000 : 30000 });
}
export async function cavemanCommand(args = [], options = {}) {
  if (args.length && !['--help', '--version', 'tools'].includes(args[0])) throw new Error('ContextPilot exposes bundled Caveman help/version/tools only; its native skill is used automatically. Proxy, login, routing and hook installers are not enabled.');
  if (args.length > 1) throw new Error('Use caveman --help, --version or tools');
  const state = path.join(options.dataDir ?? dataRoot(), 'caveman');
  return capture(process.execPath, [path.join(bundleRoot, 'caveman', 'cli', 'dist', 'index.js'), ...(args.length ? args : ['--help'])], {
    env: { ...process.env, CAVEMAN_HOME: state, CAVEMAN_CONFIG: path.join(state, 'config.json'), CAVEMAN_TELEMETRY: '0', DO_NOT_TRACK: '1' }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command = 'status', ...args] = process.argv.slice(2);
    if (command === 'setup') console.log(JSON.stringify(await setupGraphify(), null, 2));
    else if (command === 'status') console.log(JSON.stringify(bundledStatus(), null, 2));
    else {
      const result = command === 'caveman' ? await cavemanCommand(args) : await graphCommand(command, args);
      process.stdout.write(result.stdout); process.stderr.write(result.stderr); process.exitCode = result.code;
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
