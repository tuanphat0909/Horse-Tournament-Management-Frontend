import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, CheckCircle, AlertTriangle, ShieldCheck, Trophy, Award, Medal } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceDetail, getRaceEntries, getPublicRaceResults } from '../../api/publicService';
import { getBalance, placeBet, getRaceBettingInfo } from '../../api/spectatorService';
import { formatDateTime, formatWinProbability } from '../../utils/format';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { getCurrentUser } from '../../api/authService';

const RACE_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  live: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  ongoing: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  running: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  scheduled: { label: 'Upcoming', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  finished: { label: 'Completed', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
};

export function SpectatorRaceDetailPage() {
  const { raceId } = useParams();
  const user = getCurrentUser();
  const statusLower = user?.status?.toLowerCase();
  const isLocked = statusLower !== 'active';

  const [race, setRace] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  const [balance, setBalance] = useState(0);
  const [canBet, setCanBet] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Betting state
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [amountStr, setAmountStr] = useState('');
  const [betLoading, setBetLoading] = useState(false);
  const [betError, setBetError] = useState('');
  const [betSuccess, setBetSuccess] = useState('');

  const amount = Number(amountStr) || 0;
  const odds = selectedEntry?.currentOdds ?? 1.0;
  const potentialProfit = amount * (odds - 1);
  const totalReturn = amount * odds;

  useEffect(() => {
    if (!raceId) return;
    // eslint-disable-next-line react-hooks/immutability
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceId]);

  async function loadData() {
    setLoading(true);
    try {
      const [raceRes, bettingRes, balanceRes, publicEntriesRes, resultsRes] = await Promise.all([
        getRaceDetail(raceId),
        getRaceBettingInfo(raceId).catch(() => null),
        getBalance().catch(() => ({ result: 0 })),
        getRaceEntries(raceId).catch(() => null),
        getPublicRaceResults(raceId).catch(() => null)
      ]);

      const fetchedRace = raceRes?.result ?? null;
      setRace(fetchedRace);

      let fetchedResults: any[] = [];
      if (resultsRes?.result) {
        fetchedResults = Array.isArray(resultsRes.result) ? resultsRes.result : [resultsRes.result];
      }
      setResults(fetchedResults.length > 0 ? fetchedResults : null);

      let fetchedEntries = bettingRes?.result?.entries ?? [];
      if ((!fetchedEntries || fetchedEntries.length === 0) && publicEntriesRes?.result) {
        const rawEntries = Array.isArray(publicEntriesRes.result) ? publicEntriesRes.result : (publicEntriesRes.result.raceEntries || []);
        fetchedEntries = rawEntries.map((pe: any) => ({
          raceEntryId: pe.raceEntryId || pe.id,
          laneNo: pe.laneNo || pe.laneNumber || 1,
          horseName: pe.horseName || pe.horse?.name || 'Horse',
          jockeyName: pe.jockeyName || pe.jockeyProfile?.user?.fullName || pe.jockey?.fullName || 'Jockey',
          currentOdds: pe.odds || pe.currentOdds || 1.0,
          averageTime: pe.averageTime,
          recentAverageTime: pe.recentAverageTime,
          winRate: pe.winRate,
          winningProbability: pe.winningProbability
        }));
      }

      setEntries(fetchedEntries);
      setCanBet(bettingRes?.result?.canBet ?? false);
      setBalance(balanceRes?.result?.balance ?? 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load race data.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaceBet() {
    setBetError('');
    setBetSuccess('');

    if (!selectedEntry) return setBetError('Please select a horse to bet on.');
    if (amount <= 0) return setBetError('Bet amount must be greater than 0.');
    if (amount > balance) return setBetError('Insufficient wallet balance.');

    setBetLoading(true);
    try {
      await placeBet({
        raceEntryId: selectedEntry.raceEntryId,
        amount: amount
      });

      setBetSuccess('Bet placed successfully!');
      setSelectedEntry(null);
      setAmountStr('');

      // Refetch balance after betting
      const bal = await getBalance();
      setBalance(bal?.result?.balance ?? 0);
    } catch (err: any) {
      setBetError(err.response?.data?.message || err.message || 'Betting error');
    } finally {
      setBetLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen px-8 py-16 max-w-4xl mx-auto" style={{ backgroundColor: '#0b101e' }}>
        <LoadingSkeleton rows={6} h="h-16" />
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400" style={{ backgroundColor: '#0b101e' }}>
        {error || 'Race not found.'}
      </div>
    );
  }

  const statusKey = race.status?.toLowerCase() ?? 'scheduled';
  const tournamentStatusKey = race.round?.tournament?.status?.toLowerCase() ?? 'upcoming';
  const config = RACE_STATUS_CONFIG[statusKey] ?? RACE_STATUS_CONFIG.scheduled;

  const invalidTournamentStatuses = ['finished', 'completed', 'cancelled', 'ended'];
  const isBettingAllowed = canBet && !isLocked;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />

        <main className="relative z-10 max-w-[1200px] mx-auto px-8 py-6 flex flex-col xl:flex-row gap-6">

          <div className="flex-1 space-y-6">
            <Link to={`/spectator/tournaments/${race.round?.tournamentId || ''}`} className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Races List
            </Link>

            {/* Race Header */}
            <div className="glass-panel rounded-2xl p-8 border border-glass-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold via-champagne to-gold opacity-50" />
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${config.color} flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full ${config.dot}`} /> {config.label}
                </span>
                <span className="text-sm font-medium text-gold">Round {race.round?.roundNumber || '—'}</span>
              </div>
              <p className="text-muted text-sm mb-1">{race.round?.tournament?.name || 'Tournament Name'}</p>
              <h1 className="text-3xl font-serif font-bold text-white mb-4">{race.name}</h1>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-glass-border/40">
                <div className="space-y-1">
                  <div className="text-xs text-muted">Start</div>
                  <div className="text-sm text-white font-medium flex items-center gap-1.5">
                    <Clock size={14} className="text-gold" />
                    {formatDateTime(race.raceDate)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted">Race Track</div>
                  <div className="text-sm text-white font-medium flex items-center gap-1.5">
                    <MapPin size={14} className="text-gold" />
                    {race.distanceMeter}m
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted">Max Lanes</div>
                  <div className="text-sm text-white font-medium">{race.maxLanes} lanes</div>
                </div>
              </div>
            </div>

            {/* Official Race Results / Leaderboard */}
            {(results && results.length > 0) && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6 border border-gold/30 relative overflow-hidden bg-gradient-to-br from-gold/10 via-amber-950/20 to-navy">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gold/20">
                  <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-gold" />
                    <h2 className="text-xl font-serif font-bold text-white">Official Race Results</h2>
                  </div>
                  <span className="px-3 py-1 bg-gold/20 text-gold border border-gold/30 text-xs font-bold rounded-full uppercase tracking-wider">
                    Published
                  </span>
                </div>

                <div className="space-y-3">
                  {results.map((res: any, idx: number) => {
                    const winnerName = res.winner || res.horseName || 'Winner';
                    return (
                      <div key={res.id || idx} className="flex items-center justify-between p-4 bg-navy/60 border border-gold/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold">
                            {idx === 0 ? <Trophy size={18} /> : idx === 1 ? <Medal size={18} /> : <Award size={18} />}
                          </div>
                          <div>
                            <div className="text-xs text-gold uppercase tracking-wider font-bold">Winner / Champion</div>
                            <div className="text-lg font-bold text-white">{winnerName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted">Race ID</div>
                          <div className="text-sm font-mono text-white font-bold">#{res.raceId}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Horses List */}
            <h2 className="text-xl font-serif font-bold text-white mt-8 mb-4">Horse List ({entries.length})</h2>

            {entries.length === 0 ? (
              <div className="glass-panel rounded-xl p-12 text-center text-muted">
                No horses participating in this race.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entries.map(e => {
                  const isSelected = selectedEntry?.raceEntryId === e.raceEntryId;

                  return (
                    <motion.div
                      key={e.raceEntryId}
                      whileHover={isBettingAllowed ? { scale: 1.01 } : {}}
                      onClick={() => isBettingAllowed && setSelectedEntry(e)}
                      className={`glass-panel rounded-xl p-4 border transition-all ${isBettingAllowed ? 'cursor-pointer hover:border-gold/50' : 'opacity-75 cursor-not-allowed border-glass-border'
                        } ${isSelected ? 'border-gold bg-gold/5 ring-1 ring-gold/20' : 'border-glass-border'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-navy bg-gold px-2 py-0.5 rounded-sm">Lane {e.laneNo}</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-champagne tabular-nums">x{e.currentOdds?.toFixed(2) || '1.00'}</div>
                          <div className="text-[10px] text-muted">Odds</div>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-1">{e.horseName}</h3>
                      <div className="text-xs text-muted mb-3 flex items-center gap-1">
                        <ShieldCheck size={12} className="text-gold/60" />
                        Jockey: {e.jockeyName}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-glass-border/20 text-center mb-3">
                        <div>
                          <div className="text-[10px] text-muted">Avg Speed</div>
                          <div className="text-xs text-white font-medium">{e.averageTime ? `${Number(e.averageTime).toFixed(2)} m/s` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted">Recent Avg Speed</div>
                          <div className="text-xs text-white font-medium">{e.recentAverageTime ? `${Number(e.recentAverageTime).toFixed(2)} m/s` : '—'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted">Win Rate</div>
                          <div className="text-xs text-white font-medium">{((e.winRate > 1 ? e.winRate : e.winRate * 100) || 0).toFixed(0)}%</div>
                        </div>
                      </div>

                      {e.winningProbability != null && (
                        <div className="flex justify-between items-center pt-3 border-t border-glass-border/40">
                          <span className="text-xs text-muted">Expected Win Probability:</span>
                          <span className="text-xs text-emerald-400 font-bold">{formatWinProbability(e.winningProbability)}</span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Betting Sidebar */}
          <AnimatePresence>
            {selectedEntry && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full xl:w-96 shrink-0"
              >
                <div className="glass-panel rounded-2xl p-6 border border-gold/30 sticky top-6">
                  <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle className="text-gold" />
                    Betting Slip
                  </h3>

                  {!isBettingAllowed && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      {isLocked
                        ? 'Your account is locked or inactive. Betting is disabled!'
                        : invalidTournamentStatuses.includes(tournamentStatusKey)
                          ? 'Tournament has ended, betting is disabled.'
                          : 'Betting is not allowed for this race currently.'}
                    </div>
                  )}

                  {betSuccess && (
                    <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                      <CheckCircle size={16} />
                      {betSuccess}
                    </div>
                  )}

                  {betError && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      {betError}
                    </div>
                  )}

                  <div className="bg-navy/40 rounded-lg p-4 mb-5 border border-glass-border/50">
                    <div className="text-xs text-muted mb-1">You are choosing:</div>
                    <div className="font-bold text-white mb-2">{selectedEntry.horseName}</div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Lane:</span>
                      <span className="text-white">{selectedEntry.laneNo}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted">Odds:</span>
                      <span className="text-champagne font-bold tabular-nums">x{odds.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">Bet Amount (Coins)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={amountStr}
                        onChange={e => setAmountStr(e.target.value)}
                        placeholder="Example: 1000"
                        disabled={!isBettingAllowed}
                        className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-3 text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs text-muted">Wallet Balance:</span>
                      <span className={`text-sm font-bold tabular-nums ${amount > balance ? 'text-red-400' : 'text-emerald-400'}`}>
                        {balance.toLocaleString()} coins
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-glass-border/40 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Bet Amount:</span>
                      <span className="text-white tabular-nums">{amount.toLocaleString()} coins</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Expected Payout:</span>
                      <span className="text-emerald-400 font-medium tabular-nums">+{potentialProfit.toLocaleString()} coins</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-white">Total Return:</span>
                      <span className="text-gold tabular-nums">{totalReturn.toLocaleString()} coins</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceBet}
                    disabled={!isBettingAllowed || betLoading || amount <= 0 || amount > balance}
                    className="w-full bg-gradient-to-r from-gold to-gold-light text-navy font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {betLoading ? 'Processing...' : 'Confirm Bet'}
                  </button>

                  <div className="mt-4 text-center">
                    <Link to="/spectator/wallet" className="text-xs text-gold/80 hover:text-gold underline underline-offset-2">
                      Deposit more funds
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
