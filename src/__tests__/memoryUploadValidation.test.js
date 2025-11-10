import { renderHook, act } from '@testing-library/react';
import { vi, describe, expect, beforeEach } from 'vitest';

import { useUploadMemory } from '../hooks/useUploadMemory.js';

const mockAddMemory = vi.fn();
const mockUploadMemoryImage = vi.fn();

vi.mock('../providers/FirebaseProvider.jsx', () => ({
  useFirebase: () => ({
    addMemory: mockAddMemory,
    uploadMemoryImage: mockUploadMemoryImage,
  }),
}));

describe('useUploadMemory validation', () => {
  beforeEach(() => {
    mockAddMemory.mockReset();
    mockUploadMemoryImage.mockReset();
  });

  it('rejects files that are too large', async () => {
    const { result } = renderHook(() => useUploadMemory());
    const bigFile = new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'large.jpg', {
      type: 'image/jpeg',
    });

    await expect(
      act(async () => {
        await result.current.upload({
          name: 'Guest',
          message: 'Congrats',
          file: bigFile,
        });
      })
    ).rejects.toThrow('Images must be smaller than 3MB.');

    expect(mockUploadMemoryImage).not.toHaveBeenCalled();
    expect(mockAddMemory).not.toHaveBeenCalled();
  });

  it('uploads valid images and stores memory entry', async () => {
    const { result } = renderHook(() => useUploadMemory());
    const file = new File([new Uint8Array(1024)], 'memory.jpg', { type: 'image/jpeg' });

    mockUploadMemoryImage.mockResolvedValue({
      url: 'https://example.com/img.jpg',
      path: 'memories/img.jpg',
    });
    mockAddMemory.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.upload({ name: 'Amina', message: 'Mabrook!', file });
    });

    expect(mockUploadMemoryImage).toHaveBeenCalled();
    expect(mockAddMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Amina',
        message: 'Mabrook!',
        imageUrl: 'https://example.com/img.jpg',
      })
    );
  });
});
