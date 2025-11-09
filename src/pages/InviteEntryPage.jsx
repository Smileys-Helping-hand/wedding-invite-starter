import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Loader from '../components/common/Loader.jsx';
import InviteCodePrompt from '../components/InviteCodePrompt.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import './InviteEntryPage.css';

const InviteEntryPage = () => {
  const navigate = useNavigate();
  const { lookupGuest, error, loading } = useGuest();

  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    if (revealing) return;
    const input = document.querySelector('input#inviteCode');
    input?.focus();
  }, [revealing]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    if (!code.trim()) {
      setLocalError('Please enter your invite code');
      return;
    }

    const guestData = await lookupGuest(code);
    if (guestData) {
      setRevealing(true);
      window.setTimeout(() => navigate('/invite'), 800);
    } else {
      setLocalError('Invalid invite code. Please check and try again.');
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-b from-[#fffdf8] to-[#f8f5ec]">
      {loading && <Loader />}

      <motion.div
        className="invite-entry-wrapper relative z-50 flex flex-col items-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {revealing ? (
          <Loader label="Preparing your invitation" />
        ) : (
          <InviteCodePrompt
            code={code}
            setCode={setCode}
            handleSubmit={handleSubmit}
            error={localError || error}
          />
        )}
      </motion.div>
    </main>
  );
};

export default InviteEntryPage;
