import { useEffect, useState } from 'react';
import './AppBackground.css';
import { getAssetPath } from '../../utils/assetPaths.js';
import { useTheme } from '../../providers/ThemeProvider.jsx';

const AppBackground = () => {
  const { theme } = useTheme();
  const showSparkles = theme?.toggles?.sparkles !== false;
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
        <video className="sparkle-video" autoPlay muted loop playsInline onError={() => setSparklesSrc('')}>
          <source src={sparklesSrc} type={videoType} />
        </video>
      )}
      <div className="gradient-overlay" />
    </div>
  );
};

export default AppBackground;
