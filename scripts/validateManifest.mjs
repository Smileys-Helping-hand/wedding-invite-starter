import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('dist/manifest.webmanifest');

if (!fs.existsSync(manifestPath)) {
  console.error('❌ Manifest missing. Run npm run build first.');
  process.exit(1);
}

let manifest;

try {
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  manifest = JSON.parse(raw);
} catch (error) {
  console.error(`❌ Unable to parse manifest: ${error.message}`);
  process.exit(1);
}

const requiredKeys = ['short_name', 'icons', 'start_url', 'theme_color'];
const missingKeys = requiredKeys.filter((key) => !manifest[key] || manifest[key].length === 0);

if (missingKeys.length > 0) {
  console.error(`❌ Manifest missing key(s): ${missingKeys.join(', ')}`);
  process.exit(1);
}

console.log('✅ Manifest & icons validated.');
