import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getTournaments, getTournamentDetail, getTournamentRounds } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { Pager, paginate } from '../../components/ui/Pager';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Đang diễn ra', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  ongoing: { label: 'Đang diễn ra', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  upcoming: { label: 'Sắp diễn ra', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  pending: { label: 'Sắp diễn ra', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Đã kết thúc', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
  ended: { label: 'Đã kết thúc', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
};

export function SpectatorTournamentsPage() {
  const [search, setSearch] = useState('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [showDetail, setShowDetail] = useState(false);

  async function openDetail(t: any) {
    const id = t.tournamentId ?? t.id;
    setShowDetail(true);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const [detailData, roundsData] = await Promise.all([
        getTournamentDetail(id),
        getTournamentRounds(id).catch(() => null),
      ]);
      const d = detailData?.result ?? detailData ?? null;
      const rounds = roundsData?.result ?? (Array.isArray(roundsData) ? roundsData : null);
      setDetail(d ? { ...d, rounds: rounds ?? d.rounds ?? [] } : null);
    } catch (err: unknown) {
      setDetailError(parseApiError(err as Error));
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setShowDetail(false);
    setDetail(null);
    setDetailError('');
  }

  useEffect(() => {
    getTournaments()
      .then((d: any) => setTournaments(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch((err) => {
        console.error(err);
        setTournaments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = tournaments.filter(t => (t.name ?? '').toLowerCase().includes(search.toLowerCase()));

  const [page, setPage] = useState(1);
  const pg = paginate(filtered, page, 9);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Giải đấu"
            subtitle="Tất cả các giải đấu đang diễn ra"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />

          <div className="flex items-center gap-2 bg-white/4 border border-glass-border focus-within:border-gold/40 transition-colors rounded-lg px-3 py-2 w-64">
            <Search size={14} className="text-muted shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giải đấu..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải danh sách giải đấu...</div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {pg.paged.map((t, i) => {
                const s = t.status?.toLowerCase() ?? 'upcoming';
                const config = STATUS_CONFIG[s] ?? STATUS_CONFIG.upcoming;
                return (
                  <motion.div
                    key={t.tournamentId ?? i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-gold/25 transition-all group relative overflow-hidden text-left"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {config.label}
                      </span>
                      <span className="text-xs text-muted font-medium">ID: {t.tournamentId}</span>
                    </div>
                    <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-3 line-clamp-1">{t.name}</h3>
                    <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-glass-border/40">
                      <div className="flex justify-between">
                        <span>Ngày bắt đầu:</span>
                        <span className="text-white font-medium">{t.startDate ? new Date(t.startDate).toLocaleString() : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày kết thúc:</span>
                        <span className="text-white font-medium">{t.endDate ? new Date(t.endDate).toLocaleString() : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Số vòng đấu:</span>
                        <span className="text-gold font-bold">{t.numberOfRounds ?? '—'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => openDetail(t)}
                      className="mt-4 w-full btn-gold px-4 py-2 rounded-lg text-xs font-bold"
                    >
                      Chi tiết
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
          <Pager page={pg.page} totalPages={pg.totalPages} total={pg.total} onChange={setPage} />

          {/* Tournament detail modal */}
          {showDetail && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-lg border border-glass-border max-h-[85vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-5">
                  <h3 className="text-lg font-serif text-white flex-1 min-w-0">{detail?.name ?? 'Chi tiết giải đấu'}</h3>
                  <button onClick={closeDetail} className="text-muted hover:text-white text-sm">✕</button>
                </div>
                {detailLoading ? (
                  <div className="text-center py-10 text-muted text-sm">Đang tải...</div>
                ) : detailError ? (
                  <div className="text-red-400 text-sm px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{detailError}</div>
                ) : detail ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5 text-xs text-muted">
                      <div className="flex justify-between"><span>Ngày bắt đầu:</span><span className="text-white font-medium">{detail.startDate ? new Date(detail.startDate).toLocaleString() : '—'}</span></div>
                      <div className="flex justify-between"><span>Ngày kết thúc:</span><span className="text-white font-medium">{detail.endDate ? new Date(detail.endDate).toLocaleString() : '—'}</span></div>
                      <div className="flex justify-between"><span>Trạng thái:</span><span className="text-white font-medium">{detail.status ?? '—'}</span></div>
                    </div>
                    {Array.isArray(detail.rounds) && detail.rounds.length > 0 && (
                      <div>
                        <div className="text-xs text-muted font-medium mb-2 pt-3 border-t border-glass-border/40">Vòng đấu</div>
                        <div className="space-y-2">
                          {detail.rounds.map((r: any, ri: number) => (
                            <div key={r.roundId ?? ri} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/3 border border-glass-border">
                              <span className="text-white font-medium">{r.name ?? `Vòng ${r.roundNumber ?? ri + 1}`}</span>
                              <span className="text-muted">{r.status ?? '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted text-sm">Chưa có dữ liệu</div>
                )}
              </motion.div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
