import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, CheckCheck, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/publicService';
import { getCurrentUser } from '../../api/authService';
import { getLocalNotifs, type LocalNotif } from '../ui/Toast';

/**
 * Topbar dùng chung mọi role.
 * Chuông thông báo gộp 2 nguồn:
 *  1. Lịch sử Toast cục bộ (mọi thao tác vừa làm — lưu tối đa 12h trong localStorage)
 *  2. Thông báo từ server (GET /public/notifications)
 * Có ĐỐM SÁNG nhắc khi có thông báo mới chưa xem; mở chuông = đã xem.
 */

const SEEN_KEY = 'notif_seen_at';

const KIND_ICON = {
  success: { icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  error:   { icon: AlertCircle,  cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  info:    { icon: Info,         cls: 'text-gold bg-gold/10 border-gold/20' },
};

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  return `${h} giờ trước`;
}

export function Topbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [serverItems, setServerItems] = useState<any[]>([]);
  const [localItems, setLocalItems] = useState<LocalNotif[]>(() => getLocalNotifs());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seenAt, setSeenAt] = useState<number>(() => Number(localStorage.getItem(SEEN_KEY) ?? 0));
  const panelRef = useRef<HTMLDivElement>(null);

  const serverUnread = serverItems.filter(n => !(n.isRead ?? n.read)).length;
  const localNew = localItems.filter(n => n.at > seenAt).length;
  // Đốm sáng = có toast mới chưa xem HOẶC thông báo server chưa đọc
  const hasNew = localNew > 0 || serverUnread > 0;

  const load = useCallback(async () => {
    setLocalItems(getLocalNotifs());
    if (!user) return;
    setLoading(true);
    try {
      const d: any = await getNotifications(1, 15);
      setServerItems(d?.result ?? []);
    } catch { /* im lặng — chuông không được làm hỏng trang */ }
    finally { setLoading(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Toast mới bắn ra ở bất kỳ đâu → cập nhật lịch sử + đốm sáng ngay
  useEffect(() => {
    const onLocal = () => setLocalItems(getLocalNotifs());
    window.addEventListener('local-notif', onLocal);
    return () => window.removeEventListener('local-notif', onLocal);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function openPanel() {
    const next = !open;
    setOpen(next);
    if (next) {
      load();
      // đánh dấu đã xem lịch sử cục bộ
      const now = Date.now();
      localStorage.setItem(SEEN_KEY, String(now));
      setSeenAt(now);
    }
  }

  async function handleReadServer(n: any) {
    if (!(n.isRead ?? n.read)) {
      try { await markNotificationRead(n.id); } catch { /* ignore */ }
      setServerItems(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true, read: true } : x));
    }
    if (n.actionUrl) navigate(n.actionUrl);
  }

  async function handleReadAll() {
    try { await markAllNotificationsRead(); } catch { /* ignore */ }
    setServerItems(prev => prev.map(x => ({ ...x, isRead: true, read: true })));
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-glass-border bg-(--topbar-bg) backdrop-blur-xl flex items-center px-8 justify-between">
      <div className="flex items-center gap-3 bg-white/4 border border-glass-border rounded-lg px-3 py-2 w-80">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          placeholder="Tìm ngựa, cuộc đua, giải đấu..."
          className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
        />
      </div>
      <div className="flex items-center gap-4">
        {/* Chuông thông báo */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={openPanel}
            className={`relative transition-colors p-2 ${open ? 'text-gold' : 'text-muted hover:text-white'}`}
            title="Thông báo">
            <Bell size={18} />
            {hasNew && (
              <>
                {/* Đốm sáng nhấp nháy nhắc có thông báo mới */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gold" />
              </>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-[min(400px,calc(100vw-3rem))] glass-panel-elevated rounded-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-glass-border flex items-center justify-between">
                <span className="text-sm font-serif font-bold text-white">Thông báo</span>
                {serverUnread > 0 && (
                  <button onClick={handleReadAll} className="flex items-center gap-1 text-[11px] text-muted hover:text-gold transition-colors">
                    <CheckCheck size={12} /> Đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-100 overflow-y-auto">

                {/* ── Hoạt động gần đây (lịch sử toast, giữ 12h) ── */}
                {localItems.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/60">Hoạt động gần đây (12h)</div>
                    {localItems.map(n => {
                      const cfg = KIND_ICON[n.kind] ?? KIND_ICON.info;
                      const Icon = cfg.icon;
                      return (
                        <div key={n.id} className="px-4 py-2.5 border-b border-glass-border/30 flex items-start gap-2.5">
                          <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${cfg.cls}`}>
                            <Icon size={12} />
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11.5px] text-white/90 leading-snug">{n.text}</div>
                            <div className="text-[10px] text-muted/50 mt-0.5">{timeAgo(n.at)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* ── Thông báo hệ thống (server) ── */}
                <div className="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted/60">Thông báo hệ thống</div>
                {loading ? (
                  <div className="p-5 text-center text-muted text-xs">Đang tải…</div>
                ) : serverItems.length === 0 ? (
                  <div className="px-4 pb-5 pt-1 text-center">
                    <div className="text-muted/60 text-[11px]">Chưa có thông báo nào từ hệ thống</div>
                  </div>
                ) : (
                  serverItems.map((n, i) => {
                    const isRead = n.isRead ?? n.read ?? false;
                    return (
                      <button key={n.id ?? i} onClick={() => handleReadServer(n)}
                        className={`w-full text-left px-4 py-3 border-b border-glass-border/40 transition-colors hover:bg-white/4 ${isRead ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-2.5">
                          {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5" />}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{n.title ?? 'Thông báo'}</div>
                            <div className="text-[11px] text-muted leading-snug line-clamp-2 mt-0.5">{n.content ?? n.message ?? ''}</div>
                            {n.createdAt && <div className="text-[10px] text-muted/50 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</div>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-muted">
          <span className="text-white font-medium">Season 2026</span> • Q3
        </div>
      </div>
    </header>
  );
}
