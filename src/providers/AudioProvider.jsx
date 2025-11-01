import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAssetPath } from '../utils/assetPaths.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import { useTheme } from './ThemeProvider.jsx';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const resumeOnSourceChangeRef = useRef(false);
  const volumeRef = useRef(0.4);
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
      }
    } catch (err) {
      /* storage unavailable; continue with defaults */
    }
  }, []);

  useEffect(() => {
    const audio = new Audio(audioSource ?? getAssetPath('nasheed'));
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    const handleReady = () => setIsReady(true);
    audio.addEventListener('canplaythrough', handleReady, { once: true });

    if (resumeOnSourceChangeRef.current) {
      audio
        .play()
        .then(() => setIsPlaying(true))
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
    };
  }, [audioSource]);

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

  const toggleAudio = async () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        setIsPlaying(false);
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const value = useMemo(
    () => ({
      isReady,
      isPlaying,
      volume,
      setVolume,
      toggleAudio,
      source: audioSource,
    }),
    [isReady, isPlaying, volume, audioSource, toggleAudio]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
