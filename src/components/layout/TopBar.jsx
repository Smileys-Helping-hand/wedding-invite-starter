import { Link, useLocation } from 'react-router-dom';
import { useAudio } from '../../providers/AudioProvider.jsx';
import { useGuest } from '../../providers/GuestProvider.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import './TopBar.css';

const resolveGuestName = (guest) => {
  if (!guest) return null;
  if (guest.guestName) return guest.guestName;
  if (Array.isArray(guest.guestNames) && guest.guestNames.length > 0) {
    return guest.guestNames[0];
  }
  if (guest.primaryGuest) return guest.primaryGuest;
  return null;
};

const TopBar = () => {
  const location = useLocation();
  const { guest } = useGuest();
  const { isPlaying, toggleAudio } = useAudio();
  const { theme } = useTheme();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const guestName = resolveGuestName(guest);

  return (
    <header className="top-bar">
      <div className="top-bar__inner container">
        <div className="top-bar__left">
          {guestName && !isAdminRoute && (
            <div className="guest-pill">
              <span className="guest-label">Welcome</span>
              <span className="guest-name">{guestName}</span>
            </div>
          )}
        </div>
        <Link to="/" className="brand-emblem" aria-label="Return to invite entry">
          <span className="brand-emblem__ring">
            <span className="brand-emblem__names">
              {theme?.brideName ?? 'Razia'} &amp; {theme?.groomName ?? 'Abduraziq'}
            </span>
          </span>
        </Link>
        <div className="top-bar__actions">
          <button type="button" className="audio-toggle" onClick={toggleAudio}>
            <span className="audio-toggle__dot" data-active={isPlaying} />
            <span>{isPlaying ? 'Nasheed On' : 'Nasheed Off'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
