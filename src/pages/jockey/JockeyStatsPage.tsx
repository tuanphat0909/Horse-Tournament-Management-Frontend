import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flag, Award, Star, BarChart3, History } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getJockeyStats, getAssignedHorses } from '../../api/jockeyService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
interface JockeyStats {
  totalRaces: number;
  wins: number;
  top3: number;
  totalPoints: number;
  rankingPoint: number;
}

export function JockeyStatsPage() {
  const [stats, setStats] = useState<JockeyStats | null>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getJockeyStats().then(res => {
        if (res && res.result) setStats(res.result);
      }),
      getAssignedHorses().then(res => {
        setRaces(res?.result ?? (Array.isArray(res) ? res : []));
      })
    ])
      .catch(err => {
        console.error(err);
        setError('Không thể tải thống kê thành tích nài ngựa');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalRaces = stats?.totalRaces ?? 0;
  const wins = stats?.wins ?? 0;
  const winRate = totalRaces > 0 ? ((wins / totalRaces) * 100).toFixed(1) : '0';
  const top3 = stats?.top3 ?? 0;
  const rankingPoint = stats?.rankingPoint ?? 0;

  const statsDisplay = [
    { label: 'Số lần thắng', value: loading ? '...' : wins, icon: Trophy, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20' },
    { label: 'Tổng cuộc đua', value: loading ? '...' : totalRaces, icon: Flag, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20' },
    { label: 'Tỉ lệ thắng', value: loading ? '...' : `${winRate}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
    { label: 'Top 3', value: loading ? '...' : top3, icon: Award, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20' },
  ];

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Thành tích"
            subtitle="Thống kê và hiệu suất thi đấu cá nhân"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsDisplay.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden hover:border-gold/30 transition-all group">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.bg} blur-[30px] opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} border border-white/[0.08] flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className="relative z-10 text-3xl font-serif font-bold text-white group-hover:text-champagne transition-colors">{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Win-rate visual + Ranking */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><BarChart3 size={15} className="text-gold" /></div>
                <h2 className="text-base font-serif text-white">Phân bố kết quả</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              
              {loading ? (
                <LoadingSkeleton />
              ) : totalRaces === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📊</div>
                  <div className="text-muted text-sm">Chưa tham gia cuộc đua nào</div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">Số lần Về Nhất (Hạng 1)</span>
                      <span className="text-gold font-bold">{wins} / {totalRaces}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-gold h-full rounded-full" style={{ width: `${winRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">Vị trí khác</span>
                      <span className="text-muted">{totalRaces - wins} / {totalRaces}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full rounded-full" style={{ width: `${100 - Number(winRate)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 w-14 h-14 rounded-full bg-gold/10 border border-gold/25 ring-1 ring-gold/20 flex items-center justify-center mb-3"><Star size={28} className="text-gold" /></div>
              <div className="text-4xl font-serif font-bold text-white mb-1">
                {loading ? '—' : rankingPoint > 0 ? `#${Math.max(1, 20 - Math.floor(rankingPoint / 10))}` : 'Chưa xếp hạng'}
              </div>
              <div className="text-sm text-muted mb-4">Hạng cá nhân tạm thời</div>
              <div className="w-full p-3 rounded-xl bg-gold/5 border border-gold/20">
                <div className="text-xs text-muted mb-1">Điểm tích lũy</div>
                <div className="text-2xl font-bold text-gold">{loading ? '—' : rankingPoint}</div>
              </div>
            </motion.div>
          </div>

          {/* Race history */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="p-5 border-b border-glass-border relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><History size={15} className="text-gold" /></div>
              <h2 className="text-base font-serif text-white">Lịch sử cuộc đua tham gia</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            <div className="p-6">
              {loading ? (
                <LoadingSkeleton />
              ) : totalRaces === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📊</div>
                  <div className="text-muted text-sm">Chưa có lịch sử thi đấu</div>
                </div>
              ) : (
                <div className="text-sm text-white space-y-4">
                  <div className="p-4 bg-white/[0.02] border border-glass-border rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gold">Đã tham gia {totalRaces} cuộc đua chính thức</div>
                      <div className="text-xs text-muted">Tỉ lệ về Nhất đạt {winRate}%</div>
                    </div>
                    <div className="font-mono text-sm text-gold">+{wins * 10} điểm thưởng</div>
                  </div>

                  {/* Danh sách các cuộc đua đã hoàn thành */}
                  <div className="space-y-2.5">
                    {races
                      .filter(r => {
                        const s = (r.status ?? '').toLowerCase();
                        return s === 'completed' || s === 'finished';
                      })
                      .map((r, idx) => (
                        <div key={r.raceEntryId ?? idx} className="p-4 rounded-xl bg-white/[0.01] border border-glass-border hover:border-gold/20 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{r.raceName}</div>
                            <div className="text-xs text-muted">{r.horseName} • {r.tournamentName} • Lane {r.laneNo}</div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              r.finishPosition === 1 ? 'bg-gold/20 text-gold border border-gold/30' :
                              r.finishPosition === 2 ? 'bg-slate-300/20 text-slate-300' :
                              r.finishPosition === 3 ? 'bg-amber-700/20 text-amber-600' :
                              'bg-white/5 text-muted'
                            }`}>
                              Hạng {r.finishPosition ?? '—'}
                            </div>
                            {r.finishTime && (
                              <div className="text-xs font-mono text-champagne mt-1">{r.finishTime}s</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
