import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getAssetPath } from '../utils/assetPaths.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import { useTheme } from './ThemeProvider.jsx';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const resumeOnSourceChangeRef = useRef(false);
  const volumeRef = useRef(0.4);
  const fadeFrameRef = useRef(null);
  const hasAutoplayedRef = useRef(false);
  const pendingStartRef = useRef(false);
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [audioSource, setAudioSource] = useState(() => getAssetPath('nasheed'));

  useEffect(() => {
    const nextSource = theme?.assets?.nasheed ?? getAssetPath('nasheed');
    setAudioSource(nextSource);
  }, [theme]);

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
          setIsPlaying(false);
          hasAutoplayedRef.current = true;
        }
      }
    } catch (err) {
      /* storage unavailable; continue with defaults */
    }
  }, []);

  const clearFade = useCallback(() => {
    if (fadeFrameRef.current) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
  }, []);

  const fadeVolume = useCallback(
    (targetVolume, { duration = 900, pauseAfter = false, onComplete } = {}) => {
      const audio = audioRef.current;
      if (!audio) return;

      clearFade();

      const startVolume = audio.volume;
      const delta = targetVolume - startVolume;

      if (Math.abs(delta) < 0.001 || duration <= 0) {
        audio.volume = targetVolume;
        if (pauseAfter) {
          audio.pause();
        }
        onComplete?.();
        return;
      }

      let startTime;

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        audio.volume = startVolume + delta * progress;

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
        } else {
          audio.volume = targetVolume;
          if (pauseAfter) {
            audio.pause();
          }
          fadeFrameRef.current = null;
          onComplete?.();
        }
      };

      fadeFrameRef.current = requestAnimationFrame(step);
    },
    [clearFade]
  );

  const playWithFade = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      audio.volume = 0;
      await audio.play();
      hasAutoplayedRef.current = true;
      setIsPlaying(true);
      fadeVolume(volumeRef.current, { duration: 1200 });
      return true;
    } catch (err) {
      setIsPlaying(false);
      return false;
    }
  }, [fadeVolume]);

  useEffect(() => {
    const audio = new Audio(audioSource ?? getAssetPath('nasheed'));
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    const handleReady = () => {
      setIsReady(true);
      if (pendingStartRef.current && !hasAutoplayedRef.current) {
        pendingStartRef.current = false;
        playWithFade();
      }
    };
    audio.addEventListener('canplaythrough', handleReady, { once: true });

    if (resumeOnSourceChangeRef.current) {
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          fadeVolume(volumeRef.current, { duration: 1200 });
        })
        .catch(() => {
          setIsPlaying(false);
          resumeOnSourceChangeRef.current = false;
        });
    }

    return () => {
      audio.pause();
      audio.removeEventListener('canplaythrough', handleReady);
      audioRef.current = null;
      setIsReady(false);
      clearFade();
    };
  }, [audioSource, fadeVolume, clearFade, volumeRef, playWithFade]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    try {
      localStorage.setItem(STORAGE_KEYS.audio, JSON.stringify({ isPlaying, volume }));
    } catch (err) {
      /* storage unavailable; skip persistence */
    }
  }, [volume, isPlaying]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    resumeOnSourceChangeRef.current = isPlaying;
  }, [isPlaying]);

  const startAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || hasAutoplayedRef.current || isPlaying) {
      return;
    }

    if (!isReady) {
      pendingStartRef.current = true;
      try {
        audio.load();
      } catch (err) {
        /* ignore load failures */
      }
      return;
    }

    pendingStartRef.current = false;
    await playWithFade();
  }, [isReady, isPlaying, playWithFade]);

  const toggleAudio = async () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      return;
    }

    hasAutoplayedRef.current = true;
    fadeVolume(0, {
      duration: 800,
      pauseAfter: true,
      onComplete: () => {
        setIsPlaying(false);
      },
    });
  };

  const value = useMemo(
    () => ({
      isReady,
      isPlaying,
      volume,
      setVolume,
      toggleAudio,
      startAudio,
      source: audioSource,
    }),
    [isReady, isPlaying, volume, audioSource, toggleAudio, startAudio]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
