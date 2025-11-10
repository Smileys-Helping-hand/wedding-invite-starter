import 'dotenv/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const ensureConfig = () => {
  const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error('❌ Cannot load monitor dashboard. Missing env vars:', missing.join(', '));
    process.exit(1);
  }

  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  };
};

const loadMonitorSnapshot = async () => {
  const config = ensureConfig();
  const app = getApps().find((candidate) => candidate.name === 'monitor-cli')
    ? getApp('monitor-cli')
    : initializeApp(config, 'monitor-cli');
  const db = getFirestore(app);

  const heartbeatDoc = await getDoc(doc(db, 'system', 'heartbeat'));
  if (!heartbeatDoc.exists()) {
    console.log('ℹ️ No heartbeat record found yet. Visit /monitor after the first ping.');
    return;
  }

  const data = heartbeatDoc.data();
  console.log('💚 Current heartbeat status');
  console.table({
    status: data.status ?? 'unknown',
    siteResponse: data.siteResponse ?? '—',
    lastPing: data.lastPing?.toDate?.().toISOString?.() ?? data.lastPing ?? '—',
  });
};

loadMonitorSnapshot()
  .then(() => {
    console.log('✅ Monitor snapshot retrieved. View full dashboard at /monitor');
  })
  .catch((error) => {
    console.error('❌ Unable to read monitor snapshot:', error.message);
    process.exit(1);
  });
