import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Calendar, Trophy, ShieldCheck, ChevronRight, X, MapPin } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getAssignedHorses } from '../../api/jockeyService';
import { parseApiError } from '../../api/authService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const getStatusConfig = (status: string) => {
  const s = (status ?? '').toLowerCase();
  if (s === 'scheduled' || s === 'upcoming' || s === 'pending') {
    return { label: 'Upcoming', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
  }
  if (s === 'running' || s === 'live' || s === 'active' || s === 'ongoing') {
    return { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  }
  if (s === 'finished' || s === 'completed') {
    return { label: 'Completed', color: 'text-gray-400 bg-white/5 border-glass-border' };
  }
  return { label: status || 'Unknown', color: 'text-muted bg-white/5 border-glass-border' };
};

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

type Tab = 'upcoming' | 'completed';

export function JockeyRacesPage() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRace, setSelectedRace] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAssignedHorses();
        setRaces(data?.result ?? (Array.isArray(data) ? data : []));
      } catch (err: unknown) {
        setError(parseApiError(err as Error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcomingRaces = races.filter(r => {
    const s = (r.status ?? '').toLowerCase();
    return s !== 'finished' && s !== 'completed';
  });

  const completedRaces = races.filter(r => {
    const s = (r.status ?? '').toLowerCase();
    return s === 'finished' || s === 'completed';
  });

  const tabCounts = {
    upcoming: upcomingRaces.length,
    completed: completedRaces.length,
  };

  const activeRaces = tab === 'upcoming' ? upcomingRaces : completedRaces;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="My Races"
            subtitle="Your race history and results"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 12%"
          />

          <div className="flex items-center gap-1 border-b border-glass-border pb-0">
            <button
              onClick={() => setTab('upcoming')}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${
                tab === 'upcoming' ? 'text-yellow-400 border-yellow-400' : 'text-muted border-transparent hover:text-white'
              }`}
            >
              Upcoming Races
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === 'upcoming' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-white/5 text-muted'}`}>
                {tabCounts.upcoming}
              </span>
            </button>
            <button
              onClick={() => setTab('completed')}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${
                tab === 'completed' ? 'text-emerald-400 border-emerald-400' : 'text-muted border-transparent hover:text-white'
              }`}
            >
              Completed Races
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === 'completed' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-muted'}`}>
                {tabCounts.completed}
              </span>
            </button>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          ) : activeRaces.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏁</div>
              <div className="text-muted text-sm">No {tab === 'upcoming' ? 'upcoming' : 'completed'} races available</div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeRaces.map((r, i) => {
                const cfg = getStatusConfig(r.status);
                return (
                  <motion.div key={r.raceEntryId ?? r.raceId ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="glass-panel rounded-2xl overflow-hidden border border-glass-border hover:border-gold/30 hover:bg-gold/[0.02] transition-all group relative">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <div className="p-6 flex items-start gap-5 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0 mt-2">{i + 1}</div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/20 ring-1 ring-gold/20 flex items-center justify-center shrink-0">
                        <Flag size={20} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-base font-serif text-white group-hover:text-champagne transition-colors">{r.horseName ?? `Horse #${r.horseId}`}</h3>
                          {cfg && <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted mb-3">
                          {r.tournamentName && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border"><Trophy size={10} className="text-gold/60" /> {r.tournamentName}</span>}
                          {r.raceDate && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border"><Calendar size={10} className="text-gold/60" /> {formatDate(r.raceDate)}</span>}
                        </div>
                        <div className="flex items-center gap-5 p-3 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all w-fit flex-wrap">
                          <div className="text-sm font-bold text-white group-hover:text-champagne transition-colors">🐴 Lane {r.laneNo ?? '?'}</div>
                          <div className="flex items-center gap-1 text-xs text-muted"><ShieldCheck size={11} className="text-emerald-400" /> Race: <span className="text-champagne font-semibold">{r.raceName || `Race #${r.raceId}`}</span></div>
                          {(r.status?.toLowerCase() === 'completed' || r.status?.toLowerCase() === 'finished') && (
                            <>
                              <div className="w-px h-4 bg-glass-border hidden sm:block" />
                              <div className="text-xs font-bold text-gold">Rank: {r.finishPosition ?? '—'}</div>
                              {r.finishTime && (
                                <div className="text-xs font-mono text-champagne">Time: {r.finishTime}s</div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRace(r)}
                        className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors shrink-0 font-medium cursor-pointer"
                      >
                        Detail <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRace(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-lg mx-4 glass-panel rounded-2xl border border-gold/20 overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-blue-500/15 to-transparent blur-[60px] pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between p-6 pb-4 border-b border-glass-border">
                <div>
                  <h3 className="text-lg font-serif font-bold text-champagne">{selectedRace.raceName || `Race #${selectedRace.raceId}`}</h3>
                  <p className="text-xs text-muted mt-0.5">Race Entry #{selectedRace.raceEntryId}</p>
                </div>
                <button onClick={() => setSelectedRace(null)} className="w-8 h-8 rounded-full bg-white/5 border border-glass-border flex items-center justify-center text-muted hover:text-white hover:bg-white/10 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="relative z-10 p-6 space-y-4">
                {/* Tournament */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                  <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Trophy size={16} className="text-gold" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Tournament</div>
                    <div className="text-sm font-semibold text-white">{selectedRace.tournamentName || '—'}</div>
                  </div>
                </div>

                {/* Horse & Lane */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Assigned Horse</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">🐴 {selectedRace.horseName || '—'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Lane Number</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5"><MapPin size={14} className="text-gold" /> {selectedRace.laneNo != null ? `Lane ${selectedRace.laneNo}` : 'Not assigned'}</div>
                  </div>
                </div>

                {/* Race Date & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Race Date</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5"><Calendar size={14} className="text-gold" /> {formatDate(selectedRace.raceDate)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Status</div>
                    {(() => {
                      const cfg = getStatusConfig(selectedRace.status);
                      return <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>;
                    })()}
                  </div>
                </div>

                {/* Finish Results (if completed) */}
                {(selectedRace.finishPosition != null || selectedRace.finishTime != null) && (
                  <div className="p-3 rounded-xl bg-gold/[0.05] border border-gold/20">
                    <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-2 flex items-center gap-1"><Flag size={12} /> Race Results</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-muted">Finish Position</div>
                        <div className="text-lg font-bold text-champagne">{selectedRace.finishPosition != null ? `#${selectedRace.finishPosition}` : '—'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted">Finish Time</div>
                        <div className="text-lg font-bold text-champagne">{selectedRace.finishTime != null ? `${selectedRace.finishTime}s` : '—'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
