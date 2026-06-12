import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Flag, Trophy, Calendar, BarChart3,
  Bell, LogOut, Users, ClipboardList,
  ShieldCheck, FileText, Target, Star, Activity,
  Megaphone, UserCheck, AlertTriangle, Wallet,
} from 'lucide-react';
import { getCurrentUser, logout } from '../../api/authService';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Accounts', path: '/admin/users' },
    { icon: Trophy, label: 'Tournaments', path: '/admin/tournaments' },
    { icon: Calendar, label: 'Race Schedule', path: '/admin/races' },
    { icon: ClipboardList, label: 'Registrations', path: '/admin/registrations' },
    { icon: UserCheck, label: 'Assign Referees', path: '/admin/referees' },
    { icon: Megaphone, label: 'Publish Results', path: '/admin/results' },
    { icon: AlertTriangle, label: 'Violations', path: '/admin/violations' },
    { icon: Target, label: 'Predictions', path: '/admin/predictions' },
  ],
  owner: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/owner/dashboard' },
    { icon: Flag, label: 'My Horses', path: '/owner/horses' },
    { icon: Trophy, label: 'Tournaments', path: '/owner/tournaments' },
    { icon: ClipboardList, label: 'Race Entry', path: '/owner/registrations' },
    { icon: Users, label: 'Jockey', path: '/owner/jockeys' },
    { icon: BarChart3, label: 'Results & Prizes', path: '/owner/results' },
  ],
  jockey: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/jockey/dashboard' },
    { icon: Bell, label: 'Invitations', path: '/jockey/invitations' },
    { icon: Flag, label: 'My Races', path: '/jockey/races' },
    { icon: Calendar, label: 'Schedule', path: '/jockey/schedule' },
    { icon: Star, label: 'Achievements', path: '/jockey/stats' },
    { icon: AlertTriangle, label: 'My Violations', path: '/jockey/violations' },
  ],
  referee: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/referee/dashboard' },
    { icon: ShieldCheck, label: 'Horse Inspection', path: '/referee/horse-check' },
    { icon: Activity, label: 'Record Violations', path: '/referee/violations' },
    { icon: Flag, label: 'Confirm Results', path: '/referee/confirm-results' },
    { icon: FileText, label: 'Reports', path: '/referee/reports' },
  ],
  spectator: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/spectator/dashboard' },
    { icon: Wallet, label: 'My Wallet', path: '/spectator/wallet' },
    { icon: Trophy, label: 'Tournaments & Schedule', path: '/spectator/tournaments' },
    { icon: Activity, label: 'Live Results', path: '/spectator/live' },
    { icon: Target, label: 'My Predictions', path: '/spectator/predictions' },
    { icon: Bell, label: 'Notifications', path: '/spectator/notifications' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  owner: 'Horse Owner',
  jockey: 'Jockey',
  referee: 'Referee',
  spectator: 'Spectator',
};

function toRoleKey(role: string | undefined): string {
  if (!role) return 'spectator';
  const lower = role.toLowerCase();
  return lower === 'horseowner' ? 'owner' : lower;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const roleKey = toRoleKey(user?.role);
  const navItems = NAV_BY_ROLE[roleKey] ?? NAV_BY_ROLE.spectator;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-[280px] shrink-0 h-screen sticky top-0 border-r border-glass-border bg-[#0A1220] flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 h-16 flex items-center gap-2.5 border-b border-glass-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/30">
          <svg viewBox="0 0 24 24" fill="var(--color-gold)" className="w-4 h-4">
            <path d="M12 2C9 2 8 5 8 5L6 6V10L8 12V18L6 20H8V22H10V20H14V22H16V20H18L16 18V12L18 10V6L16 5C16 5 15 2 12 2Z" />
          </svg>
        </div>
        <span className="font-serif text-lg font-bold text-champagne tracking-wider">EQUESTRIA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted/50 font-bold px-3 mb-2">Menu</div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-200 ${
                isActive
                  ? 'bg-gold/10 text-champagne border border-gold/20'
                  : 'text-muted hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-gold' : ''} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-glass-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center font-serif text-base font-bold text-champagne">
            {user?.fullName?.[0] ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.fullName ?? 'User'}</div>
            <div className="text-[11px] text-gold font-medium">{ROLE_LABELS[roleKey] ?? user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted hover:text-white transition-colors p-1"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
