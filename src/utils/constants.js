export const ENVELOPE_KEY = 'hs_hasOpenedEnvelope';

export function ensureEnvelopeKey() {
  if (typeof window === 'undefined') return;
  try {
    const legacy = window.localStorage.getItem('hasOpenedEnvelope');
    const current = window.localStorage.getItem(ENVELOPE_KEY);
    if (legacy && !current) {
      window.localStorage.setItem(ENVELOPE_KEY, legacy);
      window.localStorage.removeItem('hasOpenedEnvelope');
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Unable to migrate envelope key', err);
    }
  }
}

export const EVENT_DATE_GREGORIAN = new Date('2025-12-16T18:00:00+04:00');
export const EVENT_VENUE = {
  name: 'Legacy Events',
  addressLine1: 'Legacy Events, Schaapkraal Road, Ottery, Cape Town',
  addressLine2: '',
  gatheringTime: '4:30 PM for 5:00 PM',
  programTime: '',
};

export const RSVP_STATUSES = {
  confirmed: 'confirmed',
  pending: 'pending',
  declined: 'declined',
};

export const STORAGE_KEYS = {
  guest: 'lumina-invite-guest',
  audio: 'lumina-invite-audio',
  adminSession: 'lumina-admin-session',
  themeDraft: 'lumina-theme-draft',
  adminGuests: 'lumina-admin-guests',
};

export const EXPERIENCE_PHASES = {
  envelope: 'envelope',
  invitation: 'invitation',
  memories: 'memories',
};
