import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Props: onScan(text), facingMode ("environment"|"user"), elementId optional
const QRCodeScanner = ({ onScan, facingMode = 'environment', elementId = 'html5qr-reader', fps = 10 }) => {
  const containerRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    const id = elementId;
    const config = { fps, qrbox: { width: 300, height: 300 } };

    const startScanner = async () => {
      try {
        qrRef.current = new Html5Qrcode(id, { verbose: false });
        const constraints = { video: { facingMode } };
        await qrRef.current.start(
          constraints,
          config,
          (decodedText, decodedResult) => {
            if (!mounted) return;
            if (typeof onScan === 'function') onScan(decodedText);
          },
          (errorMessage) => {
            // ignore scan errors
          }
        );
      } catch (err) {
        // Could not start scanner (permissions/device). Ignore silently.
      }
    };

    // create container if not present
    if (containerRef.current) {
      const existing = document.getElementById(id);
      if (!existing) {
        const div = document.createElement('div');
        div.id = id;
        containerRef.current.appendChild(div);
      }
      startScanner();
    }

    return () => {
      mounted = false;
      if (qrRef.current) {
        qrRef.current.stop().then(() => {
          try {
            qrRef.current.clear();
          } catch (e) {
            // ignore
          }
        }).catch(() => { /* ignore stop errors */ });
      }
    };
  }, [elementId, facingMode, onScan, fps]);

  return <div ref={containerRef} style={{ width: '100%' }} />;
};

export default QRCodeScanner;
