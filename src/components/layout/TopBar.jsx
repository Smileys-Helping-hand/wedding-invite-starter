import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
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
  const coupleNames = `${theme?.brideName ?? 'Razia'} & ${theme?.groomName ?? 'Abduraziq'}`;
  const emblemFontSize = useMemo(() => {
    const length = coupleNames.replace(/\s+/g, '').length;
    if (length <= 16) return '1.08rem';
    if (length <= 22) return '0.98rem';
    if (length <= 30) return '0.9rem';
    return '0.82rem';
  }, [coupleNames]);

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
            <span
              className="brand-emblem__names"
              style={{ fontSize: emblemFontSize }}
              data-length={coupleNames.length}
            >
              {coupleNames}
            </span>
          </span>
        </Link>
        <div className="top-bar__actions">
          <button
            type="button"
            className="audio-toggle"
            onClick={toggleAudio}
            aria-pressed={isPlaying}
            aria-label="Toggle Nasheed"
            title="Toggle Nasheed"
          >
            <span className="sr-only">Toggle Nasheed</span>
            <svg
              className="audio-toggle__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M9 5v14l8-5.5V10.5L9 5zm-3 4h2v6H6a2 2 0 0 1 0-4h2"
                fill={isPlaying ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
