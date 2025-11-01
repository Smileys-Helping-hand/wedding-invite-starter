import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getAssetPath, getWaxSeal } from '../../utils/assetPaths.js';
import './EnvelopeStage.css';

const EnvelopeStage = ({ onOpened, sealVariant = 'default' }) => {
  const [isMelting, setIsMelting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isMelting) return undefined;
    const timer = window.setTimeout(() => {
      setIsOpen(true);
      onOpened?.();
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [isMelting, onOpened]);

  const handleClick = () => {
    if (isOpen || isMelting) return;
    setIsMelting(true);
  };

  const waxAnimate = useMemo(
    () =>
      isMelting
        ? {
            scale: [1, 1.06, 0.92, 0.6, 0.2],
            opacity: [1, 1, 0.9, 0.4, 0],
            rotate: [0, -2, 3, -1, 0],
          }
        : { scale: 1, opacity: 1, rotate: 0 },
    [isMelting]
  );

  return (
    <div className="envelope-stage">
      <div className="envelope-stage__halo" aria-hidden="true" />
      <div className="envelope-stage__sparkles" aria-hidden="true" />
      <motion.div
        className={`envelope-shell${isOpen ? ' is-open' : ''}`}
        initial={{ opacity: 0, scale: 0.92, y: 48 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.8, 0.5, 1] }}
      >
        <div className="envelope-texture" />
        <img src={getAssetPath('envelope')} alt="Golden envelope" className="envelope" />
      </motion.div>
      <motion.button
        type="button"
        className="wax-button"
        onClick={handleClick}
        aria-label="Open invitation"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        data-melting={isMelting}
      >
        <span className="wax-button__glow" aria-hidden="true" />
        <motion.img
          src={getWaxSeal(sealVariant)}
          alt="Wax seal"
          className="waxseal"
          animate={waxAnimate}
          transition={{ duration: 1.4, ease: [0.42, 0, 0.58, 1] }}
        />
      </motion.button>
      {isOpen && (
        <motion.div
          className="invite-card-wrapper"
          initial={{ opacity: 0, y: 140 }}
          animate={{ opacity: 1, y: -40 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={getAssetPath('inviteCard')} alt="Invitation card" className="invite-card" />
          <span className="invite-card__shimmer" aria-hidden="true" />
        </motion.div>
      )}
    </div>
  );
};

export default EnvelopeStage;
