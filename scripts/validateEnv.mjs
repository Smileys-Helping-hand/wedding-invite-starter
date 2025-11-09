import 'dotenv/config';

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MSG_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_ADMIN_PASSWORD',
  'VITE_BRAND_NAME',
];

const optional = ['VITE_AMPLIFY_MONITOR_KEY'];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '));
  process.exit(1);
}

optional
  .filter((key) => !process.env[key])
  .forEach((key) => {
    console.warn(`⚠️ Optional environment variable not set: ${key}`);
  });

console.log('✅ Environment validated successfully.');
