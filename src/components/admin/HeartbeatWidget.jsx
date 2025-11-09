import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

import { useFirebase } from '../../providers/FirebaseProvider.jsx';

const statusTone = (status) => {
  if (status === 'ok' || status === 'healthy') return 'text-green-300';
  if (status === 'warn' || status === 'degraded') return 'text-amber-200';
  if (status === 'error' || status === 'down') return 'text-red-300';
  return 'text-slate-200';
};

const HeartbeatWidget = () => {
  const { db } = useFirebase();
  const [heartbeat, setHeartbeat] = useState(null);

  useEffect(() => {
    if (!db) return undefined;
    const unsubscribe = onSnapshot(doc(db, 'system', 'heartbeat'), (snapshot) => {
      setHeartbeat(snapshot.exists() ? snapshot.data() : null);
    });
    return () => unsubscribe();
  }, [db]);

  const status = heartbeat?.status ?? 'unknown';
  const response = heartbeat?.siteResponse ?? '—';
  const lastPing = (() => {
    const value = heartbeat?.lastPing;
    if (!value) return '—';
    if (typeof value.toDate === 'function') return value.toDate().toLocaleTimeString();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toLocaleTimeString();
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? '—' : new Date(parsed).toLocaleTimeString();
    }
    return '—';
  })();

  return (
    <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-4 shadow-lg text-sm text-white min-w-[220px]">
      <p className="text-xs uppercase tracking-[0.18em] text-white/70">System heartbeat</p>
      <p className={`text-lg font-semibold mt-1 ${statusTone(status)}`}>{status}</p>
      <dl className="mt-3 space-y-1 text-white/70">
        <div className="flex justify-between gap-4">
          <dt>Response</dt>
          <dd className="font-mono text-xs">{response}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Last ping</dt>
          <dd className="font-mono text-xs">{lastPing}</dd>
        </div>
      </dl>
    </div>
  );
};

export default HeartbeatWidget;
