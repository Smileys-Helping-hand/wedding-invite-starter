import { motion } from 'framer-motion';
import { getAssetPath } from '../../utils/assetPaths.js';
import './CurtainReveal.css';

const CurtainReveal = ({ onComplete }) => (
  <div className="curtain-stage">
    <motion.img
      src={getAssetPath('curtainLeft')}
      alt="Silk curtain left"
      className="curtain curtain--left"
      initial={{ x: 0 }}
      animate={{ x: '-120%' }}
      transition={{ duration: 2.6, ease: [0.7, 0, 0.3, 1] }}
      onAnimationComplete={onComplete}
    />
    <motion.img
      src={getAssetPath('curtainRight')}
      alt="Silk curtain right"
      className="curtain curtain--right"
      initial={{ x: 0 }}
      animate={{ x: '120%' }}
      transition={{ duration: 2.6, ease: [0.7, 0, 0.3, 1] }}
    />
  </div>
);

export default CurtainReveal;
