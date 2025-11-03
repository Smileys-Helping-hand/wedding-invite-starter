export const defaultAssets = {
  envelope: '/assets/marble-envelope.png',
  inviteCard: '/assets/floral-panel.png',
  cardBackground: '/assets/floral-panel.png',
  sparklesVideo: '/assets/sparkles.mp4',
  nasheed: '/assets/golden-hour-piano.mp3',
  emblem: '/assets/emblem-gold.png',
  bismillah: '/assets/bismillah-gold.png',
};

export const waxSeals = {
  default: '/assets/wax-seal-gold.png',
  gold: '/assets/wax-seal-gold.png',
  rosegold: '/assets/wax-seal-rosegold.png',
  emerald: '/assets/wax-seal-emerald.png',
  flower: '/assets/wax-seal-flower.png',
};

export const getAssetPath = (key, overrides) => overrides?.[key] ?? defaultAssets[key];

export const getWaxSeal = (variant = 'default', overrides) => {
  if (overrides) {
    const map = overrides.waxSeals ?? overrides;
    return map?.[variant] ?? map?.default ?? waxSeals[variant] ?? waxSeals.default;
  }

  return waxSeals[variant] ?? waxSeals.default;
};
