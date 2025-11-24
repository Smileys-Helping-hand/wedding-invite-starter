import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import './QRCodeCard.css';

const QRCodeCard = ({ code, label }) => {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!code) return undefined;
    QRCode.toDataURL(code, { width: 220, margin: 1 })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [code]);

  return (
    <div className="qr-card" aria-label={`QR for ${label ?? code}`}>
      <div className="qr-card__image" aria-hidden="true">
        {dataUrl && <img src={dataUrl} alt="QR code" />}
      </div>
      <div className="qr-card__meta">
        <p className="qr-card__label">{label || 'Invite code'}</p>
        <p className="qr-card__code">{code}</p>
      </div>
    </div>
  );
};

export default QRCodeCard;
