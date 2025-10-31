import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextInput from '../components/common/TextInput.jsx';
import Button from '../components/common/Button.jsx';
import Loader from '../components/common/Loader.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import './InviteEntryPage.css';

const InviteEntryPage = () => {
  const navigate = useNavigate();
  const { lookupGuest, error, loading, guest } = useGuest();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!code.trim()) {
      setLocalError('Please enter your invite code');
      return;
    }

    const guestData = await lookupGuest(code);
    if (guestData) {
      navigate('/invite');
    }
  };

  return (
    <div className="page-panel invite-entry">
      <motion.div className="invite-entry__content" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <span className="badge">Luxury engagement soirée</span>
        <h1 className="page-title">Bismillah, Welcome</h1>
        <p className="page-subtitle">
          Step through silken curtains into an evening of devotion, elegance, and celebration for Razia &amp; Abduraziq.
        </p>

        <form className="invite-form" onSubmit={handleSubmit}>
          <TextInput
            label="Invite Code"
            placeholder="Enter your personal code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            error={localError || error}
            autoFocus
            autoComplete="one-time-code"
          />
          <Button type="submit" variant="primary" size="lg" loading={loading}>
            Unlock Invitation
          </Button>
        </form>

        {guest && (
          <motion.div className="invite-entry__preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-muted">Welcome back, {guest.guestName}. Continue to your invitation experience.</p>
            <Button variant="ghost" size="md" onClick={() => navigate('/invite')}>
              Continue Experience
            </Button>
          </motion.div>
        )}
      </motion.div>

      {loading && <Loader label="Validating invite code" />}
    </div>
  );
};

export default InviteEntryPage;
