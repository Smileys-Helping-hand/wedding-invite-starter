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
  const { isPlaying, toggleAudio, startAudio } = useAudio();
  const { theme } = useTheme();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const guestName = resolveGuestName(guest);
  const coupleNames = `${theme?.brideName ?? 'Razia'} & ${theme?.groomName ?? 'Abduraziq'}`;
  const { emblemFontSize, emblemLetterSpacing } = useMemo(() => {
    const length = coupleNames.replace(/\s+/g, '').length;
    if (length <= 16) {
      return { emblemFontSize: 'clamp(0.92rem, 2.8vw, 1.16rem)', emblemLetterSpacing: '0.2em' };
    }
    if (length <= 24) {
      return { emblemFontSize: 'clamp(0.88rem, 2.6vw, 1.06rem)', emblemLetterSpacing: '0.18em' };
    }
    if (length <= 32) {
      return { emblemFontSize: 'clamp(0.84rem, 2.4vw, 0.98rem)', emblemLetterSpacing: '0.16em' };
    }
    if (length <= 40) {
      return { emblemFontSize: 'clamp(0.8rem, 2.2vw, 0.94rem)', emblemLetterSpacing: '0.14em' };
    }
    return { emblemFontSize: 'clamp(0.76rem, 2vw, 0.9rem)', emblemLetterSpacing: '0.12em' };
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
              style={{
                '--emblem-font-size': emblemFontSize,
                '--emblem-letter-spacing': emblemLetterSpacing,
              }}
            >
              {coupleNames}
            </span>
          </span>
        </Link>
        <div className="top-bar__actions">
          <button
            type="button"
            className="audio-toggle"
            onClick={() => {
              if (isPlaying) {
                toggleAudio();
              } else {
                startAudio?.({ force: true });
              }
            }}
            aria-pressed={isPlaying}
            aria-label="Toggle nasheed playback"
            title="Toggle Nasheed"
            data-state={isPlaying ? 'on' : 'off'}
          >
            <span className="sr-only">Toggle Nasheed</span>
            <svg className="audio-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" data-variant="on">
              <path
                d="M12 4a1 1 0 0 1 1-1c2.27 0 4.11.74 5.86 1.37.62.22 1.14.41 1.64.53A.75.75 0 0 1 21 5.64v4.14l-4 1V16a4.25 4.25 0 1 1-1.5-3.24V4Z"
                data-fill="solid"
              />
            </svg>
            <svg className="audio-toggle__icon" viewBox="0 0 24 24" aria-hidden="true" data-variant="off">
              <path
                d="M11.5 4.2c2.18 0 3.93-.7 6.5-1.2v4.8l-5 1.1V17a3.25 3.25 0 1 1-1.5-2.75V4.2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
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
