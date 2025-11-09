import { renderHook, act } from '@testing-library/react';
import { vi, describe, expect, beforeEach, afterEach, it } from 'vitest';

import AudioProvider, { useAudio } from '../providers/AudioProvider.jsx';

const howlerMocks = vi.hoisted(() => {
  const fadeMock = vi.fn();
  const stopMock = vi.fn();
  const playMock = vi.fn();

  class HowlMock {
    constructor(options) {
      this._volume = options.volume ?? 1;
      this._state = 'loaded';
      this._options = options;
    }

    volume(value) {
      if (typeof value === 'number') {
        this._volume = value;
      }
      return this._volume;
    }

    play() {
      playMock();
      return 1;
    }

    fade(from, to, duration) {
      this._volume = to;
      fadeMock(from, to, duration);
    }

    stop() {
      stopMock();
    }

    state() {
      return this._state;
    }

    load() {}

    once(event, cb) {
      if (event === 'load') {
        cb();
      }
    }

    on() {}
    off() {}
    unload() {}
  }

  return { fadeMock, stopMock, playMock, HowlMock };
});

vi.mock('howler', () => ({
  Howl: howlerMocks.HowlMock,
}));

vi.mock('../utils/assetPaths.js', () => ({
  getAssetPath: () => 'nasheed.mp3',
}));

vi.mock('../providers/ThemeProvider.jsx', () => ({
  useTheme: () => ({ theme: { toggles: {} } }),
}));

const { fadeMock, stopMock, playMock } = howlerMocks;

describe('AudioProvider fading behaviour', () => {
  beforeEach(() => {
    fadeMock.mockReset();
    stopMock.mockReset();
    playMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fades audio in and out when toggled', async () => {
    const wrapper = ({ children }) => <AudioProvider>{children}</AudioProvider>;
    const { result } = renderHook(() => useAudio(), { wrapper });

    await act(async () => {
      await result.current.startAudio({ force: true });
    });

    expect(fadeMock).toHaveBeenCalledWith(0, 0.4, 600);

    await act(async () => {
      result.current.toggleAudio();
      vi.runAllTimers();
    });

    expect(fadeMock).toHaveBeenCalledWith(0.4, 0, 600);
    expect(stopMock).toHaveBeenCalled();
  });
});
