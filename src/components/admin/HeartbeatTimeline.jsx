import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';

import { useFirebase } from '../../providers/FirebaseProvider.jsx';

const formatPingTime = (value) => {
  if (!value) return '—';
  if (typeof value.toDate === 'function') {
    return value.toDate().toLocaleTimeString();
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000).toLocaleTimeString();
  }
  if (typeof value === 'number') {
    return new Date(value).toLocaleTimeString();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? '—' : new Date(parsed).toLocaleTimeString();
  }
  return '—';
};

const statusColor = (status) => {
  if (status === 'ok' || status === 'healthy') return 'text-green-400';
  if (status === 'warn' || status === 'degraded') return 'text-amber-300';
  if (status === 'error' || status === 'down') return 'text-red-400';
  return 'text-slate-200';
};

const HeartbeatTimeline = () => {
  const { db } = useFirebase();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!db) return undefined;

    const heartbeatQuery = query(
      collection(db, 'system/heartbeats/log'),
      orderBy('lastPing', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(heartbeatQuery, (snapshot) => {
      const mapped = snapshot.docs.map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }));
      setEntries(mapped);
    });

    return () => unsubscribe();
  }, [db]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-gray-200 shadow-sm">
      <h4 className="font-semibold text-white mb-3">Recent Heartbeats</h4>
      <ul className="space-y-2">
        {entries.length === 0 && <li className="text-gray-400">No entries yet.</li>}
        {entries.map((entry) => {
          const time = formatPingTime(entry.lastPing);
          return (
            <li key={entry.id} className="flex items-center justify-between gap-3">
              <span className="tabular-nums">{time}</span>
              <span className={`uppercase tracking-wide text-xs ${statusColor(entry.status)}`}>
                {entry.status ?? 'unknown'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default HeartbeatTimeline;
