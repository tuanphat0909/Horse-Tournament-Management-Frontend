import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { user, authReady } = useAuth();

  // Wait for token validation to complete before making any routing decision.
  if (!authReady) {
    return (
      <div
        style={{ backgroundColor: '#0b101e' }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 640 400" fill="none" className="w-32 h-20 opacity-60">
            <g stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M470 160 C494 148 520 148 538 162 C550 172 556 184 554 194" />
              <path d="M470 160 C440 150 410 152 386 166" />
              <path d="M386 166 C346 158 300 160 266 176 C248 184 238 194 234 204" />
              <path d="M412 208 C420 224 416 240 404 250" />
              <path d="M404 250 C428 258 456 268 480 284" />
              <path d="M264 232 C236 244 206 260 180 278" />
            </g>
          </svg>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-gold animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
