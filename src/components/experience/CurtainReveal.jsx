import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getAssetPath } from '../../utils/assetPaths.js';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import './CurtainReveal.css';

const CurtainReveal = ({ onComplete }) => {
  const { theme } = useTheme();
  const defaultLeft = getAssetPath('curtainLeft');
  const defaultRight = getAssetPath('curtainRight');
  const [leftSrc, setLeftSrc] = useState(theme?.assets?.curtainLeft ?? defaultLeft);
  const [rightSrc, setRightSrc] = useState(
    theme?.assets?.curtainRight ?? theme?.assets?.curtainLeft ?? defaultRight
  );
  const completedRef = useRef(false);

  useEffect(() => {
    setLeftSrc(theme?.assets?.curtainLeft ?? defaultLeft);
    setRightSrc(theme?.assets?.curtainRight ?? theme?.assets?.curtainLeft ?? defaultRight);
  }, [theme?.assets?.curtainLeft, theme?.assets?.curtainRight, defaultLeft, defaultRight]);

  const handleComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  return (
    <div className="curtain-stage">
      <motion.img
        src={leftSrc}
        alt="Silk curtain left"
        className="curtain curtain--left"
        initial={{ x: 0 }}
        animate={{ x: '-120%' }}
        transition={{ duration: 2.6, ease: [0.7, 0, 0.3, 1] }}
        onAnimationComplete={handleComplete}
        onError={() => setLeftSrc(defaultLeft)}
      />
      <motion.img
        src={rightSrc}
        alt="Silk curtain right"
        className="curtain curtain--right"
        data-mirror={rightSrc === leftSrc}
        initial={{ x: 0 }}
        animate={{ x: '120%' }}
        transition={{ duration: 2.6, ease: [0.7, 0, 0.3, 1] }}
        onError={() => setRightSrc(defaultRight)}
      />
    </div>
  );
};

export default CurtainReveal;
