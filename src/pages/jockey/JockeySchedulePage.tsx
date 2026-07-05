import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trophy, ChevronRight } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceSchedule } from '../../api/publicService';
import { parseApiError } from '../../api/authService';

const STATUS_CONFIG = {
  upcoming: { label: 'Đã nhận', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  pending:  { label: 'Chờ xác nhận', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
};

export function JockeySchedulePage() {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRaceSchedule();
        setRaces(data?.result ?? (Array.isArray(data) ? data : []));
      } catch (err: unknown) {
        setError(parseApiError(err as Error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive day groups from the fetched data, grouped by race date.
  const DAY_GROUPS = Array.from(new Set(races.map(r => r.raceDate)));

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Lịch thi đấu"
            subtitle="Lịch đua sắp tới của bạn"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : error ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          ) : races.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">📅</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-8">
              {DAY_GROUPS.map(date => {
                const dayRaces = races.filter(r => r.raceDate === date);
                return (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20">
                        <Calendar size={13} className="text-gold" />
                        <span className="text-sm font-bold text-gold">{date}</span>
                      </div>
                      <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-muted shrink-0">{dayRaces.length} lượt đua</span>
                    </div>

                    <div className="space-y-3">
                      {dayRaces.map((r, i) => {
                        const cfg = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG];
                        return (
                          <motion.div key={r.id ?? i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                            className="glass-panel rounded-xl border border-glass-border hover:border-gold/30 hover:bg-gold/2 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-blue-500/10 to-transparent blur-2xl pointer-events-none" />
                            <div className="flex items-stretch relative z-10">
                              <div className="flex-1 p-5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-gold/15 to-transparent border border-gold/20 ring-1 ring-gold/20 flex items-center justify-center text-2xl shrink-0">🏇</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-base font-serif font-bold text-white group-hover:text-champagne transition-colors">{r.name}</span>
                                    {cfg && <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted">
                                    {r.tournamentName && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/4 border border-glass-border"><Trophy size={10} className="text-gold/60" /> {r.tournamentName}</span>}
                                    {r.raceDate && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/4 border border-glass-border"><Calendar size={10} className="text-gold/60" /> {r.raceDate}</span>}
                                    {r.distanceMeter != null && <span className="text-champagne font-semibold px-2 py-0.5 rounded-full bg-gold/6 border border-gold/20">{r.distanceMeter}m</span>}
                                  </div>
                                </div>
                                <button className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors shrink-0 font-medium">
                                  Xem chi tiết <ChevronRight size={13} />
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
    </div>
  );
}
