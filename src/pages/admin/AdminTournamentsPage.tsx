import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader, Plus, Search, Shuffle, Trophy, Clock, ArrowUpDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createTournament, generateTournamentRaces, generateFinalRace, closeTournamentRegistration } from '../../api/adminService';
import { getRaceSchedule, getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { formatDateTime } from '../../utils/format';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type StatusFilter = 'all' | 'upcoming' | 'active' | 'completed';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  upcoming: { label: 'Upcoming', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Completed', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
};

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_FORM = {
  name: '',
  description: '',
  registrationStartDate: '',
  registrationEndDate: '',
  startDate: '',
  endDate: '',
  firstPrize: '10000000',
  secondPrize: '5000000',
  thirdPrize: '2500000'
};

export function AdminTournamentsPage() {
  const { t } = useLanguage();
  const { showToast } = useNotifications();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Sắp xếp danh sách tournaments
  type SortKey = 'newest' | 'oldest' | 'name' | 'status';
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  const [form, setForm] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [generatingForTournament, setGeneratingForTournament] = useState<number | null>(null);

  async function loadTournaments() {
    setLoadingTournaments(true);
    try {
      const [data, raceData]: any[] = await Promise.all([
        getTournaments(),
        getRaceSchedule().catch(() => ({ result: [] })),
      ]);
      setTournaments(data?.result ?? (Array.isArray(data) ? data : []));
      setRaces(raceData?.result ?? (Array.isArray(raceData) ? raceData : []));
    } catch (err) {
      console.error(err);
      setTournaments([]);
      setRaces([]);
    } finally {
      setLoadingTournaments(false);
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    setError('');
    const now = new Date();

    // 1. Validate registration window
    if (form.registrationStartDate && form.registrationEndDate) {
      const regStartVal = new Date(form.registrationStartDate);
      const regEndVal = new Date(form.registrationEndDate);
      if (regEndVal <= regStartVal) {
        setError(t('Registration end date must be after registration start date.'));
        return;
      }
    }

    // 2. Validate registration start date vs past
    if (form.registrationStartDate) {
      const regStartVal = new Date(form.registrationStartDate);
      if (regStartVal.getTime() < now.getTime() - 5 * 60 * 1000) {
        setError(t('Registration start date cannot be in the past.'));
        return;
      }
    }

    // 3. Validate tournament start date vs registration end date
    if (form.startDate && form.registrationEndDate) {
      const startVal = new Date(form.startDate);
      const regEndVal = new Date(form.registrationEndDate);
      if (startVal < regEndVal) {
        setError(t('Tournament start date must be on or after registration end date.'));
        return;
      }
    }

    // 4. Validate tournament window
    if (form.startDate && form.endDate) {
      const startVal = new Date(form.startDate);
      const endVal = new Date(form.endDate);
      if (endVal <= startVal) {
        setError(t('Tournament end date must be after tournament start date.'));
        return;
      }
    }
  }, [form.registrationStartDate, form.registrationEndDate, form.startDate, form.endDate, t]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.name || !form.registrationStartDate || !form.registrationEndDate || !form.startDate || !form.endDate) {
      setError(t('Please fill in all required fields.'));
      return;
    }

    // Guard if there is an active date error
    const regStartVal = new Date(form.registrationStartDate);
    const regEndVal = new Date(form.registrationEndDate);
    const startVal = new Date(form.startDate);
    const endVal = new Date(form.endDate);
    const now = new Date();

    if (regStartVal.getTime() < now.getTime() - 5 * 60 * 1000 ||
        regEndVal <= regStartVal ||
        startVal < regEndVal ||
        endVal <= startVal) {
      return; // prevent submit if invalid dates
    }

    const prizes = [
      { rankPosition: 1, amount: Number(form.firstPrize || 10000000), ownerPercentage: 70, jockeyPercentage: 30 },
      { rankPosition: 2, amount: Number(form.secondPrize || 5000000), ownerPercentage: 70, jockeyPercentage: 30 },
      { rankPosition: 3, amount: Number(form.thirdPrize || 2500000), ownerPercentage: 70, jockeyPercentage: 30 }
    ];

    setLoading(true);
    try {
      const data: any = await createTournament({
        name: form.name,
        description: form.description || '',
        registrationStartDate: form.registrationStartDate,
        registrationEndDate: form.registrationEndDate,
        startDate: form.startDate,
        endDate: form.endDate,
        prizes: prizes
      });
      const newId = data?.result?.id ?? data?.result?.tournamentId;
      showToast(t('Success'), newId != null
        ? `${t('Tournament created successfully!')} ID = ${newId}. ${t('Tournament is now in Upcoming status.')}`
        : t('Tournament created successfully!'));
      setForm(INIT_FORM);
      setShowModal(false);
      loadTournaments();
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setError('');
    setForm(INIT_FORM);
  }

  async function handleCloseRegistration(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    setError('');
    try {
      await closeTournamentRegistration(tournamentId);
      showToast(t('Success'), t('Registration deadline closed successfully!'));
      await loadTournaments();
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setGeneratingForTournament(null);
    }
  }

  async function handleGenerateRaces(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    setError('');
    try {
      await generateTournamentRaces(tournamentId);
      showToast(t('Success'), t('Races auto-assigned for tournament.'));
      await loadTournaments();
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setGeneratingForTournament(null);
    }
  }

  async function handleGenerateFinal(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    setError('');
    try {
      await generateFinalRace(tournamentId);
      showToast(t('Success'), t('Final bracket (Top 12) auto-assigned successfully.'));
      await loadTournaments();
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setGeneratingForTournament(null);
    }
  }

  const statsCounts: Record<StatusFilter, number> = {
    all: tournaments.length,
    active: tournaments.filter(t => t.status === 'Active').length,
    upcoming: tournaments.filter(t => t.status === 'Upcoming').length,
    completed: tournaments.filter(t => t.status === 'Completed').length,
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = (t.name ?? '').toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && t.status === 'Active';
    if (filter === 'upcoming') return matchesSearch && t.status === 'Upcoming';
    if (filter === 'completed') return matchesSearch && t.status === 'Completed';
    return matchesSearch;
  });

  // Sắp xếp theo lựa chọn: mới nhất / cũ nhất (theo days bắt đầu), tên A-Z, trạng thái
  const STATUS_ORDER: Record<string, number> = { Active: 0, Upcoming: 1, Completed: 2 };
  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime();
      case 'name':
        return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'vi');
      case 'status':
        return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      case 'newest':
      default:
        return new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime();
    }
  });

  function getTournamentRaceState(tour: any) {
    const tournamentRaces = races.filter(r => r.tournamentId === tour.tournamentId);
    const rounds = tour.rounds ?? [];
    
    // Check registration date: phân biệt CHƯA MỞ / ĐANG MỞ / ĐÃ ĐÓNG
    const now = new Date();
    const regStart = tour.registrationStartDate ? new Date(tour.registrationStartDate) : null;
    const regEnd = new Date(tour.registrationEndDate);
    const regNotStarted = regStart != null && now < regStart;
    const regOpen = !regNotStarted && now < regEnd;
    const regEnded = now >= regEnd;

    const preRound = rounds.find((r: any) => r.roundNumber === 1);
    const finalRound = rounds.find((r: any) => r.roundNumber === 2);

    const preRaces = preRound ? tournamentRaces.filter(r => r.roundId === preRound.roundId) : [];
    const finalRaces = finalRound ? tournamentRaces.filter(r => r.roundId === finalRound.roundId) : [];

    const hasPre = preRound != null;
    const hasFinal = finalRound != null;

    // Auto arrange is available if registration has closed and no rounds have been generated yet
    const canAutoArrange = regEnded && rounds.length === 0;

    // Generate Final is available if we have Pre Round, all Pre races are Finished/Completed, and no Final race yet
    const preFinished = hasPre && preRaces.length > 0 && preRaces.every(r => r.status === 'Finished' || r.status === 'Completed');
    const canGenerateFinal = preFinished && finalRaces.length === 0;

    let statusLabel = '';
    if (regNotStarted) {
      statusLabel = 'Registration not open';
    } else if (regOpen) {
      statusLabel = 'Đang mở đăng ký';
    } else if (rounds.length === 0) {
      statusLabel = 'Pending Auto Arrange';
    } else if (hasPre && !preFinished) {
      statusLabel = 'Competing in Pre-round';
    } else if (canGenerateFinal) {
      statusLabel = 'Pending xếp Final';
    } else if (hasFinal) {
      statusLabel = 'Competing in Finals';
    }

    return {
      totalRaces: tournamentRaces.length,
      regNotStarted,
      regOpen,
      canAutoArrange,
      canGenerateFinal,
      statusLabel
    };
  }

  return (

    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title={t("Tournament Management")}
            subtitle={t("Create and manage tournaments")}
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold font-sans">
                <Plus size={16} /> {t("Create Tournament")}
              </button>
            }
          />

          {/* Status Filters */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'upcoming', 'completed'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  filter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {s === 'all' ? t('All') : t(STATUS_CONFIG[s].label)}
                <span className="ml-2 text-[11px] font-bold text-current opacity-60">
                  {statsCounts[s] ?? 0}
                </span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search tournaments...")} className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none focus:outline-none focus:ring-0 border-0 w-full" style={{ boxShadow: 'none' }} />
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

          {!showModal && error && (
            <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>
          )}


          {/* Tournament Cards */}
          {loadingTournaments ? (
            <LoadingSkeleton rows={4} h="h-24" />
          ) : filteredTournaments.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">{t("No data available")}</div>
            </div>
          ) : (
            <div className="overflow-y-auto pr-1.5 -mr-1.5 scrollbar-thin" style={{ maxHeight: 'calc(100vh - 330px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {sortedTournaments.map((tour, i) => {
                const s = tour.status?.toLowerCase() ?? 'upcoming';
                const config = STATUS_CONFIG[s] ?? STATUS_CONFIG.upcoming;
                const raceState = getTournamentRaceState(tour);
                const isGenerating = generatingForTournament === tour.tournamentId;
                return (
                  <motion.div
                    key={tour.tournamentId ?? i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-gold/25 transition-all group relative overflow-hidden text-left"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="mb-3 space-y-1.5">
                      {/* Hàng 1: badge trạng thái tổng quát */}
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} inline-flex items-center gap-1.5 w-fit`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {t(config.label)}
                        </span>
                      </div>
                      {/* Hàng 2: badge loại rounds + đếm ngược thời gian */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {(() => {
                          const now = Date.now();
                          const endMs = tour.registrationEndDate ? new Date(tour.registrationEndDate).getTime() : null;
                          const daysLeft = endMs !== null ? Math.ceil((endMs - now) / 86400000) : null;
                          if (daysLeft === null) return null;
                          if (daysLeft < 0) return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 shrink-0">🔒 Đã đóng ĐK</span>
                          );
                          if (daysLeft <= 12) return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 shrink-0">⚡ Final · còn {daysLeft}n</span>
                          );
                          return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 text-emerald-400 shrink-0">✓ Đang mở ĐK</span>
                          );
                        })()}
                        {raceState.regNotStarted && tour.registrationStartDate ? (
                          <CountdownTimer target={tour.registrationStartDate} utc={false} label="Reg. opens in:" />
                        ) : tour.registrationEndDate ? (
                          <CountdownTimer target={tour.registrationEndDate} utc={false} hideWhenExpired />
                        ) : null}
                      </div>
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
                      <div className="flex justify-between">
                        <span>{t("Round thi đấu:")}</span>
                        <span className="text-gold font-bold">Pre + Final</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Status đua:")}</span>
                        <span className="text-gold font-bold">{t(raceState.statusLabel)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Race đã tạo:")}</span>
                        <span className="text-white font-medium">{raceState.totalRaces}</span>
                      </div>
                      <div className="flex flex-col gap-1 pt-2.5 mt-2 border-t border-glass-border/30">
                        <span className="font-bold text-white text-[11px] uppercase tracking-wider">{t("Prizes:")}</span>
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
                          <span className="text-red-400 font-semibold italic text-[11px] mt-0.5">{t("Prizes not configured yet")}</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {raceState.regOpen && (
                        <button
                          onClick={() => handleCloseRegistration(tour.tournamentId)}
                          disabled={isGenerating}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                        >
                          {isGenerating ? <Loader size={13} className="animate-spin" /> : <Clock size={13} />}
                          {isGenerating ? t('Closing...') : t('Close Registration')}
                        </button>
                      )}
                      {raceState.canAutoArrange && (
                        <button
                          onClick={() => handleGenerateRaces(tour.tournamentId)}
                          disabled={isGenerating}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                        >
                          {isGenerating ? <Loader size={13} className="animate-spin" /> : <Shuffle size={13} />}
                          {isGenerating ? t('Assigning...') : t('Auto Assign Pre-lanes')}
                        </button>
                      )}
                      {raceState.canGenerateFinal && (
                        <button
                          onClick={() => handleGenerateFinal(tour.tournamentId)}
                          disabled={isGenerating}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                        >
                          {isGenerating ? <Loader size={13} className="animate-spin" /> : <Trophy size={13} />}
                          {isGenerating ? t('Assigning...') : t('Auto Assign Final')}
                        </button>
                      )}
                      {!raceState.regOpen && !raceState.canAutoArrange && !raceState.canGenerateFinal && raceState.statusLabel && (
                        <button
                          disabled
                          className="px-3 py-2 rounded-lg text-xs font-bold text-muted border border-glass-border bg-white/[0.04] cursor-not-allowed"
                        >
                          {t(raceState.statusLabel)}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </div>
          )}


        </main>
      </div>

      {/* Create Tournament Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">{t("Create new tournament")}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>{t("Tournament Name *")}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={t("E.g.: Autumn Race 2026")} className={INPUT} />
              </div>

              <div>
                <label className={LABEL}>{t("Description tournaments")}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder={t("Enter detailed tournament description...")} className={`${INPUT} h-20 resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>{t("Mở đăng ký *")}</label>
                  <input
                    type="datetime-local"
                    value={form.registrationStartDate}
                    onChange={e => set('registrationStartDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className={LABEL}>{t("Close Registration *")}</label>
                  <input
                    type="datetime-local"
                    value={form.registrationEndDate}
                    onChange={e => set('registrationEndDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>{t("Bắt đầu tournaments *")}</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className={LABEL}>{t("Kết thúc tournaments *")}</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={e => set('endDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="border-t border-glass-border/30 pt-3">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider mb-2 block">{t("Cơ cấu giải thưởng (VNĐ)")}</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted mb-1">Vô địch *</label>
                    <input type="number" value={form.firstPrize} onChange={e => set('firstPrize', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-1">2nd Place *</label>
                    <input type="number" value={form.secondPrize} onChange={e => set('secondPrize', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-1">3rd Place *</label>
                    <input type="number" value={form.thirdPrize} onChange={e => set('thirdPrize', e.target.value)} className={INPUT} />
                  </div>
                </div>
              </div>

              {error && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">{t("Cancel")}</button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? t('Creating...') : t('Create Tournament')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
