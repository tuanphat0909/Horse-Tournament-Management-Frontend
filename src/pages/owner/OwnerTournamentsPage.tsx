import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getTournaments } from '../../api/publicService';
import { formatDateTime } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Đang diễn ra', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  upcoming: { label: 'Sắp diễn ra', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Đã kết thúc', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
};

export function OwnerTournamentsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTournaments()
      .then((d: any) => setTournaments(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch((err) => {
        console.error(err);
        setTournaments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = tournaments.filter(t => (t.name ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title={t("Giải đấu")}
            subtitle={t("Các giải đấu đang và sắp diễn ra")}
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 58%"
          />

          <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border focus-within:border-gold/40 rounded-lg px-3 py-2 w-64 transition-colors">
            <Search size={14} className="text-gold/60 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Tìm giải đấu...")} className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
          </div>

          {loading ? (
            <LoadingSkeleton rows={4} h="h-24" />
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">{t("Chưa có dữ liệu")}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((tour, i) => {
                const s = tour.status?.toLowerCase() ?? 'upcoming';
                const config = STATUS_CONFIG[s] ?? STATUS_CONFIG.upcoming;
                return (
                  <motion.div
                    key={tour.tournamentId ?? i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-gold/25 transition-all group relative overflow-hidden text-left"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {t(config.label)}
                      </span>
                    </div>
                    <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-1 line-clamp-1">{tour.name}</h3>
                    <p className="text-xs text-muted/80 line-clamp-2 min-h-[32px] mb-3">{tour.description || t("Chưa có mô tả chi tiết.")}</p>
                    <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-glass-border/40">
                      <div className="flex justify-between">
                        <span>{t("Mở đăng ký:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.registrationStartDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Đóng đăng ký:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.registrationEndDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Ngày bắt đầu:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Ngày kết thúc:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.endDate)}</span>
                      </div>
                      <div className="flex flex-col gap-1 pt-2.5 mt-2 border-t border-glass-border/30">
                        <span className="font-bold text-white text-[11px] uppercase tracking-wider">{t("Giải thưởng:")}</span>
                        {tour.prizes && tour.prizes.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1.5 text-center mt-1">
                            {tour.prizes
                              .slice()
                              .sort((a: any, b: any) => a.rankPosition - b.rankPosition)
                              .map((p: any) => (
                                <div key={p.id} className="bg-white/[0.03] border border-glass-border/40 rounded px-1 py-1">
                                  <div className="text-[9px] text-muted font-semibold">Hạng {p.rankPosition}</div>
                                  <div className="text-gold font-bold text-[10px] whitespace-nowrap">{Number(p.amount).toLocaleString('vi-VN')} đ</div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span className="text-red-400 font-semibold italic text-[11px] mt-0.5">{t("Chưa cấu hình giải thưởng")}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
