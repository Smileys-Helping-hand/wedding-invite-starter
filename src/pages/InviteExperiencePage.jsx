import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import CurtainReveal from '../components/experience/CurtainReveal.jsx';
import BismillahReveal from '../components/experience/BismillahReveal.jsx';
import EnvelopeStage from '../components/experience/EnvelopeStage.jsx';
import InviteDetails from '../components/experience/InviteDetails.jsx';
import MemoryWallPlaceholder from '../components/experience/MemoryWallPlaceholder.jsx';
import TextInput from '../components/common/TextInput.jsx';
import Button from '../components/common/Button.jsx';
import Loader from '../components/common/Loader.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import { EXPERIENCE_PHASES, RSVP_STATUSES } from '../utils/constants.js';
import './InviteExperiencePage.css';

const InviteExperiencePage = () => {
  const { guest, updateRSVP, loading: guestLoading } = useGuest();
  const [phase, setPhase] = useState(EXPERIENCE_PHASES.curtains);
  const [message, setMessage] = useState(guest?.notes ?? '');
  const [additionalGuests, setAdditionalGuests] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

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

  return (
    <div className="page-panel invite-experience">
      <AnimatePresence mode="wait">
        {phase === EXPERIENCE_PHASES.curtains && (
          <motion.div key="curtains" exit={{ opacity: 0 }}>
            <CurtainReveal onComplete={() => setPhase(EXPERIENCE_PHASES.bismillah)} />
          </motion.div>
        )}

        {phase === EXPERIENCE_PHASES.bismillah && (
          <motion.div key="bismillah" exit={{ opacity: 0 }}>
            <BismillahReveal onComplete={() => setPhase(EXPERIENCE_PHASES.envelope)} />
          </motion.div>
        )}

        {phase === EXPERIENCE_PHASES.envelope && (
          <motion.div key="envelope" exit={{ opacity: 0 }}>
            <EnvelopeStage onOpened={() => setPhase(EXPERIENCE_PHASES.invitation)} />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === EXPERIENCE_PHASES.invitation && (
        <div className="experience-content">
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
        </div>
      )}

      {(guestLoading || isSaving) && <Loader label="Saving your RSVP" />}
    </div>
  );
};

export default InviteExperiencePage;
