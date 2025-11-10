import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import InviteCodePrompt from '../components/InviteCodePrompt.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import './InviteEntryPage.css';

const InviteEntryPage = () => {
  const navigate = useNavigate();
  const { lookupGuest } = useGuest();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCodeSubmit = async (code) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter your invite code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const guest = await lookupGuest(trimmed);
      if (!guest) {
        setError('Invalid invite code. Please try again.');
        return;
      }

      try {
        localStorage.setItem('hs_hasOpenedEnvelope', 'false');
      } catch (storageError) {
        console.warn('Unable to reset envelope state', storageError);
      }

      setTimeout(() => navigate('/invite'), 800);
    } catch (err) {
      setError(err?.message ?? 'Unexpected error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-entry">
      <InviteCodePrompt onSubmit={handleCodeSubmit} error={error} loading={loading} />
    </div>
  );
};

export default InviteEntryPage;
