import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import EnvelopeStage from '../components/experience/EnvelopeStage.jsx';
import InviteDetails from '../components/experience/InviteDetails.jsx';
import MemoryWallPlaceholder from '../components/experience/MemoryWallPlaceholder.jsx';
import TextInput from '../components/common/TextInput.jsx';
import Button from '../components/common/Button.jsx';
import Loader from '../components/common/Loader.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import { useTheme } from '../providers/ThemeProvider.jsx';
import { EXPERIENCE_PHASES, RSVP_STATUSES } from '../utils/constants.js';
import './InviteExperiencePage.css';

const InviteExperiencePage = () => {
  const { guest, updateRSVP, loading: guestLoading } = useGuest();
  const { theme } = useTheme();
  const [phase, setPhase] = useState(EXPERIENCE_PHASES.envelope);
  const [message, setMessage] = useState(guest?.notes ?? '');
  const [additionalGuests, setAdditionalGuests] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const experienceRef = useRef(null);

  if (!guest) {
    return <Navigate to="/" replace />;
  }

  const handleRSVP = async (status) => {
    setIsSaving(true);
    setFeedback('');
    try {
      await updateRSVP(status, {
        notes: message,
        additionalGuests: Number(additionalGuests) || 0,
      });
      setFeedback(
        status === RSVP_STATUSES.confirmed
          ? 'Your RSVP has been received with joy.'
          : 'Thank you for letting us know.'
      );
    } catch (err) {
      setFeedback('We could not save your response. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const showMemoryWall = guest?.rsvpStatus === RSVP_STATUSES.confirmed;

  useEffect(() => {
    if (phase !== EXPERIENCE_PHASES.invitation) return;
    const node = experienceRef.current;
    if (!node) return;

    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [phase]);

  return (
    <div className="page-panel invite-experience" ref={experienceRef}>
      <AnimatePresence mode="wait">
        {phase === EXPERIENCE_PHASES.envelope && (
          <motion.div
            key="envelope"
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <EnvelopeStage
              onOpened={() => setPhase(EXPERIENCE_PHASES.invitation)}
              sealVariant={
                guest?.sealVariant ??
                guest?.waxSealVariant ??
                theme?.assets?.waxSealVariant ??
                'default'
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === EXPERIENCE_PHASES.invitation && (
        <motion.div
          className="experience-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <InviteDetails
            onRSVP={handleRSVP}
            loading={isSaving || guestLoading}
          />

          <section className="rsvp-form">
            <h2 className="section-title">Share RSVP Details</h2>
            <div className="grid-two">
              <TextInput
                label="Additional guests"
                type="number"
                min="0"
                value={additionalGuests}
                onChange={(event) => setAdditionalGuests(event.target.value)}
                hint="Include children or family members attending with you"
              />
              <TextInput
                label="Message for the couple"
                as="textarea"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                hint="Share a dua, dietary note, or warm wishes"
              />
            </div>
            <div className="rsvp-actions">
              <Button variant="ghost" size="md" onClick={() => handleRSVP(guest.rsvpStatus)} loading={isSaving}>
                Save Notes
              </Button>
            </div>
            {feedback && <p className="rsvp-feedback">{feedback}</p>}
          </section>

          {showMemoryWall && <MemoryWallPlaceholder />}
        </motion.div>
      )}

      {(guestLoading || isSaving) && <Loader label="Saving your RSVP" />}
    </div>
  );
};

export default InviteExperiencePage;
