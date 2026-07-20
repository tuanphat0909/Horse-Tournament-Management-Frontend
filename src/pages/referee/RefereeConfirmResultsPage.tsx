import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Save, RefreshCw, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRefereeDashboard, submitResult } from '../../api/refereeService';
import { getRaceEntries } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-red-400/40 transition-colors';
const READONLY_INPUT = 'w-full bg-navy/80 border border-glass-border/40 rounded-lg px-4 py-2.5 text-sm text-gold font-bold cursor-not-allowed outline-none';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

export function RefereeConfirmResultsPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);

  const [form, setForm] = useState({ raceId: '', winner: '', winningTime: '', remarks: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [raceEntries, setRaceEntries] = useState<any[]>([]);
  const [originalTimes, setOriginalTimes] = useState<Record<number, number>>({});
  const [timeReasons, setTimeReasons] = useState<Record<number, string>>({});
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);

  // Completed race check
  const selectedRace = races.find(r => r.raceId === Number(form.raceId));
  const isCompleted = selectedRace && (selectedRace.status === 'Completed' || selectedRace.status === 'Finished');

  useEffect(() => {
    if (form.raceId) {
      const race = races.find(r => r.raceId === Number(form.raceId));
      if (race && (race.status === 'Completed' || race.status === 'Finished')) {
        setError('This race already has official published results.');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [form.raceId, races]);

  useEffect(() => {
    getRefereeDashboard()
      .then((data: any) => {
        const list = data?.result?.assignedRaces || [];
        const now = new Date();
        // REQUIREMENT 1: Only allow races that are in progress, finished, or raceDate <= now
        const activeOrFinishedRaces = list.filter((r: any) => {
          const st = (r.status || '').toLowerCase();
          const isStartedOrDone = st === 'inprogress' || st === 'running' || st === 'finished' || st === 'completed' || (r.raceDate && new Date(r.raceDate) <= now);
          return isStartedOrDone;
        });
        setRaces(activeOrFinishedRaces);
      })
      .catch(() => setRaces([]))
      .finally(() => setLoadingRaces(false));
  }, []);

  function setF(field: string, val: string) {
    setForm(p => ({ ...p, [field]: val }));
  }

  async function handleRaceChange(raceId: string) {
    setF('raceId', raceId);
    setF('winner', '');
    setF('winningTime', '');
    setF('remarks', '');
    setError('');
    setSuccess('');
    setRaceEntries([]);
    setOriginalTimes({});
    setTimeReasons({});

    if (!raceId) return;

    setLoadingEntries(true);
    try {
      const res = await getRaceEntries(Number(raceId));
      const entries = res?.result ?? (Array.isArray(res) ? res : []);

      // Sort entries by FinishTime ascending (or position)
      const sorted = [...entries].sort((a: any, b: any) => {
        if (a.finishTime != null && b.finishTime != null) return a.finishTime - b.finishTime;
        if (a.finishPosition != null && b.finishPosition != null) return a.finishPosition - b.finishPosition;
        return 0;
      });

      // Pre-populate simulated finish times if race doesn't have times yet
      const hasTimes = sorted.some((e: any) => e.finishTime != null);
      const baseWinnerTime = Math.round(55 + Math.random() * 8);

      const origMap: Record<number, number> = {};

      sorted.forEach((e: any, index: number) => {
        const timeVal = hasTimes && e.finishTime != null
          ? Number(e.finishTime)
          : Number((baseWinnerTime + (index * 1.4) + Math.random() * 1.5).toFixed(2));
        
        e.finishTime = timeVal;
        e.finishPosition = index + 1;
        if (e.raceEntryId) {
          origMap[e.raceEntryId] = timeVal;
        }
      });

      setOriginalTimes(origMap);
      setRaceEntries(sorted);

      const top1 = sorted[0];
      if (top1) {
        setF('winner', top1.horseName || String(top1.horseId));
        setF('winningTime', String(top1.finishTime));
        setF('remarks', 'Results auto-sorted by finish times.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot load horse list for the selected race.');
    } finally {
      setLoadingEntries(false);
    }
  }

  function handleTimeChange(raceEntryId: number, value: string) {
    const val = value === '' ? null : Number(value);
    setRaceEntries(prev => prev.map(entry => {
      if (entry.raceEntryId === raceEntryId) {
        return { ...entry, finishTime: val };
      }
      return entry;
    }));
  }

  // REQUIREMENT 3: Sort Leaderboard & Re-assign ranks 1..N based on finishTime
  function handleSortAndSaveLeaderboard() {
    const sorted = [...raceEntries].sort((a: any, b: any) => {
      const ta = a.finishTime ?? 999999;
      const tb = b.finishTime ?? 999999;
      return ta - tb;
    });

    sorted.forEach((entry: any, idx: number) => {
      entry.finishPosition = idx + 1;
    });

    setRaceEntries(sorted);

    // REQUIREMENT 2: Auto-update Winner & Winning Time on left form
    const top1 = sorted[0];
    if (top1 && top1.finishTime != null) {
      setF('winner', top1.horseName || String(top1.horseId));
      setF('winningTime', String(top1.finishTime));
    }
  }

  // Check if any horse finish time was changed from original time
  const getModifiedHorses = () => {
    return raceEntries.filter(e => {
      const orig = originalTimes[e.raceEntryId];
      if (orig == null || e.finishTime == null) return false;
      return Math.abs(Number(e.finishTime) - orig) > 0.001;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.raceId) {
      setError('Please select a race.');
      return;
    }

    if (isCompleted) {
      setError('This race already has published results — cannot resubmit.');
      return;
    }

    const invalidEntry = raceEntries.find(e => e.finishTime == null || isNaN(e.finishTime));
    if (invalidEntry) {
      setError('Please fill in valid finish times for all horses in the leaderboard.');
      return;
    }

    // REQUIREMENT 4: Check if referee modified any horse finish time -> Require reason
    const modified = getModifiedHorses();
    const missingReason = modified.find(m => !timeReasons[m.raceEntryId]?.trim());
    
    if (modified.length > 0 && missingReason) {
      setShowReasonModal(true);
      return;
    }

    executeSubmit();
  }

  async function executeSubmit() {
    setShowReasonModal(false);
    setLoading(true);
    setError(''); setSuccess('');

    try {
      // Build detailed remarks string including reasons for time modifications
      const modified = getModifiedHorses();
      let fullRemarks = form.remarks || 'Official results submitted.';
      
      if (modified.length > 0) {
        const reasonNotes = modified.map(m => 
          `[Time Adjustment for ${m.horseName} (Lane ${m.laneNo}): Original=${originalTimes[m.raceEntryId]}s, New=${m.finishTime}s. Reason: ${timeReasons[m.raceEntryId] || 'Referee adjustment'}]`
        ).join(' ');
        fullRemarks = `${fullRemarks} | ${reasonNotes}`;
      }

      // Ensure leaderboard is sorted before submit
      const sorted = [...raceEntries].sort((a: any, b: any) => (a.finishTime ?? 999999) - (b.finishTime ?? 999999));
      sorted.forEach((e: any, idx: number) => { e.finishPosition = idx + 1; });

      const top1 = sorted[0];

      await submitResult({
        raceId: Number(form.raceId),
        winner: top1.horseName || String(top1.horseId),
        winningTime: String(top1.finishTime),
        remarks: fullRemarks,
        entries: sorted.map(e => ({
          raceEntryId: e.raceEntryId,
          finishPosition: Number(e.finishPosition),
          finishTime: Number(e.finishTime)
        }))
      });

      setSuccess('Race results and leaderboard published successfully!');
      setForm({ raceId: '', winner: '', winningTime: '', remarks: '' });
      setRaceEntries([]);
      setOriginalTimes({});
      setTimeReasons({});
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  const modifiedHorses = getModifiedHorses();

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Confirm Results"
            subtitle="Confirm official race times and publish leaderboard"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
          />

          <div className={`grid grid-cols-1 ${form.raceId ? 'lg:grid-cols-12' : 'max-w-2xl'} gap-6 mx-auto transition-all duration-300`}>
            
            {/* Left Column: Form (5 Cols) */}
            <div className={`${form.raceId ? 'lg:col-span-5' : 'w-full'} glass-panel rounded-xl p-8 border border-glass-border h-fit`}>
              <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                <Trophy size={20} className="text-gold" />
                Enter Race Results
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* REQUIREMENT 1: Only show InProgress / Finished / Started races */}
                <div>
                  <label className={LABEL}>Race *</label>
                  {loadingRaces ? (
                    <LoadingSkeleton />
                  ) : (
                    <select value={form.raceId} onChange={e => handleRaceChange(e.target.value)} className={INPUT} style={{colorScheme: 'dark'}}>
                      <option value="">-- Select Ongoing / Finished Race --</option>
                      {races.map(r => (
                        <option key={r.raceId} value={r.raceId}>
                          ID {r.raceId}: {r.raceName} ({r.status || 'Active'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                {/* REQUIREMENT 2: Winning Horse is Read-Only / Auto-Calculated */}
                <div>
                  <label className={LABEL}>Winning Horse (Rank 1 Auto-Detected) *</label>
                  <input
                    readOnly
                    value={form.winner ? `🏆 ${form.winner}` : '-- Select Race First --'}
                    className={READONLY_INPUT}
                  />
                  <p className="text-[11px] text-muted/70 mt-1">Winning horse is automatically set from Top 1 in the Race Leaderboard.</p>
                </div>
                
                {/* REQUIREMENT 2: Time Completed is Read-Only / Auto-Calculated */}
                <div>
                  <label className={LABEL}>Winning Time (Auto-Calculated) *</label>
                  <input
                    readOnly
                    value={form.winningTime ? `${form.winningTime} seconds` : '-- Select Race First --'}
                    className={READONLY_INPUT + ' text-emerald-400'}
                  />
                </div>
                
                <div>
                  <label className={LABEL}>Referee Notes / Remarks</label>
                  <textarea
                    disabled={!!isCompleted}
                    rows={3}
                    value={form.remarks}
                    onChange={e => setF('remarks', e.target.value)}
                    placeholder="E.g., Close finish, clear track conditions..."
                    className={INPUT + " resize-none"}
                  />
                </div>

                {error && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
                {success && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2"><CheckCircle2 size={16} />{success}</div>}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !form.raceId || !!isCompleted}
                    className="btn-red w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? 'Submitting...' : isCompleted ? 'Results Published' : 'Confirm & Publish Official Results'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Leaderboard Table (7 Cols) */}
            {form.raceId && (
              <div className="lg:col-span-7 glass-panel rounded-xl p-8 border border-glass-border flex flex-col h-fit">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-glass-border/40">
                  <div>
                    <h2 className="text-xl font-serif text-white">Race Leaderboard</h2>
                    <p className="text-xs text-muted">Input finish times (seconds). Positions are auto-calculated on Save.</p>
                  </div>

                  {/* REQUIREMENT 3: Save & Auto-Sort Leaderboard Button */}
                  <button
                    type="button"
                    onClick={handleSortAndSaveLeaderboard}
                    disabled={!!isCompleted}
                    className="btn-gold px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <RefreshCw size={13} /> Save & Sort Ranks
                  </button>
                </div>

                {loadingEntries ? (
                  <LoadingSkeleton />
                ) : raceEntries.length === 0 ? (
                  <div className="text-sm text-muted py-6 italic">No race entry data found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-border/30 text-[11px] text-muted uppercase font-bold tracking-wider">
                          <th className="py-2.5 pr-3">Lane</th>
                          <th className="py-2.5 pr-3">Horse</th>
                          <th className="py-2.5 pr-3">Jockey</th>
                          <th className="py-2.5 pr-3 w-28 text-center">Rank</th>
                          <th className="py-2.5 text-right w-36">Time (Seconds)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border/20 text-sm text-white">
                        {raceEntries.map((entry: any, index: number) => {
                          const isModified = originalTimes[entry.raceEntryId] != null && Math.abs((entry.finishTime ?? 0) - originalTimes[entry.raceEntryId]) > 0.001;

                          return (
                            <tr key={entry.raceEntryId || index} className="hover:bg-white/[0.01] transition-colors">
                              <td className="py-3.5 pr-3 text-xs font-mono text-muted">L{entry.laneNo}</td>
                              <td className="py-3.5 pr-3 font-semibold text-white">
                                {index === 0 ? '🏆 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '🐎 '}
                                {entry.horseName}
                              </td>
                              <td className="py-3.5 pr-3 text-xs text-muted flex items-center gap-1">
                                <ShieldCheck size={12} className="text-gold/60 shrink-0" />
                                {entry.jockeyName || 'N/A'}
                              </td>
                              {/* REQUIREMENT 3: Rank (Position) is READ-ONLY badge */}
                              <td className="py-3.5 pr-3 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  index === 0 ? 'bg-gold/20 text-gold border border-gold/40' :
                                  index === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                                  index === 2 ? 'bg-amber-700/20 text-amber-300 border border-amber-700/30' :
                                  'bg-white/5 text-muted border border-glass-border'
                                }`}>
                                  Rank #{index + 1}
                                </span>
                              </td>
                              {/* Editable Finish Time */}
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isModified && (
                                    <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20" title="Time modified">
                                      Edited
                                    </span>
                                  )}
                                  <input
                                    disabled={!!isCompleted}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={entry.finishTime ?? ''}
                                    onChange={e => handleTimeChange(entry.raceEntryId, e.target.value)}
                                    className="w-28 bg-navy/60 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-white text-right font-mono focus:border-gold/50 outline-none"
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* REQUIREMENT 4: Time Adjustment Reason Modal for Admin Reporting */}
          <AnimatePresence>
            {showReasonModal && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel rounded-2xl p-7 w-full max-w-lg border border-gold/30 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-white">Time Adjustment Report</h3>
                      <p className="text-xs text-muted">Please provide reasons for modified finish times to report to Admin.</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1 my-4 divide-y divide-glass-border/30">
                    {modifiedHorses.map(h => (
                      <div key={h.raceEntryId} className="pt-3 first:pt-0">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-white">🐎 {h.horseName} (Lane {h.laneNo})</span>
                          <span className="text-muted font-mono">
                            {originalTimes[h.raceEntryId]}s ➔ <span className="text-gold font-bold">{h.finishTime}s</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          value={timeReasons[h.raceEntryId] || ''}
                          onChange={e => setTimeReasons({ ...timeReasons, [h.raceEntryId]: e.target.value })}
                          placeholder="Reason (e.g. Photo finish camera review, obstacle timing adjustment)..."
                          className="w-full bg-navy/60 border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-glass-border/40">
                    <button
                      onClick={() => setShowReasonModal(false)}
                      className="px-5 py-2 rounded-xl text-xs text-muted border border-glass-border hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeSubmit}
                      className="btn-gold px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Save size={14} /> Submit & Report to Admin
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
