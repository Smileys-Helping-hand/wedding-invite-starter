import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import './EventDashboardPage.css';

const GAMES_KEY = 'hs_memory_wall_games';
const STORAGE_KEY = 'hs_memory_wall_images';

const EventDashboardPage = () => {
  const navigate = useNavigate();
  const [guesses, setGuesses] = useState([]);
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Load guesses
    try {
      const raw = localStorage.getItem(GAMES_KEY);
      const data = raw ? JSON.parse(raw) : [];
      setGuesses(data.sort((a, b) => (b.votes || 0) - (a.votes || 0)));
    } catch (err) {
      setGuesses([]);
    }

    // Load images
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      setImages(data);
    } catch (err) {
      setImages([]);
    }

    // Listen for updates
    const handleStorage = () => {
      try {
        const rawGuesses = localStorage.getItem(GAMES_KEY);
        const dataGuesses = rawGuesses ? JSON.parse(rawGuesses) : [];
        setGuesses(dataGuesses.sort((a, b) => (b.votes || 0) - (a.votes || 0)));

        const rawImages = localStorage.getItem(STORAGE_KEY);
        const dataImages = rawImages ? JSON.parse(rawImages) : [];
        setImages(dataImages);
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="event-dashboard-shell">
      <div className="event-dashboard-container">
        <header className="event-dashboard-header">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h1 className="page-title">Event Day Dashboard</h1>
            <p className="page-subtitle">View all guest guesses and photo submissions</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/admin')}>Back to Admin</Button>
        </header>

        <div className="dashboard-grid">
          <section className="dashboard-section">
            <h2>Guest Guesses</h2>
            <p className="muted">Sorted by votes (most popular first)</p>
            {guesses.length === 0 ? (
              <p className="empty-state">No guesses submitted yet</p>
            ) : (
              <div className="dashboard-list">
                {guesses.map((g) => (
                  <div key={g.id} className="dashboard-card">
                    <div className="card-header">
                      <strong>{g.name}</strong>
                      <span className="vote-badge">👍 {g.votes || 0} votes</span>
                    </div>
                    <div className="card-body">
                      <span className="guess-value">Guess: {g.guess}</span>
                      <span className="muted">{new Date(g.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <h2>Memory Wall Photos</h2>
            <p className="muted">{images.length} photo{images.length !== 1 ? 's' : ''} uploaded</p>
            {images.length === 0 ? (
              <p className="empty-state">No photos uploaded yet</p>
            ) : (
              <div className="photo-grid">
                {images.map((src, idx) => (
                  <div key={idx} className="photo-card">
                    <img src={src} alt={`Memory ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default EventDashboardPage;
