import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/common/Button.jsx';
import './CommunityDashboardPage.css';

const GAMES_KEY = 'hs_memory_wall_games';
const STORAGE_KEY = 'hs_memory_wall_images';

const CommunityDashboardPage = () => {
  const navigate = useNavigate();
  const [guesses, setGuesses] = useState([]);
  const [images, setImages] = useState([]);

  const loadData = () => {
    try {
      const rawGuesses = localStorage.getItem(GAMES_KEY);
      const dataGuesses = rawGuesses ? JSON.parse(rawGuesses) : [];
      setGuesses(dataGuesses.sort((a, b) => (b.votes || 0) - (a.votes || 0)));

      const rawImages = localStorage.getItem(STORAGE_KEY);
      const dataImages = rawImages ? JSON.parse(rawImages) : [];
      setImages(dataImages);
    } catch (err) {
      setGuesses([]);
      setImages([]);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);

    // Refresh every 5 seconds to show live updates
    const interval = setInterval(loadData, 5000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const voteForGuess = (guessId) => {
    try {
      const next = guesses.map(g => g.id === guessId ? { ...g, votes: (g.votes || 0) + 1 } : g);
      localStorage.setItem(GAMES_KEY, JSON.stringify(next));
      setGuesses(next.sort((a, b) => (b.votes || 0) - (a.votes || 0)));
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="community-dashboard-shell">
      <div className="community-dashboard-container">
        <motion.header 
          className="community-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="badge">Community</span>
            <h1 className="page-title">Community Dashboard</h1>
            <p className="page-subtitle">View everyone's photos and vote for your favorite guesses!</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/invite')}>Back to Invitation</Button>
        </motion.header>

        <div className="community-grid">
          <motion.section 
            className="community-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="section-header">
              <h2>🎉 Guest Guesses</h2>
              <span className="count-badge">{guesses.length} guess{guesses.length !== 1 ? 'es' : ''}</span>
            </div>
            <p className="muted">Vote for your favorite guesses!</p>
            
            {guesses.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🎲</span>
                <p>No guesses yet — be the first to guess!</p>
              </div>
            ) : (
              <div className="community-list">
                {guesses.map((g, index) => (
                  <motion.div 
                    key={g.id} 
                    className="community-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <div className="card-rank">#{index + 1}</div>
                    <div className="card-content">
                      <div className="card-info">
                        <strong>{g.name}</strong>
                        <span className="guess-value">guessed {g.guess}</span>
                      </div>
                      <div className="card-meta">
                        <span className="muted">{new Date(g.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <button className="vote-btn-large" onClick={() => voteForGuess(g.id)}>
                      <span className="vote-icon">👍</span>
                      <span className="vote-count">{g.votes || 0}</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section 
            className="community-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="section-header">
              <h2>📸 Community Photos</h2>
              <span className="count-badge">{images.length} photo{images.length !== 1 ? 's' : ''}</span>
            </div>
            <p className="muted">Shared moments from our community</p>
            
            {images.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📷</span>
                <p>No photos shared yet — share your first memory!</p>
              </div>
            ) : (
              <div className="photo-gallery">
                {images.map((src, idx) => (
                  <motion.div 
                    key={idx} 
                    className="gallery-item"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <img src={src} alt={`Community memory ${idx + 1}`} />
                    <div className="photo-overlay">
                      <span>Photo {idx + 1}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default CommunityDashboardPage;
