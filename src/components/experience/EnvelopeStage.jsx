import { useState } from 'react';
import { motion } from 'framer-motion';
import { getAssetPath } from '../../utils/assetPaths.js';
import './EnvelopeStage.css';

const EnvelopeStage = ({ onOpened }) => {
  const [isMelting, setIsMelting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (isOpen) return;
    setIsMelting(true);
    setTimeout(() => {
      setIsOpen(true);
      onOpened?.();
    }, 1600);
  };

  return (
    <div className="envelope-stage">
      <motion.img
        src={getAssetPath('envelope')}
        alt="Golden envelope"
        className="envelope"
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.8, 0.5, 1] }}
      />
      <motion.button
        type="button"
        className="wax-button"
        onClick={handleClick}
        aria-label="Open invitation"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.img
          src={getAssetPath('waxSeal')}
          alt="Wax seal"
          className="waxseal"
          animate={isMelting ? { scale: [1, 1.1, 0.3], opacity: [1, 0.6, 0] } : {}}
          transition={{ duration: 1.4, ease: [0.42, 0, 0.58, 1] }}
        />
      </motion.button>
      {isOpen && (
        <motion.img
          src={getAssetPath('inviteCard')}
          alt="Invitation card"
          className="invite-card"
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: -60 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </div>
  );
};

export default EnvelopeStage;
