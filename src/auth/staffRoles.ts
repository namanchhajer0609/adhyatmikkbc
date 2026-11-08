export type StaffRole = 'admin' | 'host' | 'player';

export const STAFF_EMAILS: Record<StaffRole, string> = {
  admin: 'tkm/admin@tkmrrnagar.bhikshu',
  host: 'tkm/host@tkmrrnagar.bhikshu',
  player: 'tkm/player@tkmrrnagar.bhikshu',
};

export const STAFF_LOGIN_IDS: Record<StaffRole, string> = {
  admin: 'tkm/admin@tkmrrnagar.bhikshu',
  host: 'tkm/host@tkmrrnagar.bhikshu',
  player: 'tkm/player@tkmrrnagar.bhikshu',
};

export const staffRoleForEmail = (email?: string | null): StaffRole | null => {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  return (Object.entries(STAFF_EMAILS).find(([, value]) => value.toLowerCase() === normalized)?.[0] as StaffRole | undefined) ?? null;
};

export const protectedRoleForPath = (path: string): StaffRole | null => {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/host')) return 'host';
  if (path.startsWith('/contestant')) return 'player';
  return null;
};
