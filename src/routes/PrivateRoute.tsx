import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../api/authService';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRoleKey = user.role?.toLowerCase().replace(/[\s_-]/g, '') ?? '';
    const allowed = allowedRoles.map(r => r.toLowerCase().replace(/[\s_-]/g, ''));
    if (!allowed.includes(userRoleKey)) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
