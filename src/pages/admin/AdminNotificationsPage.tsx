import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Trophy, Activity, Sparkles, Wallet, Info, 
  Trash2, Check, CheckSquare, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { HighlightQuoted } from '../../components/ui/HighlightQuoted';
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

type FilterType = 'all' | 'unread' | 'system' | 'tournament' | 'race' | 'wallet';

export function AdminNotificationsPage() {
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
        return 'bg-white/[0.03] border-glass-border';
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      let cleanStr = dateStr;
      if (!cleanStr.endsWith('Z') && !cleanStr.includes('+')) {
        cleanStr += 'Z';
      }
      return new Date(cleanStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemVar = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

  return (
    <div className="flex min-h-screen bg-[#070b13] text-white">
      <PageAmbience />
      <Sidebar />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <PageHero 
              title="System Alerts & Notifications" 
              subtitle="Manage admin logs, assignment reminders, and tournament system activities."
              imageUrl="/images/hero-admin.jpg"
              actions={
                <button
                  onClick={handleMarkAllRead}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-glass-border hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer text-champagne"
                >
                  <CheckSquare size={14} />
                  Mark all as read
                </button>
              }
            />

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-white/[0.02] border border-glass-border rounded-xl">
              {(['all', 'unread', 'system', 'tournament', 'race', 'wallet'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-gold text-rich-black shadow-lg shadow-gold/20'
                      : 'text-muted hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Notifications Feed */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                <AnimatePresence mode="popLayout">
                  {notifications.map((noti) => (
                    <motion.div
                      key={noti.id}
                      variants={itemVar}
                      exit={{ opacity: 0, x: -50 }}
                      className={`glass-panel border rounded-xl p-4 flex gap-4 items-start relative transition-all group ${
                        !noti.isRead 
                          ? 'border-gold-border/30 bg-[#0d162a]/30' 
                          : 'border-glass-border bg-white/[0.01]'
                      }`}
                    >
                      {/* Unread Indicator dot */}
                      {!noti.isRead && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />
                      )}

                      {/* Icon */}
                      <div className={`p-2.5 rounded-lg border shrink-0 ${getNotiIconBg(noti.type)}`}>
                        {getNotiIcon(noti.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h4 className={`text-sm font-bold truncate ${!noti.isRead ? 'text-white' : 'text-white/80'}`}>
                            {noti.title}
                          </h4>
                          <span className="text-[10px] text-muted/60 shrink-0 font-sans">
                            {formatTime(noti.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed font-sans pr-10">
                          <HighlightQuoted text={noti.content || noti.message} />
                        </p>
                      </div>

                      {/* Hover Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto self-center">
                        {!noti.isRead && (
                          <button
                            onClick={() => handleMarkRead(noti.id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 text-muted hover:text-emerald-400 transition-all cursor-pointer"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(noti.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-muted hover:text-red-400 transition-all cursor-pointer"
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
                <p className="text-sm font-medium">No alerts matching filter "{activeFilter}"</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-glass-border/40 pt-4">
                <p className="text-xs text-muted">
                  Showing Page {currentPage} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-glass-border hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-champagne"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-glass-border hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer text-champagne"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
