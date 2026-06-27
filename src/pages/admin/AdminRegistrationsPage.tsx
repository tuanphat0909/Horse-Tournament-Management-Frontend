import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, X } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRegistrations, approveRegistration, rejectRegistration } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

type TabType = 'pending' | 'approved' | 'rejected';

const TAB_CONFIG = {
  pending: { label: 'Chờ duyệt', color: 'text-yellow-400', bg: 'border-yellow-400/40 bg-yellow-400/5', match: 'pending' },
  approved: { label: 'Đã duyệt', color: 'text-emerald-400', bg: 'border-emerald-400/40 bg-emerald-400/5', match: 'approved' },
  rejected: { label: 'Từ chối', color: 'text-red-400', bg: 'border-red-400/40 bg-red-400/5', match: 'rejected' },
};

export function AdminRegistrationsPage() {
  const [tab, setTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Trạng thái thao tác duyệt/từ chối
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewError, setReviewError] = useState('');

  function loadRegistrations() {
    setLoading(true);
    setError('');
    getRegistrations()
      .then((data: any) => {
        const list = data?.result ?? (Array.isArray(data) ? data : []);
        setRegistrations(list);
      })
      .catch((err: unknown) => setError(parseApiError(err as Error)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadRegistrations(); }, []);

  async function handleReview(id: number, status: 'Approved' | 'Rejected') {
    setReviewError('');
    setReviewingId(id);
    try {
      if (status === 'Approved') await approveRegistration(id);
      else await rejectRegistration(id);
      setRegistrations(prev => prev.map(r => ((r.registrationId ?? r.id) === id ? { ...r, status } : r)));
      loadRegistrations();
    } catch (err: unknown) {
      setReviewError(parseApiError(err as Error));
    } finally {
      setReviewingId(null);
    }
  }

  const counts: Record<TabType, number> = {
    pending: registrations.filter(r => (r.status ?? '').toLowerCase() === 'pending').length,
    approved: registrations.filter(r => (r.status ?? '').toLowerCase() === 'approved').length,
    rejected: registrations.filter(r => (r.status ?? '').toLowerCase() === 'rejected').length,
  };

  const filtered = registrations.filter(r => {
    const matchesTab = (r.status ?? '').toLowerCase() === TAB_CONFIG[tab].match;
    const q = search.toLowerCase();
    const matchesSearch =
      (r.horseName ?? '').toLowerCase().includes(q) ||
      (r.tournamentName ?? '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Duyệt đăng ký"
            subtitle="Xét duyệt đăng ký tham gia thi đấu"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-glass-border pb-0">
            {(['pending', 'approved', 'rejected'] as TabType[]).map(t => {
              const cfg = TAB_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${
                    tab === t ? `${cfg.color} border-current` : 'text-muted border-transparent hover:text-white'
                  }`}
                >
                  {cfg.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? cfg.bg + ' ' + cfg.color : 'bg-white/5 text-muted'}`}>
                    {counts[t]}
                  </span>
                </button>
              );
            })}
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/4 border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ngựa, giải đấu..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {reviewError && (
            <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{reviewError}</div>
          )}

          {/* Table */}
          {error ? (
            <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>
          ) : loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">📝</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-glass-border">
                    <th className="px-5 py-3 font-bold">Ngựa</th>
                    <th className="px-5 py-3 font-bold">Giải đấu</th>
                    <th className="px-5 py-3 font-bold">Trạng thái</th>
                    <th className="px-5 py-3 font-bold">Ngày đăng ký</th>
                    <th className="px-5 py-3 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const id = r.registrationId ?? r.id;
                    const isPending = (r.status ?? '').toLowerCase() === 'pending';
                    const busy = reviewingId === id;
                    return (
                    <tr key={id ?? i} className="border-b border-glass-border/40 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{r.horseName ?? '—'}</td>
                      <td className="px-5 py-3 text-body">{r.tournamentName ?? '—'}</td>
                      <td className="px-5 py-3 text-body">{r.status ?? '—'}</td>
                      <td className="px-5 py-3 text-muted">{r.registeredAt ? new Date(r.registeredAt).toLocaleString() : '—'}</td>
                      <td className="px-5 py-3">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => id != null && handleReview(id, 'Approved')}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Check size={13} /> Duyệt
                            </button>
                            <button
                              onClick={() => id != null && handleReview(id, 'Rejected')}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X size={13} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-muted/50 text-xs">—</div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
