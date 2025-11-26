import { RSVP_STATUSES } from './constants.js';

const CHECKIN_STORAGE_KEY = 'hs_event_checkins';
const CHECKIN_META_STORAGE_KEY = 'hs_event_meta';
const CHECKIN_CHANNEL = 'hs_checkins_channel';
const EVENT_DAY_MODE_KEY = 'hs_event_mode';
const EVENT_DAY_MODE_KEY = 'hs_eventday_enabled';

const normalizeGuest = (guest = {}) => {
  const guestNames = Array.isArray(guest.guestNames)
    ? guest.guestNames.filter(Boolean).map((value) => value.trim())
    : [guest.guestName, guest.partnerName].filter(Boolean).map((value) => value.trim());

  const primaryGuest = guestNames[0] ?? '';
  const partnerName = guestNames[1] ?? null;
  const householdCount = Number.isFinite(guest.householdCount)
    ? guest.householdCount
    : Number.isFinite(guest.household)
      ? guest.household
      : Math.max(guestNames.length, 1);

  return {
    code: guest.code?.toUpperCase(),
    guestNames,
    primaryGuest,
    partnerName,
    householdCount,
    householdId: guest.householdId ?? null,
    contact: guest.contact ?? '',
    rsvpStatus: guest.rsvpStatus ?? RSVP_STATUSES.pending,
    notes: guest.notes ?? '',
    additionalGuests: guest.additionalGuests ?? 0,
    lastUpdated: guest.lastUpdated ?? null,
    role: guest.role ?? 'guest',
    vip: Boolean(guest.vip),
  };
};

const normaliseGuest = normalizeGuest;

const lettersOnly = (value = '') => value.replace(/[^a-z]/gi, '').toUpperCase();

const computeNextHouseholdId = (entries = []) => {
  const highest = entries.reduce((acc, guest) => {
    const match = /H(\d+)/i.exec(guest.householdId ?? '');
    if (!match) return acc;
    const numeric = Number(match[1]);
    return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
  }, 0);

  return `H${String(highest + 1).padStart(3, '0')}`;
};

const assignHouseholdId = (entries = [], preferredId) => {
  if (preferredId?.trim()) return preferredId.trim().toUpperCase();
  return computeNextHouseholdId(entries);
};

const computeInviteCode = (entries = [], primaryName = '', partnerName = '', preferredCode, excludeCode) => {
  const used = new Set(entries.map((guest) => guest.code?.toUpperCase()).filter(Boolean));
  if (excludeCode) {
    used.delete(excludeCode.toUpperCase());
  }

  if (preferredCode) {
    const candidate = preferredCode.toUpperCase();
    if (!used.has(candidate)) {
      return candidate;
    }
  }

  const baseLetters = lettersOnly(primaryName) || lettersOnly(partnerName) || 'RAZI';
  const prefix = (baseLetters.length >= 4 ? baseLetters.slice(0, 4) : baseLetters.padEnd(4, 'A')).toUpperCase();
  let counter = entries.length + 1;
  let candidate = `${prefix}${String(counter).padStart(4, '0')}`;

  while (used.has(candidate)) {
    counter += 1;
    candidate = `${prefix}${String(counter).padStart(4, '0')}`;
  }

  return candidate;
};

const generateInviteCode = computeInviteCode;

const buildGuestPayload = (payload, options) => {
  const names = payload.guestNames?.length ? payload.guestNames : [payload.guestName, payload.partnerName];
  const guestNames = names.filter(Boolean).map((value) => value.trim());
  const primary = guestNames[0] ?? '';
  const partner = guestNames[1] ?? '';
  const code = computeInviteCode(options.entries, primary, partner, payload.code, options.excludeCode);
  const householdId = assignHouseholdId(options.entries, payload.householdId ?? options.currentHouseholdId);
  const timestamp = new Date().toISOString();

  return normalizeGuest({
    ...payload,
    code,
    guestNames,
    householdId,
    householdCount: Math.max(Number(payload.householdCount) || guestNames.length || 1, guestNames.length || 1),
    contact: payload.contact ?? '',
    notes: payload.notes ?? '',
    lastUpdated: timestamp,
    role: payload.role ?? 'guest',
  });
};

const normaliseCheckInRecord = (record = {}) => ({
  checkedIn: Boolean(record.checkedIn),
  checkedInAt: record.checkedInAt ?? null,
});

const readStoredCheckIns = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CHECKIN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce((acc, [code, value]) => {
      const key = code?.toUpperCase();
      if (!key) return acc;
      acc[key] = normaliseCheckInRecord(value);
      return acc;
    }, {});
  } catch (err) {
    return {};
  }
};

const persistCheckIns = (map = {}) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    /* ignore */
  }
};

const ensureCheckInsForEntries = (entries = [], existing = {}) => {
  const next = { ...existing };
  entries.forEach((guest) => {
    const code = guest.code?.toUpperCase();
    if (!code) return;
    if (!next[code]) {
      next[code] = normaliseCheckInRecord({ checkedIn: false, checkedInAt: null });
    }
  });
  return next;
};

const toggleCheckInRecord = (map = {}, code) => {
  const key = code?.toUpperCase();
  if (!key) return map;
  const current = map[key] ?? normaliseCheckInRecord();
  const checkedIn = !current.checkedIn;
  return {
    ...map,
    [key]: {
      checkedIn,
      checkedInAt: checkedIn ? new Date().toISOString() : null,
    },
  };
};

const applyCheckInState = (map = {}, code, state) => {
  const key = code?.toUpperCase();
  if (!key) return map;
  const next = {
    ...map,
    [key]: {
      checkedIn: Boolean(state.checkedIn),
      checkedInAt: state.checkedIn ? state.checkedInAt ?? new Date().toISOString() : null,
    },
  };
  return next;
};

const clearCheckInStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CHECKIN_STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
};

const readStoredMeta = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CHECKIN_META_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce((acc, [code, value]) => {
      const key = code?.toUpperCase();
      if (!key) return acc;
      acc[key] = {
        vip: Boolean(value.vip),
        notes: typeof value.notes === 'string' ? value.notes : undefined,
      };
      return acc;
    }, {});
  } catch (err) {
    return {};
  }
};

const persistMeta = (map = {}) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHECKIN_META_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    /* ignore */
  }
};

const updateGuestMeta = (map = {}, code, changes = {}) => {
  const key = code?.toUpperCase();
  if (!key) return map;
  const current = map[key] ?? {};
  return {
    ...map,
    [key]: {
      ...current,
      ...changes,
    },
  };
};

const clearMetaStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CHECKIN_META_STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
};

const isEventDayModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  try {
    const value = window.localStorage.getItem(EVENT_DAY_MODE_KEY);
    if (value === null) return false;
    return value === 'on' || value === 'true';
    return window.localStorage.getItem(EVENT_DAY_MODE_KEY) === 'true';
  } catch (err) {
    return false;
  }
};

const setEventDayModeEnabled = (enabled) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EVENT_DAY_MODE_KEY, enabled ? 'on' : 'off');
    window.dispatchEvent(new Event('hs:event-mode-change'));
    if (enabled) {
      window.localStorage.setItem(EVENT_DAY_MODE_KEY, 'true');
    } else {
      window.localStorage.removeItem(EVENT_DAY_MODE_KEY);
    }
  } catch (err) {
    /* ignore */
  }
};

const applyMetaToEntries = (entries = [], meta = {}) =>
  entries.map((guest) => {
    const overlay = meta[guest.code?.toUpperCase()] ?? {};
    return {
      ...guest,
      vip: overlay.vip ?? guest.vip,
      notes: typeof overlay.notes === 'string' ? overlay.notes : guest.notes,
    };
  });

const formatCheckInTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (err) {
    return '';
  }
};

const formatRelativeCheckInTime = (value) => {
  if (!value) return '';
  try {
    const timestamp = new Date(value).getTime();
    const now = Date.now();
    const diffMs = Math.max(now - timestamp, 0);
    const roundedMs = Math.round(diffMs / 15000) * 15000; // smooth to 15s intervals
    const diffMinutes = Math.floor(roundedMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffMinutes < 1) return 'Arrived moments ago';
    if (diffMinutes === 1) return 'Arrived 1 minute ago';
    if (diffMinutes < 60) return `Arrived ${diffMinutes} mins ago`;
    if (diffHours === 1) return 'Arrived 1 hour ago';
    if (diffHours < 6) return `Arrived ${diffHours} hours ago`;
    return `Arrived at ${formatCheckInTime(value)}`;
  } catch (err) {
    return '';
  }
};

const encodeCsvValue = (value) =>
  `"${String(value ?? '')
    .replace(/"/g, '""')
    .replace(/\r?\n|\r/g, ' ')}"`;

const parseCheckInPayload = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  if (upper.includes('CHECKIN:')) {
    return upper.split('CHECKIN:').pop().trim();
  }
  return upper;
};

const computeArrivalStats = (entries = [], checkIns = {}) => {
  const summary = entries.reduce(
    (acc, guest) => {
      const record = checkIns[guest.code?.toUpperCase()] ?? {};
      const householdTotal = (guest.householdCount ?? 0) + (guest.additionalGuests ?? 0);
      acc.total += 1;

      if (guest.rsvpStatus === RSVP_STATUSES.confirmed) {
        acc.confirmed += 1;
        acc.guestsAttending += householdTotal;
      } else if (guest.rsvpStatus === RSVP_STATUSES.pending) {
        acc.pending += 1;
      } else if (guest.rsvpStatus === RSVP_STATUSES.declined) {
        acc.declined += 1;
      }

      if (record.checkedIn) {
        acc.checkedIn += 1;
        acc.guestsArrived += householdTotal;
      }

      return acc;
    },
    {
      total: 0,
      confirmed: 0,
      pending: 0,
      declined: 0,
      guestsAttending: 0,
      checkedIn: 0,
      guestsArrived: 0,
    }
  );

  const awaitingArrival = Math.max(summary.total - summary.declined - summary.checkedIn, 0);

  return {
    ...summary,
    pendingArrival: awaitingArrival,
    stillExpected: Math.max(summary.guestsAttending - summary.guestsArrived, 0),
  };
};

const sortEntriesForEventDay = (entries = [], checkIns = {}) =>
  [...entries].sort((a, b) => {
    const recordA = checkIns[a.code?.toUpperCase()] ?? {};
    const recordB = checkIns[b.code?.toUpperCase()] ?? {};
    const arrivedA = Boolean(recordA.checkedIn);
    const arrivedB = Boolean(recordB.checkedIn);
    if (arrivedA && arrivedB) {
      const timeA = recordA.checkedInAt ? new Date(recordA.checkedInAt).getTime() : 0;
      const timeB = recordB.checkedInAt ? new Date(recordB.checkedInAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
    }
    if (arrivedA !== arrivedB) return arrivedB - arrivedA;
    return a.primaryGuest.localeCompare(b.primaryGuest);
  });

const broadcastEvent = (type, payload) => {
  if (typeof window === 'undefined') return;
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHECKIN_CHANNEL);
      channel.postMessage({ type, payload });
      channel.close();
    }
  } catch (err) {
    /* ignore */
  }
};

const broadcastCheckIns = (map = {}) => {
  persistCheckIns(map);
  broadcastEvent('checkins:update', map);
};

const broadcastMeta = (map = {}) => {
  persistMeta(map);
  broadcastEvent('meta:update', map);
};

const broadcastReset = () => {
  clearCheckInStorage();
  clearMetaStorage();
  broadcastEvent('checkins:reset');
};

const subscribeToEventState = (entries = [], { onCheckIns, onMeta }) => {
  const syncCheckIns = () => {
    if (!onCheckIns) return;
    onCheckIns((prev) => ensureCheckInsForEntries(entries, readStoredCheckIns() || prev));
  };
  const syncMeta = () => {
    if (!onMeta) return;
    onMeta(readStoredMeta());
  };

  const storageHandler = (event) => {
    if (event.key === CHECKIN_STORAGE_KEY) {
      syncCheckIns();
    }
    if (event.key === CHECKIN_META_STORAGE_KEY) {
      syncMeta();
    }
  };

  const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel(CHECKIN_CHANNEL)
    : null;

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler);
  }
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      if (event?.data?.type === 'checkins:update') {
        syncCheckIns();
      }
      if (event?.data?.type === 'checkins:reset') {
        syncCheckIns();
        syncMeta();
      }
      if (event?.data?.type === 'meta:update') {
        syncMeta();
      }
    };
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageHandler);
    }
    if (broadcastChannel) {
      broadcastChannel.close();
    }
  };
};

export {
  normalizeGuest,
  normaliseGuest,
  lettersOnly,
  computeNextHouseholdId,
  assignHouseholdId,
  computeInviteCode,
  generateInviteCode,
  buildGuestPayload,
  readStoredCheckIns,
  persistCheckIns,
  ensureCheckInsForEntries,
  toggleCheckInRecord,
  applyCheckInState,
  clearCheckInStorage,
  readStoredMeta,
  persistMeta,
  updateGuestMeta,
  clearMetaStorage,
  applyMetaToEntries,
  formatCheckInTime,
  formatRelativeCheckInTime,
  encodeCsvValue,
  computeArrivalStats,
  sortEntriesForEventDay,
  broadcastCheckIns,
  broadcastMeta,
  broadcastReset,
  subscribeToEventState,
  CHECKIN_STORAGE_KEY,
  CHECKIN_META_STORAGE_KEY,
  EVENT_DAY_MODE_KEY,
  isEventDayModeEnabled,
  setEventDayModeEnabled,
  parseCheckInPayload,
};
