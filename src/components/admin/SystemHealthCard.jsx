import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const STATUS_LABELS = {
  cdn: 'CDN integrity',
  heartbeat: 'Heartbeat',
  firebase: 'Firebase rules',
  env: 'Env keys',
};

const resolveIcon = (status) => {
  if (status === 'ok') return <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" />;
  if (status === 'fail') return <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />;
  return <AlertTriangle className="h-5 w-5 text-yellow-400 animate-pulse" aria-hidden="true" />;
};

const statusClasses = (status) => {
  if (status === 'ok') return 'bg-green-500/10 text-green-200 border-green-400/30';
  if (status === 'fail') return 'bg-red-500/10 text-red-200 border-red-400/30';
  return 'bg-yellow-500/10 text-yellow-200 border-yellow-400/30';
};

const fetchStatus = async () => {
  const handle = async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    return response.ok ? 'ok' : 'fail';
  };

  const [cdn, heartbeat, firebase] = await Promise.all([
    handle('/api/checkCdnIntegrity'),
    handle('/api/heartbeat'),
    handle('/api/validateFirebase'),
  ]);

  return {
    cdn,
    heartbeat,
    firebase,
    env: import.meta.env.VITE_FIREBASE_API_KEY ? 'ok' : 'fail',
  };
};

const SystemHealthCard = () => {
  const [health, setHealth] = useState({ cdn: 'loading', heartbeat: 'loading', firebase: 'loading', env: 'loading' });

  useEffect(() => {
    let isMounted = true;

    const update = async () => {
      try {
        const payload = await fetchStatus();
        if (isMounted) setHealth(payload);
      } catch (error) {
        if (isMounted) {
          setHealth({ cdn: 'fail', heartbeat: 'fail', firebase: 'fail', env: 'fail' });
        }
      }
    };

    update();
    const interval = setInterval(update, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-sm"
    >
      <h3 className="text-lg font-semibold text-white">System Health Summary</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {Object.entries(health).map(([key, status]) => (
          <div
            key={key}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-colors duration-200 ${statusClasses(status)}`}
            aria-live="polite"
          >
            <span className="capitalize tracking-wide">{STATUS_LABELS[key] ?? key}</span>
            {resolveIcon(status)}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">Auto-refreshes every 30s — synced with Monitor &amp; CDN checks.</p>
    </motion.div>
  );
};

export default SystemHealthCard;
