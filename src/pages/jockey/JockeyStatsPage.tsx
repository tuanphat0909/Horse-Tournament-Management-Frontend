import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flag, Award, Star, BarChart3, History } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getJockeyStats } from '../../api/jockeyService';
import { parseApiError } from '../../api/authService';

// GET /jockeys/stats → { totalRaces, wins, top3, totalPoints, rankingPoint }
const show = (v: any) => (v == null ? '—' : String(v));

export function JockeyStatsPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJockeyStats()
      .then((res: any) => {
        const s = res?.result ?? res ?? {};
        setStats(s);
      })
      .catch((err: Error) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const s = stats ?? {};
  const winRate = s.totalRaces > 0 ? Math.round(s.wins / s.totalRaces * 100) + '%' : '—';
  const tiles = [
    { label: 'Số lần thắng', value: show(s.wins), icon: Trophy, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20' },
    { label: 'Tổng cuộc đua', value: show(s.totalRaces), icon: Flag, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20' },
    { label: 'Tỉ lệ thắng', value: winRate, icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
    { label: 'Top 3', value: show(s.top3), icon: Award, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20' },
  ];

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Thành tích"
            subtitle="Thống kê và hiệu suất thi đấu"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/6 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {loading && (
            <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải...</div>
          )}

          {/* Overview stats — fields read defensively (DTO shape unspecified) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tiles.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden hover:border-gold/30 transition-all group">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-linear-to-br ${s.bg} blur-[30px] opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.bg} border border-white/8 flex items-center justify-center ${s.color} mb-3 relative z-10`}>
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
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-blue-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><BarChart3 size={15} className="text-gold" /></div>
                <h2 className="text-base font-serif text-white">Phân bố kết quả</h2>
                <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">📊</div>
                <div className="text-muted text-sm">Chưa có dữ liệu</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-blue-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="relative z-10 w-14 h-14 rounded-full bg-gold/10 border border-gold/25 ring-1 ring-gold/20 flex items-center justify-center mb-3"><Star size={28} className="text-gold" /></div>
              <div className="text-4xl font-serif font-bold text-white mb-1">{show(s.rankingPoint)}</div>
              <div className="text-sm text-muted mb-4">Điểm xếp hạng</div>
              <div className="w-full p-3 rounded-xl bg-gold/5 border border-gold/20">
                <div className="text-xs text-muted mb-1">Điểm tích lũy</div>
                <div className="text-2xl font-bold text-gold">{show(s.totalPoints)}</div>
              </div>
            </motion.div>
          </div>

          {/* Race history */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-blue-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="p-5 border-b border-glass-border relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><History size={15} className="text-gold" /></div>
              <h2 className="text-base font-serif text-white">Lịch sử thi đấu</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            <div className="p-6">
              <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">📊</div>
                <div className="text-muted text-sm">Chưa có dữ liệu</div>
              </div>
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
