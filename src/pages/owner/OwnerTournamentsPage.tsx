import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getTournaments } from '../../api/publicService';
import { getMyRegistrations } from '../../api/ownerService';
import { formatDateTime } from '../../utils/format';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { useLanguage } from '../../context/LanguageContext';
import { getTournamentStatusStyle, getStatusOrder } from '../../constants/tournamentStatus';
import type { Tournament } from '../../types/domain';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pager, paginate } from '../../components/ui/Pager';

type StatusFilter = 'all' | 'active' | 'upcoming' | 'completed';
type SortKey = 'newest' | 'oldest' | 'name' | 'status';
const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All', active: 'Active', upcoming: 'Upcoming', completed: 'Completed',
};

// Giải đang mở đăng ký được xếp lên đầu — đó là việc chủ ngựa cần xử lý ngay.
function isRegistrationOpen(tour: any): boolean {
  const s = (tour.status ?? '').toLowerCase();
  if (s === 'registration open' || s === 'pendingregistration') {
    const end = tour.registrationEndDate ? new Date(tour.registrationEndDate) : null;
    const start = tour.registrationStartDate ? new Date(tour.registrationStartDate) : null;
    const now = new Date();
    if (start && now < start) return false;
    return !end || now < end;
  }
  return false;
}

export function OwnerTournamentsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [myPage, setMyPage] = useState(1);

  useEffect(() => {
    Promise.all([
      getTournaments(),
      getMyRegistrations().catch(() => ({ result: [] }))
    ])
      .then(([tourData, regData]: any) => {
        setTournaments(tourData?.result ?? (Array.isArray(tourData) ? tourData : []));
        setMyRegistrations(regData?.result ?? (Array.isArray(regData) ? regData : []));
      })
      .catch((err) => {
        console.error(err);
        setTournaments([]);
        setMyRegistrations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const statsCounts: Record<StatusFilter, number> = {
    all: tournaments.length,
    active: tournaments.filter(t => {
      const s = (t.status ?? '').toLowerCase();
      return s === 'active' || s === 'registration open' || s === 'registration closed' || s === 'medical checking' || s === 'ready to arrange' || s === 'pre round' || s === 'final round' || s === 'prize distribution' || s === 'pendingscheduling';
    }).length,
    upcoming: tournaments.filter(t => {
      const s = (t.status ?? '').toLowerCase();
      return s === 'upcoming' || s === 'pendingregistration';
    }).length,
    completed: tournaments.filter(t => {
      const s = (t.status ?? '').toLowerCase();
      return s === 'completed' || s === 'cancelled';
    }).length,
  };

  const filtered = tournaments
    .filter(t => (t.name ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter(t => {
      if (filter === 'all') return true;
      const s = (t.status ?? '').toLowerCase();
      if (filter === 'active') {
        return s === 'active' || s === 'registration open' || s === 'registration closed' || s === 'medical checking' || s === 'ready to arrange' || s === 'pre round' || s === 'final round' || s === 'prize distribution' || s === 'pendingscheduling';
      }
      if (filter === 'upcoming') return s === 'upcoming' || s === 'pendingregistration';
      if (filter === 'completed') return s === 'completed' || s === 'cancelled';
      return false;
    })
    .sort((a, b) => {
      // Ưu tiên tuyệt đối: giải đang mở đăng ký luôn nằm trên, rồi mới tới tiêu chí sort
      const regDiff = Number(isRegistrationOpen(b)) - Number(isRegistrationOpen(a));
      if (regDiff !== 0) return regDiff;
      switch (sortBy) {
        case 'oldest': return new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime();
        case 'name': return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'vi');
        case 'status': return getStatusOrder(a.status) - getStatusOrder(b.status);
        case 'newest':
        default: return new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime();
      }
    });

  const myParticipatingTournaments = tournaments.filter(tour => {
    const isCompletedOrCancelled = tour.status?.toLowerCase() === 'completed' || tour.status?.toLowerCase() === 'cancelled';
    if (isCompletedOrCancelled) return false;

    return myRegistrations.some(reg => 
      reg.tournamentId === tour.tournamentId && 
      !['rejected', 'disqualified', 'cancelled'].includes((reg.status ?? '').toLowerCase())
    );
  }).map(tour => {
    const myHorses = myRegistrations
      .filter(reg => reg.tournamentId === tour.tournamentId && !['rejected', 'disqualified', 'cancelled'].includes((reg.status ?? '').toLowerCase()))
      .map(reg => ({
        horseName: reg.horseName ?? `Horse #${reg.horseId}`,
        status: reg.status
      }));
    return { ...tour, myHorses };
  }).sort((a, b) => Number(isRegistrationOpen(b)) - Number(isRegistrationOpen(a)));

  // Phân trang 2 danh sách (6 thẻ/trang = 2 hàng lưới 3 cột)
  const { paged: pagedTournaments, totalPages, total, page: safePage } = paginate(filtered, page, 6);
  const {
    paged: pagedMyTournaments,
    totalPages: myTotalPages,
    total: myTotal,
    page: safeMyPage,
  } = paginate(myParticipatingTournaments, myPage, 6);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title={t("Tournaments")}
            subtitle={t("Active and upcoming tournaments")}
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 5%"
          />

          {/* My Participating Tournaments Section */}
          {myParticipatingTournaments.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-glass-border/30 pb-2">
                <span className="text-lg font-serif text-white font-bold flex items-center gap-2">
                  🏆 {t("Upcoming tournaments with my horses")}
                </span>
                <span className="bg-gold/10 text-gold border border-gold/20 text-xs px-2 py-0.5 rounded-full font-bold">
                  {myParticipatingTournaments.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pagedMyTournaments.map((tour, i) => {
                  const s = tour.status?.toLowerCase() ?? 'upcoming';
                  const config = getTournamentStatusStyle(s);
                  return (
                    <motion.div
                      key={`my-tour-${tour.tournamentId}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-panel rounded-2xl p-5 border border-gold/30 hover:border-gold/50 transition-all group relative overflow-hidden text-left h-full flex flex-col justify-between"
                      style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}
                    >
                      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-center gap-2 mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5 whitespace-nowrap shrink-0`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {t(config.label)}
                          </span>
                        </div>
                        <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-1 line-clamp-1">{tour.name}</h3>
                        <p className="text-xs text-muted/80 line-clamp-2 min-h-[32px] mb-3">{tour.description || t("No detailed description available.")}</p>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-glass-border/40 text-xs">
                        <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-glass-border/30 rounded-lg p-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                            🐴 {t("My registered horses:")}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {tour.myHorses.map((h: any, idx: number) => {
                              const isAppr = (h.status ?? '').toLowerCase() === 'approved';
                              const isVet = (h.status ?? '').toLowerCase() === 'pendingvet';
                              const statusColor = isAppr 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : isVet 
                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
                              return (
                                <span key={idx} className={`text-[9px] font-medium px-2 py-0.5 rounded border ${statusColor}`}>
                                  {h.horseName} ({t(h.status)})
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-between pt-1">
                          <span className="text-muted">{t("Bắt đầu lúc:")}</span>
                          <span className="text-white font-medium">{formatDateTime(tour.startDate)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {myTotalPages > 1 && (
                <Pager page={safeMyPage} totalPages={myTotalPages} total={myTotal} onChange={setMyPage} />
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'active', 'upcoming', 'completed'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  filter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t(FILTER_LABELS[s])}
                <span className="ml-2 text-[11px] font-bold text-current opacity-60">{statsCounts[s]}</span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border focus-within:border-gold/40 rounded-lg px-3 py-2 w-56 transition-colors">
              <Search size={14} className="text-gold/60 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search tournaments...")} className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 transition-colors"
                style={{ colorScheme: 'dark' }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton rows={4} h="h-24" />
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">{t("No data available")}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {pagedTournaments.map((tour, i) => {
                const s = tour.status?.toLowerCase() ?? 'upcoming';
                const config = getTournamentStatusStyle(s);
                const regNotStarted = tour.registrationStartDate && new Date() < new Date(tour.registrationStartDate);
                return (
                  <motion.div
                    key={tour.tournamentId ?? i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-gold/25 transition-all group relative overflow-hidden text-left h-full flex flex-col"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-center gap-2 mb-3 min-h-[26px]">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5 whitespace-nowrap shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {t(config.label)}
                      </span>
                      {s !== 'cancelled' && s !== 'completed' && s !== 'finished' && (
                        regNotStarted ? (
                          <CountdownTimer target={tour.registrationStartDate} utc={false} label="Reg. opens in:" />
                        ) : tour.registrationEndDate ? (
                          <CountdownTimer target={tour.registrationEndDate} utc={false} hideWhenExpired />
                        ) : null
                      )}
                    </div>
                    <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-1 line-clamp-1">{tour.name}</h3>
                    <p className="text-xs text-muted/80 line-clamp-2 min-h-[32px] mb-3">{tour.description || t("No detailed description available.")}</p>
                    <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-glass-border/40">
                      <div className="flex justify-between">
                        <span>{t("Reg. opens:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.registrationStartDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Reg. closes:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.registrationEndDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Start Date:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("End Date:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.endDate)}</span>
                      </div>
                      <div className="flex flex-col gap-1 pt-2.5 mt-2 border-t border-glass-border/30">
                        <span className="font-bold text-white text-[11px] uppercase tracking-wider">{t("Prizes:")}</span>
                        {/* min-h giữ chỗ để card không có prize vẫn cao bằng card có prize */}
                        <div className="min-h-[46px] flex flex-col justify-center">
                          {tour.prizes && tour.prizes.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1.5 text-center mt-1">
                              {tour.prizes
                                .slice()
                                .sort((a: any, b: any) => a.rankPosition - b.rankPosition)
                                .map((p: any) => (
                                  <div key={p.id} className="bg-white/[0.03] border border-glass-border/40 rounded px-1 py-1">
                                    <div className="text-[9px] text-muted font-semibold">Rank {p.rankPosition}</div>
                                    <div className="text-gold font-bold text-[10px] whitespace-nowrap">{Number(p.amount).toLocaleString('vi-VN')} đ</div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <span className="text-red-400 font-semibold italic text-[11px]">{t("Prizes not configured yet")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
          )}

        </main>
      </div>
    </div>
  );
}
