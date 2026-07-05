import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trophy, Activity, CheckCircle, Sparkles, Info } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { Pager, paginate } from '../../components/ui/Pager';

type NotiType = 'result' | 'prediction' | 'tournament' | 'prize' | 'system';

const TYPE_CONFIG: Record<NotiType, { icon: typeof Bell; bg: string; color: string }> = {
  result:     { icon: Activity,    bg: 'bg-blue-500/10 border-blue-500/20',     color: 'text-blue-400' },
  prediction: { icon: Sparkles,   bg: 'bg-emerald-500/10 border-emerald-500/20', color: 'text-emerald-400' },
  prize:      { icon: Trophy,     bg: 'bg-gold/10 border-gold/20',              color: 'text-gold' },
  tournament: { icon: CheckCircle,bg: 'bg-purple-500/10 border-purple-500/20',  color: 'text-purple-400' },
  system:     { icon: Info,       bg: 'bg-white/5 border-glass-border',         color: 'text-muted' },
};
const DEFAULT_CFG = TYPE_CONFIG['system'];

function resolveType(t: string): NotiType {
  const key = (t ?? '').toLowerCase();
  if (key.includes('result')) return 'result';
  if (key.includes('prediction') || key.includes('bet')) return 'prediction';
  if (key.includes('prize') || key.includes('reward')) return 'prize';
  if (key.includes('tournament') || key.includes('race')) return 'tournament';
  return 'system';
}

export function SpectatorNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await getNotifications();
      setNotifications(data?.result ?? (Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleMarkRead(id: number) {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true, read: true} : n));
    } catch {
      // silently ignore
    }
  }

  async function markAllRead() {
    try {
      // Dùng API read-all của BE (1 request) thay vì gọi lẻ từng thông báo
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    } catch {
      // fallback: đánh dấu từng cái nếu API read-all lỗi
      const unread = notifications.filter(n => !(n.isRead ?? n.read));
      await Promise.allSettled(unread.map(n => handleMarkRead(n.id)));
    }
  }

  const unread = notifications.filter(n => !(n.isRead ?? n.read)).length;

  const [page, setPage] = useState(1);
  const { paged, totalPages, total, page: safePage } = paginate(notifications, page, 10);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="max-w-400 mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Thông báo"
            subtitle="Thông báo và cập nhật mới nhất"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            actions={
              unread > 0 ? (
                <button onClick={markAllRead} className="px-4 py-2 rounded-lg text-xs text-muted border border-glass-border hover:text-white hover:bg-white/5 transition-colors">
                  Đánh dấu tất cả đã đọc
                </button>
              ) : undefined
            }
          />

          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          {loading ? (
            <div className="text-center py-16 text-muted text-sm">Đang tải...</div>
          ) : (
            <div className="space-y-2">
              {paged.map((n, i) => {
                const nType = resolveType(n.type ?? n.notificationType ?? '');
                const cfg = TYPE_CONFIG[nType] ?? DEFAULT_CFG;
                const Icon = cfg.icon;
                const isRead = n.isRead ?? n.read ?? false;
                return (
                  <motion.div key={n.id ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => !isRead && handleMarkRead(n.id)}
                    className={`glass-panel rounded-xl p-5 border transition-all cursor-pointer group relative overflow-hidden ${isRead ? 'border-glass-border hover:border-gold/30 hover:bg-gold/4' : 'border-gold/25 bg-gold/2 hover:border-gold/35 hover:bg-gold/5'}`}>
                    <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    {!isRead && <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />}
                    <div className="relative z-10 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} border flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${isRead ? 'text-white/80' : 'text-white'}`}>{n.title ?? n.subject ?? 'Thông báo'}</span>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                        </div>
                        <p className="text-xs text-muted leading-relaxed mb-2">{n.body ?? n.content ?? n.message ?? ''}</p>
                        <span className="text-[10px] text-muted/60">{n.createdAt ?? n.time ?? ''}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
              {notifications.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
                  <Bell size={36} className="mx-auto mb-3 text-gold opacity-40" />
                  <div className="text-muted text-sm">Không có thông báo nào</div>
                  <div className="mx-auto mt-4 w-24 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
