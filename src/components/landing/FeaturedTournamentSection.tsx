import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Trophy } from 'lucide-react';
import { getTournaments } from '../../api/publicService';

function daysLeft(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  return days > 0 ? days : 0;
}

function fmtDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const FeaturedTournamentSection = () => {
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    getTournaments()
      .then((d: any) => {
        const list: any[] = d?.result ?? (Array.isArray(d) ? d : []);
        // Ưu tiên giải đang active, nếu không có thì lấy giải đầu tiên
        const active = list.find(t => (t.status ?? '').toLowerCase() === 'active' || (t.status ?? '').toLowerCase() === 'ongoing');
        setTournament(active ?? list[0] ?? null);
      })
      .catch(() => {/* giữ null, fallback UI */});
  }, []);

  const name = tournament?.name ?? 'Giải đấu đang cập nhật';
  const startDate = fmtDate(tournament?.startDate);
  const endDate = fmtDate(tournament?.endDate);
  const rounds = tournament?.numberOfRounds ?? '—';
  const remaining = tournament?.endDate ? daysLeft(tournament.endDate) : null;
  const isActive = tournament && ((tournament.status ?? '').toLowerCase() === 'active' || (tournament.status ?? '').toLowerCase() === 'ongoing');

  return (
    <section id="tournaments" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden glass-panel-elevated p-1"
        >
          {/* Animated Border Gradient */}
          <div className="absolute inset-0 bg-linear-to-r from-gold via-champagne to-gold opacity-30 blur-sm animate-pulse" />

          <div className="relative bg-navy rounded-[22px] overflow-hidden">
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-gold/10 via-navy to-navy" />

            <div className="relative p-10 md:p-16 flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                {isActive && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Event
                  </div>
                )}

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight">
                  <span className="text-gradient-gold italic">{name}</span>
                </h2>

                <div className="flex flex-wrap gap-6 text-sm text-muted">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gold" /> {startDate} – {endDate}</div>
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gold" /> {rounds} vòng đấu</div>
                </div>

                <p className="text-body leading-relaxed max-w-lg">
                  Giải đấu đua ngựa hàng đầu mùa giải. Đăng ký ngay để không bỏ lỡ sự kiện thể thao đỉnh cao, được quản lý toàn diện trên nền tảng Equestria.
                </p>
              </div>

              <div className="w-full lg:w-100 glass-panel p-8 rounded-2xl relative shadow-2xl">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-gold/20 blur-3xl rounded-full pointer-events-none" />
                <h3 className="text-lg font-serif text-white mb-6">Thông tin giải đấu</h3>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-navy/60 p-4 rounded-xl border border-glass-border text-center hover:border-gold/30 transition-colors">
                      <div className="text-3xl font-serif text-champagne mb-1">
                        {remaining != null ? String(remaining) : '—'}
                      </div>
                      <div className="text-[10px] uppercase text-muted tracking-wider font-bold">Ngày còn lại</div>
                   </div>
                   <div className="bg-navy/60 p-4 rounded-xl border border-glass-border text-center hover:border-gold/30 transition-colors">
                      <div className="text-3xl font-serif text-champagne mb-1">{rounds}</div>
                      <div className="text-[10px] uppercase text-muted tracking-wider font-bold">Vòng đua</div>
                   </div>
                </div>

                <button className="btn-gold w-full py-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                  Tham gia giải đấu <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
