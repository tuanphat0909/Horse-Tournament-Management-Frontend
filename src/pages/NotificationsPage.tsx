import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Trophy, Activity, Sparkles, Wallet, Info,
  Trash2, Check, CheckSquare, ChevronLeft, ChevronRight, Eye,
} from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { PageHero } from '../components/layout/PageHero';
import { PageAmbience } from '../components/layout/PageAmbience';
import { HighlightQuoted } from '../components/ui/HighlightQuoted';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../api/publicService';
import { parseApiError, getCurrentUser } from '../api/authService';
import { useNotifications } from '../context/NotificationContext';
import { filterNotisForRole, toRoleKey } from '../utils/notificationFilter';

type FilterType = 'all' | 'unread' | 'tournament' | 'race' | 'bet' | 'wallet' | 'system';

// Mỗi role chỉ quan tâm một số loại thông báo — tab lọc bám theo đó.
const FILTERS_BY_ROLE: Record<string, FilterType[]> = {
  admin:        ['all', 'unread', 'system', 'tournament', 'race', 'wallet'],
  owner:        ['all', 'unread', 'system', 'tournament', 'race', 'wallet'],
  jockey:       ['all', 'unread', 'system', 'tournament', 'race'],
  referee:      ['all', 'unread', 'system', 'tournament', 'race'],
  veterinarian: ['all', 'unread', 'system', 'tournament'],
  spectator:    ['all', 'unread', 'tournament', 'race', 'bet', 'wallet', 'system'],
};

// Ảnh + vị trí crop giống hệt các trang khác của cùng role để hero không bị lệch
const HERO_BY_ROLE: Record<string, { title: string; subtitle: string; image: string; position: string }> = {
  admin: {
    title: 'System Alerts & Notifications',
    subtitle: 'Admin logs, assignment reminders and tournament system activities.',
    image: '/images/hero-admin.jpg',
    position: 'center center',
  },
  owner: {
    title: 'Notifications',
    subtitle: 'Updates about your horses, registrations, jockey contracts and prizes.',
    image: '/images/hero-owner.jpg',
    position: 'center 5%',
  },
  jockey: {
    title: 'Notifications',
    subtitle: 'Contract invitations, race schedules and your results.',
    image: '/images/hero-jockey.jpg',
    position: 'center 12%',
  },
  referee: {
    title: 'Notifications',
    subtitle: 'Race assignments, inspection duties and result confirmations.',
    image: '/images/hero-referee.jpg',
    position: 'right 28%',
  },
  veterinarian: {
    title: 'Notifications',
    subtitle: 'Medical check requests and horse health updates.',
    image: '/images/hero-referee.jpg',
    position: 'right 28%',
  },
  spectator: {
    title: 'Notifications',
    subtitle: 'Tournament updates, race results, bets and wallet activities.',
    image: '/images/hero-spectator.jpg',
    position: 'center 50%',
  },
};

const PAGE_SIZE = 8;

export function NotificationsPage() {
  const navigate = useNavigate();
  const { fetchRecent } = useNotifications();
  const roleKey = toRoleKey(getCurrentUser()?.role);
  const hero = HERO_BY_ROLE[roleKey] ?? HERO_BY_ROLE.spectator;
  const filters = FILTERS_BY_ROLE[roleKey] ?? FILTERS_BY_ROLE.spectator;

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadNotifications() {
    setLoading(true);
    setError('');
    try {
      const params: any = { page: currentPage, pageSize: PAGE_SIZE };
      if (activeFilter === 'unread') {
        params.isRead = false;
      } else if (activeFilter !== 'all') {
        params.type = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
      }

      const res = await getNotifications(params);
      const items = res?.result?.items ?? res?.result?.Items ?? [];
      const total = res?.result?.totalCount ?? res?.result?.TotalCount ?? 0;

      // Bỏ thông báo không thuộc vai trò đang đăng nhập
      const visible = filterNotisForRole(Array.isArray(items) ? items : [], roleKey);
      setNotifications(visible);
      setTotalCount(Math.max(0, total - (items.length - visible.length)));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeFilter]);

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      fetchRecent();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchRecent();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
      fetchRecent();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleViewDetails = (noti: any) => {
    if (!noti.isRead) handleMarkRead(noti.id);
    if (noti.actionUrl) navigate(noti.actionUrl);
  };

  const getNotiIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tournament': return <Trophy size={18} className="text-purple-400" />;
      case 'race':       return <Activity size={18} className="text-blue-400" />;
      case 'bet':        return <Sparkles size={18} className="text-emerald-400" />;
      case 'wallet':     return <Wallet size={18} className="text-gold" />;
      default:           return <Info size={18} className="text-muted" />;
    }
  };

  const getNotiIconBg = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tournament': return 'bg-purple-500/10 border-purple-500/25';
      case 'race':       return 'bg-blue-500/10 border-blue-500/25';
      case 'bet':        return 'bg-emerald-500/10 border-emerald-500/25';
      case 'wallet':     return 'bg-gold/10 border-gold-border/20';
      default:           return 'bg-white/[0.03] border-glass-border';
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      let cleanStr = dateStr;
      if (!cleanStr.endsWith('Z') && !cleanStr.includes('+')) cleanStr += 'Z';
      return new Date(cleanStr).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const unreadOnPage = notifications.filter(n => !n.isRead).length;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemVar = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />

        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <PageHero
            title={hero.title}
            subtitle={hero.subtitle}
            imageUrl={hero.image}
            imagePosition={hero.position}
          />

          {/* Filter tabs — nút Mark all as read nằm cuối hàng, canh phải */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-white/[0.02] border border-glass-border rounded-xl">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => handleFilterChange(filter)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${
                  activeFilter === filter
                    ? 'bg-gold text-[#0b101e] shadow-lg shadow-gold/20'
                    : 'text-muted hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                {filter}
              </button>
            ))}
            <button
              onClick={handleMarkAllRead}
              disabled={unreadOnPage === 0}
              className="ml-auto px-4 py-2 rounded-lg text-xs font-semibold text-champagne border border-glass-border hover:bg-white/[0.06] hover:border-gold/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <CheckSquare size={14} />
              Mark all as read
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <LoadingSkeleton rows={5} h="h-20" />
          ) : notifications.length > 0 ? (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
              <AnimatePresence mode="popLayout">
                {notifications.map(noti => (
                  <motion.div
                    key={noti.id}
                    variants={itemVar}
                    exit={{ opacity: 0, x: -50 }}
                    className={`glass-panel border rounded-xl p-4 flex gap-4 items-start relative transition-all ${
                      !noti.isRead ? 'border-gold-border/30 bg-gold/[0.02]' : 'border-glass-border bg-white/[0.01]'
                    }`}
                  >
                    {!noti.isRead && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />
                    )}

                    <div className={`p-2.5 rounded-lg border shrink-0 ${getNotiIconBg(noti.type)}`}>
                      {getNotiIcon(noti.type)}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h4 className={`text-sm font-bold truncate ${!noti.isRead ? 'text-white' : 'text-white/80'}`}>
                          {noti.title}
                        </h4>
                        <span className="text-[10px] text-muted/60 shrink-0">
                          {formatTime(noti.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed pr-2">
                        <HighlightQuoted text={noti.content || noti.message} />
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      {noti.actionUrl && (
                        <button
                          onClick={() => handleViewDetails(noti)}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 text-muted hover:text-blue-400 transition-all"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {!noti.isRead && (
                        <button
                          onClick={() => handleMarkRead(noti.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 text-muted hover:text-emerald-400 transition-all"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(noti.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-muted hover:text-red-400 transition-all"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="glass-panel border border-glass-border rounded-2xl py-16 px-4 text-center text-muted">
              <Bell size={32} className="mx-auto mb-3 opacity-30 text-gold" />
              <p className="text-sm font-medium">
                {activeFilter === 'all' ? 'No notifications yet' : `No notifications matching "${activeFilter}"`}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-glass-border/40 pt-4">
              <p className="text-xs text-muted">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-glass-border hover:bg-white/5 disabled:opacity-40 transition-colors text-champagne"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-glass-border hover:bg-white/5 disabled:opacity-40 transition-colors text-champagne"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
