import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Trophy, Clock, ChevronDown, Calendar, Medal, Star } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { getRaceSchedule, getJockeyRankings, getHorseRankings } from '../../api/publicService';

// TODO: backend chưa có API cho live race standings
const LIVE_RACE = {
  name: 'Vòng 3 - Chặng Sức Bền (Nhóm 2)', tournament: 'Giải Xuân 2026', distance: '2.000m',
  standings: [
    { pos: 1, horse: 'Silver Arrow', jockey: 'Nguyễn Mạnh Cường', time: '1:23.8', gap: '—', color: 'bg-gold' },
    { pos: 2, horse: 'Night Runner', jockey: 'Trần Văn Hòa', time: '1:24.3', gap: '+0.5s', color: 'bg-white/40' },
    { pos: 3, horse: 'Shadow Dancer', jockey: 'Bùi Minh Tâm', time: '1:25.1', gap: '+1.3s', color: 'bg-orange-400' },
    { pos: 4, horse: 'Crimson Flame', jockey: 'Lê Hoàng Nam', time: '1:25.7', gap: '+1.9s', color: 'bg-white/10' },
    { pos: 5, horse: 'Blue Thunder', jockey: 'Phạm Bá Dũng', time: '1:26.0', gap: '+2.2s', color: 'bg-white/10' },
  ],
};

const POS_STYLE: Record<number, string> = {
  1: 'bg-gold/20 text-gold border-gold/30',
  2: 'bg-white/10 text-white border-white/20',
  3: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
};

export function SpectatorLiveResultsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const [schedule, setSchedule] = useState<any[]>([]);
  const [jockeyRankings, setJockeyRankings] = useState<any[]>([]);
  const [horseRankings, setHorseRankings] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(true);

  useEffect(() => {
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
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Kết quả & Lịch đua"
            subtitle="Theo dõi cuộc đua và lịch thi đấu sắp tới"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />

          {/* TODO: backend chưa có API cho live race — dữ liệu tạm thời */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl border border-red-500/20 overflow-hidden">
            <div className="p-5 border-b border-glass-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> TRỰC TIẾP
                </span>
                <div>
                  <div className="text-base font-serif font-bold text-white">{LIVE_RACE.name}</div>
                  <div className="text-xs text-muted">{LIVE_RACE.tournament} • {LIVE_RACE.distance}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Clock size={12} /> Cập nhật liên tục
              </div>
            </div>
            <div className="p-6 space-y-2.5">
              {LIVE_RACE.standings.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${s.pos === 1 ? 'bg-gold text-navy font-black' : s.pos === 2 ? 'bg-white/20 text-white' : s.pos === 3 ? 'bg-orange-500/30 text-orange-400' : 'bg-white/5 text-muted'}`}>
                    {s.pos}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{s.horse}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted">{s.jockey}</span>
                        <span className="font-mono text-champagne font-bold">{s.time}</span>
                        <span className="text-muted w-10 text-right">{s.gap}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div className={`h-full rounded-full ${s.color}`}
                        initial={{ width: 0 }} animate={{ width: `${100 - (i * 8)}%` }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 0.5 }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Race Schedule from API */}
          <div>
            <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-gold" /> Lịch thi đấu sắp tới
            </h2>
            {scheduleLoading ? (
              <div className="text-center py-8 text-muted text-sm">Đang tải...</div>
            ) : schedule.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center text-muted text-sm">Chưa có lịch thi đấu</div>
            ) : (
              <div className="space-y-3">
                {schedule.map((race, i) => (
                  <motion.div key={race.id ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Activity size={16} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-serif font-bold text-white">{race.name ?? `Cuộc đua #${race.id}`}</div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted mt-0.5">
                          {race.raceDate && <span className="flex items-center gap-1"><Clock size={10} /> {race.raceDate}</span>}
                          {race.distanceMeter && <span>{race.distanceMeter}m</span>}
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
              <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
                <Medal size={18} className="text-gold" /> Xếp hạng Nài ngựa
              </h2>
              <div className="glass-panel rounded-xl overflow-hidden">
                {rankingsLoading ? (
                  <div className="p-8 text-center text-muted text-sm">Đang tải...</div>
                ) : jockeyRankings.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">Chưa có dữ liệu</div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {jockeyRankings.slice(0, 10).map((j, i) => (
                      <div key={j.id ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
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
              <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-gold" /> Xếp hạng Ngựa
              </h2>
              <div className="glass-panel rounded-xl overflow-hidden">
                {rankingsLoading ? (
                  <div className="p-8 text-center text-muted text-sm">Đang tải...</div>
                ) : horseRankings.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">Chưa có dữ liệu</div>
                ) : (
                  <div className="divide-y divide-glass-border">
                    {horseRankings.slice(0, 10).map((h, i) => (
                      <div key={h.id ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
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

          {/* TODO: backend chưa có API cho kết quả đã xác nhận (completed races) */}
          <div>
            <h2 className="text-lg font-serif text-white mb-4 flex items-center gap-2">
              <Trophy size={18} className="text-gold" /> Kết quả đã xác nhận
            </h2>
            <div className="glass-panel rounded-xl p-8 text-center text-muted text-sm">
              Dữ liệu kết quả cuộc đua sẽ được hiển thị khi backend cung cấp API.
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
