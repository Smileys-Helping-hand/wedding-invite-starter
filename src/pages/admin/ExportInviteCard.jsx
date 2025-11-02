import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import Button from '../../components/common/Button.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import { getAssetPath } from '../../utils/assetPaths.js';
import { EVENT_VENUE } from '../../utils/constants.js';
import './ExportInviteCard.css';

const ExportInviteCard = ({ guests = [] }) => {
  const { theme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const squareRef = useRef(null);
  const storyRef = useRef(null);
  const assetBackground = theme?.assets?.inviteCard ?? getAssetPath('cardBackground', theme?.assets);

  const coupleNames = useMemo(() => theme?.texts?.coupleNames ?? 'Razia & Abduraziq', [theme?.texts?.coupleNames]);
  const blessing = theme?.texts?.blessing ?? 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ';
  const scheduleGregorian =
    theme?.text?.scheduleGregorian ?? theme?.texts?.scheduleGregorian ?? 'Tuesday, 16 December 2025';
  const scheduleVenue =
    theme?.text?.scheduleVenue ?? theme?.texts?.scheduleVenue ??
    EVENT_VENUE.addressLine1 ?? 'Legacy Events, Schaapkraal Road, Ottery, Cape Town';
  const scheduleTime =
    theme?.text?.scheduleTime ?? theme?.texts?.scheduleTime ??
    EVENT_VENUE.gatheringTime ?? '4:30 PM for 5:00 PM';

  const downloadCanvas = async (element, { width, height, fileName }) => {
    const canvas = await html2canvas(element, {
      width,
      height,
      scale: 2,
      backgroundColor: theme?.colors?.panel ?? '#f8f5f0',
    });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  };

  const handleExport = async () => {
    if (!squareRef.current || !storyRef.current) return;
    setIsExporting(true);
    try {
      await downloadCanvas(squareRef.current, { width: 1080, height: 1080, fileName: 'invite-square.png' });
      await downloadCanvas(storyRef.current, { width: 1080, height: 1920, fileName: 'invite-story.png' });
    } catch (err) {
      console.warn('Failed to export invite cards', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="admin-export">
      <header className="admin-export__header">
        <div>
          <h1 className="page-title">Export Invite Cards</h1>
          <p className="page-subtitle">
            Generate WhatsApp-ready graphics using your current theme styling for {guests.length} household{guests.length === 1 ? '' : 's'}.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleExport} disabled={isExporting}>
          {isExporting ? 'Rendering…' : 'Export PNGs'}
        </Button>
      </header>

      <div className="admin-export__previews">
        <div className="export-preview">
          <span className="export-preview__label">Square</span>
          <div className="export-card export-card--square" ref={squareRef}>
            <div className="export-card__panel" style={{ backgroundImage: `url(${assetBackground})` }}>
              <span className="export-card__blessing">{blessing}</span>
              <span className="export-card__names">{coupleNames}</span>
              <div className="export-card__schedule">
                <span>{scheduleGregorian}</span>
                <span>{scheduleVenue}</span>
                <span>{scheduleTime}</span>
              </div>
              <span className="export-card__note">Use your invite code to RSVP.</span>
            </div>
          </div>
        </div>
        <div className="export-preview">
          <span className="export-preview__label">Story</span>
          <div className="export-card export-card--story" ref={storyRef}>
            <div className="export-card__panel" style={{ backgroundImage: `url(${assetBackground})` }}>
              <span className="export-card__blessing">{blessing}</span>
              <span className="export-card__names">{coupleNames}</span>
              <div className="export-card__schedule">
                <span>{scheduleGregorian}</span>
                <span>{scheduleVenue}</span>
                <span>{scheduleTime}</span>
              </div>
              <span className="export-card__note">Scan QR or tap link to respond.</span>
            </div>
          </div>
        </div>
      </div>
      <p className="admin-export__hint">PNG files will download to your device and can be shared on WhatsApp or Instagram.</p>
    </div>
  );
};

export default ExportInviteCard;
