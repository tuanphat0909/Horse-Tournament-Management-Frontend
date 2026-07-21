import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, CheckCircle, DollarSign, Zap, X, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createPrizes, triggerPayout, publishRaceResult } from '../../api/adminService';
import { getRaceSchedule, getTournaments, getRaceEntries } from '../../api/publicService';
import { parseApiError } from '../../api/authService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_PRIZES = { tournamentId: '', firstPlacePrize: '', secondPlacePrize: '', thirdPlacePrize: '' };

import { useNotifications } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';

export function AdminResultsPage() {
  const { showToast } = useNotifications();
  const confirm = useConfirm();
  // Prizes modal
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [prizes, setPrizes] = useState(INIT_PRIZES);
  const [prizesLoading, setPrizesLoading] = useState(false);
  const [prizesError, setPrizesError] = useState('');
  const [prizesSuccess, setPrizesSuccess] = useState('');

  // Payout trigger
  const [payoutRaceId, setPayoutRaceId] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  // Races
  const [races, setRaces] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loadingRaces, setLoadingRaces] = useState(true);

  // Tournaments
  const [tournaments, setTournaments] = useState<any[]>([]);

  // Expanded race standings details
  const [expandedRaceId, setExpandedRaceId] = useState<number | null>(null);
  const [raceEntries, setRaceEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  async function toggleExpandRace(raceId: number) {
    if (expandedRaceId === raceId) {
      setExpandedRaceId(null);
      return;
    }
    setExpandedRaceId(raceId);
    setLoadingEntries(true);
    setRaceEntries([]);
    try {
      const res = await getRaceEntries(raceId);
      const data = res?.result ?? (Array.isArray(res) ? res : []);
      // Sort entries by FinishPosition, nulls at the end
      const sorted = [...data].sort((a: any, b: any) => {
        if (a.finishPosition === null || a.finishPosition === undefined) return 1;
        if (b.finishPosition === null || b.finishPosition === undefined) return -1;
        return a.finishPosition - b.finishPosition;
      });
      setRaceEntries(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEntries(false);
    }
  }

  // Initialize
  useEffect(() => {
    fetchRaces();
    fetchTournaments();
  }, []);

  function fetchTournaments() {
    getTournaments()
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.result) ? data.result : [];
        setTournaments(raw);
      })
      .catch(() => setTournaments([]));
  }

  function fetchRaces() {
    setLoadingRaces(true);
    getRaceSchedule()
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.result) ? data.result : [];
        setRaces(raw);
      })
      .catch(() => setRaces([]))
      .finally(() => setLoadingRaces(false));
  }

  async function handlePublish(raceId: number) {
    const ok = await confirm({
      title: 'Publish results',
      message: `Are you sure you want to publish results for race #${raceId}?`,
      confirmText: 'Publish',
    });
    if (!ok) return;
    try {
      await publishRaceResult(raceId);
      showToast('Success', 'Published successful!');
      fetchRaces();
    } catch (err: unknown) {
      showToast('Error', parseApiError(err as Error), 'error');
    }
  }

  function setP(field: string, value: string) {
    setPrizes(prev => ({ ...prev, [field]: value }));
  }

  function handleTournamentChange(tournamentIdStr: string) {
    setP('tournamentId', tournamentIdStr);
    setPrizesError('');
    setPrizesSuccess('');
    
    if (!tournamentIdStr) {
      setP('firstPlacePrize', '');
      setP('secondPlacePrize', '');
      setP('thirdPlacePrize', '');
      return;
    }
    
    const selectedTour = tournaments.find(t => t.tournamentId.toString() === tournamentIdStr);
    if (selectedTour && selectedTour.prizes && selectedTour.prizes.length > 0) {
      const p1 = selectedTour.prizes.find((p: any) => p.rankPosition === 1)?.amount ?? '';
      const p2 = selectedTour.prizes.find((p: any) => p.rankPosition === 2)?.amount ?? '';
      const p3 = selectedTour.prizes.find((p: any) => p.rankPosition === 3)?.amount ?? '';
      
      setP('firstPlacePrize', p1.toString());
      setP('secondPlacePrize', p2.toString());
      setP('thirdPlacePrize', p3.toString());
    } else {
      setP('firstPlacePrize', '');
      setP('secondPlacePrize', '');
      setP('thirdPlacePrize', '');
    }
  }

  async function handleCreatePrizes() {
    setPrizesError(''); setPrizesSuccess('');
    if (!prizes.tournamentId || !prizes.firstPlacePrize || !prizes.secondPlacePrize || !prizes.thirdPlacePrize) {
      setPrizesError('Please fill in all fields.');
      return;
    }
    setPrizesLoading(true);
    try {
      await createPrizes({
        tournamentId: Number(prizes.tournamentId),
        firstPlacePrize: Number(prizes.firstPlacePrize),
        secondPlacePrize: Number(prizes.secondPlacePrize),
        thirdPlacePrize: Number(prizes.thirdPlacePrize),
      });
      showToast('Success', `Prizes configured successfully for tournament #${prizes.tournamentId}!`);
      closePrizesModal();
      fetchTournaments();
    } catch (err: unknown) {
      setPrizesError(parseApiError(err as Error));
    } finally {
      setPrizesLoading(false);
    }
  }

  function closePrizesModal() {
    setShowPrizesModal(false);
    setPrizesError(''); setPrizesSuccess('');
    setPrizes(INIT_PRIZES);
  }

  async function handleTriggerPayout() {
    setPayoutError(''); setPayoutSuccess('');
    if (!payoutRaceId) { setPayoutError('Please enter Race ID.'); return; }
    setPayoutLoading(true);
    try {
      await triggerPayout(Number(payoutRaceId));
      setPayoutSuccess(`Payout for Race #${payoutRaceId} has been triggered!`);
      setPayoutRaceId('');
    } catch (err: unknown) {
      setPayoutError(parseApiError(err as Error));
    } finally {
      setPayoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Results & Publishing"
            subtitle="Confirm and publish official results"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Search races */}
          <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border focus-within:border-gold/40 transition-colors rounded-lg px-3 py-2 w-64">
            <Search size={14} className="text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search races, tournaments..."
              className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
            />
          </div>

          {/* Management Tools */}
          <div className="grid grid-cols-2 gap-4">
            {/* Prizes Setup */}
            <div className="glass-panel rounded-xl p-6 border border-glass-border hover:border-gold/30 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <DollarSign size={18} className="text-gold" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Configure Prizes</div>
                  <div className="text-xs text-muted">Set prize money for ranks 1–3 of a tournament</div>
                </div>
              </div>
              <button
                onClick={() => setShowPrizesModal(true)}
                className="btn-gold w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 relative z-10"
              >
                <DollarSign size={14} /> Configure Prizes
              </button>
            </div>

            {/* Trigger Payout */}
            <div className="glass-panel rounded-xl p-6 border border-glass-border hover:border-emerald-500/30 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Zap size={18} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Trigger Payout</div>
                  <div className="text-xs text-muted">Select a race with published results to pay out bets</div>
                </div>
              </div>
              <div className="relative z-10 flex gap-2">
                <select
                  value={payoutRaceId}
                  onChange={e => { setPayoutRaceId(e.target.value); setPayoutError(''); setPayoutSuccess(''); }}
                  className="flex-1 bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="text-muted/60">-- Select Match --</option>
                  {races
                    .filter((r: any) => r.status === 'Published' || r.status === 'Finished')
                    .map((r: any) => (
                      <option key={r.raceId} value={r.raceId} className="bg-navy text-white">
                        {r.raceName || r.name} (ID: {r.raceId})
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleTriggerPayout}
                  disabled={payoutLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Zap size={14} /> {payoutLoading ? '…' : 'Trigger'}
                </button>
              </div>
              {payoutError && <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{payoutError}</div>}
              {payoutSuccess && <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{payoutSuccess}</div>}
            </div>
          </div>

          {/* Pending Publication */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <Megaphone size={15} className="text-yellow-400" />
              </div>
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <h2 className="text-base font-medium font-serif text-white">Pending Publication</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/30 via-glass-border to-transparent" />
            </div>
            
            {loadingRaces ? (
              <LoadingSkeleton />
            ) : (() => {
              const matchesSearch = (r: any) => !search.trim()
                || (r.name ?? r.raceName ?? '').toLowerCase().includes(search.toLowerCase())
                || (r.tournamentName ?? '').toLowerCase().includes(search.toLowerCase());
              const pendingRaces = races.filter(r => (r.status === 'Completed' || r.status === 'PendingPublish') && matchesSearch(r));
              if (pendingRaces.length === 0) return (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">No data awaiting publication</div>
                </div>
              );
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRaces.map((race: any) => {
                    const isExpanded = expandedRaceId === race.raceId;
                    return (
                      <div key={race.raceId} className="glass-panel rounded-xl border border-glass-border overflow-hidden flex flex-col justify-between">
                        <div className="p-5 flex items-center justify-between gap-4">
                          <div>
                            <div className="font-bold text-white mb-1">{race.name ?? race.raceName} (ID: {race.raceId})</div>
                            <div className="text-xs text-muted">Tournament: {race.tournamentName || 'N/A'} • {new Date(race.raceDate || race.startTime).toLocaleString('vi-VN')}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => toggleExpandRace(race.raceId)}
                              className="px-2.5 py-1.5 rounded-lg border border-glass-border text-xs text-muted hover:text-white hover:bg-white/5 transition-all"
                            >
                              {isExpanded ? 'Hide' : 'Detail'}
                            </button>
                            <button onClick={() => handlePublish(race.raceId)} className="btn-gold px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-gold/20">
                              Publish
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-glass-border/30 bg-navy/60 p-4 text-xs space-y-3">
                            <div className="font-bold text-[10px] text-muted uppercase tracking-wider">
                              Results recorded by the system (for verification):
                            </div>
                            {loadingEntries ? (
                              <LoadingSkeleton />
                            ) : raceEntries.length === 0 ? (
                              <div className="text-muted/60 italic py-2">No race entry data</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-glass-border/30 text-[10px] text-muted uppercase">
                                      <th className="py-2 pr-3">Rank</th>
                                      <th className="py-2 pr-3">Lane</th>
                                      <th className="py-2 pr-3">Horse</th>
                                      <th className="py-2 pr-3">Jockey</th>
                                      <th className="py-2 text-right">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-glass-border/20 text-white/90">
                                    {raceEntries.map((entry: any) => (
                                      <tr key={entry.raceEntryId}>
                                        <td className="py-2 pr-3 font-bold text-gold">
                                          {entry.finishPosition ? `${entry.finishPosition}` : '-'}
                                        </td>
                                        <td className="py-2 pr-3 text-muted">L{entry.laneNo}</td>
                                        <td className="py-2 pr-3 font-medium">🐎 {entry.horseName}</td>
                                        <td className="py-2 pr-3 text-muted">{entry.jockeyName || 'N/A'}</td>
                                        <td className="py-2 text-right font-mono">
                                          {entry.finishTime ? `${entry.finishTime}s` : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Published */}
          <div>
            <div className="flex items-center gap-3 mb-4 mt-8">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle size={14} className="text-emerald-400" />
              </div>
              <h2 className="text-base font-medium font-serif text-white">Published</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-400/30 via-glass-border to-transparent" />
            </div>
            
            {loadingRaces ? (
              <LoadingSkeleton />
            ) : (() => {
              const publishedRaces = races.filter(r => (r.status === 'Published' || r.status === 'Finished')
                && (!search.trim()
                  || (r.name ?? r.raceName ?? '').toLowerCase().includes(search.toLowerCase())
                  || (r.tournamentName ?? '').toLowerCase().includes(search.toLowerCase())));
              if (publishedRaces.length === 0) return (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">No races published yet</div>
                </div>
              );
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publishedRaces.map((race: any) => {
                    const isExpanded = expandedRaceId === race.raceId;
                    return (
                      <div key={race.raceId} className="glass-panel rounded-xl border border-glass-border overflow-hidden flex flex-col justify-between">
                        <div className="p-5 flex items-center justify-between gap-4">
                          <div>
                            <div className="font-bold text-white mb-1">{race.name ?? race.raceName} (ID: {race.raceId})</div>
                            <div className="text-xs text-muted">Tournament: {race.tournamentName || 'N/A'}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => toggleExpandRace(race.raceId)}
                              className="px-2.5 py-1.5 rounded-lg border border-glass-border text-xs text-muted hover:text-white hover:bg-white/5 transition-all"
                            >
                              {isExpanded ? 'Hide' : 'Detail'}
                            </button>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle size={12} /> Published
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-glass-border/30 bg-navy/60 p-4 text-xs space-y-3">
                            <div className="font-bold text-[10px] text-muted uppercase tracking-wider">
                              Official results:
                            </div>
                            {loadingEntries ? (
                              <LoadingSkeleton />
                            ) : raceEntries.length === 0 ? (
                              <div className="text-muted/60 italic py-2">No race entry data</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-glass-border/30 text-[10px] text-muted uppercase">
                                      <th className="py-2 pr-3">Rank</th>
                                      <th className="py-2 pr-3">Lane</th>
                                      <th className="py-2 pr-3">Horse</th>
                                      <th className="py-2 pr-3">Jockey</th>
                                      <th className="py-2 text-right">Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-glass-border/20 text-white/90">
                                    {raceEntries.map((entry: any) => (
                                      <tr key={entry.raceEntryId}>
                                        <td className="py-2 pr-3 font-bold text-gold">
                                          {entry.finishPosition ? `${entry.finishPosition}` : '-'}
                                        </td>
                                        <td className="py-2 pr-3 text-muted">L{entry.laneNo}</td>
                                        <td className="py-2 pr-3 font-medium">🐎 {entry.horseName}</td>
                                        <td className="py-2 pr-3 text-muted">{entry.jockeyName || 'N/A'}</td>
                                        <td className="py-2 text-right font-mono">
                                          {entry.finishTime ? `${entry.finishTime}s` : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

        </main>
      </div>

      {/* Prizes Modal */}
      {showPrizesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden">
            <button 
              onClick={closePrizesModal} 
              className="absolute top-4 right-4 p-1 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all z-20"
              title="Close"
            >
              <X size={18} />
            </button>
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <DollarSign size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Configure Prizes</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Select Tournament *</label>
                <select
                  value={prizes.tournamentId}
                  onChange={e => handleTournamentChange(e.target.value)}
                  className={INPUT + ' cursor-pointer'}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="text-muted/60">-- Select Tournament --</option>
                  {tournaments.map((t: any) => (
                    <option key={t.tournamentId} value={t.tournamentId} className="bg-navy text-white">
                      {t.name} (ID: {t.tournamentId})
                    </option>
                  ))}
                </select>
              </div>

              {prizes.tournamentId && (() => {
                const tour = tournaments.find(t => t.tournamentId.toString() === prizes.tournamentId);
                const hasPrizes = tour && tour.prizes && tour.prizes.length > 0;
                return hasPrizes ? (
                  <div className="text-xs px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium leading-relaxed">
                    ✓ This tournament already has prizes configured. The previously configured amounts are shown below. You can modify them if needed.
                  </div>
                ) : (
                  <div className="text-xs px-3 py-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium leading-relaxed">
                    ⚠ This tournament has no prizes configured yet. Please set them up below.
                  </div>
                );
              })()}
              <div>
                <label className={LABEL}>First Prize (VND) *</label>
                <input value={prizes.firstPlacePrize} onChange={e => setP('firstPlacePrize', e.target.value)} type="number" min="0" placeholder="E.g.: 85000000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Second Prize (VND) *</label>
                <input value={prizes.secondPlacePrize} onChange={e => setP('secondPlacePrize', e.target.value)} type="number" min="0" placeholder="E.g.: 42000000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Third Prize (VND) *</label>
                <input value={prizes.thirdPlacePrize} onChange={e => setP('thirdPlacePrize', e.target.value)} type="number" min="0" placeholder="E.g.: 21000000" className={INPUT} />
              </div>

              {prizesError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{prizesError}</div>}
              {prizesSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{prizesSuccess}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closePrizesModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleCreatePrizes} disabled={prizesLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {prizesLoading ? 'Saving...' : 'Save Prizes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
