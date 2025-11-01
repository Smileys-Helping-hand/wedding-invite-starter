import { useEffect, useState } from 'react';
import './AppBackground.css';
import { getAssetPath } from '../../utils/assetPaths.js';
import { useTheme } from '../../providers/ThemeProvider.jsx';

const AppBackground = () => {
  const { theme } = useTheme();
  const sparkleAmount = Math.min(Math.max(theme?.toggles?.sparkleAmount ?? 0.55, 0), 1);
  const showSparkles = theme?.toggles?.sparkles !== false && sparkleAmount > 0.01;
  const showBokeh = theme?.toggles?.lightBokeh === true;
  const showPetals = theme?.toggles?.petals === true;
  const defaultSparkles = getAssetPath('sparklesVideo');
  const [sparklesSrc, setSparklesSrc] = useState(showSparkles ? theme?.assets?.sparklesVideo ?? defaultSparkles : '');

  useEffect(() => {
    if (!showSparkles) {
      setSparklesSrc('');
      return;
    }
    setSparklesSrc(theme?.assets?.sparklesVideo ?? defaultSparkles);
  }, [showSparkles, theme?.assets?.sparklesVideo, defaultSparkles]);

  const videoType = sparklesSrc?.endsWith('.webm') ? 'video/webm' : 'video/mp4';

  return (
    <div className="app-background" aria-hidden="true">
      {showSparkles && sparklesSrc && (
        <video
          className="sparkle-video"
          autoPlay
          muted
          loop
          playsInline
          style={{ opacity: sparkleAmount * 0.6 + 0.2 }}
          onError={() => setSparklesSrc('')}
        >
          <source src={sparklesSrc} type={videoType} />
        </video>
      )}
      <div className="gradient-overlay" />
      {showBokeh && <div className="bokeh-overlay" />}
      {showPetals && (
        <div className="petal-overlay">
          {Array.from({ length: 12 }).map((_, index) => (
            <span key={index} className="petal" aria-hidden="true" style={{ '--index': index }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AppBackground;
