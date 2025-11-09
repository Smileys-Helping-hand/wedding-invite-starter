import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Loader from '../components/common/Loader.jsx';
import InviteCodePrompt from '../components/InviteCodePrompt.jsx';
import EnvelopeStage from '../components/experience/EnvelopeStage.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import { fadeIn } from '../utils/motionPresets.js';
import './InviteEntryPage.css';

const InviteEntryPage = () => {
  const navigate = useNavigate();
  const { lookupGuest, error, loading } = useGuest();

  const ENVELOPE_KEY = 'envelope_opened';

  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [hasEnvelopePlayed, setHasEnvelopePlayed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(ENVELOPE_KEY) === 'true';
    } catch (err) {
      return false;
    }
  });
  const redirectTimerRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!code.trim()) {
      setLocalError('Please enter your invite code');
      return;
    }

    const guestData = await lookupGuest(code);
    if (guestData) {
      if (!hasEnvelopePlayed) {
        try {
          window.localStorage.setItem(ENVELOPE_KEY, 'true');
        } catch (err) {
          /* ignore persistence issues */
        }

        setHasEnvelopePlayed(true);
        setShowEnvelope(true);
        redirectTimerRef.current = window.setTimeout(() => {
          navigate('/invite');
        }, 6000);
      } else {
        navigate('/invite');
      }
    } else {
      setLocalError('Invalid invite code');
    }
  };

  useEffect(
    () => () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    },
    []
  );

  if (loading) return <Loader />;

  return (
    <motion.div className="invite-entry-wrapper" {...fadeIn} exit={{ opacity: 0 }}>
      {showEnvelope ? (
        <EnvelopeStage autoOpen />
      ) : (
        <InviteCodePrompt
          code={code}
          setCode={setCode}
          onSubmit={handleSubmit}
          error={localError || error}
        />
      )}
    </motion.div>
  );
};

export default InviteEntryPage;
