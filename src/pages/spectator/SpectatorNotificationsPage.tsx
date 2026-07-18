import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Trophy, Activity, Sparkles, Wallet, Info, 
  Trash2, Check, CheckSquare, ChevronLeft, ChevronRight, Eye 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from '../../api/publicService';
import { useNotifications } from '../../context/NotificationContext';
import { parseApiError } from '../../api/authService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type FilterType = 'all' | 'unread' | 'tournament' | 'race' | 'bet' | 'wallet' | 'system';

export function SpectatorNotificationsPage() {
  const navigate = useNavigate();
  const { fetchRecent } = useNotifications(); // to refresh header count
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const pageSize = 8;

  async function loadNotifications() {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        page: currentPage,
        pageSize: pageSize
      };

      if (activeFilter === 'unread') {
        params.isRead = false;
      } else if (activeFilter !== 'all') {
        // Map filter names to match backend Types exactly
        // Type (Tournament, Race, Bet, Wallet, System)
        params.type = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
      }

      const res = await getNotifications(params);
      if (res && res.result) {
        const items = res.result.items || res.result.Items || [];
        const total = res.result.totalCount !== undefined 
          ? res.result.totalCount 
          : (res.result.TotalCount !== undefined ? res.result.TotalCount : 0);
        setNotifications(items);
        setTotalCount(total);
      } else {
        setNotifications([]);
        setTotalCount(0);
      }
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

  // Reset page when filter changes
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      fetchRecent(); // refresh header
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchRecent(); // refresh header
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
      fetchRecent(); // refresh header
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleViewDetails = (noti: any) => {
    if (!noti.isRead) {
      handleMarkRead(noti.id);
    }
    if (noti.actionUrl) {
      navigate(noti.actionUrl);
    }
  };

  const getNotiIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tournament':
        return <Trophy size={18} className="text-purple-400" />;
      case 'race':
        return <Activity size={18} className="text-blue-400" />;
      case 'bet':
        return <Sparkles size={18} className="text-emerald-400" />;
      case 'wallet':
        return <Wallet size={18} className="text-gold" />;
      default:
        return <Info size={18} className="text-muted" />;
    }
  };

  const getNotiIconBg = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tournament':
        return 'bg-purple-500/10 border-purple-500/25';
      case 'race':
        return 'bg-blue-500/10 border-blue-500/25';
      case 'bet':
        return 'bg-emerald-500/10 border-emerald-500/25';
      case 'wallet':
        return 'bg-gold/10 border-gold-border/20';
      default:
        return 'bg-white/5 border-glass-border';
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

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      return past.toLocaleDateString('vi-VN', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const filtersList: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'tournament', label: 'Tournaments' },
    { value: 'race', label: 'Race' },
    { value: 'bet', label: 'Bets' },
    { value: 'wallet', label: 'Wallet' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="min-h-screen text-body font-sans flex bg-[#0B101E]">
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        
        <main className="max-w-[1200px] mx-auto px-8 py-6 space-y-6 relative z-10">
          <PageHero
            title="Notification Center"
            subtitle="Track, manage, and update betting and tournament info in real time"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-gold-border/30 rounded-2xl p-4 backdrop-blur-xl">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1.5">
              {filtersList.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    activeFilter === f.value
                      ? 'bg-gold/20 text-champagne border-gold/40 shadow-lg'
                      : 'text-muted border-transparent hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-champagne border border-gold-border/30 hover:border-gold hover:bg-gold/5 transition-all cursor-pointer"
              >
                <CheckSquare size={13} />
                Mark all as read
              </button>
            </div>
          </div>

          {error && (
            <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">
              {error}
            </div>
          )}

          {/* List Section */}
          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {notifications.map((n) => {
                  const isRead = n.isRead;
                  const cardBg = isRead
                    ? 'border-glass-border bg-white/[0.01] hover:border-gold-border/30'
                    : 'border-gold-border/40 bg-gold/[0.01] hover:border-gold/50 shadow-md';

                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.2 }}
                      className={`glass-panel rounded-xl p-5 border transition-all relative overflow-hidden group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}
                    >
                      {/* Left side: Icon, dot and text */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Status Blue/Gold Dot */}
                        <div className="pt-3">
                          <span
                            className={`w-2 h-2 rounded-full block shrink-0 ${
                              !isRead ? 'bg-gold shadow-lg shadow-gold/50 animate-pulse' : 'bg-white/20'
                            }`}
                          />
                        </div>

                        {/* Category Icon */}
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getNotiIconBg(n.type)}`}>
                          {getNotiIcon(n.type)}
                        </div>

                        {/* Title, message and timestamp */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-baseline gap-x-2.5">
                            <h3 className={`text-sm font-bold leading-none ${!isRead ? 'text-white font-extrabold' : 'text-white/80'}`}>
                              {n.title}
                            </h3>
                            <span className="text-[10px] text-muted/50 font-medium">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted leading-relaxed pr-6">
                            {n.content || n.message}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Action details button */}
                        {n.actionUrl && (
                          <button
                            onClick={() => handleViewDetails(n)}
                            title="Go to details"
                            className="p-2 rounded-lg text-champagne hover:text-white hover:bg-gold/10 border border-gold-border/20 hover:border-gold/40 transition-all cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                        )}

                        {/* Mark read button */}
                        {!isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            title="Mark as read"
                            className="p-2 rounded-lg text-muted hover:text-champagne hover:bg-white/[0.04] border border-glass-border hover:border-gold-border/30 transition-all cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                        )}

                        {/* Soft delete button */}
                        <button
                          onClick={() => handleDelete(n.id)}
                          title="Delete notification"
                          className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 border border-glass-border hover:border-red-500/25 transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {notifications.length === 0 && (
                <div className="glass-panel rounded-xl p-16 text-center border border-glass-border relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />
                  <Bell size={40} className="mx-auto mb-4 text-gold opacity-30 animate-bounce" />
                  <h4 className="text-white font-semibold text-sm mb-1">No notifications</h4>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    {activeFilter === 'unread' 
                      ? 'Great! You have read all notifications.'
                      : 'Your inbox is currently empty in this category.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 bg-surface border border-gold-border/30 rounded-xl py-3 px-6 max-w-xs mx-auto">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  currentPage === 1
                    ? 'text-muted/30 border-glass-border/30 cursor-not-allowed'
                    : 'text-muted hover:text-white border-glass-border hover:bg-white/[0.04]'
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-bold text-white/80">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  currentPage === totalPages
                    ? 'text-muted/30 border-glass-border/30 cursor-not-allowed'
                    : 'text-muted hover:text-white border-glass-border hover:bg-white/[0.04]'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
