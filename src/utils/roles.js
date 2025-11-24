export const STAFF_ROLES = {
  manager: 'MANAGER',
  checkIn: 'CHECK_IN',
  security: 'SECURITY',
};

const DEFAULT_PINS = {
  [STAFF_ROLES.manager]: '0408',
  [STAFF_ROLES.checkIn]: '1111',
  [STAFF_ROLES.security]: '2222',
};

export const getRolePins = () => ({
  [STAFF_ROLES.manager]: import.meta.env.VITE_PIN_MANAGER || DEFAULT_PINS[STAFF_ROLES.manager],
  [STAFF_ROLES.checkIn]: import.meta.env.VITE_PIN_CHECKIN || DEFAULT_PINS[STAFF_ROLES.checkIn],
  [STAFF_ROLES.security]: import.meta.env.VITE_PIN_SECURITY || DEFAULT_PINS[STAFF_ROLES.security],
});

export const getRoleByPin = (pin) => {
  const pins = getRolePins();
  const match = Object.entries(pins).find(([, value]) => value && value.toString() === pin.toString());
  return match ? match[0] : null;
};

export const getRoleLabel = (role) => {
  if (role === STAFF_ROLES.manager) return 'Manager';
  if (role === STAFF_ROLES.checkIn) return 'Check-In';
  if (role === STAFF_ROLES.security) return 'Security';
  return 'Guest';
};

export const STAFF_ROLE_STORAGE_KEY = 'hs_staff_role';
