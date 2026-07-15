import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRefereeDashboard, submitResult } from '../../api/refereeService';
import { getRaceEntries } from '../../api/publicService';
import { parseApiError } from '../../api/authService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-red-400/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

export function RefereeConfirmResultsPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);

  const [form, setForm] = useState({ raceId: '', winner: '', winningTime: '', remarks: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [raceEntries, setRaceEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Race đã có kết quả (Completed/Finished) thì khóa form — BE sẽ từ chối nộp lần 2
  const selectedRace = races.find(r => r.raceId === Number(form.raceId));
  const isCompleted = selectedRace && (selectedRace.status === 'Completed' || selectedRace.status === 'Finished');

  useEffect(() => {
    if (form.raceId) {
      const race = races.find(r => r.raceId === Number(form.raceId));
      if (race && (race.status === 'Completed' || race.status === 'Finished')) {
        setError('This race already has results — cannot resubmit.');
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
        setRaces(list);
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
    setRaceEntries([]);
    
    if (!raceId) return;

    setLoadingEntries(true);
    try {
      const res = await getRaceEntries(Number(raceId));
      const entries = res?.result ?? (Array.isArray(res) ? res : []);
      
      // Sort entries by FinishPosition, nulls at the end
      const sorted = [...entries].sort((a: any, b: any) => {
        if (a.finishPosition === null || a.finishPosition === undefined) return 1;
        if (b.finishPosition === null || b.finishPosition === undefined) return -1;
        return a.finishPosition - b.finishPosition;
      });

      // If the race doesn't have results yet, pre-populate default simulated results
      const hasResults = sorted.some((e: any) => e.finishPosition != null);
      if (!hasResults) {
        const baseWinnerTime = Math.round(55 + Math.random() * 10);
        sorted.forEach((e: any, index: number) => {
          e.finishPosition = index + 1;
          e.finishTime = index === 0 
            ? baseWinnerTime 
            : Number((baseWinnerTime + (index * 1.5) + Math.random() * 2).toFixed(2));
        });
      }

      setRaceEntries(sorted);

      const winnerEntry = sorted.find((e: any) => e.finishPosition === 1);
      if (winnerEntry) {
        setF('winner', winnerEntry.horseName || winnerEntry.horseId.toString());
        setF('winningTime', String(winnerEntry.finishTime));
        setF('remarks', 'Results recorded.');
      } else {
        setF('remarks', 'Referee recorded results manually.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot load horse list for the race.');
    } finally {
      setLoadingEntries(false);
    }
  }

  function handleEntryChange(raceEntryId: number, field: string, value: string) {
    setRaceEntries(prev => prev.map(entry => {
      if (entry.raceEntryId === raceEntryId) {
        const val = value === '' ? null : Number(value);
        return { ...entry, [field]: val };
      }
      return entry;
    }));
  }

  useEffect(() => {
    const winnerEntry = raceEntries.find(e => Number(e.finishPosition) === 1);
    if (winnerEntry) {
      setForm(p => ({
        ...p,
        winner: winnerEntry.horseName || String(winnerEntry.horseId),
        winningTime: winnerEntry.finishTime != null ? String(winnerEntry.finishTime) : ''
      }));
    }
  }, [raceEntries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.raceId) {
      setError('Please select a race.');
      return;
    }

    if (isCompleted) {
      setError('This race already has results — cannot resubmit.');
      return;
    }

    const invalidEntry = raceEntries.find(e => e.finishPosition == null || e.finishTime == null);
    if (invalidEntry) {
      setError('Please enter rank and time for all horses.');
      return;
    }

    const winners = raceEntries.filter(e => Number(e.finishPosition) === 1);
    if (winners.length !== 1) {
      setError('Please select exactly one horse for 1st Place.');
      return;
    }

    if (!form.winner || !form.winningTime) {
      setError('Missing winner information.');
      return;
    }

    setLoading(true);
    try {
      await submitResult({
        raceId: Number(form.raceId),
        winner: form.winner,
        winningTime: form.winningTime,
        remarks: form.remarks,
        entries: raceEntries.map(e => ({
          raceEntryId: e.raceEntryId,
          finishPosition: Number(e.finishPosition),
          finishTime: Number(e.finishTime)
        }))
      });
      setSuccess('Results recorded successfully!');
      setForm({ raceId: '', winner: '', winningTime: '', remarks: '' });
      setRaceEntries([]);
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Confirm Results"
            subtitle="Confirm and publish official results"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
          />

          <div className={`grid grid-cols-1 ${form.raceId ? 'lg:grid-cols-2' : 'max-w-2xl'} gap-6 mx-auto transition-all duration-300`}>
            {/* Form Column */}
            <div className="glass-panel rounded-xl p-8 border border-glass-border h-fit">
              <h2 className="text-xl font-serif text-white mb-6">Enter Race Results</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={LABEL}>Race *</label>
                  {loadingRaces ? (
                    <LoadingSkeleton />
                  ) : (
                    <select value={form.raceId} onChange={e => handleRaceChange(e.target.value)} className={INPUT} style={{colorScheme: 'dark'}}>
                      <option value="">-- Select Race --</option>
                      {races.map(r => (
                        <option key={r.raceId} value={r.raceId}>ID {r.raceId}: {r.raceName} ({r.status})</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  <label className={LABEL}>Winning Horse *</label>
                  {/* Dropdown từ danh sách horse THẬT của races — không bắt gõ tên/ID tay nữa */}
                  <select value={form.winner} onChange={e => setF('winner', e.target.value)}
                    disabled={!form.raceId || loadingEntries || !!isCompleted}
                    className={INPUT} style={{ colorScheme: 'dark' }}>
                    <option value="">{!form.raceId ? '-- Select Previous Race --' : loadingEntries ? '-- Loading horses... --' : '-- Select Winning Horse --'}</option>
                    {raceEntries.map((e: any, i: number) => {
                      const name = e.horseName ?? String(e.horseId);
                      return (
                        <option key={e.raceEntryId ?? i} value={name}>
                          {`Lane ${e.laneNo ?? '?'}: ${name}${e.jockeyName ? ` (${e.jockeyName})` : ''}${e.finishPosition != null ? ` — rank ${e.finishPosition}` : ''}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label className={LABEL}>Time completed (Winning Time) *</label>
                  <input disabled={!!isCompleted} value={form.winningTime} onChange={e => setF('winningTime', e.target.value)} placeholder="VD: 01:23.45" className={INPUT} />
                </div>
                
                <div>
                  <label className={LABEL}>Notes</label>
                  <textarea disabled={!!isCompleted} rows={3} value={form.remarks} onChange={e => setF('remarks', e.target.value)} placeholder="E.g., Close finish, new record..." className={INPUT + " resize-none"} />
                </div>

                {error && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
                {success && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{success}</div>}

                <div className="pt-2">
                  <button type="submit" disabled={loading || !!isCompleted} className="btn-red w-full py-3 rounded-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? 'Sending...' : isCompleted ? 'Results Available' : 'Confirm Results'}
                  </button>
                </div>
              </form>
            </div>

            {/* Standings/Entries Column */}
            {form.raceId && (
              <div className="glass-panel rounded-xl p-8 border border-glass-border flex flex-col h-fit">
                <h2 className="text-xl font-serif text-white mb-6">Race Leaderboard</h2>
                {loadingEntries ? (
                  <LoadingSkeleton />
                ) : raceEntries.length === 0 ? (
                  <div className="text-sm text-muted py-6 italic">No race entry data</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-border/30 text-[10px] text-muted uppercase">
                          <th className="py-2 pr-3">Lane</th>
                          <th className="py-2 pr-3">Horse</th>
                          <th className="py-2 pr-3">Jockey</th>
                          <th className="py-2 pr-3 w-28">Rank (Position)</th>
                          <th className="py-2 text-right w-36">Time (Seconds)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border/20 text-white/90">
                        {raceEntries.map((entry: any) => (
                          <tr key={entry.raceEntryId}>
                            <td className="py-3 pr-3 text-muted">L{entry.laneNo}</td>
                            <td className="py-3 pr-3 font-medium">🐎 {entry.horseName}</td>
                            <td className="py-3 pr-3 text-muted">{entry.jockeyName || 'N/A'}</td>
                            <td className="py-3 pr-3">
                              <input
                                disabled={!!isCompleted}
                                type="number"
                                min="1"
                                max={raceEntries.length}
                                value={entry.finishPosition ?? ''} 
                                onChange={e => handleEntryChange(entry.raceEntryId, 'finishPosition', e.target.value)}
                                placeholder="VD: 1" 
                                className="w-16 bg-navy/40 border border-glass-border/60 rounded px-2 py-1 text-sm text-white text-center focus:border-red-400/40 outline-none"
                              />
                            </td>
                            <td className="py-3 text-right">
                              <input
                                disabled={!!isCompleted}
                                type="number"
                                step="0.01"
                                min="0"
                                value={entry.finishTime ?? ''} 
                                onChange={e => handleEntryChange(entry.raceEntryId, 'finishTime', e.target.value)}
                                placeholder="VD: 60.55" 
                                className="w-28 bg-navy/40 border border-glass-border/60 rounded px-2 py-1 text-sm text-white text-right focus:border-red-400/40 outline-none"
                              />
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

        </main>
      </div>
    </div>
  );
}
