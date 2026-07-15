import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { getTournaments, getRaceSchedule, getJockeyRankings, getHorseRankings } from '../../api/publicService';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Số liệu THẬT từ hệ thống (API public) thay cho số bịa.
 * Nếu API lỗi / BE chưa chạy → hiện "—" thay vì số giả.
 */

function CountUp({ value }: { value: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || value == null) return;
    if (value <= 0) { setDisplay(0); return; }
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-expo: dồn tốc độ về cuối cho cảm giác "nặng"
      const eased = 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref} className="tabular">{value == null ? '—' : display.toLocaleString('vi-VN')}</span>;
}

export const StatsSection = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<{ horses: number | null; tournaments: number | null; races: number | null; jockeys: number | null }>({
    horses: null, tournaments: null, races: null, jockeys: null,
  });
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    Promise.allSettled([getHorseRankings(), getTournaments(), getRaceSchedule(), getJockeyRankings()])
      .then(([horses, tournaments, races, jockeys]) => {
        const len = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled' ? ((r.value as any)?.result ?? []).length : null;
        setStats({ horses: len(horses), tournaments: len(tournaments), races: len(races), jockeys: len(jockeys) });
        if (tournaments.status === 'fulfilled') {
          const list = (tournaments.value as any)?.result ?? [];
          setLiveCount(list.filter((tour: any) => (tour.status ?? '').toLowerCase() === 'active').length);
        }
      });
  }, []);

  const items = [
    { value: stats.horses, label: t('Horses on leaderboard'), sub: undefined as string | undefined },
    { value: stats.tournaments, label: t('Tournaments'), sub: liveCount > 0 ? `${liveCount} ${t('live now')}` : undefined },
    { value: stats.races, label: t('Races in schedule'), sub: undefined },
    { value: stats.jockeys, label: t('Professional jockeys'), sub: undefined },
  ];

  return (
    <section className="py-32 relative noise-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gold/5 blur-xl group-hover:bg-gold/10 transition-colors duration-500 rounded-full" />
              {/* min-h cố định + badge phụ đặt absolute → 4 ô luôn CAO BẰNG NHAU
                  dù có hay không dòng "N đang diễn ra" */}
              <div className="glass-panel p-8 pb-10 text-center rounded-2xl relative z-10 min-h-[170px] flex flex-col items-center justify-center group-hover:border-gold/30 group-hover:-translate-y-2 transition-all duration-500">
                <div className="text-4xl md:text-5xl font-serif font-bold text-champagne mb-3 group-hover:text-glow transition-all">
                  <CountUp value={stat.value} />
                </div>
                <div className="text-xs font-medium text-muted uppercase tracking-widest">
                  {stat.label}
                </div>
                {stat.sub && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {stat.sub}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-[11px] text-muted/50 mt-6">{t('Live data from Equestria system')}</p>
      </div>
    </section>
  );
};
