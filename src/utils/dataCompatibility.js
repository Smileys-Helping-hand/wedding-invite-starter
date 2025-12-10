/**
 * Data Compatibility Layer
 * 
 * Ensures backward compatibility between existing Firebase data (lumina-* keys)
 * and new event day features (hs_* keys). This prevents any disruption to
 * existing guest data, RSVPs, and admin sessions when deploying new features.
 */

// Existing production keys (DO NOT CHANGE - used by live site)
export const PRODUCTION_KEYS = {
  guest: 'lumina-invite-guest',
  audio: 'lumina-invite-audio',
  adminSession: 'lumina-admin-session',
  themeDraft: 'lumina-theme-draft',
  adminGuests: 'lumina-admin-guests',
};

// New event day feature keys (separate namespace to avoid conflicts)
export const EVENT_DAY_KEYS = {
  checkins: 'hs_event_checkins',
  checkInMeta: 'hs_event_meta',
  memoryWall: 'hs_memory_wall_images',
  games: 'hs_memory_wall_games',
  customLayout: 'hs_custom_layout',
  eventDayEnabled: 'hs_eventday_enabled',
  staffRole: 'hs_staff_role',
};

// Firebase collections (existing structure - DO NOT CHANGE)
export const FIREBASE_COLLECTIONS = {
  guests: 'guests',              // Existing: guest RSVP data
  config: 'config',              // Existing: theme configuration
  adminLogs: 'adminLogs',        // Existing: admin activity logs
  // New collections for event day (optional, fallback to localStorage)
  eventPhotos: 'eventPhotos',    // New: event day photos (optional)
  eventGuesses: 'eventGuesses',  // New: games/guesses (optional)
  checkIns: 'checkIns',          // New: arrival tracking (optional)
};

/**
 * Check if localStorage key belongs to production data
 * @param {string} key - localStorage key
 * @returns {boolean} - true if production key
 */
export const isProductionKey = (key) => {
  return Object.values(PRODUCTION_KEYS).includes(key);
};

/**
 * Check if localStorage key belongs to new event day features
 * @param {string} key - localStorage key
 * @returns {boolean} - true if event day key
 */
export const isEventDayKey = (key) => {
  return Object.values(EVENT_DAY_KEYS).includes(key);
};

/**
 * Migrate data structure if needed (handles version compatibility)
 * @param {string} key - storage key
 * @param {any} data - stored data
 * @returns {any} - migrated data
 */
export const migrateDataIfNeeded = (key, data) => {
  if (!data) return data;

  // Guest data migration (if structure changed)
  if (key === PRODUCTION_KEYS.guest && typeof data === 'object') {
    return {
      inviteCode: data.inviteCode || '',
      guest: {
        ...data.guest,
        // Ensure backward compatibility with existing fields
        primaryGuest: data.guest?.primaryGuest || data.guest?.guestNames?.[0] || '',
        guestNames: data.guest?.guestNames || [data.guest?.primaryGuest || ''],
        householdCount: data.guest?.householdCount ?? data.guest?.household ?? 1,
        rsvpStatus: data.guest?.rsvpStatus || 'pending',
        additionalGuests: data.guest?.additionalGuests ?? 0,
        contact: data.guest?.contact || '',
        code: data.guest?.code || data.inviteCode || '',
      },
    };
  }

  // Admin guests migration (ensure array format)
  if (key === PRODUCTION_KEYS.adminGuests) {
    return Array.isArray(data) ? data : [];
  }

  return data;
};

/**
 * Safe localStorage getter with migration support
 * @param {string} key - storage key
 * @returns {any} - parsed and migrated data
 */
export const getSafeStorage = (key) => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateDataIfNeeded(key, parsed);
  } catch (err) {
    console.warn(`Failed to read localStorage key: ${key}`, err);
    return null;
  }
};

/**
 * Safe localStorage setter with validation
 * @param {string} key - storage key
 * @param {any} data - data to store
 */
export const setSafeStorage = (key, data) => {
  try {
    if (typeof window === 'undefined') return;
    
    // Prevent overwriting production data with invalid values
    if (isProductionKey(key) && !data) {
      console.warn(`Attempted to clear production key: ${key}`);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to write localStorage key: ${key}`, err);
  }
};

/**
 * Clear only event day data (preserves production data)
 */
export const clearEventDayData = () => {
  Object.values(EVENT_DAY_KEYS).forEach(key => {
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      // ignore
    }
  });
};

/**
 * Validate Firebase guest data structure
 * @param {object} guestData - guest data from Firebase
 * @returns {boolean} - true if valid
 */
export const isValidGuestData = (guestData) => {
  if (!guestData || typeof guestData !== 'object') return false;
  
  // Required fields for backward compatibility
  return Boolean(
    guestData.primaryGuest || guestData.guestNames?.length
  );
};

/**
 * Normalize guest data for consistent structure
 * @param {object} rawGuest - raw guest data
 * @returns {object} - normalized guest
 */
export const normalizeGuestData = (rawGuest) => {
  if (!rawGuest) return null;

  const primaryGuest = rawGuest.primaryGuest || rawGuest.guestNames?.[0] || 'Guest';
  const guestNames = rawGuest.guestNames || [primaryGuest];

  return {
    code: (rawGuest.code || '').toUpperCase(),
    primaryGuest,
    guestNames,
    partnerName: rawGuest.partnerName || null,
    householdCount: rawGuest.householdCount ?? rawGuest.household ?? 1,
    householdId: rawGuest.householdId || null,
    rsvpStatus: rawGuest.rsvpStatus || 'pending',
    additionalGuests: rawGuest.additionalGuests ?? 0,
    contact: rawGuest.contact || '',
    vip: rawGuest.vip || false,
    dietaryRequirements: rawGuest.dietaryRequirements || '',
    lastUpdated: rawGuest.lastUpdated || new Date().toISOString(),
  };
};

export default {
  PRODUCTION_KEYS,
  EVENT_DAY_KEYS,
  FIREBASE_COLLECTIONS,
  isProductionKey,
  isEventDayKey,
  getSafeStorage,
  setSafeStorage,
  clearEventDayData,
  isValidGuestData,
  normalizeGuestData,
};
