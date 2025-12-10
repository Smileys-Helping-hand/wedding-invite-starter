import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isEventDayModeEnabled } from '../../utils/guestUtils.js';
import { useFirebase } from '../../providers/FirebaseProvider.jsx';
import './MemoryWallPlaceholder.css';
import GamesForm from './GamesForm.jsx';

const STORAGE_KEY = 'hs_memory_wall_images';

const MemoryWallPlaceholder = () => {
  const navigate = useNavigate();
  const { uploadMedia, isReady, syncEventPhoto } = useFirebase();
  const [images, setImages] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  });

  const [enabled, setEnabled] = useState(() => (typeof window !== 'undefined' ? isEventDayModeEnabled() : false));

  // Camera capture refs/state
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // Games state
  const GAMES_KEY = 'hs_memory_wall_games';
  const [guesses, setGuesses] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(GAMES_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  });

  const persistGames = (next) => {
    try {
      window.localStorage.setItem(GAMES_KEY, JSON.stringify(next));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    const handler = () => setEnabled(isEventDayModeEnabled());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const persistLocal = (next) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      // ignore
    }
  };

  const readFileFallback = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target.result;
        const photoEntry = {
          url: data,
          timestamp: new Date().toISOString(),
          type: 'upload',
        };
        
        // Try to sync to Firebase (optional)
        if (syncEventPhoto) {
          try {
            await syncEventPhoto(photoEntry);
          } catch (err) {
            // Firebase sync failed, continue with localStorage only
          }
        }
        
        setImages((prev) => {
          const next = [data, ...prev].slice(0, 50);
          persistLocal(next);
          return next;
        });
        resolve();
      };
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files) => {
    const fileArray = Array.from(files || []);
    for (const file of fileArray) {
      if (uploadMedia && isReady) {
        try {
          const { url } = await uploadMedia(file, { directory: 'memory-wall' });
          
          const photoEntry = {
            url,
            timestamp: new Date().toISOString(),
            type: 'upload',
            fileName: file.name,
          };
          
          // Sync to Firebase collection (optional)
          if (syncEventPhoto) {
            try {
              await syncEventPhoto(photoEntry);
            } catch (err) {
              // Sync failed, continue with storage URL
            }
          }
          
          setImages((prev) => [url, ...prev].slice(0, 50));
        } catch (err) {
          await readFileFallback(file);
        }
      } else {
        await readFileFallback(file);
      }
    }
  };

  // Camera helpers
  const startCamera = async () => {
    if (cameraOpen) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOpen(true);
    } catch (err) {
      console.warn('Could not open camera', err);
    }
  };

  const stopCamera = () => {
    try {
      streamRef.current?.getTracks()?.forEach((t) => t.stop());
    } catch (err) {
      // ignore
    }
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const captureFromCamera = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
        await handleFiles([file]);
      }
    } catch (err) {
      console.warn('capture failed', err);
    } finally {
      setCapturing(false);
      // keep camera open for more captures, or stop automatically if you prefer
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Games helpers
  const submitGuess = (name, guess) => {
    const entry = { id: Date.now(), name: name || 'Guest', guess: Number(guess), votes: 0, createdAt: new Date().toISOString() };
    const next = [entry, ...guesses].slice(0, 50);
    setGuesses(next);
    persistGames(next);
  };

  const voteForGuess = (guessId) => {
    const next = guesses.map(g => g.id === guessId ? { ...g, votes: (g.votes || 0) + 1 } : g);
    setGuesses(next);
    persistGames(next);
  };

  return (
    <motion.section
      className="memory-wall"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="memory-wall__content">
        <span className="badge">Memory Wall</span>
        <h2 className="memory-wall__title text-script">Memory Wall &amp; Gallery</h2>
        <p>
          Share a photo from the event to the public gallery. Images are stored locally for testing or uploaded to Firebase when configured.
        </p>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button 
            className="community-link-btn"
            onClick={() => navigate('/community')}
          >
            🌟 View Community Dashboard
          </button>
        </div>

        {enabled ? (
          <div className="memory-actions">
            <label className="memory-upload">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
              />
              <span className="memory-upload__hint">Upload photos from your device</span>
            </label>

            <div className="memory-camera">
              {!cameraOpen ? (
                <button type="button" className="btn" onClick={startCamera}>📸 Use camera</button>
              ) : (
                <div className="camera-controls">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <div>
                    <button type="button" className="btn" onClick={captureFromCamera} disabled={capturing}>{capturing ? 'Capturing…' : '📷 Capture'}</button>
                    <button type="button" className="btn ghost" onClick={stopCamera}>Close camera</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="muted">The Memory Wall is available during Event Day.</p>
        )}

        <div className="memory-grid">
          {images.length === 0 && Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="memory-tile">
              <span>Reserved for cherished moments</span>
            </div>
          ))}
          {images.map((src, idx) => (
            <div key={idx} className="memory-tile">
              <img src={src} alt={`memory-${idx}`} />
            </div>
          ))}
        </div>

        {/* Simple Games area: place guesses/bets */}
        <div className="memory-games">
          <h3>Games &amp; Guesses</h3>
          <p className="muted">Place a guess (1–10) for fun. Vote for your favorite guesses!</p>
          <GamesForm onSubmit={submitGuess} />

          <div className="guess-list">
            {guesses.length === 0 ? (
              <p className="muted">No guesses yet — be the first!</p>
            ) : (
              guesses.map((g) => (
                <div key={g.id} className="guess-row">
                  <div className="guess-content">
                    <strong>{g.name}</strong> guessed <em>{g.guess}</em> • <span className="muted">{new Date(g.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <button className="vote-btn" onClick={() => voteForGuess(g.id)}>
                    👍 {g.votes || 0}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default MemoryWallPlaceholder;
