import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, Calendar, Trophy, ShieldCheck, ChevronRight } from 'lucide-react';
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
    return { label: 'Completed', color: 'text-muted bg-white/5 border-glass-border' };
  }
  return { label: status || 'Unknown', color: 'text-muted bg-white/5 border-glass-border' };
};

export function JockeyRacesPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="My Races"
            subtitle="History và kết quả races"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

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
              <div className="text-4xl opacity-40 mb-3">🏁</div>
              <div className="text-muted text-sm">No data available</div>
            </div>
          ) : (
            <div className="space-y-4">
              {races.map((r, i) => {
                const cfg = getStatusConfig(r.status);
                return (
                  <motion.div key={r.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
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
                          {r.raceDate && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border"><Calendar size={10} className="text-gold/60" /> {r.raceDate}</span>}
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
                      <button className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors shrink-0 font-medium">
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
    </div>
  );
}
