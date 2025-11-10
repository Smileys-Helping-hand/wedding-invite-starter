import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { execSync } from 'child_process';

const version = 'v5.3.4';
const distPath = path.resolve('dist');
const backupDir = path.resolve('backups');

if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found. Run npm run build before backing up.');
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const archivePath = path.join(backupDir, `build-${version}.zip`);
const output = fs.createWriteStream(archivePath);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.on('error', (error) => {
  console.error(`❌ Failed to create archive: ${error.message}`);
  process.exit(1);
});

const finalizeArchive = new Promise((resolve, reject) => {
  output.on('close', resolve);
  output.on('error', reject);
});

archive.pipe(output);
archive.directory(distPath, false);
await archive.finalize();

try {
  await finalizeArchive;
} catch (error) {
  console.error(`❌ Archive stream error: ${error.message}`);
  process.exit(1);
}

try {
  execSync(`git tag -a ${version}-backup -m "Pre-deploy snapshot"`, { stdio: 'inherit' });
  console.log(`📦 Backup created and tagged as ${version}-backup`);
} catch (error) {
  console.error(`⚠️ Unable to create git tag: ${error.message}`);
  process.exit(1);
}
