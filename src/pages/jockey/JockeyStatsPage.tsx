import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flag, Award, Star, BarChart3, History } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getJockeyStats } from '../../api/jockeyService';

function fmtDate(s?: string) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
}

export function JockeyStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJockeyStats()
      .then((d: any) => setStats(d?.result ?? d ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const wins    = loading ? '…' : (stats?.winCount ?? stats?.wins ?? '—');
  const total   = loading ? '…' : (stats?.totalRaces ?? stats?.total ?? '—');
  const winRate = loading ? '…' : (stats?.winRate != null ? (stats.winRate * 100).toFixed(1) + '%' : stats?.winRatePercent != null ? stats.winRatePercent + '%' : '—');
  const top3    = loading ? '…' : (stats?.top3Count ?? stats?.top3 ?? '—');
  const rank    = loading ? '…' : (stats?.rank ?? stats?.ranking ?? '—');
  const points  = loading ? '…' : (stats?.points ?? '—');
  const history: any[] = stats?.raceHistory ?? stats?.races ?? [];

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Thành tích"
            subtitle="Thống kê và hiệu suất thi đấu"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {/* Overview stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Số lần thắng', value: wins,    icon: Trophy,    color: 'text-gold',       bg: 'from-gold/15 to-amber-900/20' },
              { label: 'Tổng cuộc đua', value: total,  icon: Flag,      color: 'text-blue-400',   bg: 'from-blue-500/15 to-blue-900/20' },
              { label: 'Tỉ lệ thắng',  value: winRate, icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
              { label: 'Top 3',         value: top3,    icon: Award,     color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20' },
            ].map((s, i) => (
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
          <div className="grid grid-cols-[1fr_280px] gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><BarChart3 size={15} className="text-gold" /></div>
                <h2 className="text-base font-serif text-white">Phân bố kết quả</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              {loading || !stats ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">{loading ? '⏳' : '📊'}</div>
                  <div className="text-muted text-sm">{loading ? 'Đang tải...' : 'Chưa có dữ liệu'}</div>
                </div>
              ) : (
                <div className="space-y-3 relative z-10">
                  {[
                    { label: 'Thắng', count: stats.winCount ?? stats.wins ?? 0,   cls: 'bg-gold' },
                    { label: 'Top 3', count: stats.top3Count ?? stats.top3 ?? 0,   cls: 'bg-blue-400' },
                    { label: 'Tổng',  count: stats.totalRaces ?? stats.total ?? 0, cls: 'bg-white/20' },
                  ].map((b, i) => {
                    const max = Math.max(stats.totalRaces ?? stats.total ?? 1, 1);
                    const pct = Math.min(100, Math.round((b.count / max) * 100));
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-muted">{b.label}</span>
                          <span className="text-champagne font-bold">{b.count}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                          <div className={`h-full rounded-full ${b.cls} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 w-14 h-14 rounded-full bg-gold/10 border border-gold/25 ring-1 ring-gold/20 flex items-center justify-center mb-3"><Star size={28} className="text-gold" /></div>
              <div className="text-4xl font-serif font-bold text-white mb-1">{rank}</div>
              <div className="text-sm text-muted mb-4">Hạng cá nhân mùa giải</div>
              <div className="w-full p-3 rounded-xl bg-gold/5 border border-gold/20">
                <div className="text-xs text-muted mb-1">Điểm tích lũy</div>
                <div className="text-2xl font-bold text-gold">{points}</div>
              </div>
            </motion.div>
          </div>

          {/* Race history */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="p-5 border-b border-glass-border relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><History size={15} className="text-gold" /></div>
              <h2 className="text-base font-serif text-white">Lịch sử thi đấu</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            <div className="relative z-10">
              {loading ? (
                <div className="p-12 text-center text-muted text-sm">Đang tải...</div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl opacity-40 mb-3">📊</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              ) : (
                <div className="divide-y divide-glass-border">
                  {history.map((r: any, i: number) => {
                    const pos = r.finishPosition ?? r.position;
                    const posCls = pos === 1 ? 'text-gold' : pos === 2 ? 'text-slate-300' : pos === 3 ? 'text-amber-600' : 'text-muted';
                    return (
                      <div key={r.raceId ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                        <div className={`w-8 h-8 rounded-full bg-white/[0.04] border border-glass-border flex items-center justify-center text-sm font-bold shrink-0 ${posCls}`}>
                          {pos ?? '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">{r.raceName ?? r.race?.name ?? `Cuộc đua #${r.raceId ?? i}`}</div>
                          <div className="text-xs text-muted truncate">{r.horseName ?? r.horse?.name ?? '—'}{r.tournamentName ? ` • ${r.tournamentName}` : ''}</div>
                        </div>
                        {r.prize != null && <span className="text-xs text-gold font-bold shrink-0">+{Number(r.prize).toLocaleString()}</span>}
                        <span className="text-xs text-muted shrink-0 hidden md:block">{fmtDate(r.raceDate)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
