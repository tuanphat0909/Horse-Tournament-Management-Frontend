import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Trophy, Clock, Calendar, Medal, Star } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceSchedule, getJockeyRankings, getHorseRankings, getLiveRaces } from '../../api/publicService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const POS_STYLE: Record<number, string> = {
  1: 'bg-gold/20 text-gold border-gold/30',
  2: 'bg-white/10 text-white border-white/20',
  3: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
};

export function SpectatorLiveResultsPage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [jockeyRankings, setJockeyRankings] = useState<any[]>([]);
  const [horseRankings, setHorseRankings] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(true);

  const [liveRaces, setLiveRaces] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    getLiveRaces()
      .then(d => setLiveRaces(d?.result ?? []))
      .catch(() => setLiveRaces([]))
      .finally(() => setLiveLoading(false));
    getRaceSchedule()
      .then(d => setSchedule(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setSchedule([]))
      .finally(() => setScheduleLoading(false));

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
            title="Kết quả & Lịch đua"
            subtitle="Theo dõi cuộc đua và lịch thi đấu sắp tới"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl border border-red-500/20 overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="p-5 border-b border-glass-border flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> TRỰC TIẾP
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock size={12} /> Cập nhật liên tục
              </div>
            </div>
            <div className="p-6">
              {liveLoading ? (
                <LoadingSkeleton />
              ) : liveRaces.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🏁</div>
                  <div className="text-muted text-sm">Chưa có trận nào đang diễn ra</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveRaces.map((lr, i) => (
                    <div key={lr.raceId || i} className="glass-panel p-5 rounded-xl border border-red-500/20 bg-red-500/5">
                      <div className="flex justify-between items-center">
                        <div className="font-bold text-white text-lg">{lr.raceName}</div>
                        <div className="text-xs text-red-400 font-bold uppercase tracking-wider px-2 py-1 bg-red-500/10 border border-red-500/20 rounded">
                          Đang chạy
                        </div>
                      </div>
                      <div className="text-sm text-muted mt-1">{lr.tournamentName || 'Giải đấu'} • Bắt đầu lúc: {new Date(lr.startTime).toLocaleTimeString('vi-VN')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Race Schedule from API */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Calendar size={15} className="text-gold" /></div>
              <h2 className="text-lg font-serif text-white">Lịch thi đấu sắp tới</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            {scheduleLoading ? (
              <LoadingSkeleton />
            ) : schedule.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">📅</div>
                <div className="text-muted text-sm">Chưa có lịch thi đấu</div>
                <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map((race, i) => (
                  <motion.div key={race.id ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Activity size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-serif font-bold text-white">{race.name ?? `Cuộc đua #${race.id}`}</div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-0.5">
                          {race.raceDate && <span className="flex items-center gap-1"><Clock size={10} /> {race.raceDate}</span>}
                          {race.distanceMeter && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-champagne">{race.distanceMeter}m</span>}
                          {race.tournamentName && <span className="text-gold/60">{race.tournamentName}</span>}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border text-blue-400 bg-blue-500/10 border-blue-500/20 shrink-0">Sắp diễn ra</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Rankings from API */}
          <div className="grid grid-cols-2 gap-6">
            {/* Jockey Rankings */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Medal size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">Xếp hạng Nài ngựa</h2>
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
                    <div className="text-muted text-sm">Chưa có dữ liệu</div>
                  </div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {jockeyRankings.slice(0, 10).map((j, i) => (
                      <div key={j.id ?? i} className={`flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gold/[0.04] group ${i === 0 ? 'bg-gold/[0.04]' : i < 3 ? 'bg-white/[0.03]' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border shrink-0 ${POS_STYLE[i + 1] ?? 'bg-white/5 text-muted border-glass-border'}`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{j.jockeyName ?? j.fullName ?? j.name ?? `Jockey #${j.id}`}</div>
                          {j.totalWins != null && <div className="text-xs text-muted">{j.totalWins} thắng</div>}
                        </div>
                        {j.score != null && (
                          <div className="flex items-center gap-1 text-gold text-xs font-bold shrink-0">
                            <Star size={11} /> {j.score}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Horse Rankings */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Trophy size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">Xếp hạng Ngựa</h2>
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
                    <div className="text-muted text-sm">Chưa có dữ liệu</div>
                  </div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {horseRankings.slice(0, 10).map((h, i) => (
                      <div key={h.id ?? i} className={`flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gold/[0.04] group ${i === 0 ? 'bg-gold/[0.04]' : i < 3 ? 'bg-white/[0.03]' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border shrink-0 ${POS_STYLE[i + 1] ?? 'bg-white/5 text-muted border-glass-border'}`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{h.horseName ?? h.name ?? `Ngựa #${h.id}`}</div>
                          {h.totalWins != null && <div className="text-xs text-muted">{h.totalWins} thắng</div>}
                        </div>
                        {h.score != null && (
                          <div className="flex items-center gap-1 text-gold text-xs font-bold shrink-0">
                            <Star size={11} /> {h.score}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results section */}
          <div>
            <div className="flex items-center gap-3 mb-4 mt-8">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Trophy size={15} className="text-gold" /></div>
              <h2 className="text-lg font-serif text-white">Kết quả đã xác nhận</h2>
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
                  <div className="text-muted text-sm">Chưa có kết quả nào được công bố</div>
                </div>
              );
              return (
                <div className="space-y-4">
                  {publishedRaces.map((race: any) => (
                    <div key={race.raceId || race.id} className="glass-panel p-5 rounded-xl border border-glass-border">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-white">{race.raceName || race.name}</div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                          Đã công bố
                        </span>
                      </div>
                      <div className="text-xs text-muted mb-4">{race.tournamentName} • {new Date(race.raceDate || race.startTime).toLocaleDateString('vi-VN')}</div>
                      
                      {/* For a fully robust view we would call getRaceResults(race.raceId) but we can just display the overview for now */}
                      <div className="text-sm px-4 py-3 bg-white/[0.02] border border-glass-border rounded-lg text-white/80">
                        Chi tiết kết quả có thể được xem tại trang chi tiết trận đua.
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
