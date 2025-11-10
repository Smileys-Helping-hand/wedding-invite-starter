import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { useFirebase } from '../../providers/FirebaseProvider.jsx';
import MemoryGrid from './MemoryGrid.jsx';
import MemoryUploadModal from './MemoryUploadModal.jsx';
import { summariseMemories } from '../../utils/summariseMemories.js';
import './MemoryWall.css';

const MemoryWall = () => {
  const { subscribeToMemories } = useFirebase();
  const [memories, setMemories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToMemories?.(
      (items) => {
        if (Array.isArray(items)) {
          setMemories(items);
          setLoading(false);
        }
      },
      { onlyApproved: import.meta.env.VITE_MEMORY_APPROVAL === 'true' }
    );

    return unsubscribe;
  }, [subscribeToMemories]);

  useEffect(() => {
    let cancelled = false;

    const runSummary = async () => {
      if (!memories.length) {
        setSummary('');
        return;
      }
      const result = await summariseMemories(memories);
      if (!cancelled) {
        setSummary(result);
      }
    };

    runSummary();

    return () => {
      cancelled = true;
    };
  }, [memories]);

  const highlight = useMemo(() => memories.slice(0, 3), [memories]);

  return (
    <section className="memory-wall" aria-label="Memory wall">
      <div className="memory-wall__header">
        <div>
          <h2>Memory Wall</h2>
          <p>
            Share a photo or dua to bless Razia &amp; Abduraziq on their engagement
            journey.
          </p>
          {summary && <p className="memory-wall__summary">{summary}</p>}
        </div>
        <button
          type="button"
          className="memory-wall__upload"
          onClick={() => setIsModalOpen(true)}
        >
          Share Memory
        </button>
      </div>

      {loading ? (
        <p className="memory-wall__loading">Loading shared blessings…</p>
      ) : (
        <>
          <div className="memory-wall__highlight">
            {highlight.map((item) => (
              <motion.div
                key={item.id}
                className="memory-highlight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <img src={item.imageUrl} alt="Memory highlight" loading="lazy" />
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <MemoryGrid memories={memories} />
        </>
      )}

      <MemoryUploadModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default MemoryWall;
