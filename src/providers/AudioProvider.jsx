import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getAssetPath } from '../utils/assetPaths.js';

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

const STORAGE_KEY = 'lumina-invite-audio';

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    const audio = new Audio(getAssetPath('nasheed'));
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('canplaythrough', () => setIsReady(true), { once: true });

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.volume === 'number') {
          audio.volume = parsed.volume;
          setVolume(parsed.volume);
        }
        if (parsed?.isPlaying) {
          audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      }
    } catch (err) {
      console.warn('Failed to restore audio preferences', err);
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ isPlaying, volume }));
    } catch (err) {
      console.warn('Failed to store audio preferences', err);
    }
  }, [volume, isPlaying]);

  const toggleAudio = async () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Unable to start playback', err);
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
    }),
    [isReady, isPlaying, volume]
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};
