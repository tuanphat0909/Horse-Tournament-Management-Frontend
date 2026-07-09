const ROLE_DASHBOARD = {
  admin: '/admin/dashboard',
  horseowner: '/owner/dashboard',
  owner: '/owner/dashboard',
  jockey: '/jockey/dashboard',
  referee: '/referee/dashboard',
  spectator: '/spectator/dashboard',
  veterinarian: '/vet/dashboard',
};

export function getDashboardPath(role) {
  if (!role) return '/';
  const key = role.toLowerCase().replace(/[\s_-]/g, '');
  return ROLE_DASHBOARD[key] ?? '/';
}
