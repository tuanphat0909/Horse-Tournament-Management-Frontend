import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Trophy, Clock, Calendar, Medal, Star } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceSchedule, getJockeyRankings, getHorseRankings, getRaceResultsPublic, getLiveRaces } from '../../api/publicService';

const POS_STYLE: Record<number, string> = {
  1: 'bg-gold/20 text-gold border-gold/30',
  2: 'bg-white/10 text-white border-white/20',
  3: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
};

export function SpectatorLiveResultsPage() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [jockeyRankings, setJockeyRankings] = useState<any[]>([]);
  const [horseRankings, setHorseRankings] = useState<any[]>([]);
  const [liveRaces, setLiveRaces] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(true);

  // Kết quả đã xác nhận (GET /public/races/{id}/results)
  const [resultRaceId, setResultRaceId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsLoaded, setResultsLoaded] = useState(false);

  function loadResults(raceId: string) {
    setResultRaceId(raceId);
    setResults([]); setResultsLoaded(false);
    if (!raceId) return;
    setResultsLoading(true);
    getRaceResultsPublic(Number(raceId))
      .then(d => setResults(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setResults([]))
      .finally(() => { setResultsLoading(false); setResultsLoaded(true); });
  }

  useEffect(() => {
    getLiveRaces()
      .then(d => setLiveRaces(d?.result ?? (Array.isArray(d) ? d : [])))
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
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Kết quả & Lịch đua"
            subtitle="Theo dõi cuộc đua và lịch thi đấu sắp tới"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl border border-red-500/20 overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="p-5 border-b border-glass-border flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> TRỰC TIẾP
                </span>
                {!liveLoading && liveRaces.length > 0 && (
                  <span className="text-xs text-muted">{liveRaces.length} cuộc đua đang diễn ra</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock size={12} /> Cập nhật liên tục
              </div>
            </div>
            <div className="p-6">
              {liveLoading ? (
                <div className="text-center py-10 text-muted text-sm">Đang tải...</div>
              ) : liveRaces.length === 0 ? (
                <div className="rounded-xl p-10 text-center bg-white/2 border border-glass-border">
                  <div className="text-4xl opacity-40 mb-3">🏁</div>
                  <div className="text-muted text-sm">Không có cuộc đua nào đang diễn ra</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {liveRaces.map((race: any, i: number) => {
                    const rid = race.raceId ?? race.id;
                    return (
                      <div key={rid ?? i} className="flex items-center gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:border-red-500/35 transition-all group">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <Activity size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-serif font-bold text-white group-hover:text-champagne transition-colors truncate">{race.name ?? `Cuộc đua #${rid}`}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-0.5">
                            {race.raceDate && <span className="flex items-center gap-1"><Clock size={10} /> {race.raceDate}</span>}
                            {race.distanceMeter && <span>{race.distanceMeter}m</span>}
                            {race.tournamentName && <span className="text-gold/60">{race.tournamentName}</span>}
                          </div>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border text-red-400 bg-red-500/10 border-red-500/25 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Live
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Race Schedule from API */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Calendar size={15} className="text-gold" /></div>
              <h2 className="text-lg font-serif text-white">Lịch thi đấu sắp tới</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            {scheduleLoading ? (
              <div className="text-center py-8 text-muted text-sm">Đang tải...</div>
            ) : schedule.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">📅</div>
                <div className="text-muted text-sm">Chưa có lịch thi đấu</div>
                <div className="mx-auto mt-4 w-24 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map((race, i) => (
                  <motion.div key={race.id ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/30 hover:bg-gold/4 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Activity size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-serif font-bold text-white">{race.name ?? `Cuộc đua #${race.id}`}</div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-0.5">
                          {race.raceDate && <span className="flex items-center gap-1"><Clock size={10} /> {race.raceDate}</span>}
                          {race.distanceMeter && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-champagne">{race.distanceMeter}m</span>}
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
                <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              <div className="glass-panel rounded-xl overflow-hidden relative">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
                {rankingsLoading ? (
                  <div className="p-8 text-center text-muted text-sm">Đang tải...</div>
                ) : jockeyRankings.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl opacity-40 mb-3">🏇</div>
                    <div className="text-muted text-sm">Chưa có dữ liệu</div>
                  </div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {jockeyRankings.slice(0, 10).map((j, i) => (
                      <div key={j.jockeyId ?? i} className={`flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gold/4 group ${i === 0 ? 'bg-gold/4' : i < 3 ? 'bg-white/3' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border shrink-0 ${POS_STYLE[i + 1] ?? 'bg-white/5 text-muted border-glass-border'}`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{j.fullName ?? `Jockey #${j.jockeyId}`}</div>
                          {j.experienceYears != null && <div className="text-xs text-muted">{j.experienceYears} năm KN</div>}
                        </div>
                        {j.rankingPoint != null && (
                          <div className="flex items-center gap-1 text-gold text-xs font-bold shrink-0">
                            <Star size={11} /> {j.rankingPoint} điểm
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
                <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              <div className="glass-panel rounded-xl overflow-hidden relative">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
                {rankingsLoading ? (
                  <div className="p-8 text-center text-muted text-sm">Đang tải...</div>
                ) : horseRankings.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl opacity-40 mb-3">🐎</div>
                    <div className="text-muted text-sm">Chưa có dữ liệu</div>
                  </div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {horseRankings.slice(0, 10).map((h, i) => (
                      <div key={h.horseId ?? i} className={`flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-gold/4 group ${i === 0 ? 'bg-gold/4' : i < 3 ? 'bg-white/3' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border shrink-0 ${POS_STYLE[i + 1] ?? 'bg-white/5 text-muted border-glass-border'}`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{h.name ?? `Ngựa #${h.horseId}`}</div>
                          {h.winsCount != null && <div className="text-xs text-muted">{h.winsCount} thắng</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Trophy size={15} className="text-gold" /></div>
              <h2 className="text-lg font-serif text-white">Kết quả đã xác nhận</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="relative z-10 mb-4 max-w-md">
                <label className="block text-xs text-muted font-medium mb-1.5">Chọn cuộc đua để xem kết quả</label>
                <select value={resultRaceId} onChange={e => loadResults(e.target.value)}
                  className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40 transition-colors" style={{ colorScheme: 'dark' }}>
                  <option value="">-- Chọn cuộc đua --</option>
                  {schedule.map((r, i) => {
                    const rid = r.raceId ?? r.id;
                    return <option key={rid ?? i} value={rid}>{`${r.name ?? ('Cuộc đua #' + rid)}${r.raceDate ? ' — ' + r.raceDate : ''}`}</option>;
                  })}
                </select>
              </div>
              {resultsLoading ? (
                <div className="relative z-10 text-center py-8 text-muted text-sm">Đang tải kết quả...</div>
              ) : !resultRaceId ? (
                <div className="relative z-10 text-center py-8 text-muted text-sm">Chọn một cuộc đua để xem kết quả đã xác nhận.</div>
              ) : results.length === 0 && resultsLoaded ? (
                <div className="relative z-10 text-center py-8">
                  <div className="text-4xl opacity-40 mb-3">🏆</div>
                  <div className="text-muted text-sm">Cuộc đua này chưa có kết quả công bố.</div>
                </div>
              ) : (
                <div className="relative z-10 space-y-2">
                  {results.map((r, i) => (
                    <div key={r.id ?? r.raceEntryId ?? i} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/2 border border-glass-border">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm border shrink-0 ${POS_STYLE[i + 1] ?? 'bg-white/5 text-muted border-glass-border'}`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">🐴 {r.horseName ?? `Ngựa #${r.horseId}`}</div>
                        <div className="text-xs text-muted">{r.jockeyName ? `Nài: ${r.jockeyName}` : ''}{r.raceName ? ` • ${r.raceName}` : ''}</div>
                      </div>
                      {r.winner && (r.winner === r.horseName || r.winner === String(r.horseId)) && (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border text-gold bg-gold/10 border-gold/25 shrink-0">🏆 Vô địch</span>
                      )}
                      {r.status && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border text-blue-400 bg-blue-500/10 border-blue-500/20 shrink-0">{r.status}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
