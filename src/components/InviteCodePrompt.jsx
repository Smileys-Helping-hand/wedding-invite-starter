import React, { useEffect, useRef, useState } from 'react';

import './InviteCodePrompt.css';

const InviteCodePrompt = ({ onSubmit, error, loading }) => {
  const [code, setCode] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    onSubmit?.(code);
  };

  return (
    <form className="invite-code-card" onSubmit={handleSubmit} aria-label="Enter invite code">
      <h2>Enter Your Invite Code</h2>
      <input
        ref={inputRef}
        type="text"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="e.g. A123"
        disabled={loading}
        aria-required="true"
      />
      {error && (
        <p role="alert" style={{ color: 'salmon', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
      <button type="submit" disabled={loading}>
        {loading ? 'Validating...' : 'Unlock Invitation'}
      </button>
    </form>
  );
};

export default InviteCodePrompt;
