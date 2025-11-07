import { useState } from 'react';

import { exportInviteVariants } from '../utils/exportInviteImage.js';
import Button from './common/Button.jsx';
import './ShareCardButton.css';

const ShareCardButton = () => {
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState('');

  const handleExport = async () => {
    const node = document.querySelector('.invite-card-panel');
    if (!node) {
      setToast('Invite card not ready for export.');
      return;
    }

    try {
      setDownloading(true);
      await exportInviteVariants(node, 'raziaraaziq-invite');
      setToast('Invite cards saved — share on WhatsApp with love!');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setToast('Unable to export invite card. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="share-card">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        loading={downloading}
      >
        Export Invite Card
      </Button>
      {toast && <span className="share-card__toast">{toast}</span>}
    </div>
  );
};

export default ShareCardButton;
