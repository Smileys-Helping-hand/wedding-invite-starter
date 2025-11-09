import 'dotenv/config';
import { getApps, initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const REQUIRED_KEYS = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'];

const resolveConfig = () => {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  };
};

const getDatabase = () => {
  const config = resolveConfig();
  const existing = getApps().find((candidate) => candidate.name === 'validate-firebase');
  const app = existing ?? initializeApp(config, 'validate-firebase');
  return getFirestore(app);
};

export default async function handler() {
  try {
    const db = getDatabase();
    await getDoc(doc(db, 'system', 'heartbeat'));
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Firebase validation failed:', error.message);
    return new Response(JSON.stringify({ status: 'error', message: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
