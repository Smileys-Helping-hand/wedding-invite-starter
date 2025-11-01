import './AppBackground.css';
import { getAssetPath } from '../../utils/assetPaths.js';
import { useTheme } from '../../providers/ThemeProvider.jsx';

const AppBackground = () => {
  const { theme } = useTheme();
  const showSparkles = theme?.toggles?.sparkles !== false;
  const sparklesSrc = theme?.assets?.sparklesVideo ?? getAssetPath('sparklesVideo');

  return (
    <div className="app-background" aria-hidden="true">
      {showSparkles && (
        <video className="sparkle-video" autoPlay muted loop playsInline>
          <source src={sparklesSrc} type="video/mp4" />
        </video>
      )}
      <div className="gradient-overlay" />
    </div>
  );
};

export default AppBackground;
