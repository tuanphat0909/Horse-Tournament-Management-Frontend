import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Calendar, Medal, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceSchedule, getJockeyRankings, getHorseRankings, getTournaments } from '../../api/publicService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const POS_STYLE: Record<number, string> = {
  1: 'bg-gold/20 text-gold border-gold/30',
  2: 'bg-white/10 text-white border-white/20',
  3: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
};

export function SpectatorLiveResultsPage() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [jockeyRankings, setJockeyRankings] = useState<any[]>([]);
  const [horseRankings, setHorseRankings] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [tourLoading, setTourLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(true);



  // expandedRankingId tracks which ranking row is expanded (jockeyId or horseId)
  const [expandedJockey, setExpandedJockey] = useState<number | null>(null);
  const [expandedHorse, setExpandedHorse] = useState<number | null>(null);

  useEffect(() => {

    getRaceSchedule()
      .then(d => setSchedule(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setSchedule([]))
      .finally(() => setScheduleLoading(false));
    getTournaments()
      .then(d => setTournaments(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setTournaments([]))
      .finally(() => setTourLoading(false));

    Promise.all([getJockeyRankings(), getHorseRankings()])
      .then(([jr, hr]) => {
        setJockeyRankings(jr?.result ?? (Array.isArray(jr) ? jr : []));
        setHorseRankings(hr?.result ?? (Array.isArray(hr) ? hr : []));
      })
      .catch(() => { setJockeyRankings([]); setHorseRankings([]); })
      .finally(() => setRankingsLoading(false));
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Results & Race Schedule"
            subtitle="Track races and upcoming schedule"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />



          {/* Tournament schedule — item 9: switched from race list to tournament list */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Calendar size={15} className="text-gold" /></div>
              <h2 className="text-lg font-serif text-white">Upcoming Schedule</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            {tourLoading ? (
              <LoadingSkeleton />
            ) : tournaments.filter(t => t.status !== 'Completed').length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">📅</div>
                <div className="text-muted text-sm">No upcoming tournaments</div>
                <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.filter(t => t.status !== 'Completed').map((tour, i) => {
                  const isActive = tour.status === 'Active';
                  return (
                    <motion.div key={tour.tournamentId ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all relative overflow-hidden group">
                      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                          <Trophy size={16} className={isActive ? 'text-emerald-400' : 'text-blue-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-serif font-bold text-white">{tour.name}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-0.5">
                            {tour.startDate && <span className="flex items-center gap-1"><Clock size={10} /> {new Date(tour.startDate).toLocaleDateString('vi-VN')}</span>}
                            {tour.endDate && <span>→ {new Date(tour.endDate).toLocaleDateString('vi-VN')}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                            {isActive ? 'Active' : 'Upcoming'}
                          </span>
                          <button
                            onClick={() => navigate(`/spectator/tournaments/${tour.tournamentId}`)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gold/10 border border-glass-border hover:border-gold/30 text-champagne transition-colors"
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rankings from API */}
          <div className="grid grid-cols-2 gap-6">
            {/* Jockey Rankings */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Medal size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">Jockey Rankings</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              <div className="glass-panel rounded-xl overflow-hidden relative">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />
                {rankingsLoading ? (
                  <LoadingSkeleton />
                ) : jockeyRankings.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl opacity-40 mb-3">🏇</div>
                    <div className="text-muted text-sm">No data available</div>
                  </div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {jockeyRankings.slice(0, 10).map((j, i) => {
                      const jid = j.jockeyId ?? j.id ?? i;
                      const isExpanded = expandedJockey === jid;
                      return (
                        <div key={jid}>
                          <button
                            onClick={() => setExpandedJockey(isExpanded ? null : jid)}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gold/5 text-left ${i === 0 ? 'bg-gold/5' : i < 3 ? 'bg-white/[0.03]' : ''}`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border shrink-0 ${POS_STYLE[i + 1] ?? 'bg-white/5 text-muted border-glass-border'}`}>{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white">{j.fullName ?? `Jockey #${j.jockeyId}`}</div>
                              <div className="text-xs text-muted">{j.experienceYears ?? 0} years of experience</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 text-gold text-xs font-bold">
                                <Star size={11} /> {j.rankingPoint ?? 0}
                              </div>
                              {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }} className="overflow-hidden"
                              >
                                <div className="px-5 py-3 bg-white/[0.02] border-t border-glass-border grid grid-cols-2 gap-2 text-xs text-muted">
                                  <span>Email: <span className="text-champagne">{j.email ?? '—'}</span></span>
                                  <span>Ranking Points: <span className="text-gold font-bold">{j.rankingPoint ?? 0}</span></span>
                                  <span>Experience: <span className="text-white">{j.experienceYears ?? 0} years</span></span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Horse Rankings */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Trophy size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">Horse Rankings</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              <div className="glass-panel rounded-xl overflow-hidden relative">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />
                {rankingsLoading ? (
                  <LoadingSkeleton />
                ) : horseRankings.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl opacity-40 mb-3">🐎</div>
                    <div className="text-muted text-sm">No data available</div>
                  </div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {horseRankings.slice(0, 10).map((h, i) => {
                      const hid = h.horseId ?? h.id ?? i;
                      const isExpanded = expandedHorse === hid;
                      return (
                        <div key={hid}>
                          <button
                            onClick={() => setExpandedHorse(isExpanded ? null : hid)}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gold/5 text-left ${i === 0 ? 'bg-gold/5' : i < 3 ? 'bg-white/[0.03]' : ''}`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border shrink-0 ${POS_STYLE[i + 1] ?? 'bg-white/5 text-muted border-glass-border'}`}>{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white">{h.name ?? `Horse #${h.horseId}`}</div>
                              <div className="text-xs text-muted">{h.winsCount ?? 0} wins</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 text-gold text-xs font-bold">
                                <Trophy size={11} /> {h.winsCount ?? 0}
                              </div>
                              {isExpanded ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }} className="overflow-hidden"
                              >
                                <div className="px-5 py-3 bg-white/[0.02] border-t border-glass-border grid grid-cols-2 gap-2 text-xs text-muted">
                                  <span>Breed: <span className="text-champagne">{h.breed ?? '—'}</span></span>
                                  <span>Owner: <span className="text-white">{h.ownerName ?? '—'}</span></span>
                                  <span>Age: <span className="text-white">{h.age ?? '—'}</span></span>
                                  <span>Total Wins: <span className="text-gold font-bold">{h.winsCount ?? 0}</span></span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results section */}
          <div>
            <div className="flex items-center gap-3 mb-4 mt-8">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Trophy size={15} className="text-gold" /></div>
              <h2 className="text-lg font-serif text-white">Confirmed Results</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            
            {scheduleLoading ? (
              <LoadingSkeleton />
            ) : (() => {
              const publishedRaces = schedule.filter(r => r.status === 'Published' || r.status === 'Finished');
              if (publishedRaces.length === 0) return (
                <div className="glass-panel rounded-xl p-8 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🏆</div>
                  <div className="text-muted text-sm">No results published yet</div>
                </div>
              );
              return (
                <div className="space-y-4">
                  {publishedRaces.map((race: any) => (
                    <div key={race.raceId || race.id} className="glass-panel p-5 rounded-xl border border-glass-border">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-white">{race.raceName || race.name}</div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          Published
                        </span>
                      </div>
                      <div className="text-xs text-muted mb-4">{race.tournamentName} • {new Date(race.raceDate || race.startTime).toLocaleDateString('vi-VN')}</div>
                      
                      {/* For a fully robust view we would call getRaceResults(race.raceId) but we can just display the overview for now */}
                      <div className="text-sm px-4 py-3 bg-white/[0.02] border border-glass-border rounded-lg text-white/80">
                        Detailed results can be viewed on the race details page.
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

        </main>
      </div>
    </div>
  );
}
