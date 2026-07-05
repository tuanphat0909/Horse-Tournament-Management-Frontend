import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast thông báo dùng chung toàn app (không cần Context).
 * Cách dùng: import { toast } from '.../components/ui/Toast';
 *   toast.success('Đã ghép làn thành công!');
 *   toast.error('Có lỗi xảy ra');
 * <Toaster /> được mount 1 lần trong App.tsx.
 */

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; text: string };

let listeners: ((t: ToastItem) => void)[] = [];
let seq = 1;

/* ── Lịch sử thông báo cục bộ (hiện ở chuông Topbar) ──
   Mỗi toast được lưu vào localStorage, tự xóa sau 12 GIỜ. */
const HISTORY_KEY = 'local_notifs';
const HISTORY_TTL_MS = 12 * 60 * 60 * 1000; // 12h

export type LocalNotif = { id: number; kind: ToastKind; text: string; at: number };

export function getLocalNotifs(): LocalNotif[] {
  try {
    const raw: LocalNotif[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    const cutoff = Date.now() - HISTORY_TTL_MS;
    const fresh = raw.filter(n => n.at > cutoff);
    if (fresh.length !== raw.length) localStorage.setItem(HISTORY_KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return [];
  }
}

function saveToHistory(kind: ToastKind, text: string) {
  const item: LocalNotif = { id: Date.now() * 100 + (seq % 100), kind, text, at: Date.now() };
  const list = [item, ...getLocalNotifs()].slice(0, 50); // tối đa 50 mục
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  // báo cho chuông Topbar biết có thông báo mới (đốm sáng)
  window.dispatchEvent(new CustomEvent('local-notif'));
}

function push(kind: ToastKind, text: string) {
  const item = { id: seq++, kind, text };
  listeners.forEach(l => l(item));
  saveToHistory(kind, text);
}

export const toast = {
  success: (text: string) => push('success', text),
  error: (text: string) => push('error', text),
  info: (text: string) => push('info', text),
};

const KIND_STYLE: Record<ToastKind, { icon: typeof Info; cls: string; iconCls: string }> = {
  success: { icon: CheckCircle2, cls: 'border-emerald-500/30 bg-[#0d1f18]/95', iconCls: 'text-emerald-400' },
  error:   { icon: AlertCircle,  cls: 'border-red-500/30 bg-[#231114]/95',     iconCls: 'text-red-400' },
  info:    { icon: Info,         cls: 'border-gold/30 bg-[#1c1910]/95',        iconCls: 'text-gold' },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (t: ToastItem) => {
      setItems(prev => [...prev, t].slice(-4)); // tối đa 4 toast cùng lúc
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== t.id)), 4000);
    };
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] pointer-events-none">
      <AnimatePresence>
        {items.map(t => {
          const cfg = KIND_STYLE[t.kind];
          const Icon = cfg.icon;
          return (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl ${cfg.cls}`}>
              <Icon size={17} className={`shrink-0 mt-0.5 ${cfg.iconCls}`} />
              <span className="text-sm text-white/90 leading-snug flex-1">{t.text}</span>
              <button onClick={() => setItems(prev => prev.filter(x => x.id !== t.id))}
                className="shrink-0 p-0.5 rounded text-white/40 hover:text-white transition-colors">
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
