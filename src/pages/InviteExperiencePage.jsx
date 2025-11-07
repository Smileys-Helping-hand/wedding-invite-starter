import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';

import EnvelopeStage from '../components/experience/EnvelopeStage.jsx';
import InviteDetails from '../components/experience/InviteDetails.jsx';
import MemoryWall from '../components/memory/MemoryWall.jsx';
import RSVPForm from '../components/RSVPForm.jsx';
import ShareCardButton from '../components/ShareCardButton.jsx';
import CountdownSplash from '../components/CountdownSplash.jsx';
import Loader from '../components/common/Loader.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';
import { useTheme } from '../providers/ThemeProvider.jsx';
import { useRSVP } from '../hooks/useRSVP.js';
import { EXPERIENCE_PHASES, RSVP_STATUSES } from '../utils/constants.js';
import './InviteExperiencePage.css';

const InviteExperiencePage = () => {
  const { guest, loading: guestLoading } = useGuest();
  const { theme } = useTheme();
  const {
    submitRSVP,
    isSubmitting,
    error: rsvpError,
    success: rsvpSuccess,
    isOffline,
  } = useRSVP();
  const [phase, setPhase] = useState(EXPERIENCE_PHASES.envelope);
  const [showCountdown, setShowCountdown] = useState(
    () => theme?.toggles?.countdownSplash !== false
  );
  const [formState, setFormState] = useState(() => ({
    status: guest?.rsvpStatus ?? RSVP_STATUSES.pending,
    householdCount: guest?.household ?? guest?.householdCount ?? 1,
    message: guest?.notes ?? '',
    plusOneName: guest?.plusOneName ?? guest?.partnerName ?? '',
  }));
  const [inlineFeedback, setInlineFeedback] = useState('');
  const experienceRef = useRef(null);

  const shouldRedirect = !guest;

  useEffect(() => {
    setFormState({
      status: guest?.rsvpStatus ?? RSVP_STATUSES.pending,
      householdCount: guest?.household ?? guest?.householdCount ?? 1,
      message: guest?.notes ?? '',
      plusOneName: guest?.plusOneName ?? guest?.partnerName ?? '',
    });
  }, [
    guest?.rsvpStatus,
    guest?.notes,
    guest?.household,
    guest?.householdCount,
    guest?.plusOneName,
    guest?.partnerName,
  ]);

  useEffect(() => {
    setShowCountdown(theme?.toggles?.countdownSplash !== false);
  }, [theme?.toggles?.countdownSplash]);

  const handleStatusRSVP = async (status) => {
    const payload = { ...formState, status };
    setFormState(payload);
    setInlineFeedback('');
    try {
      await submitRSVP(payload);
      setInlineFeedback(
        status === RSVP_STATUSES.confirmed
          ? 'Your RSVP has been received with joy.'
          : 'Thank you for letting us know.'
      );
    } catch (err) {
      setInlineFeedback(err.message ?? 'We could not save your response.');
    }
  };

  const handleFormSubmit = async (nextState) => {
    try {
      await submitRSVP(nextState);
      setInlineFeedback('JazakAllahu khairan — your RSVP is saved.');
      setFormState(nextState);
    } catch (err) {
      setInlineFeedback(err.message ?? 'Unable to save RSVP.');
    }
  };

  const showMemoryWall = formState.status === RSVP_STATUSES.confirmed;

  useEffect(() => {
    if (phase !== EXPERIENCE_PHASES.invitation) return;
    const node = experienceRef.current;
    if (!node) return;

    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [phase]);

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-panel invite-experience" ref={experienceRef}>
      <CountdownSplash open={showCountdown} onContinue={() => setShowCountdown(false)} />
      <AnimatePresence mode="wait">
        {!showCountdown && phase === EXPERIENCE_PHASES.envelope && (
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
            onRSVP={handleStatusRSVP}
            loading={isSubmitting || guestLoading}
          />

          <section className="rsvp-form">
            <div className="rsvp-form__header">
              <h2 className="section-title">Share RSVP Details</h2>
              <ShareCardButton />
            </div>
            {isOffline && (
              <p className="rsvp-offline">
                You are offline — RSVP changes will sync once reconnected.
              </p>
            )}
            <RSVPForm
              value={formState}
              onChange={setFormState}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              error={rsvpError}
              success={rsvpSuccess}
              disabled={guestLoading}
            />
            {inlineFeedback && <p className="rsvp-feedback">{inlineFeedback}</p>}
          </section>

          {showMemoryWall && <MemoryWall />}
        </motion.div>
      )}

      {(guestLoading || isSubmitting) && <Loader label="Saving your RSVP" />}
    </div>
  );
};

export default InviteExperiencePage;
