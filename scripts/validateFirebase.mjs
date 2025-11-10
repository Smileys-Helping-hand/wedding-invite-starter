import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const requiredEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_ADMIN_PASSWORD',
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing env vars detected. Deployment cancelled. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

try {
  const app = initializeApp(firebaseConfig, 'deploy-validation');
  const db = getFirestore(app);
  const testRef = doc(db, 'invites/test');
  await getDoc(testRef);
  console.log('✅ Firestore connection verified.');
} catch (error) {
  console.error(`❌ Firebase connection failed: ${error.message}`);
  process.exit(1);
}
