import { motion } from 'framer-motion';
import { getAssetPath } from '../../utils/assetPaths.js';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import './BismillahReveal.css';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const glowVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: [0, 1, 0.75, 1],
    scale: [0.8, 1.1, 0.95, 1],
    transition: { duration: 2.2, ease: 'easeInOut' },
  },
};

const BismillahReveal = ({ onComplete }) => {
  const { theme } = useTheme();
  const glowEnabled = theme?.toggles?.glow !== false;
  const asset = theme?.assets?.bismillah ?? getAssetPath('bismillah');

  return (
    <motion.div
      className="bismillah-stage"
      data-glow={glowEnabled}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onAnimationComplete={onComplete}
    >
      {glowEnabled && <motion.div className="bismillah-glow" variants={glowVariants} />}
      <span className="bismillah-light" aria-hidden="true" />
      <img src={asset} alt="Bismillah in golden calligraphy" className="bismillah-art" />
      <motion.p
        className="bismillah-caption"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 1.1 }}
      >
        In the name of Allah, the Most Gracious, the Most Merciful
      </motion.p>
    </motion.div>
  );
};

export default BismillahReveal;
