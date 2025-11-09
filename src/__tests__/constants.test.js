import { describe, expect, it } from 'vitest';

import {
  EVENT_DATE_GREGORIAN,
  EVENT_VENUE,
  RSVP_STATUSES,
  STORAGE_KEYS,
  EXPERIENCE_PHASES,
} from '../utils/constants.js';

describe('constants', () => {
  it('exposes the engagement metadata consistently', () => {
    expect(EVENT_DATE_GREGORIAN).toBeInstanceOf(Date);
    expect(EVENT_DATE_GREGORIAN.getFullYear()).toBe(2025);
    expect(EVENT_VENUE.name).toBe('Legacy Events');
    expect(EVENT_VENUE.gatheringTime).toContain('4:30 PM');
    expect(Object.values(RSVP_STATUSES)).toContain('confirmed');
    expect(STORAGE_KEYS.guest).toContain('guest');
    expect(EXPERIENCE_PHASES.envelope).toBe('envelope');
  });
});
