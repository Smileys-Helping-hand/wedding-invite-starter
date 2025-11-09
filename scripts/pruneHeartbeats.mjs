import 'dotenv/config';
import { initializeApp, getApps } from 'firebase/app';
import {
  deleteDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { format, subDays } from 'date-fns';

const REQUIRED_KEYS = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID'];

const resolveConfig = () => {
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }

  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  };
};

const getDatabase = () => {
  const config = resolveConfig();
  const existing = getApps().find((app) => app.name === 'heartbeat-pruner');
  const app = existing ?? initializeApp(config, 'heartbeat-pruner');
  return getFirestore(app);
};

export const HEARTBEAT_COLLECTION_PATH = 'system/heartbeats/log';

const dateFromTimestamp = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
  return null;
};

export const pruneOldHeartbeats = async (database = getDatabase()) => {
  const cutoffDate = subDays(new Date(), 30);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
  console.log(`🧹  Pruning heartbeats older than ${cutoffDate.toISOString()}`);

  const heartbeatQuery = query(
    collection(database, HEARTBEAT_COLLECTION_PATH),
    where('lastPing', '<', cutoffTimestamp),
    orderBy('lastPing', 'asc')
  );

  const snapshot = await getDocs(heartbeatQuery);
  let removed = 0;
  const summaryMap = new Map();

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const lastPingDate = dateFromTimestamp(data.lastPing);
    const status = data.status ?? 'unknown';

    if (lastPingDate) {
      const weekKey = format(lastPingDate, "yyyy-'W'II");
      const current = summaryMap.get(weekKey) ?? {
        week: weekKey,
        total: 0,
        statusCounts: {},
        latest: null,
      };

      current.total += 1;
      current.statusCounts[status] = (current.statusCounts[status] ?? 0) + 1;
      if (!current.latest || current.latest < lastPingDate) {
        current.latest = lastPingDate;
      }

      summaryMap.set(weekKey, current);
    }

    await deleteDoc(docSnapshot.ref);
    removed += 1;
  }

  for (const [weekKey, summary] of summaryMap.entries()) {
    await setDoc(
      doc(database, 'system/heartbeats/summaries', weekKey),
      {
        week: weekKey,
        total: summary.total,
        statusCounts: summary.statusCounts,
        lastPing: summary.latest ? Timestamp.fromDate(summary.latest) : null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  console.log(`✅  Removed ${removed} stale heartbeat logs.`);
  if (summaryMap.size > 0) {
    console.log(`📦  Updated ${summaryMap.size} weekly heartbeat summaries.`);
  }

  return { removed, summariesUpdated: summaryMap.size };
};

if (process.argv[1] && process.argv[1].includes('pruneHeartbeats.mjs')) {
  pruneOldHeartbeats()
    .then(({ removed, summariesUpdated }) => {
      console.log(`📊  Weekly summaries refreshed: ${summariesUpdated}`);
    })
    .catch((error) => {
      console.error('❌  Prune failed:', error.message);
      process.exit(1);
    });
}

export default pruneOldHeartbeats;
