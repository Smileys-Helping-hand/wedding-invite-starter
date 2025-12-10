import { useState } from 'react';

const GamesForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [guess, setGuess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guess) return;
    onSubmit(name, guess);
    setName('');
    setGuess('');
  };

  return (
    <form onSubmit={handleSubmit} className="games-form">
      <input placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Guess (1-10)" value={guess} onChange={(e) => setGuess(e.target.value)} />
      <button type="submit" className="btn">Place Guess</button>
    </form>
  );
};

export default GamesForm;
