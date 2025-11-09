import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import { useFirebase } from '../../providers/FirebaseProvider.jsx';
import './MemoryWallModeration.css';

const emptyState = {
  title: 'All memories are shining bright',
  description:
    'New submissions will appear here for your blessing before they join the memory wall.',
};

const MemoryWallModeration = () => {
  const firebase = useFirebase();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firebase?.subscribeToMemories) return undefined;
    const unsubscribe = firebase.subscribeToMemories(
      (data) => {
        if (!data) {
          setEntries([]);
          return;
        }

        const pending = data.filter(
          (item) => item.approved === false || item.approved === undefined
        );
        setEntries(pending);
        setLoading(false);
      },
      { limitTo: 100 }
    );

    return unsubscribe;
  }, [firebase]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleApprove = async (memoryId) => {
    setError('');
    try {
      await firebase.updateMemory(memoryId, { approved: true });
      setToast('Memory approved and now visible.');
    } catch (err) {
      setError('Unable to approve memory. Please try again.');
    }
  };

  const handleDelete = async (memoryId) => {
    setError('');
    try {
      await firebase.deleteMemory(memoryId);
      setToast('Memory removed.');
    } catch (err) {
      setError('Unable to remove memory.');
    }
  };

  const items = useMemo(
    () =>
      entries.map((item) => ({
        id: item.id,
        name: item.name ?? 'Guest',
        message: item.message ?? '',
        imageUrl: item.imageUrl ?? '',
        uploadedAt: item.timestamp?.toDate?.()?.toLocaleString?.() ?? '',
      })),
    [entries]
  );

  return (
    <section className="memory-moderation">
      <header className="memory-moderation__header">
        <div>
          <h1 className="page-title">Memory Wall Moderation</h1>
          <p className="page-subtitle">
            Approve heartfelt blessings before they grace the wall.
          </p>
        </div>
      </header>
      {toast && <div className="admin-toast admin-toast--success">{toast}</div>}
      {error && <div className="admin-toast admin-toast--error">{error}</div>}
      {loading ? (
        <div className="memory-moderation__loading">
          <Loader label="Loading pending memories" />
        </div>
      ) : (
        <AnimatePresence>
          {items.length === 0 ? (
            <motion.div
              key="empty"
              className="memory-moderation__empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2>{emptyState.title}</h2>
              <p>{emptyState.description}</p>
            </motion.div>
          ) : (
            <div className="memory-moderation__grid">
              {items.map((item) => (
                <motion.article
                  key={item.id}
                  className="memory-moderation__card"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                >
                  <div className="memory-moderation__media">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={`Memory shared by ${item.name}`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="memory-moderation__placeholder">No image</span>
                    )}
                  </div>
                  <div className="memory-moderation__body">
                    <h3>{item.name}</h3>
                    {item.uploadedAt && (
                      <span className="memory-moderation__timestamp">
                        {item.uploadedAt}
                      </span>
                    )}
                    <p>{item.message}</p>
                  </div>
                  <div className="memory-moderation__actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(item.id)}
                    >
                      Approve ✅
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Remove ❌
                    </Button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
};

export default MemoryWallModeration;
