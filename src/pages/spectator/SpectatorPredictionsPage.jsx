import { useState, useEffect } from 'react';
import { formatUSD } from '../../utils/format';
import { useFormik } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, CheckCircle, XCircle, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getMyBets, placeBet, getRaceBettingInfo } from '../../api/spectatorService';
import { getRaceSchedule, getRaceEntries } from '../../api/publicService';
import { parseApiError, getCurrentUser } from '../../api/authService';
import { placeBetSchema } from '../../constants/validationSchemas';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

function normalizeStatus(s) {
  const key = (s ?? '').toLowerCase();
  if (key === 'win' || key === 'won' || key === 'correct') return 'correct';
  if (key === 'lose' || key === 'lost' || key === 'incorrect') return 'incorrect';
  return 'pending';
}

const RESULT_CONFIG = {
  correct: { label: 'Win', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  incorrect: { label: 'Loss', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle },
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Clock },
};

const TABS = [
  ['all', 'All'],
  ['pending', 'Pending'],
  ['correct', 'Win'],
  ['incorrect', 'Loss'],
];

const INPUT = 'w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';

export function SpectatorPredictionsPage() {
  const user = getCurrentUser();
  const statusLower = user?.status?.toLowerCase();
  const isLocked = statusLower !== 'active';
  const [bets, setBets] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  // Lỗi/thông báo từ API — tách khỏi lỗi validate từng ô của Formik
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [horses, setHorses] = useState([]);
  const [loadingHorses, setLoadingHorses] = useState(false);

  // Form đặt cược — Formik giữ giá trị + validate (placeBetSchema: raceId/horseId/amount)
  const betFormik = useFormik({
    initialValues: { raceId: '', horseId: '', amount: '' },
    validationSchema: placeBetSchema,
    onSubmit: async (values) => {
      setSubmitError('');
      setSubmitSuccess('');
      try {
        const selectedHorse = horses.find((h) => String(h.horseId ?? h.id) === values.horseId);
        if (!selectedHorse || !selectedHorse.raceEntryId) throw new Error('Race entry information not found.');
        await placeBet({ raceEntryId: selectedHorse.raceEntryId, amount: Number(values.amount) });
        setSubmitSuccess('Bet placed successfully!');
        betFormik.resetForm();
        load();
      } catch (err) {
        setSubmitError(parseApiError(err));
      }
    },
  });

  // Chọn race → nạp danh sách ngựa của race đó và reset ô chọn ngựa
  useEffect(() => {
    if (betFormik.values.raceId) {
      setLoadingHorses(true);
      getRaceBettingInfo(betFormik.values.raceId)
        .then((res) => {
          const data = res?.result?.entries ?? res?.result ?? [];
          setHorses(data);
          betFormik.setFieldValue('horseId', '');
        })
        .catch(() => {
          getRaceEntries(betFormik.values.raceId)
            .then((res) => setHorses(res?.result ?? []))
            .catch(() => setHorses([]));
        })
        .finally(() => setLoadingHorses(false));
    } else {
      setHorses([]);
      betFormik.setFieldValue('horseId', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [betFormik.values.raceId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const betsData = await getMyBets().catch(() => ({ result: [] }));
      setBets(betsData?.result ?? (Array.isArray(betsData) ? betsData : []));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    getRaceSchedule()
      .then((d) => setRaces(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setRaces([]));
  }, []);

  function closeModal() {
    setShowAdd(false);
    setSubmitError('');
    setSubmitSuccess('');
    betFormik.resetForm();
  }

  const activeList = bets;
  const filtered = tab === 'all' ? activeList : activeList.filter((b) => normalizeStatus(b.status || (b.isCorrect === true ? 'win' : b.isCorrect === false ? 'lose' : 'pending')) === tab);
  const counts = {
    all: activeList.length,
    pending: activeList.filter((b) => normalizeStatus(b.status || (b.isCorrect === true ? 'win' : b.isCorrect === false ? 'lose' : 'pending')) === 'pending').length,
    correct: activeList.filter((b) => normalizeStatus(b.status || (b.isCorrect === true ? 'win' : b.isCorrect === false ? 'lose' : 'pending')) === 'correct').length,
    incorrect: activeList.filter((b) => normalizeStatus(b.status || (b.isCorrect === true ? 'win' : b.isCorrect === false ? 'lose' : 'pending')) === 'incorrect').length,
  };

  // Backend tra tien thang thuc nhan o `actualPayout`; giu them `prize`/`reward`
  // de phong cac endpoint cu van dung ten khac.
  const tienThang = (b) => b.actualPayout ?? b.prize ?? b.reward ?? 0;
  const totalWon = bets.filter((b) => normalizeStatus(b.status) === 'correct').reduce((s, b) => s + tienThang(b), 0);
  const totalBets = counts.correct + counts.incorrect;
  const accuracy = totalBets > 0 ? `${Math.round((counts.correct / totalBets) * 100)}%` : '—';

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <PageHero
            title="My Bets"
            subtitle="Place bets and view your betting history"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            actions={
              <button
                onClick={() => {
                  if (!isLocked) setShowAdd(true);
                }}
                disabled={isLocked}
                className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${isLocked ? 'bg-white/5 border-glass-border text-muted/50 cursor-not-allowed' : 'btn-gold'}`}
              >
                <Plus size={14} /> Place Bet {isLocked && '🔒'}
              </button>
            }
          />

          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Won', value: totalWon > 0 ? `${formatUSD(totalWon)}` : '—', icon: Sparkles, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20' },
              { label: 'Win Rate', value: accuracy, icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
              { label: 'Total Bets', value: bets.length, icon: CheckCircle, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="glass-panel rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.bg} blur-[30px] opacity-60 pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} border border-white/[0.08] flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className="relative z-10 text-2xl font-extrabold tracking-tight tabular-nums text-white">{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {TABS.map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {label} <span className="ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 text-muted">{counts[t]}</span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-3">
              {filtered.map((b, i) => {
                const statusKey = normalizeStatus(b.status);
                const cfg = RESULT_CONFIG[statusKey];
                const Icon = cfg.icon;
                const uid = b.id ?? b.betId ?? b.predictionId ?? i;
                const isExpanded = expandedId === uid;
                return (
                  <motion.div key={uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel rounded-xl border border-glass-border hover:border-gold/30 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <button onClick={() => setExpandedId(isExpanded ? null : uid)} className="relative z-10 w-full flex items-start gap-4 p-5 text-left">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-2xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base font-serif font-bold text-white">{b.horseName ?? `Horse #${b.horseId}`}</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            <Icon size={10} /> {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted">
                          {b.raceName && <span>{b.raceName}</span>}
                          {b.raceId && !b.raceName && <span>Race #{b.raceId}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <div className="text-xs text-muted">
                          Bet: <span className="text-white font-medium tabular-nums">{formatUSD(Number(b.amount ?? 0))}</span>
                        </div>
                        {tienThang(b) > 0 && <div className="text-sm font-bold text-gold tabular-nums">+{formatUSD(Number(tienThang(b)))}</div>}
                        {isExpanded ? <ChevronUp size={14} className="text-muted mt-1" /> : <ChevronDown size={14} className="text-muted mt-1" />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                          <div className="relative z-10 px-5 pb-4 pt-1 border-t border-glass-border grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted">
                            {b.raceName && (
                              <span>
                                Race: <span className="text-white">{b.raceName}</span>
                              </span>
                            )}
                            {b.raceId && (
                              <span>
                                Race ID: <span className="text-white">#{b.raceId}</span>
                              </span>
                            )}
                            {b.tournamentName && (
                              <span>
                                Tournament: <span className="text-champagne">{b.tournamentName}</span>
                              </span>
                            )}
                            {b.createdAt && (
                              <span>
                                Time: <span className="text-white">{new Date(b.createdAt).toLocaleString('vi-VN')}</span>
                              </span>
                            )}
                            {b.currentOdds != null && (
                              <span>
                                Odds: <span className="text-gold font-bold">x{Number(b.currentOdds).toFixed(2)}</span>
                              </span>
                            )}
                            {b.laneNo != null && (
                              <span>
                                Lane No: <span className="text-white">{b.laneNo}</span>
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🎯</div>
                  <div className="text-muted text-sm">No bets placed</div>
                  <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                </div>
              )}
            </div>
          )}

          {/* Place bet modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-md border border-glass-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <Sparkles size={15} className="text-gold" />
                  </div>
                  <h3 className="text-lg font-serif text-white">Place New Bet</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <form onSubmit={betFormik.handleSubmit} noValidate>
                  <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Race *</label>
                    <select name="raceId" value={betFormik.values.raceId} onChange={betFormik.handleChange} onBlur={betFormik.handleBlur} className={INPUT}>
                      <option value="">-- Select Race --</option>
                      {races
                        .filter((r) => {
                          const status = (r.status ?? r.Status ?? '').toLowerCase();
                          const roundStatus = (r.roundStatus ?? r.RoundStatus ?? '').toLowerCase();
                          const isFinished = ['finished', 'completed', 'cancelled', 'ended', 'resultpublished', 'closed'].includes(status) || ['finished', 'completed', 'cancelled', 'ended', 'resultpublished', 'closed'].includes(roundStatus) || r.hasResult === true || r.isFinished === true;
                          return !isFinished;
                        })
                        .map((r) => {
                          const rId = r.raceId ?? r.id;
                          return (
                            <option key={rId} value={rId}>
                              {r.name ?? `Race #${rId}`}
                              {r.raceDate ? ` — ${new Date(r.raceDate).toLocaleDateString()}` : ''}
                            </option>
                          );
                        })}
                    </select>
                    {races.filter((r) => {
                      const status = (r.status ?? r.Status ?? '').toLowerCase();
                      const roundStatus = (r.roundStatus ?? r.RoundStatus ?? '').toLowerCase();
                      return !['finished', 'completed', 'cancelled', 'ended', 'resultpublished', 'closed'].includes(status) && !['finished', 'completed', 'cancelled', 'ended', 'resultpublished', 'closed'].includes(roundStatus) && !r.hasResult && !r.isFinished;
                    }).length === 0 && <p className="text-[10px] text-muted/60 mt-1">No active races available for betting.</p>}
                    {betFormik.touched.raceId && betFormik.errors.raceId && <p className="text-xs text-red-400 mt-1">{betFormik.errors.raceId}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Select Horse *</label>
                    <select name="horseId" value={betFormik.values.horseId} onChange={betFormik.handleChange} onBlur={betFormik.handleBlur} disabled={!betFormik.values.raceId || loadingHorses} className={INPUT}>
                      <option value="">-- Select Horse --</option>
                      {horses.map((h) => {
                        const hId = h.horseId ?? h.id ?? h.raceEntryId;
                        const oddsRaw = h.currentOdds ?? h.CurrentOdds ?? h.odds ?? h.Odds;
                        const oddsVal = oddsRaw ? Number(oddsRaw).toFixed(2) : '2.00';
                        return (
                          <option key={hId} value={hId}>
                            {h.laneNo ? `Lane ${h.laneNo} - ` : ''}
                            {h.horseName ?? h.name ?? `Horse #${hId}`} (Odds x{oddsVal})
                          </option>
                        );
                      })}
                    </select>
                    {betFormik.values.raceId && horses.length === 0 && !loadingHorses && <p className="text-[10px] text-muted/60 mt-1">No horses in this race.</p>}
                    {betFormik.touched.horseId && betFormik.errors.horseId && <p className="text-xs text-red-400 mt-1">{betFormik.errors.horseId}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Bet Amount (Coins) *</label>
                    <input type="number" min="1" name="amount" value={betFormik.values.amount} onChange={betFormik.handleChange} onBlur={betFormik.handleBlur} placeholder="E.g.: 100" className={INPUT} />
                    {betFormik.touched.amount && betFormik.errors.amount && <p className="text-xs text-red-400 mt-1">{betFormik.errors.amount}</p>}

                    {betFormik.values.horseId &&
                      Number(betFormik.values.amount) > 0 &&
                      (() => {
                        const sel = horses.find((h) => String(h.horseId ?? h.id ?? h.raceEntryId) === betFormik.values.horseId);
                        const oddsRaw = sel?.currentOdds ?? sel?.CurrentOdds ?? sel?.odds ?? sel?.Odds;
                        const oddsNum = oddsRaw ? Number(oddsRaw) : 2.0;
                        const amt = Number(betFormik.values.amount);
                        const totalReturn = amt * oddsNum;
                        return (
                          <div className="mt-3 p-3 rounded-lg bg-gold/10 border border-gold/20 text-xs space-y-1">
                            <div className="flex justify-between text-muted">
                              <span>Odds Multiplier:</span>
                              <span className="text-gold font-bold">x{oddsNum.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white font-medium">
                              <span>Total return if wins:</span>
                              <span className="text-emerald-400 font-bold tabular-nums">{formatUSD(totalReturn)}</span>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                  {submitError && <div className="text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{submitError}</div>}
                  {submitSuccess && <div className="text-xs text-emerald-400 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{submitSuccess}</div>}
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={closeModal} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">
                      Close
                    </button>
                    <button type="submit" disabled={betFormik.isSubmitting} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-60">
                      {betFormik.isSubmitting ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
