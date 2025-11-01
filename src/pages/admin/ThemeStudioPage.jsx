import { useEffect, useMemo, useState } from 'react';
import Button from '../../components/common/Button.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import { defaultAssets, waxSeals } from '../../utils/assetPaths.js';
import './ThemeStudioPage.css';

const fontOptions = [
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Cinzel', value: "'Cinzel', serif" },
  { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Lato', value: "'Lato', sans-serif" },
];

const animationOptions = [
  { label: 'Gentle', value: 'gentle' },
  { label: 'Medium', value: 'medium' },
  { label: 'Grand', value: 'grand' },
];

const ThemeStudioPage = () => {
  const {
    theme,
    presets,
    applyPreset,
    updateTheme,
    saveDraft,
    publishTheme,
    uploadAsset,
    loading,
    error,
    isPublishing,
  } = useTheme();
  const [status, setStatus] = useState('');
  const [selectedWax, setSelectedWax] = useState(theme?.assets?.waxSealVariant ?? 'gold');
  const launchMode = theme?.toggles?.launchMode === true;

  useEffect(() => {
    setSelectedWax(theme?.assets?.waxSealVariant ?? 'gold');
  }, [theme?.assets?.waxSealVariant]);

  useEffect(() => {
    setStatus((previous) => {
      if (launchMode) {
        return 'Launch Mode enabled. Preview only.';
      }
      return previous === 'Launch Mode enabled. Preview only.' ? 'Editing unlocked.' : previous;
    });
  }, [launchMode]);

  const availableSeals = useMemo(() => {
    const current = theme?.assets?.waxSeals ?? {};
    const merged = { ...waxSeals, ...current };
    return Object.keys(merged);
  }, [theme?.assets]);

  const palette = theme?.palette ?? {};
  const fonts = theme?.fonts ?? {};
  const toggles = theme?.toggles ?? {};
  const assets = theme?.assets ?? defaultAssets;

  const handleColorChange = (key, value) => {
    if (launchMode) {
      setStatus('Launch Mode is active. Disable it to edit.');
      return;
    }
    updateTheme({ palette: { [key]: value } });
  };

  const handleFontChange = (key, value) => {
    if (launchMode) {
      setStatus('Launch Mode is active. Disable it to edit.');
      return;
    }
    updateTheme({ fonts: { [key]: value } });
  };

  const handleToggleChange = (key, value) => {
    if (launchMode && key !== 'launchMode') {
      setStatus('Launch Mode is active. Disable it to edit.');
      return;
    }
    updateTheme({ toggles: { [key]: value } });
  };

  const handleNameChange = (key, value) => {
    if (launchMode) {
      setStatus('Launch Mode is active. Disable it to edit.');
      return;
    }
    updateTheme({ [key]: value });
  };

  const handleAssetUpload = async (field, file) => {
    if (!file) return;
    if (launchMode) {
      setStatus('Launch Mode is active. Disable it to replace media.');
      return;
    }
    if (!uploadAsset) {
      setStatus('Firebase Storage unavailable. Asset not uploaded.');
      return;
    }

    setStatus('Uploading asset…');
    try {
      const { url } = await uploadAsset(file, {
        directory: 'theme-assets',
        fileName: `${field}-${Date.now()}-${file.name}`,
      });
      if (field === 'waxSeals') {
        updateTheme({ assets: { waxSeals: { [selectedWax]: url } } });
      } else {
        updateTheme({ assets: { [field]: url } });
      }
      setStatus('Asset uploaded successfully.');
    } catch (err) {
      setStatus('Asset upload failed. Please try again.');
    }
  };

  const handleSaveDraft = () => {
    saveDraft(theme);
    setStatus('Draft saved locally.');
  };

  const handlePublish = async () => {
    setStatus('Publishing theme…');
    await publishTheme(theme);
    setStatus('Theme published.');
  };

  return (
    <div className="theme-studio">
      <div className="theme-studio__header">
        <div>
          <span className="badge">Design studio</span>
          <h1 className="page-title">Craft the invitation aesthetic</h1>
          <p className="page-subtitle">
            Adjust palettes, typography, media, and animation in real time. Save drafts locally or publish to share with guests.
          </p>
          {launchMode && <p className="launch-mode-alert">Launch Mode is enabled. Disable it to continue editing.</p>}
        </div>
        <div className="theme-studio__actions">
          <Button variant="ghost" size="md" onClick={handleSaveDraft} disabled={loading || isPublishing}>
            Save Draft
          </Button>
          <Button variant="primary" size="md" onClick={handlePublish} loading={isPublishing}>
            Publish Theme
          </Button>
        </div>
      </div>

      {loading && <div className="theme-studio__loading">Loading theme…</div>}
      {error && <div className="theme-studio__alert">{error}</div>}
      {status && <div className="theme-studio__status">{status}</div>}

      <div className="theme-studio__grid">
        <section className="studio-panel">
          <h2>Theme presets</h2>
          <div className="preset-grid">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-card${theme?.id === preset.id ? ' is-active' : ''}`}
                onClick={() => {
                  if (launchMode) {
                    setStatus('Launch Mode is active. Disable it to edit.');
                    return;
                  }
                  applyPreset(preset.id);
                  setSelectedWax(preset.assets?.waxSealVariant ?? 'gold');
                  setStatus(`Preset "${preset.label}" applied.`);
                }}
                disabled={loading || isPublishing || launchMode}
              >
                <span className="preset-card__label">{preset.label}</span>
                <span className="preset-card__description">{preset.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="studio-panel">
          <h2>Fonts &amp; names</h2>
          <div className="studio-field-grid">
            <label className="studio-field">
              <span>Heading font</span>
              <select
                value={fonts.heading ?? fontOptions[0].value}
                onChange={(event) => handleFontChange('heading', event.target.value)}
                disabled={launchMode}
              >
                {fontOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="studio-field">
              <span>Body font</span>
              <select
                value={fonts.body ?? "'Inter', sans-serif"}
                onChange={(event) => handleFontChange('body', event.target.value)}
                disabled={launchMode}
              >
                {fontOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <TextInput
              label="Bride name"
              value={theme?.brideName ?? ''}
              onChange={(event) => handleNameChange('brideName', event.target.value)}
              disabled={launchMode}
            />
            <TextInput
              label="Groom name"
              value={theme?.groomName ?? ''}
              onChange={(event) => handleNameChange('groomName', event.target.value)}
              disabled={launchMode}
            />
          </div>
        </section>

        <section className="studio-panel">
          <h2>Palette</h2>
          <div className="studio-color-grid">
            {Object.entries({
              accent: 'Accent',
              accentSoft: 'Accent glow',
              background: 'Background',
              text: 'Primary text',
              textMuted: 'Subtle text',
              glass: 'Glass fill',
              border: 'Glass border',
            }).map(([key, label]) => (
              <label key={key} className="color-field">
                <span>{label}</span>
                <input
                  type="color"
                  value={palette[key] ?? '#ffffff'}
                  onChange={(event) => handleColorChange(key, event.target.value)}
                  disabled={launchMode}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="studio-panel">
          <h2>Animations &amp; effects</h2>
          <div className="studio-field-grid">
            <label className="studio-field">
              <span>Animation intensity</span>
              <select
                value={toggles.animationIntensity ?? 'medium'}
                onChange={(event) => handleToggleChange('animationIntensity', event.target.value)}
                disabled={launchMode}
              >
                {animationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="switch-field">
              <input
                type="checkbox"
                checked={toggles.sparkles !== false}
                onChange={(event) => handleToggleChange('sparkles', event.target.checked)}
                disabled={launchMode}
              />
              <span>Sparkle overlay</span>
            </label>
            <label className="switch-field">
              <input
                type="checkbox"
                checked={toggles.glow !== false}
                onChange={(event) => handleToggleChange('glow', event.target.checked)}
                disabled={launchMode}
              />
              <span>Bismillah glow</span>
            </label>
            <label className="switch-field launch-mode-switch">
              <input
                type="checkbox"
                checked={launchMode}
                onChange={(event) => handleToggleChange('launchMode', event.target.checked)}
              />
              <span>Launch Mode ON</span>
            </label>
          </div>
        </section>

        <section className="studio-panel">
          <h2>Media uploads</h2>
          <div className="upload-grid">
            <label className="upload-field">
              <span>Marble background curtains</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAssetUpload('curtainLeft', event.target.files?.[0])}
                disabled={launchMode}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAssetUpload('curtainRight', event.target.files?.[0])}
                disabled={launchMode}
              />
            </label>
            <label className="upload-field">
              <span>Bismillah artwork</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAssetUpload('bismillah', event.target.files?.[0])}
                disabled={launchMode}
              />
            </label>
            <label className="upload-field">
              <span>Envelope texture</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAssetUpload('envelope', event.target.files?.[0])}
                disabled={launchMode}
              />
            </label>
            <label className="upload-field">
              <span>Invitation card</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleAssetUpload('inviteCard', event.target.files?.[0])}
                disabled={launchMode}
              />
            </label>
            <label className="upload-field">
              <span>Nasheed (audio)</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => handleAssetUpload('nasheed', event.target.files?.[0])}
                disabled={launchMode}
              />
            </label>
            <label className="upload-field">
              <span>Sparkle video</span>
              <input
                type="file"
                accept="video/mp4,video/webm"
                onChange={(event) => handleAssetUpload('sparklesVideo', event.target.files?.[0])}
                disabled={launchMode}
              />
            </label>
            <div className="wax-grid">
              <div className="wax-select">
                <span>Wax seal variant</span>
                <select
                  value={theme?.assets?.waxSealVariant ?? selectedWax}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (launchMode) {
                      setStatus('Launch Mode is active. Disable it to edit.');
                      return;
                    }
                    setSelectedWax(value);
                    updateTheme({ assets: { waxSealVariant: value } });
                  }}
                  disabled={launchMode}
                >
                  {availableSeals.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </select>
              </div>
              <label className="upload-field">
                <span>Replace selected wax seal</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleAssetUpload('waxSeals', event.target.files?.[0])}
                  disabled={launchMode}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="studio-panel preview-panel">
          <h2>Live preview</h2>
          <div className="preview-frame">
            <div className="preview-curtains">
              <img src={assets.curtainLeft ?? defaultAssets.curtainLeft} alt="Left curtain" />
              <img src={assets.curtainRight ?? defaultAssets.curtainRight} alt="Right curtain" />
            </div>
            <div className="preview-bismillah">
              <img src={assets.bismillah ?? defaultAssets.bismillah} alt="Bismillah" />
            </div>
            <div className="preview-envelope">
              <img src={assets.envelope ?? defaultAssets.envelope} alt="Envelope" className="preview-envelope__paper" />
              <img src={(theme?.assets?.waxSeals ?? waxSeals)[theme?.assets?.waxSealVariant ?? selectedWax]} alt="Wax seal" className="preview-envelope__seal" />
            </div>
            <div className="preview-card">
              <img src={assets.inviteCard ?? defaultAssets.inviteCard} alt="Invite card" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ThemeStudioPage;
