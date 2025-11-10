import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_BRAND_NAME',
  'VITE_ADMIN_PASSWORD',
];

const isLocal = !process.env.VERCEL_ENV && process.env.NODE_ENV !== 'production';
const missing = required.filter((key) => !process.env[key]);

if (missing.length && !isLocal) {
  console.error('❌ Missing required environment keys:', missing.join(', '));
  process.exit(1);
}

if (isLocal && missing.length) {
  console.warn('⚠️ Running locally without full env keys. Firebase will be disabled.');
} else {
  console.log('✅ Environment check passed.');
}
