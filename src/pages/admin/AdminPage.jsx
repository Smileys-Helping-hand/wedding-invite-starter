import React, { useEffect, useState } from 'react';
import './AdminPage.css';

const AdminPage = () => {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('hs_admin_token') === 'verified') {
      setAuth(true);
    }
  }, []);

  const handleLogin = (event) => {
    event.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PASSWORD;

    if (!expected) {
      setError('⚠️ Admin password missing in .env file.');
      return;
    }

    if (password.trim() === expected) {
      localStorage.setItem('hs_admin_token', 'verified');
      setAuth(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  };

  if (auth) {
    return (
      <div className="admin-dashboard">
        <h1>Welcome back, Admin</h1>
        <p>You can now access guest lists, themes, and RSVPs.</p>
      </div>
    );
  }

  return (
    <form className="admin-login" onSubmit={handleLogin}>
      <h2>Admin Access</h2>
      <input
        type="password"
        value={password}
        placeholder="Enter admin password"
        onChange={(event) => setPassword(event.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
};

export default AdminPage;
