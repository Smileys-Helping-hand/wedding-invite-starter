import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import localGuests from '../data/local-guests.json';
import { useFirebase } from './FirebaseProvider.jsx';

const STORAGE_KEY = 'lumina-invite-guest';
const GuestContext = createContext();

export const useGuest = () => useContext(GuestContext);

const normaliseCode = (value) => value?.trim().toLowerCase();

export const GuestProvider = ({ children }) => {
  const { getGuest, saveRSVP } = useFirebase();
  const [inviteCode, setInviteCode] = useState('');
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.guest && parsed?.inviteCode) {
          setGuest(parsed.guest);
          setInviteCode(parsed.inviteCode);
        }
      }
    } catch (err) {
      console.warn('Failed to load guest from storage', err);
    }
  }, []);

  const persistGuest = (code, guestData) => {
    try {
      if (!guestData) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ inviteCode: code, guest: guestData })
      );
    } catch (err) {
      console.warn('Failed to persist guest locally', err);
    }
  };

  const findLocalGuest = (code) =>
    localGuests.find((entry) => normaliseCode(entry.code) === code) || null;

  const hydrateGuest = (code, data) => {
    const enriched = {
      ...data,
      partnerName: data.partnerName ?? undefined,
      household: data.household ?? 1,
      rsvpStatus: data.rsvpStatus ?? 'pending',
      lastUpdated: new Date().toISOString(),
    };
    setInviteCode(code);
    setGuest(enriched);
    persistGuest(code, enriched);
    return enriched;
  };

  const clearGuest = () => {
    setInviteCode('');
    setGuest(null);
    setError(null);
    persistGuest('', null);
  };

  const lookupGuest = async (code) => {
    if (!code) {
      setError('Please enter an invite code.');
      return null;
    }

    const normalised = normaliseCode(code);
    setLoading(true);
    setError(null);

    try {
      let remoteGuest = null;
      if (getGuest) {
        remoteGuest = await getGuest(normalised);
      }

      if (remoteGuest) {
        return hydrateGuest(normalised, remoteGuest);
      }

      const fallbackGuest = findLocalGuest(normalised);
      if (fallbackGuest) {
        return hydrateGuest(normalised, fallbackGuest);
      }

      setError('We could not find that invite code.');
      return null;
    } catch (err) {
      console.error('Failed to lookup guest', err);
      setError('Something went wrong. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRSVP = async (status, additional = {}) => {
    if (!guest || !inviteCode) return null;

    const updates = {
      rsvpStatus: status,
      ...additional,
      lastUpdated: new Date().toISOString(),
    };

    const previousGuest = guest;
    const mergedGuest = { ...guest, ...updates };
    setGuest(mergedGuest);
    persistGuest(inviteCode, mergedGuest);

    try {
      if (saveRSVP) {
        await saveRSVP(inviteCode, updates);
      }
      return mergedGuest;
    } catch (err) {
      setGuest(previousGuest);
      persistGuest(inviteCode, previousGuest);
      throw err;
    }
  };

  const value = useMemo(
    () => ({
      inviteCode,
      guest,
      loading,
      error,
      lookupGuest,
      updateRSVP,
      clearGuest,
    }),
    [inviteCode, guest, loading, error]
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
};
