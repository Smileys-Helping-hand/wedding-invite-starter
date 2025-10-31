import './AppBackground.css';
import { getAssetPath } from '../../utils/assetPaths.js';

const AppBackground = () => (
  <div className="app-background" aria-hidden="true">
    <video className="sparkle-video" autoPlay muted loop playsInline>
      <source src={getAssetPath('sparklesVideo')} type="video/mp4" />
    </video>
    <div className="gradient-overlay" />
  </div>
);

export default AppBackground;
