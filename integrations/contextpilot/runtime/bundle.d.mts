export const manifest: { graphify: { version: string; sha256: string }; caveman: { version: string } };
export function dataRoot(): string;
export function runtimePaths(root?: string): { root: string; python: string };
export function bundledStatus(root?: string): { caveman: { version: string; skill: string; cli: string; engineBinariesBundled: boolean }; graphify: { version: string; wheelBundled: boolean; python: string; setupComplete: boolean; requires: string } };
export function setupGraphify(options?: { dataDir?: string }): Promise<{ status: string; root: string; python: string; version: string }>;
export function graphCommand(operation: string, args?: string[], options?: { dataDir?: string; cwd?: string; budget?: number }): Promise<{ code: number; stdout: string; stderr: string }>;
export function cavemanCommand(args?: string[], options?: { dataDir?: string }): Promise<{ code: number; stdout: string; stderr: string }>;
