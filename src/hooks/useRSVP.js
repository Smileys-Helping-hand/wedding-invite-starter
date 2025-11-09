import { useCallback, useEffect, useState } from 'react';

import { useFirebase } from '../providers/FirebaseProvider.jsx';
import { useGuest } from '../providers/GuestProvider.jsx';

const defaultStatus = 'pending';

export const useRSVP = () => {
  const { submitRSVPResponse, getInvite } = useFirebase();
  const { guest, inviteCode, updateRSVP, lookupGuest } = useGuest();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const validateCode = useCallback(
    async (code) => {
      const trimmed = code?.trim();
      if (!trimmed) {
        throw new Error('Please enter your invite code.');
      }

      const guestRecord = await lookupGuest(trimmed);
      if (guestRecord) {
        return guestRecord;
      }

      if (getInvite) {
        const invite = await getInvite(trimmed.toLowerCase());
        if (invite) {
          return invite;
        }
      }

      throw new Error('Invite code not found.');
    },
    [lookupGuest, getInvite]
  );

  const submitRSVP = useCallback(
    async (form) => {
      if (!inviteCode) {
        throw new Error('Missing invite code.');
      }

      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      try {
        const updates = {
          rsvpStatus: form.status ?? defaultStatus,
          attending: form.status === 'confirmed',
          message: form.message?.slice(0, 240) ?? '',
          partySize: Number.parseInt(form.householdCount ?? '1', 10) || 1,
          guestNote: form.note?.slice(0, 240) ?? '',
          plusOneName: form.plusOneName?.slice(0, 120) ?? '',
        };

        await updateRSVP(form.status ?? defaultStatus, updates);
        await submitRSVPResponse?.(inviteCode, {
          code: inviteCode,
          guestName:
            guest?.primaryGuest ?? guest?.guestName ?? guest?.guestNames?.[0] ?? '',
          ...updates,
        });

        setSuccess(true);
        return updates;
      } catch (err) {
        setError(err.message ?? 'Unable to submit RSVP.');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [inviteCode, guest, updateRSVP, submitRSVPResponse]
  );

  return {
    guest,
    inviteCode,
    isSubmitting,
    error,
    success,
    submitRSVP,
    validateCode,
    isOffline,
  };
};

export default useRSVP;
