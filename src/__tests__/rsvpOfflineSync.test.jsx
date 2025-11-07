import { renderHook, act } from '@testing-library/react';
import { vi, describe, expect, beforeEach } from 'vitest';

import { GuestProvider, useGuest } from '../providers/GuestProvider.jsx';

const mockSaveRSVP = vi.fn();
const mockGetGuest = vi.fn();

vi.mock('../providers/FirebaseProvider.jsx', () => ({
  useFirebase: () => ({
    getGuest: mockGetGuest,
    saveRSVP: mockSaveRSVP,
  }),
}));

describe('GuestProvider offline safety', () => {
  beforeEach(() => {
    mockSaveRSVP.mockReset();
    mockGetGuest.mockReset();
    window.localStorage.clear();
  });

  it('rolls back RSVP state when Firestore update fails', async () => {
    const wrapper = ({ children }) => <GuestProvider>{children}</GuestProvider>;
    const { result } = renderHook(() => useGuest(), { wrapper });

    await act(async () => {
      await result.current.lookupGuest('Ami123');
    });

    expect(result.current.guest.rsvpStatus).toBe('pending');

    mockSaveRSVP.mockRejectedValueOnce(new Error('offline'));

    await expect(
      act(async () => {
        await result.current.updateRSVP('confirmed', { attending: true });
      })
    ).rejects.toThrow('offline');

    expect(mockSaveRSVP).toHaveBeenCalledTimes(1);
    expect(result.current.guest.rsvpStatus).toBe('pending');
  });
});
