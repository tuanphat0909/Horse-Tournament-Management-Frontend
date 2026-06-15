import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getContracts, respondContract } from '../../api/jockeyService';
import { parseApiError } from '../../api/authService';

type Tab = 'pending' | 'accepted' | 'rejected';

// Map a contract status string to one of the three tab buckets.
function bucketOf(status: string): Tab {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'accepted') return 'accepted';
  if (s === 'rejected' || s === 'declined') return 'rejected';
  return 'pending';
}

export function JockeyInvitationsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getContracts();
        setInvitations(data?.result ?? (Array.isArray(data) ? data : []));
      } catch (err: unknown) {
        setError(parseApiError(err as Error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleRespond(id: number, status: 'Active' | 'Rejected') {
    setRespondingId(id);
    try {
      await respondContract(id, status);
      setInvitations(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (err: unknown) {
      alert(parseApiError(err as Error));
    } finally {
      setRespondingId(null);
    }
  }

  const filtered = invitations.filter(i => bucketOf(i.status) === tab);

  const TAB_COUNTS = {
    pending: invitations.filter(i => bucketOf(i.status) === 'pending').length,
    accepted: invitations.filter(i => bucketOf(i.status) === 'accepted').length,
    rejected: invitations.filter(i => bucketOf(i.status) === 'rejected').length,
  };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Lời mời thi đấu"
            subtitle="Quản lý lời mời từ các chủ ngựa"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          <div className="flex items-center gap-1 border-b border-glass-border pb-0">
            {([['pending', 'Chờ phản hồi', 'text-yellow-400 border-yellow-400'], ['accepted', 'Đã nhận', 'text-emerald-400 border-emerald-400'], ['rejected', 'Đã từ chối', 'text-red-400 border-red-400']] as [Tab, string, string][]).map(([t, label, activeClass]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? activeClass : 'text-muted border-transparent hover:text-white'}`}>
                {label} <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? 'bg-current/10 text-current' : 'bg-white/5 text-muted'}`}>{TAB_COUNTS[t]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : error ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((inv, i) => {
                const bucket = bucketOf(inv.status);
                return (
                  <motion.div key={inv.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="glass-panel rounded-2xl p-6 border border-glass-border hover:border-gold/30 hover:bg-gold/[0.02] transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <div className="relative z-10 flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 ring-1 ring-gold/20 flex items-center justify-center text-3xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <h3 className="text-lg font-serif text-white group-hover:text-champagne transition-colors">{inv.horseName ?? `Ngựa #${inv.horseId}`}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted mb-3">
                          <User size={11} className="text-gold/60" /> Chủ ngựa: <span className="text-white font-medium">{inv.ownerName ?? `Owner #${inv.ownerId ?? '—'}`}</span>
                        </div>
                        {(inv.startDate || inv.endDate) && (
                          <div className="flex flex-wrap gap-2.5 text-xs text-muted mb-4">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-glass-border"><Calendar size={11} className="text-gold/60" /> <span className="text-champagne font-semibold">{inv.startDate ?? '—'}{inv.endDate ? ` → ${inv.endDate}` : ''}</span></span>
                          </div>
                        )}
                        {bucket === 'pending' && (
                          <div className="flex items-center gap-3">
                            <button
                              disabled={respondingId === inv.id}
                              onClick={() => handleRespond(inv.id, 'Active')}
                              className="px-5 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                              <CheckCircle size={15} /> Nhận lời mời
                            </button>
                            <button
                              disabled={respondingId === inv.id}
                              onClick={() => handleRespond(inv.id, 'Rejected')}
                              className="px-5 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50">
                              <XCircle size={15} /> Từ chối
                            </button>
                          </div>
                        )}
                        {bucket === 'accepted' && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium"><CheckCircle size={15} /> Đã nhận lời mời</span>
                        )}
                        {bucket === 'rejected' && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-red-400 font-medium"><XCircle size={15} /> Đã từ chối</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">✉️</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
