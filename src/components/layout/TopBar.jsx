import { Link, useLocation } from 'react-router-dom';
import { useAudio } from '../../providers/AudioProvider.jsx';
import { useGuest } from '../../providers/GuestProvider.jsx';
import './TopBar.css';

const TopBar = () => {
  const location = useLocation();
  const { guest } = useGuest();
  const { isPlaying, toggleAudio } = useAudio();

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="top-bar">
      <div className="top-bar__inner container">
        <Link to="/" className="brand-mark">
          <span className="brand-initials">R &amp; A</span>
          <span className="brand-text">Razia &amp; Abduraziq</span>
        </Link>
        <div className="top-bar__actions">
          {guest && !isAdminRoute && (
            <div className="guest-pill">
              <span className="guest-label">Welcome</span>
              <span className="guest-name">{guest.guestName}</span>
            </div>
          )}
          <button type="button" className="audio-toggle" onClick={toggleAudio}>
            <span className="dot" data-active={isPlaying} />
            <span>{isPlaying ? 'Nasheed On' : 'Nasheed Off'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
