export const meltPreset = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 0, scale: 1.02, y: -10 },
  transition: { duration: 2.2, ease: 'easeInOut' },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6 },
};

export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};
