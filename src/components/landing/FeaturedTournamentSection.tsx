import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Layers, Trophy } from 'lucide-react';
import { getTournaments } from '../../api/publicService';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Tournaments nổi bật — dữ liệu THẬT từ GET /public/tournaments.
 * Ưu tiên giải live now (Active); không có thì lấy giải sắp diễn ra gần nhất;
 * API lỗi/không có giải → ẩn cả section (không show data bịa).
 */

function fmtDate(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(v: any): number | null {
  if (!v) return null;
  const diff = new Date(v).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
}

export const FeaturedTournamentSection = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tournament, setTournament] = useState<any | null>(null);

  useEffect(() => {
    getTournaments()
      .then((d: any) => {
        const list: any[] = d?.result ?? [];
        if (list.length === 0) return;
        const active = list.filter(x => (x.status ?? '').toLowerCase() === 'active');
        const upcoming = list
          .filter(x => (x.status ?? '').toLowerCase() === 'upcoming')
          .sort((a, b) => new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime());
        setTournament(active[0] ?? upcoming[0] ?? list[list.length - 1]);
      })
      .catch(() => setTournament(null));
  }, []);

  if (!tournament) return null; // không có dữ liệu thật → không dựng chuyện

  const isLive = (tournament.status ?? '').toLowerCase() === 'active';
  const rounds = tournament.rounds?.length ?? tournament.numberOfRounds ?? null;
  const regDays = daysLeft(tournament.registrationEndDate);
  const regClosed = regDays === 0 && tournament.registrationEndDate != null;

  // Tiến độ cửa sổ đăng ký: % thời gian đã trôi qua (dữ liệu thật, tính được)
  let regProgress: number | null = null;
  if (tournament.registrationStartDate && tournament.registrationEndDate) {
    const s = new Date(tournament.registrationStartDate).getTime();
    const e = new Date(tournament.registrationEndDate).getTime();
    if (e > s) regProgress = Math.min(100, Math.max(0, Math.round(((Date.now() - s) / (e - s)) * 100)));
  }

  return (
    <section id="tournaments" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden glass-panel-elevated p-1"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gold via-champagne to-gold opacity-20 blur-sm" />

          <div className="relative bg-navy rounded-[22px] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-navy to-navy" />

            <div className="relative p-10 md:p-16 flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                {isLive ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t('Active')}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-blue-400" /> {t('Upcoming')}
                  </div>
                )}

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight">
                  <span className="text-gradient-gold italic">{tournament.name}</span>
                </h2>

                <div className="flex flex-wrap gap-6 text-sm text-muted">
                  {fmtDate(tournament.startDate) && (
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gold" /> {fmtDate(tournament.startDate)} → {fmtDate(tournament.endDate) ?? '—'}</div>
                  )}
                  {rounds != null && (
                    <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-gold" /> {rounds} {t('rounds')}</div>
                  )}
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gold" /> Tournament ID #{tournament.tournamentId ?? tournament.id}</div>
                </div>

                {tournament.description && (
                  <p className="text-body leading-relaxed max-w-lg">{tournament.description}</p>
                )}
              </div>

              <div className="w-full lg:w-[400px] glass-panel p-8 rounded-2xl relative shadow-2xl">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-gold/20 blur-3xl rounded-full pointer-events-none" />
                <h3 className="text-lg font-serif text-white mb-6">{t('Registration window')}</h3>

                {regProgress != null && (
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted font-medium">{regClosed ? t('Registration closed') : t('Registration time elapsed')}</span>
                      <span className="font-bold text-white tabular">{regProgress}%</span>
                    </div>
                    <div className="h-2.5 bg-navy-light rounded-full overflow-hidden shadow-inner border border-glass-border">
                      <motion.div
                        className={`h-full relative ${regClosed ? 'bg-red-400/70' : 'bg-gold'}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${regProgress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-navy/60 p-4 rounded-xl border border-glass-border text-center hover:border-gold/30 transition-colors">
                    <div className="text-3xl font-serif text-champagne mb-1 tabular">{regDays != null ? regDays : '—'}</div>
                    <div className="text-[10px] uppercase text-muted tracking-wider font-bold">{t('Days left to register')}</div>
                  </div>
                  <div className="bg-navy/60 p-4 rounded-xl border border-glass-border text-center hover:border-gold/30 transition-colors">
                    <div className="text-3xl font-serif text-champagne mb-1 tabular">{rounds ?? '—'}</div>
                    <div className="text-[10px] uppercase text-muted tracking-wider font-bold">{t('Rounds')}</div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className="btn-gold w-full py-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(201,168,76,0.2)] group">
                  {regClosed ? t('View tournament') : t('Join now')}
                  <span className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
