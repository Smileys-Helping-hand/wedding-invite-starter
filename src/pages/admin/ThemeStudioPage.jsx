import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { useTheme } from '../../providers/ThemeProvider.jsx';
import { defaultAssets, waxSeals } from '../../utils/assetPaths.js';
import './ThemeStudioPage.css';

const headingFontGroups = [
  {
    label: 'Serif Classics',
    options: [
      { label: 'Playfair Display', value: "'Playfair Display', serif" },
      { label: 'Cinzel', value: "'Cinzel', serif" },
      { label: 'Didot', value: "'Didot', 'Playfair Display', serif" },
      { label: 'Cormorant Garamond', value: "'Cormorant Garamond', serif" },
      { label: 'Bodoni Moda', value: "'Bodoni Moda', serif" },
    ],
  },
  {
    label: 'Script Elegance',
    options: [
      { label: 'Great Vibes', value: "'Great Vibes', cursive" },
      { label: 'Parisienne', value: "'Parisienne', cursive" },
      { label: 'Alex Brush', value: "'Alex Brush', cursive" },
    ],
  },
  {
    label: 'Arabic Calligraphy',
    options: [
      { label: 'Scheherazade New', value: "'Scheherazade New', serif" },
      { label: 'Amiri', value: "'Amiri', serif" },
      { label: 'Harmattan', value: "'Harmattan', serif" },
      { label: 'Reem Kufi', value: "'Reem Kufi Fun', 'Scheherazade New', serif" },
    ],
  },
  {
    label: 'Minimal Sans',
    options: [
      { label: 'Inter', value: "'Inter', sans-serif" },
      { label: 'Lato', value: "'Lato', sans-serif" },
      { label: 'Source Sans 3', value: "'Source Sans 3', sans-serif" },
      { label: 'Josefin Sans', value: "'Josefin Sans', sans-serif" },
    ],
  },
];

const bodyFontOptions = [
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Lato', value: "'Lato', sans-serif" },
  { label: 'Source Sans 3', value: "'Source Sans 3', sans-serif" },
  { label: 'Josefin Sans', value: "'Josefin Sans', sans-serif" },
  { label: 'Nunito', value: "'Nunito', sans-serif" },
];

const tabs = [
  { id: 'colors', label: 'Colors' },
  { id: 'fonts', label: 'Fonts' },
  { id: 'text', label: 'Text Styles' },
  { id: 'media', label: 'Media' },
  { id: 'animations', label: 'Animations' },
  { id: 'overlays', label: 'Overlays & Sparkle' },
];

const animationOptions = [
  { label: 'Gentle', value: 'gentle' },
  { label: 'Medium', value: 'medium' },
  { label: 'Grand', value: 'grand' },
];

const waxShapeOptions = [
  { value: 'round', label: 'Round' },
  { value: 'oval', label: 'Oval' },
  { value: 'floral', label: 'Floral' },
];

const cardEdgeOptions = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'soft-bevel', label: 'Soft Bevel' },
  { value: 'bevel', label: 'Beveled Corners' },
  { value: 'deckled', label: 'Deckled Edge' },
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
    resetTheme,
    loading,
    error,
    isPublishing,
  } = useTheme();
  const [status, setStatus] = useState('');
  const [selectedWax, setSelectedWax] = useState(theme?.assets?.waxSealVariant ?? 'gold');
  const [activeTab, setActiveTab] = useState('colors');
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
    return Object.keys({ ...waxSeals, ...current });
  }, [theme?.assets]);

  const palette = theme?.palette ?? {};
  const fonts = theme?.fonts ?? {};
  const text = theme?.text ?? {};
  const toggles = theme?.toggles ?? {};
  const assets = theme?.assets ?? defaultAssets;

  const guardLaunchMode = (message) => {
    if (!launchMode) return false;
    setStatus(message);
    return true;
  };

  const handleColorChange = (key, value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ palette: { [key]: value } });
  };

  const handleFontChange = (key, value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ fonts: { [key]: value } });
  };

  const handleTextChange = (key, value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ text: { [key]: value } });
  };

  const handleToggleChange = (key, value) => {
    if (launchMode && key !== 'launchMode') {
      setStatus('Launch Mode is active. Disable it to edit.');
      return;
    }
    updateTheme({ toggles: { [key]: value } });
  };

  const handleNameChange = (key, value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ [key]: value });
  };

  const handleAssetUpload = async (field, file) => {
    if (!file) return;
    if (guardLaunchMode('Launch Mode is active. Disable it to replace media.')) return;
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

  const handleSaveAndPreview = () => {
    saveDraft(theme);
    window.open('/invite', '_blank', 'noopener,noreferrer');
    setStatus('Draft saved. Preview opened in a new tab.');
  };

  const handlePublish = async () => {
    setStatus('Publishing theme…');
    await publishTheme(theme);
    setStatus('Theme published.');
  };

  const handlePreset = (presetId, label) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    applyPreset(presetId);
    const preset = presets.find((entry) => entry.id === presetId);
    if (preset?.assets?.waxSealVariant) {
      setSelectedWax(preset.assets.waxSealVariant);
    }
    setStatus(`Preset "${label}" applied.`);
  };

  const handleReset = () => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    resetTheme();
    setSelectedWax('gold');
    setStatus('Theme reset to default.');
  };

  const handleSparkleAmount = (value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ toggles: { sparkleAmount: Number(value) } });
  };

  const handleVignetteStrength = (value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ toggles: { vignetteStrength: Number(value) } });
  };

  const handleFoilIntensity = (value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ toggles: { goldFoilIntensity: Number(value) } });
  };

  const handleCardEdgeStyle = (value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ toggles: { cardEdgeStyle: value } });
  };

  const handleWaxShape = (value) => {
    if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
    updateTheme({ toggles: { waxSealShape: value } });
  };

  const renderColorTab = () => (
    <section className="studio-panel">
      <h2>Palette</h2>
      <div className="studio-color-grid">
        {Object.entries({
          accent: 'Primary accent',
          accentSoft: 'Accent glow',
          background: 'Background',
          text: 'Primary text',
          textMuted: 'Soft text',
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
  );

  const renderFontTab = () => (
    <section className="studio-panel">
      <h2>Fonts</h2>
      <div className="studio-field-grid">
        <label className="studio-field">
          <span>Heading font</span>
          <select
            value={fonts.heading ?? headingFontGroups[0].options[0].value}
            onChange={(event) => handleFontChange('heading', event.target.value)}
            disabled={launchMode}
          >
            {headingFontGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="studio-field">
          <span>Body font</span>
          <select
            value={fonts.body ?? bodyFontOptions[0].value}
            onChange={(event) => handleFontChange('body', event.target.value)}
            disabled={launchMode}
          >
            {bodyFontOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );

  const renderTextTab = () => (
    <section className="studio-panel">
      <h2>Text styles</h2>
      <div className="studio-field-grid">
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
        <TextInput
          label="Greeting"
          value={text.greeting ?? 'Assalamu Alaikum'}
          onChange={(event) => handleTextChange('greeting', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Greeting suffix when partner present"
          value={text.greetingSuffix ?? ' wa Rahmatullah'}
          onChange={(event) => handleTextChange('greetingSuffix', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Bismillah Arabic"
          value={text.bismillahArabic ?? ''}
          onChange={(event) => handleTextChange('bismillahArabic', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Bismillah translation"
          value={text.bismillahTranslation ?? ''}
          onChange={(event) => handleTextChange('bismillahTranslation', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="English introduction"
          value={text.englishIntro ?? ''}
          onChange={(event) => handleTextChange('englishIntro', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Invitation line"
          value={text.englishInviteLine ?? ''}
          onChange={(event) => handleTextChange('englishInviteLine', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Event title"
          value={text.englishEventTitle ?? ''}
          onChange={(event) => handleTextChange('englishEventTitle', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Bride formal name"
          value={text.brideFullName ?? ''}
          onChange={(event) => handleTextChange('brideFullName', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Groom formal name"
          value={text.groomFullName ?? ''}
          onChange={(event) => handleTextChange('groomFullName', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Blessing line"
          value={text.englishBlessing ?? ''}
          onChange={(event) => handleTextChange('englishBlessing', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Arabic introduction"
          value={text.arabicIntro ?? ''}
          onChange={(event) => handleTextChange('arabicIntro', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Arabic bride line"
          value={text.arabicBrideLine ?? ''}
          onChange={(event) => handleTextChange('arabicBrideLine', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Arabic connector"
          value={text.arabicConnector ?? ''}
          onChange={(event) => handleTextChange('arabicConnector', event.target.value)}
          disabled={launchMode}
        />
        <TextInput
          label="Arabic groom line"
          value={text.arabicGroomLine ?? ''}
          onChange={(event) => handleTextChange('arabicGroomLine', event.target.value)}
          disabled={launchMode}
        />
      </div>
    </section>
  );

  const renderMediaTab = () => (
    <section className="studio-panel">
      <h2>Media & wax seals</h2>
      <div className="upload-grid">
        <label className="upload-field">
          <span>Envelope artwork</span>
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
                if (guardLaunchMode('Launch Mode is active. Disable it to edit.')) return;
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
        <div className="wax-shape-field">
          <span>Wax seal shape</span>
          <div className="pill-select">
            {waxShapeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`pill-option${toggles.waxSealShape === option.value ? ' is-active' : ''}`}
                onClick={() => handleWaxShape(option.value)}
                disabled={launchMode}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="wax-shape-field">
          <span>Card edge style</span>
          <div className="pill-select">
            {cardEdgeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`pill-option${toggles.cardEdgeStyle === option.value ? ' is-active' : ''}`}
                onClick={() => handleCardEdgeStyle(option.value)}
                disabled={launchMode}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  const renderAnimationsTab = () => (
    <section className="studio-panel">
      <h2>Animation controls</h2>
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
            checked={toggles.glow !== false}
            onChange={(event) => handleToggleChange('glow', event.target.checked)}
            disabled={launchMode}
          />
          <span>Glow accents</span>
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
  );

  const renderOverlaysTab = () => (
    <section className="studio-panel">
      <h2>Atmosphere & overlays</h2>
      <div className="studio-field-grid">
        <label className="switch-field">
          <input
            type="checkbox"
            checked={toggles.sparkles !== false}
            onChange={(event) => handleToggleChange('sparkles', event.target.checked)}
            disabled={launchMode}
          />
          <span>Gold sparkle overlay</span>
        </label>
        <label className="studio-field">
          <span>Sparkle intensity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={toggles.sparkleAmount ?? 0.55}
            onChange={(event) => handleSparkleAmount(event.target.value)}
            disabled={launchMode}
          />
        </label>
        <label className="switch-field">
          <input
            type="checkbox"
            checked={toggles.lightBokeh === true}
            onChange={(event) => handleToggleChange('lightBokeh', event.target.checked)}
            disabled={launchMode}
          />
          <span>Soft light bokeh</span>
        </label>
        <label className="switch-field">
          <input
            type="checkbox"
            checked={toggles.petals === true}
            onChange={(event) => handleToggleChange('petals', event.target.checked)}
            disabled={launchMode}
          />
          <span>Floating petals</span>
        </label>
        <label className="studio-field">
          <span>Vignette strength</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={toggles.vignetteStrength ?? 0.35}
            onChange={(event) => handleVignetteStrength(event.target.value)}
            disabled={launchMode}
          />
        </label>
        <label className="switch-field">
          <input
            type="checkbox"
            checked={toggles.paperTexture !== false}
            onChange={(event) => handleToggleChange('paperTexture', event.target.checked)}
            disabled={launchMode}
          />
          <span>Paper texture</span>
        </label>
        <label className="studio-field">
          <span>Gold foil intensity</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={toggles.goldFoilIntensity ?? 0.6}
            onChange={(event) => handleFoilIntensity(event.target.value)}
            disabled={launchMode}
          />
        </label>
      </div>
    </section>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'colors':
        return renderColorTab();
      case 'fonts':
        return renderFontTab();
      case 'text':
        return renderTextTab();
      case 'media':
        return renderMediaTab();
      case 'animations':
        return renderAnimationsTab();
      case 'overlays':
        return renderOverlaysTab();
      default:
        return null;
    }
  };

  return (
    <div className="theme-studio">
      <div className="theme-studio__header">
        <div>
          <span className="badge">Design studio</span>
          <h1 className="page-title">Craft the invitation aesthetic</h1>
          <p className="page-subtitle">
            Adjust palettes, typography, media, and motion. Save drafts locally or publish for every guest.
          </p>
          {launchMode && <p className="launch-mode-alert">Launch Mode is enabled. Disable it to continue editing.</p>}
        </div>
        <div className="theme-studio__actions">
          <Link className="studio-link" to="/invite" target="_blank" rel="noopener noreferrer">
            Back to Invitation
          </Link>
          <Button variant="ghost" size="md" onClick={handleReset} disabled={loading || isPublishing}>
            Reset to Default
          </Button>
          <Button variant="ghost" size="md" onClick={handleSaveDraft} disabled={loading || isPublishing}>
            Save Draft
          </Button>
          <Button variant="ghost" size="md" onClick={handleSaveAndPreview} disabled={loading || isPublishing}>
            Save &amp; Preview Invitation
          </Button>
          <Button variant="primary" size="md" onClick={handlePublish} loading={isPublishing}>
            Publish Theme
          </Button>
        </div>
      </div>

      {loading && <div className="theme-studio__loading">Loading theme…</div>}
      {error && <div className="theme-studio__alert">{error}</div>}
      {status && <div className="theme-studio__status">{status}</div>}

      <div className="theme-studio__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`studio-tab${tab.id === activeTab ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="theme-studio__grid">
        {renderActiveTab()}

        <section className="studio-panel">
          <h2>Theme presets</h2>
          <div className="preset-grid">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-card${theme?.id === preset.id ? ' is-active' : ''}`}
                onClick={() => handlePreset(preset.id, preset.label)}
                disabled={loading || isPublishing || launchMode}
              >
                <span className="preset-card__label">{preset.label}</span>
                <span className="preset-card__description">{preset.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="studio-panel preview-panel">
          <h2>Live preview</h2>
          <div className="preview-frame">
            <div className="preview-card-shell" data-shape={toggles.cardEdgeStyle ?? 'rounded'}>
              <div className="preview-bismillah">
                <span className="preview-bismillah-arabic">
                  {text.bismillahArabic ?? 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ'}
                </span>
                <span className="preview-bismillah-translation">
                  {text.bismillahTranslation ?? 'In the name of Allah, The Most Merciful, The Most Compassionate'}
                </span>
              </div>
              <div className="preview-envelope">
                <img src={assets.envelope ?? defaultAssets.envelope} alt="Envelope" className="preview-envelope__paper" />
                <img
                  src={(theme?.assets?.waxSeals ?? waxSeals)[theme?.assets?.waxSealVariant ?? selectedWax]}
                  alt="Wax seal"
                  className="preview-envelope__seal"
                  data-shape={toggles.waxSealShape ?? 'round'}
                />
              </div>
              <div className="preview-invite-card">
                <img src={assets.inviteCard ?? defaultAssets.inviteCard} alt="Invite card" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ThemeStudioPage;
