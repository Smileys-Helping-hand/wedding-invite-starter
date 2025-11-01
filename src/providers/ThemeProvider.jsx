import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import presets from '../data/theme-presets.json';
import { defaultAssets, waxSeals } from '../utils/assetPaths.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import { useFirebase } from './FirebaseProvider.jsx';

const ThemeContext = createContext();

const DEFAULT_THEME = {
  id: 'classic-gold',
  label: 'Classic Gold & Marble',
  brideName: 'Razia',
  groomName: 'Abduraziq',
  fonts: {
    heading: "'Playfair Display', serif",
    body: "'Inter', sans-serif",
  },
  palette: {
    background: '#f8f6f2',
    accent: '#d4af37',
    accentSoft: '#f4e3c3',
    text: '#2f2721',
    textMuted: 'rgba(47, 39, 33, 0.72)',
    glass: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(210, 177, 107, 0.42)',
  },
  toggles: {
    sparkles: true,
    glow: true,
    animationIntensity: 'medium',
  },
  assets: {
    bismillah: defaultAssets.bismillah,
    curtainLeft: defaultAssets.curtainLeft,
    curtainRight: defaultAssets.curtainRight,
    envelope: defaultAssets.envelope,
    inviteCard: defaultAssets.inviteCard,
    sparklesVideo: defaultAssets.sparklesVideo,
    nasheed: defaultAssets.nasheed,
    waxSealVariant: 'gold',
    waxSeals: waxSeals,
  },
};

const mergeTheme = (base, updates = {}) => {
  if (typeof updates !== 'object' || updates === null) return { ...base };

  return Object.keys({ ...base, ...updates }).reduce((acc, key) => {
    const baseValue = base?.[key];
    const nextValue = updates?.[key];

    if (Array.isArray(baseValue) || Array.isArray(nextValue)) {
      acc[key] = nextValue ?? baseValue;
      return acc;
    }

    if (typeof baseValue === 'object' && baseValue !== null) {
      acc[key] = mergeTheme(baseValue, nextValue ?? {});
      return acc;
    }

    acc[key] = nextValue ?? baseValue;
    return acc;
  }, {});
};

const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!root) return;

  root.style.setProperty('--theme-font-heading', theme.fonts.heading);
  root.style.setProperty('--theme-font-body', theme.fonts.body);
  root.style.setProperty('--theme-color-background', theme.palette.background);
  root.style.setProperty('--theme-color-accent', theme.palette.accent);
  root.style.setProperty('--theme-color-accent-soft', theme.palette.accentSoft);
  root.style.setProperty('--theme-color-text', theme.palette.text);
  root.style.setProperty('--theme-color-text-muted', theme.palette.textMuted);
  root.style.setProperty('--theme-glass-bg', theme.palette.glass);
  root.style.setProperty('--theme-glass-border', theme.palette.border);
  root.style.setProperty('--theme-animation-intensity', theme.toggles.animationIntensity ?? 'medium');
};

const readDraft = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.themeDraft);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (err) {
    console.warn('Unable to parse stored theme draft', err);
    return null;
  }
};

const writeDraft = (data) => {
  try {
    localStorage.setItem(STORAGE_KEYS.themeDraft, JSON.stringify(data));
  } catch (err) {
    console.warn('Unable to persist theme draft', err);
  }
};

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const { fetchThemeConfig, saveThemeConfig, uploadMedia } = useFirebase();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    const initialise = async () => {
      setLoading(true);
      let resolved = DEFAULT_THEME;

      if (fetchThemeConfig) {
        try {
          const remote = await fetchThemeConfig();
          if (remote && !cancelled) {
            resolved = mergeTheme(DEFAULT_THEME, remote);
            writeDraft(resolved);
          }
        } catch (err) {
          console.warn('Unable to fetch remote theme', err);
          setError('Unable to load theme from Firestore. Using saved draft.');
        }
      }

      if (resolved === DEFAULT_THEME) {
        const draft = readDraft();
        if (draft) {
          resolved = mergeTheme(DEFAULT_THEME, draft);
        }
      }

      if (!cancelled) {
        setTheme(resolved);
        setLoading(false);
      }
    };

    initialise();

    return () => {
      cancelled = true;
    };
  }, [fetchThemeConfig]);

  const updateTheme = useCallback((updates) => {
    setTheme((prev) => mergeTheme(prev, updates));
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
    writeDraft(DEFAULT_THEME);
  }, []);

  const saveDraft = useCallback(
    (nextTheme) => {
      const payload = nextTheme ?? theme;
      writeDraft(payload);
      setTheme(mergeTheme(DEFAULT_THEME, payload));
    },
    [theme]
  );

  const publishTheme = useCallback(
    async (nextTheme) => {
      if (!saveThemeConfig) {
        console.warn('Firestore unavailable; cannot publish theme.');
        setError('Firestore unavailable; saved locally.');
        saveDraft(nextTheme);
        return;
      }

      setIsPublishing(true);
      try {
        const payload = mergeTheme(DEFAULT_THEME, nextTheme ?? theme);
        await saveThemeConfig(payload);
        writeDraft(payload);
        setTheme(payload);
        setError(null);
      } catch (err) {
        console.error('Failed to publish theme', err);
        setError('Failed to publish theme to Firestore. Saved locally.');
        saveDraft(nextTheme);
      } finally {
        setIsPublishing(false);
      }
    },
    [saveThemeConfig, saveDraft, theme]
  );

  const applyPreset = useCallback((presetId) => {
    const preset = presets.find((entry) => entry.id === presetId);
    if (!preset) return;
    updateTheme(preset);
  }, [updateTheme]);

  const value = useMemo(
    () => ({
      theme,
      presets,
      loading,
      error,
      isPublishing,
      updateTheme,
      resetTheme,
      saveDraft,
      publishTheme,
      applyPreset,
      uploadAsset: uploadMedia,
    }),
    [theme, loading, error, isPublishing, updateTheme, resetTheme, saveDraft, publishTheme, applyPreset, uploadMedia]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
