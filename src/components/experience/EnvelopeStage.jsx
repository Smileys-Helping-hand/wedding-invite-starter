import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import './EnvelopeStage.css';

const EnvelopeStage = ({ onReveal }) => {
  const [opened, setOpened] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('hs_hasOpenedEnvelope') === 'true';
  });

  useEffect(() => {
    if (!opened) return undefined;
    const timer = setTimeout(() => onReveal?.(), 2000);
    return () => clearTimeout(timer);
  }, [opened, onReveal]);

  const handleSealClick = () => {
    if (opened) return;
    setOpened(true);
    try {
      window.localStorage.setItem('hs_hasOpenedEnvelope', 'true');
    } catch (error) {
      console.warn('Unable to persist envelope state', error);
    }
    setTimeout(() => onReveal?.(), 2200);
  };

  return (
    <div className="envelope-stage">
      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.div
            key="envelope"
            className="envelope-closed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="wax-seal"
              role="button"
              tabIndex={0}
              onClick={handleSealClick}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSealClick();
                }
              }}
            >
              💌
            </div>
            <p className="hint-text">Tap the wax seal to open</p>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            className="envelope-opened"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.2 }}
          >
            <p className="reveal-text">Opening your invitation...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnvelopeStage;
