export const ASSET_PATHS = {
  bismillah: '/assets/bismillah-gold.png',
  curtainLeft: '/assets/silk-curtain-left.png',
  curtainRight: '/assets/silk-curtain-right.png',
  envelope: '/assets/envelope.png',
  inviteCard: '/assets/invitecard.png',
  sparklesVideo: '/assets/sparkles.mp4',
  nasheed: '/assets/nasheed.mp3',
};

export const WAX_SEALS = {
  default: '/assets/waxseal.png',
  gold: '/assets/waxseal_gold.png',
  rosegold: '/assets/waxseal_rosegold.png',
  emerald: '/assets/waxseal_emerald.png',
  flower: '/assets/waxseal_flower.png',
};

export const getAssetPath = (key) => ASSET_PATHS[key];

export const getWaxSeal = (variant = 'default') => WAX_SEALS[variant] ?? WAX_SEALS.default;
