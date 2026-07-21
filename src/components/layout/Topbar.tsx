import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trophy, Activity, Sparkles, Wallet, Info, CheckCheck, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { getCurrentUser } from '../../api/authService';
import { HighlightQuoted } from '../ui/HighlightQuoted';
import { toRoleKey } from '../../utils/notificationFilter';
import { getTournaments } from '../../api/publicService';

interface TournamentReadinessAlert {
  tournamentId: number;
  name: string;
  missingLanes: boolean;
  missingReferees: boolean;
  qualifiedHorses: number;
  hasInvalidHorseCount: boolean;
  startDate: string;
}

// Mỗi role có trang thông báo riêng — chuông và nút "View all" trỏ đúng trang đó.
const NOTIFICATIONS_PATH: Record<string, string> = {
  admin: '/admin/notifications',
  owner: '/owner/notifications',
  jockey: '/jockey/notifications',
  referee: '/referee/notifications',
  spectator: '/spectator/notifications',
  veterinarian: '/vet/notifications',
};

export function Topbar() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchRecent } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [readinessAlerts, setReadinessAlerts] = useState<TournamentReadinessAlert[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();
  const roleKey = toRoleKey(user?.role);
  const notificationsPath = NOTIFICATIONS_PATH[roleKey] ?? '/notifications';

  useEffect(() => {
    if (roleKey !== 'admin') {
      setReadinessAlerts([]);
      return;
    }

    let active = true;
    const loadReadinessAlerts = async () => {
      try {
        const response: any = await getTournaments();
        const tournaments = Array.isArray(response?.result) ? response.result : [];
        const now = Date.now();
        const alerts = tournaments
          .filter((tournament: any) => {
            const status = String(tournament.status ?? '').toLowerCase();
            if (status === 'completed' || status === 'finished' || status === 'cancelled') return false;
            if (!tournament.startDate) return false;
            const start = new Date(tournament.startDate).getTime();
            const end = tournament.endDate ? new Date(tournament.endDate).getTime() : start;
            return Number.isFinite(start) && start - now <= 24 * 60 * 60 * 1000 && end >= now &&
              (!tournament.hasCompleteLaneAssignments || tournament.hasMissingReferees);
          })
          .map((tournament: any) => ({
            tournamentId: Number(tournament.tournamentId),
            name: String(tournament.name ?? `Tournament #${tournament.tournamentId}`),
            missingLanes: !tournament.hasCompleteLaneAssignments,
            missingReferees: Boolean(tournament.hasMissingReferees),
            qualifiedHorses: Number(tournament.qualifiedRegistration ?? 0),
            hasInvalidHorseCount: Number(tournament.qualifiedRegistration ?? 0) < 12 || Number(tournament.qualifiedRegistration ?? 0) > 48,
            startDate: String(tournament.startDate),
          }));
        if (active) {
          setReadinessAlerts(alerts);
        }
      } catch {
        if (active) setReadinessAlerts([]);
      }
    };

    loadReadinessAlerts();
    const intervalId = window.setInterval(loadReadinessAlerts, 15_000);
    window.addEventListener('tournament-readiness-changed', loadReadinessAlerts);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('tournament-readiness-changed', loadReadinessAlerts);
    };
  }, [roleKey]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleNotiClick = async (noti: any) => {
    setDropdownOpen(false);
    if (!noti.isRead) {
      await markAsRead(noti.id);
    }
    if (noti.actionUrl) {
      navigate(noti.actionUrl);
    } else {
      navigate(notificationsPath);
    }
  };

  const getNotiIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tournament':
        return <Trophy size={14} className="text-purple-400" />;
      case 'race':
        return <Activity size={14} className="text-blue-400" />;
      case 'bet':
        return <Sparkles size={14} className="text-emerald-400" />;
      case 'wallet':
        return <Wallet size={14} className="text-gold" />;
      default:
        return <Info size={14} className="text-muted" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const now = new Date();
      let adjustedDateStr = dateStr;
      if (typeof adjustedDateStr === 'string' && !adjustedDateStr.endsWith('Z') && !adjustedDateStr.includes('+')) {
        adjustedDateStr = adjustedDateStr + 'Z';
      }
      const past = new Date(adjustedDateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return t('Just now');
      if (diffMins < 60) return `${diffMins} ${t('minutes ago')}`;
      if (diffHours < 24) return `${diffHours} ${t('hours ago')}`;

      return past.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'numeric', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const statusLower = user?.status?.toLowerCase();
  const isLocked = statusLower !== 'active';

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full">
      {readinessAlerts.map((alert) => (
        <div key={alert.tournamentId} className="bg-red-600 text-white border-b border-red-300/40 px-6 py-2.5 flex flex-wrap items-center gap-3 text-xs font-bold shadow-lg">
          <AlertTriangle size={17} className="shrink-0 animate-pulse" />
          <span className="flex-grow">
            {alert.hasInvalidHorseCount
              ? `URGENT: '${alert.name}' cannot be scheduled: ${alert.qualifiedHorses}/12 qualified horses. Extend registration or cancel the tournament.`
              : <>URGENT: '{alert.name}' starts within 24 hours but is missing
                {alert.missingLanes && alert.missingReferees
                  ? ' lane and referee assignments.'
                  : alert.missingLanes
                    ? ' lane assignments.'
                    : ' referee assignments.'}</>}
          </span>
          {alert.hasInvalidHorseCount ? (
            <button onClick={() => navigate('/admin/tournaments')} className="rounded-md bg-white text-red-700 px-3 py-1.5 hover:bg-red-50 transition-colors">
              Resolve registration
            </button>
          ) : alert.missingLanes && (
            <button onClick={() => navigate('/admin/races')} className="rounded-md bg-white text-red-700 px-3 py-1.5 hover:bg-red-50 transition-colors">
              Assign lanes
            </button>
          )}
          {!alert.hasInvalidHorseCount && alert.missingReferees && (
            <button onClick={() => navigate('/admin/referees')} className="rounded-md bg-white text-red-700 px-3 py-1.5 hover:bg-red-50 transition-colors">
              Assign referees
            </button>
          )}
        </div>
      ))}
      {isLocked && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3 flex items-center gap-3 text-red-400 text-xs font-bold backdrop-blur-md">
          <AlertTriangle size={16} className="text-red-400 shrink-0 animate-pulse" />
          <span className="flex-grow text-left">
            Your account is currently locked or inactive due to a terms violation or system request. 
            Betting, deposit, and registration features have been disabled. 
            You can only perform withdrawals of your remaining wallet balance.
          </span>
        </div>
      )}
      <header className="h-16 border-b border-glass-border bg-[#0B1628]/90 backdrop-blur-xl flex items-center px-8 justify-end">
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          {/* Bell Button */}
          <button 
            onClick={() => {
              const nextOpen = !dropdownOpen;
              setDropdownOpen(nextOpen);
              if (nextOpen) {
                fetchRecent();
              }
            }}
            className={`relative transition-colors p-2 rounded-lg hover:bg-white/[0.04] ${
              dropdownOpen ? 'text-white bg-white/[0.04]' : unreadCount > 0 ? 'text-[#FFC53D] hover:text-[#FFD966]' : 'text-muted hover:text-white'
            }`}
          >
            <Bell
              size={18}
              className={unreadCount > 0 ? 'drop-shadow-[0_0_6px_rgba(255,197,61,0.8)]' : ''}
            />
            {unreadCount > 0 && (
              <>
                {/* Vòng sáng lan tỏa để hút mắt khi có thông báo mới */}
                <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#FFC53D] opacity-70 animate-ping pointer-events-none" />
                {/* Màu vàng sáng cố định — biến --color-gold bị đổi sang nâu sạm ở light theme */}
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white/85"
                  style={{
                    background: 'linear-gradient(135deg,#FFE07A 0%,#FFC53D 55%,#F5A623 100%)',
                    color: '#2A1D00',
                    boxShadow: '0 0 10px rgba(255,197,61,0.95), 0 2px 6px rgba(0,0,0,0.3)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {/* Notifications Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-80 glass-panel-elevated rounded-xl shadow-2xl border border-gold-border/40 overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 bg-[#0A1220]/95">
              <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between bg-white/[0.01]">
                <span className="text-xs font-bold text-champagne uppercase tracking-wider">{t("Notifications")}</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 text-[10px] font-bold text-gold hover:text-white transition-colors"
                    title={t("Mark all as read")}
                  >
                    <CheckCheck size={12} /> {t("Mark as read")} ({unreadCount})
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[360px] overflow-y-auto divide-y divide-glass-border">
                {notifications.length > 0 ? (
                  notifications.slice(0, 10).map((noti) => (
                    <div
                      key={noti.id}
                      onClick={() => handleNotiClick(noti)}
                      className={`px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer flex items-start gap-3 relative ${
                        !noti.isRead ? 'bg-gold/[0.01]' : ''
                      }`}
                    >
                      {/* Unread indicator */}
                      {!noti.isRead && (
                        <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-gold" />
                      )}

                      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-glass-border flex items-center justify-center shrink-0">
                        {getNotiIcon(noti.type)}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-bold truncate ${!noti.isRead ? 'text-white' : 'text-white/70'}`}>
                            {noti.title}
                          </span>
                          <span className="text-[9px] text-muted/50 shrink-0">
                            {formatTimeAgo(noti.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted/80 line-clamp-2 leading-relaxed">
                          <HighlightQuoted text={noti.content || noti.message} />
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-muted">
                    {t("No notifications")}
                  </div>
                )}
              </div>

              {/* Footer button */}
              <div className="border-t border-glass-border bg-white/[0.02] text-center">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(notificationsPath);
                  }}
                  className="w-full py-2.5 text-[11px] font-bold text-champagne hover:text-white transition-colors cursor-pointer"
                >
                  {t("View all notifications")} &rarr;
                </button>
              </div>
            </div>
          )}

          <div className="text-sm text-muted">
            <span className="text-white font-medium">{t("Season 2026")}</span> • Q3
          </div>
        </div>
      </header>
    </div>
  );
}
