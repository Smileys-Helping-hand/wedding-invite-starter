import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Howl } from 'howler';

import { getAssetPath } from '../utils/assetPaths.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import { useTheme } from './ThemeProvider.jsx';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

const createHowl = (src, volume) =>
  new Howl({
    src: [src],
    loop: false,
    autoplay: false,
    html5: true,
    preload: true,
    volume,
  });

export const AudioProvider = ({ children }) => {
  const howlRef = useRef(null);
  const pendingStartRef = useRef(false);
  const fadeTimeoutRef = useRef(null);
  const volumeRef = useRef(0.4);
  const hasAutoplayedRef = useRef(false);
  const { theme } = useTheme();

  const [audioSource, setAudioSource] = useState(() => getAssetPath('nasheed'));
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [error, setError] = useState(null);
  const [trackIndex, setTrackIndex] = useState(0);

  const autoplayEnabled = theme?.toggles?.nasheedAutoplay !== false;

  const playlist = useMemo(() => {
    const baseTrack = theme?.assets?.nasheed ?? getAssetPath('nasheed');
    const extras = Array.isArray(theme?.assets?.ambientPlaylist)
      ? theme.assets.ambientPlaylist
      : [];
    const entries = [baseTrack, ...extras].filter(Boolean);
    return entries.length > 0 ? entries : [getAssetPath('nasheed')];
  }, [theme]);

  useEffect(() => {
    setTrackIndex(0);
  }, [playlist]);

  useEffect(() => {
    setAudioSource(playlist[trackIndex]);
  }, [playlist, trackIndex]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.audio);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.volume === 'number') {
          setVolume(parsed.volume);
          volumeRef.current = parsed.volume;
        }
        if (parsed?.isPlaying === false) {
          hasAutoplayedRef.current = true;
          setIsPlaying(false);
        }
      }
    } catch (err) {
      /* ignore persistence issues */
    }
  }, []);

  const persistState = useCallback((next) => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.audio,
        JSON.stringify({
          isPlaying: next.isPlaying,
          volume: next.volume,
        })
      );
    } catch (err) {
      /* ignore persistence issues */
    }
  }, []);

  useEffect(() => {
    persistState({ isPlaying, volume });
  }, [isPlaying, volume, persistState]);

  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;
    volumeRef.current = volume;
    howl.volume(volume);
  }, [volume]);

  const fadeTo = useCallback(
    (targetVolume, { duration = 800, stopAfter = false } = {}) => {
      const howl = howlRef.current;
      if (!howl) return;
      clearTimeout(fadeTimeoutRef.current);

      const current = howl.volume();
      if (Math.abs(current - targetVolume) < 0.01) {
        if (stopAfter) {
          howl.stop();
          setIsPlaying(false);
        }
        return;
      }

      howl.fade(current, targetVolume, duration);
      if (stopAfter) {
        fadeTimeoutRef.current = setTimeout(() => {
          howl.stop();
          setIsPlaying(false);
        }, duration + 20);
      }
    },
    []
  );

  const playWithFade = useCallback(
    async (duration = 800) => {
      const howl = howlRef.current;
      if (!howl) return false;

      try {
        howl.volume(0);
        howl.play();
        fadeTo(volumeRef.current, { duration });
        hasAutoplayedRef.current = true;
        setIsPlaying(true);
        return true;
      } catch (err) {
        setIsPlaying(false);
        setError(err.message ?? 'Audio playback blocked');
        return false;
      }
    },
    [fadeTo]
  );

  const pauseWithFade = useCallback(
    (duration = 800) => {
      const howl = howlRef.current;
      if (!howl) return;
      fadeTo(0, { duration, stopAfter: true });
    },
    [fadeTo]
  );

  const advanceTrack = useCallback(() => {
    setTrackIndex((current) => (current + 1) % playlist.length);
  }, [playlist.length]);

  useEffect(() => {
    if (!audioSource) return undefined;

    const howl = createHowl(audioSource, volumeRef.current);
    howlRef.current = howl;
    setIsReady(howl.state() === 'loaded');
    setError(null);

    const handleLoad = () => {
      setIsReady(true);
      if (pendingStartRef.current) {
        const shouldForce = pendingStartRef.current === 'force';
        pendingStartRef.current = false;
        playWithFade(shouldForce ? 400 : 800).catch(() => {});
      }
    };

    const handleLoadError = (_, errCode) => {
      setError(errCode ?? 'Unable to load audio');
      setIsReady(false);
    };

    howl.on('end', advanceTrack);

    if (howl.state() === 'loaded') {
      handleLoad();
    } else {
      howl.once('load', handleLoad);
      howl.once('loaderror', handleLoadError);
    }

    return () => {
      clearTimeout(fadeTimeoutRef.current);
      howl.off('end', advanceTrack);
      howl.stop();
      howl.unload();
      howlRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [advanceTrack, audioSource, playWithFade]);

  const startAudio = useCallback(
    async ({ force = false } = {}) => {
      if (isPlaying && !force) return true;
      if (!autoplayEnabled && !force && hasAutoplayedRef.current) {
        return false;
      }

      const howl = howlRef.current;
      if (!howl || (!isReady && howl.state() !== 'loaded')) {
        pendingStartRef.current = force ? 'force' : 'auto';
        try {
          howl?.load();
        } catch (err) {
          /* ignore */
        }
        return false;
      }

      return playWithFade(force ? 400 : 800);
    },
    [autoplayEnabled, isPlaying, isReady, playWithFade]
  );

  const toggleAudio = useCallback(() => {
    if (isPlaying) {
      pauseWithFade(600);
    } else {
      startAudio({ force: true });
    }
  }, [isPlaying, pauseWithFade, startAudio]);

  const updateVolume = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value));
    volumeRef.current = clamped;
    setVolume(clamped);
    howlRef.current?.volume(clamped);
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      isPlaying,
      error,
      volume,
      playlist,
      startAudio,
      toggleAudio,
      setVolume: updateVolume,
    }),
    [error, isPlaying, isReady, playlist, startAudio, toggleAudio, updateVolume, volume]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export default AudioProvider;
