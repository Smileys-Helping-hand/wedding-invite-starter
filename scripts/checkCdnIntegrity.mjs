import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const DEFAULT_SITE_URL = process.env.SITE_URL || 'https://razia-raaziq.vercel.app';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const ASSETS_DIR = path.resolve('public/assets');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const hashFile = (filePath) => {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(data).digest('hex');
};

const listLocalAssets = (directory) => {
  const dirents = fs.readdirSync(directory, { withFileTypes: true });
  return dirents
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      hash: hashFile(path.join(directory, entry.name)),
    }));
};

const checkCDN = async (asset, siteUrl) => {
  const response = await fetch(`${siteUrl}/assets/${asset.name}`, { method: 'HEAD' });
  if (!response.ok) {
    return 'missing';
  }

  const etag = response.headers.get('etag')?.replace(/"/g, '');
  return etag === asset.hash ? 'ok' : 'mismatch';
};

const purgeAsset = async (asset, siteUrl) => {
  console.log(`🚨 Purging stale CDN file: ${asset.name}`);
  const response = await fetch('https://api.vercel.com/v2/integrations/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${siteUrl}/assets/${asset.name}`,
      purge_cache: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`❌ Failed to purge ${asset.name}: ${text}`);
    return;
  }

  await sleep(500);
};

export const runCdnIntegrityCheck = async ({ siteUrl = DEFAULT_SITE_URL } = {}) => {
  if (!VERCEL_TOKEN) {
    throw new Error('Missing VERCEL_TOKEN — cannot authenticate with CDN.');
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error('Assets directory not found at public/assets');
  }

  console.log('🔍 Checking CDN integrity for /public/assets ...');

  const assets = listLocalAssets(ASSETS_DIR);
  if (!assets.length) {
    console.log('ℹ️ No assets found locally. Nothing to verify.');
    return;
  }

  const mismatches = [];
  for (const asset of assets) {
    try {
      const result = await checkCDN(asset, siteUrl);
      if (result !== 'ok') {
        mismatches.push({ ...asset, reason: result });
      }
    } catch (error) {
      console.error(`❌ Failed to check ${asset.name}:`, error.message);
      mismatches.push({ ...asset, reason: 'error' });
    }
  }

  if (mismatches.length === 0) {
    console.log('✅ All CDN assets match local hashes. Integrity confirmed.');
    return;
  }

  console.log(`⚠️  Found ${mismatches.length} mismatched files.`);
  for (const asset of mismatches) {
    await purgeAsset(asset, siteUrl);
  }

  console.log('✅ CDN cache purged and will refresh on next request.');
};

const isExecutedDirectly = () => {
  if (!process.argv[1]) return false;
  const scriptUrl = pathToFileURL(process.argv[1]).href;
  return import.meta.url === scriptUrl;
};

if (isExecutedDirectly()) {
  runCdnIntegrityCheck().catch((error) => {
    console.error('❌ CDN integrity check failed:', error.message);
    process.exit(1);
  });
}
