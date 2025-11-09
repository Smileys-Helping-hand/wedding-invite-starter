import 'dotenv/config';
import { initializeApp, getApps } from 'firebase/app';
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const REQUIRED_KEYS = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'];

const resolveConfig = () => {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Firebase configuration for heartbeat script: ${missing.join(', ')}`);
  }
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  };
};

const getDatabase = () => {
  const config = resolveConfig();
  const existing = getApps().find((candidate) => candidate.name === 'heartbeat-cli');
  const app = existing ?? initializeApp(config, 'heartbeat-cli');
  return getFirestore(app);
};

export const recordHeartbeat = async () => {
  const db = getDatabase();
  const now = serverTimestamp();
  const payload = {
    status: 'ok',
    siteResponse: 200,
    lastPing: now,
  };

  await setDoc(doc(db, 'system', 'heartbeat'), payload, { merge: true });
  await addDoc(collection(db, 'system/heartbeats/log'), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return payload;
};

export default async function handler() {
  try {
    await recordHeartbeat();
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Heartbeat logging failed:', error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

if (process.argv[1] && process.argv[1].includes('api/heartbeat.js')) {
  recordHeartbeat()
    .then(() => {
      console.log('✅ Heartbeat recorded in Firestore.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Heartbeat logging failed:', error.message);
      process.exit(1);
    });
}
