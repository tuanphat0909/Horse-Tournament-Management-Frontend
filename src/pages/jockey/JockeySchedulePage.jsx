import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trophy, ChevronRight, X, MapPin, Flag } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getAssignedHorses } from '../../api/jockeyService';
import { parseApiError } from '../../api/authService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  scheduled: { label: 'Scheduled', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  completed: { label: 'Completed', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
  finished: { label: 'Finished', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  running: { label: 'Running', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  active: { label: 'Active', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
};

function formatDate(raw) {
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

function formatDateOnly(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function JockeySchedulePage() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAssignedHorses();
        const list = data?.result ?? (Array.isArray(data) ? data : []);
        // Sort by raceDate descending (newest first)
        list.sort((a, b) => {
          const da = a.raceDate ? new Date(a.raceDate).getTime() : 0;
          const db = b.raceDate ? new Date(b.raceDate).getTime() : 0;
          return db - da;
        });
        setRaces(list);
      } catch (err) {
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group by formatted date
  const DAY_GROUPS = Array.from(new Set(races.map((r) => formatDateOnly(r.raceDate))));

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <PageHero title="Race Schedule" subtitle="Your upcoming race schedule and assigned horses" imageUrl="/images/hero-jockey.jpg" imagePosition="center 12%" />

          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          ) : races.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">📅</div>
              <div className="text-muted text-sm">No races assigned to you yet</div>
            </div>
          ) : (
            <div className="space-y-8">
              {DAY_GROUPS.map((date) => {
                const dayRaces = races.filter((r) => formatDateOnly(r.raceDate) === date);
                return (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20">
                        <Calendar size={13} className="text-gold" />
                        <span className="text-sm font-bold text-gold">{date}</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted shrink-0">{dayRaces.length} races</span>
                    </div>

                    <div className="space-y-3">
                      {dayRaces.map((r, i) => {
                        const statusKey = (r.status || '').toLowerCase();
                        const cfg = STATUS_CONFIG[statusKey];
                        return (
                          <motion.div key={r.raceEntryId ?? r.raceId ?? i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="glass-panel rounded-xl border border-glass-border hover:border-gold/30 hover:bg-gold/[0.02] transition-all group overflow-hidden relative">
                            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
                            <div className="flex items-stretch relative z-10">
                              <div className="flex-1 p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/15 to-transparent border border-gold/20 ring-1 ring-gold/20 flex items-center justify-center text-2xl shrink-0">🏇</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-base font-serif font-bold text-white group-hover:text-champagne transition-colors">{r.raceName || r.name || 'Race'}</span>
                                    {cfg && <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                                    {r.tournamentName && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border">
                                        <Trophy size={10} className="text-gold/60" /> {r.tournamentName}
                                      </span>
                                    )}
                                    {r.horseName && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border">🐴 {r.horseName}</span>}
                                    {r.laneNo != null && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border">
                                        <MapPin size={10} className="text-gold/60" /> Lane {r.laneNo}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border">
                                      <Calendar size={10} className="text-gold/60" /> {formatDate(r.raceDate)}
                                    </span>
                                  </div>
                                </div>
                                <button onClick={() => setSelectedRace(r)} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors shrink-0 font-medium">
                                  View details <ChevronRight size={13} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRace && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRace(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg mx-4 glass-panel rounded-2xl border border-gold/20 overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br from-blue-500/15 to-transparent blur-[60px] pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 flex items-center justify-between p-6 pb-4 border-b border-glass-border">
                <div>
                  <h3 className="text-lg font-serif font-bold text-champagne">{selectedRace.raceName || selectedRace.name || 'Race Details'}</h3>
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
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <MapPin size={14} className="text-gold" /> {selectedRace.laneNo != null ? `Lane ${selectedRace.laneNo}` : 'Not assigned'}
                    </div>
                  </div>
                </div>

                {/* Race Date & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Race Date</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Calendar size={14} className="text-gold" /> {formatDate(selectedRace.raceDate)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Status</div>
                    {(() => {
                      const sk = (selectedRace.status || '').toLowerCase();
                      const c = STATUS_CONFIG[sk];
                      return c ? <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${c.color}`}>{c.label}</span> : <span className="text-sm font-semibold text-white">{selectedRace.status || '—'}</span>;
                    })()}
                  </div>
                </div>

                {/* Finish Results (if completed) */}
                {(selectedRace.finishPosition != null || selectedRace.finishTime != null) && (
                  <div className="p-3 rounded-xl bg-gold/[0.05] border border-gold/20">
                    <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-2 flex items-center gap-1">
                      <Flag size={12} /> Race Results
                    </div>
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
