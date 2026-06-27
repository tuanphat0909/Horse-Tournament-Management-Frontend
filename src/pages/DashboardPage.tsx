import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api/authService';

const ROLE_HOME: Record<string, string> = {
  admin:      '/admin/dashboard',
  owner:      '/owner/dashboard',
  horseowner: '/owner/dashboard',
  jockey:     '/jockey/dashboard',
  referee:    '/referee/dashboard',
  spectator:  '/spectator/dashboard',
};

export function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    const role = (user?.role ?? user?.roleName ?? '').toLowerCase();
    const target = ROLE_HOME[role] ?? '/login';
    navigate(target, { replace: true });
  }, [navigate]);

  return null;
}
