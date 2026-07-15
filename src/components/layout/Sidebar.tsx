import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Flag, Trophy, Calendar, BarChart3,
  Bell, LogOut, Users, ClipboardList,
  ShieldCheck, FileText, Target, Star, Activity,
  Megaphone, UserCheck, AlertTriangle, Wallet,
  Settings, GitBranch,
} from 'lucide-react';
import { getCurrentUser } from '../../api/authService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { BrandLogo } from '../ui/BrandLogo';

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
    { icon: UserCheck, label: 'Referee Management', path: '/admin/referees' },
    { icon: Megaphone, label: 'Publish Results', path: '/admin/results' },
    { icon: AlertTriangle, label: 'Violations', path: '/admin/violations' },
    { icon: Target, label: 'Predictions', path: '/admin/predictions' },
    { icon: GitBranch, label: 'Demo Flow', path: '/admin/demo-flow' },
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
  veterinarian: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/vet/dashboard' },
    { icon: ClipboardList, label: 'Medical Check', path: '/vet/medical-check' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  owner: 'Horse Owner',
  jockey: 'Jockey',
  referee: 'Referee',
  spectator: 'Spectator',
  veterinarian: 'Veterinarian',
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

  const { setUser } = useAuth();
  const { t } = useLanguage();

  const [showSettings, setShowSettings] = useState(false);

  function handleLogout() {
    setUser(null);                       // clear React state + localStorage atomically
    navigate('/login', { replace: true }); // replace: Back không quay lại dashboard cũ
  }

  return (
    <aside className="w-[280px] shrink-0 h-screen sticky top-0 border-r border-glass-border bg-[#0A1220] flex flex-col z-40 relative">
      {/* Logo */}
      <div className="px-6 h-16 flex items-center gap-2.5 border-b border-glass-border shrink-0">
        <BrandLogo size={44} />
        <span className="font-serif text-lg font-bold text-champagne tracking-wider">EQUESTRIA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted/50 font-bold px-3 mb-2">{t("Menu")}</div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-200 ${isActive
                ? 'bg-gold/10 text-champagne border border-gold/20'
                : 'text-muted hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
            >
              <item.icon size={18} className={isActive ? 'text-gold' : ''} />
              {t(item.label)}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-glass-border shrink-0 relative">
        <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-glass-border rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold-border/30 flex items-center justify-center font-bold text-gold shrink-0">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate max-w-[120px]">{user?.fullName}</div>
              <div className="text-[11px] text-gold font-medium truncate max-w-[120px]">{t(ROLE_LABELS[roleKey] ?? user?.role)}</div>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`text-muted hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.04] ${showSettings ? 'text-gold bg-white/[0.04]' : ''}`}
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Click Outside Overlay Backdrop */}
        {showSettings && (
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setShowSettings(false)}
          />
        )}

        {/* Settings Popover */}
        {showSettings && (
          <div className="absolute bottom-20 left-4 right-4 z-50 glass-panel-elevated rounded-xl p-4 shadow-2xl border border-gold-border flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-glass-border pb-2">
              <span className="text-xs font-bold text-champagne uppercase tracking-wider">{t("Settings")}</span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-muted hover:text-white text-xs font-medium"
              >
                {t("Close")}
              </button>
            </div>

            {/* Logout Action */}
            <div className="border-t border-glass-border pt-3">
              <button
                onClick={() => {
                  setShowSettings(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 hover:border-red-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut size={14} />
                {t("Logout")}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
