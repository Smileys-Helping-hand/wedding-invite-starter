export const defaultAssets = {
  bismillah: '/assets/bismillah-gold.png',
  curtainLeft: '/assets/silk-curtain-left.png',
  curtainRight: '/assets/silk-curtain-right.png',
  envelope: '/assets/envelope.png',
  inviteCard: '/assets/invitecard.png',
  sparklesVideo: '/assets/sparkles.mp4',
  nasheed: '/assets/nasheed.mp3',
};

export const waxSeals = {
  default: '/assets/waxseal.png',
  gold: '/assets/waxseal_gold.png',
  rosegold: '/assets/waxseal_rosegold.png',
  emerald: '/assets/waxseal_emerald.png',
  flower: '/assets/waxseal_flower.png',
};

export const getAssetPath = (key, overrides) => overrides?.[key] ?? defaultAssets[key];

export const getWaxSeal = (variant = 'default', overrides) => {
  if (overrides) {
    const map = overrides.waxSeals ?? overrides;
    return map?.[variant] ?? map?.default ?? waxSeals[variant] ?? waxSeals.default;
  }

  return waxSeals[variant] ?? waxSeals.default;
};
