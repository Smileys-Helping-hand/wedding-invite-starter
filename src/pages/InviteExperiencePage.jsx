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
import {
  ENVELOPE_KEY,
  EXPERIENCE_PHASES,
  RSVP_STATUSES,
  ensureEnvelopeKey,
} from '../utils/constants.js';
import { fadeIn, fadeUp } from '../utils/motionPresets.js';
import './InviteExperiencePage.css';

ensureEnvelopeKey();

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
  const [phase, setPhase] = useState(() => {
    if (typeof window === 'undefined') return EXPERIENCE_PHASES.envelope;
    try {
      return window.localStorage.getItem(ENVELOPE_KEY) === 'true'
        ? EXPERIENCE_PHASES.invitation
        : EXPERIENCE_PHASES.envelope;
    } catch (err) {
      console.warn('Unable to read envelope playback state', err);
      return EXPERIENCE_PHASES.envelope;
    }
  });
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
  const [showRSVPSection, setShowRSVPSection] = useState(false);
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
    if (phase !== EXPERIENCE_PHASES.invitation) {
      setShowRSVPSection(false);
      return;
    }

    const node = experienceRef.current;
    if (node) {
      window.requestAnimationFrame(() => {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const timer = window.setTimeout(() => {
      setShowRSVPSection(true);
    }, 400);

    return () => window.clearTimeout(timer);
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
            <EnvelopeStage onReveal={() => setPhase(EXPERIENCE_PHASES.invitation)} />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === EXPERIENCE_PHASES.invitation && (
        <motion.div className="experience-content" {...fadeUp}>
          <motion.h2 className="invite-greeting" {...fadeIn}>
            Dearest {guest?.firstName ?? guest?.primaryGuest ?? 'Guest'},
          </motion.h2>
          <InviteDetails
            onRSVP={handleStatusRSVP}
            loading={isSubmitting || guestLoading}
          />

          {showRSVPSection && (
            <motion.section className="rsvp-form" {...fadeIn}>
              <div className="rsvp-form__header">
                <h2 className="section-title">Share RSVP Details</h2>
                <ShareCardButton />
              </div>
              {isOffline && (
                <p className="rsvp-offline">
                  ✨ Love transcends connection — reconnecting soon… RSVP changes will
                  sync automatically once you&apos;re back online.
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
            </motion.section>
          )}

          {showMemoryWall && <MemoryWall />}
        </motion.div>
      )}

      {(guestLoading || isSubmitting) && <Loader label="Saving your RSVP" />}
    </div>
  );
};

export default InviteExperiencePage;
