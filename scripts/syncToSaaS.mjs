import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(root, '..');

async function loadConfig() {
  const configPath = resolve(projectRoot, 'sync-config.json');
  const raw = await readFile(configPath, 'utf8');
  return JSON.parse(raw);
}

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function main() {
  const config = await loadConfig();
  const { exportPaths, targetRepo, exclude = [] } = config;
  const targetRoot = resolve(projectRoot, targetRepo);
  const summary = [];

  for (const relativePath of exportPaths) {
    const sourcePath = resolve(projectRoot, relativePath);
    const destination = resolve(targetRoot, relativePath);
    await ensureDir(dirname(destination));
    await cp(sourcePath, destination, {
      recursive: true,
      filter: (src) => !exclude.some((segment) => src.includes(`/${segment}/`)),
    });
    summary.push({ sourcePath, destination });
  }

  const manifestPath = join(targetRoot, 'SYNC_MANIFEST.json');
  await writeFile(manifestPath, JSON.stringify({ exportedAt: new Date().toISOString(), summary }, null, 2));
  console.log(`Synced ${summary.length} directories to ${targetRoot}`);
}

main().catch((error) => {
  console.error('Sync failed', error);
  process.exitCode = 1;
});
