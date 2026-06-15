import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, Calendar, Trophy, ShieldCheck, ChevronRight } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getContracts } from '../../api/jockeyService';
import { parseApiError } from '../../api/authService';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Chờ phản hồi', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  waiting:   { label: 'Chờ phản hồi', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  active:    { label: 'Đang hoạt động', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  accepted:  { label: 'Đã chấp nhận', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  rejected:  { label: 'Đã từ chối', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  declined:  { label: 'Đã từ chối', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  completed: { label: 'Đã kết thúc', color: 'text-muted bg-white/5 border-glass-border' },
  racing:    { label: 'Đang đua', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  upcoming:  { label: 'Sắp diễn ra', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

export function JockeyRacesPage() {
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getContracts();
        setRaces(data?.result ?? (Array.isArray(data) ? data : []));
      } catch (err: unknown) {
        setError(parseApiError(err as Error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Cuộc đua của tôi"
            subtitle="Lịch sử và kết quả cuộc đua"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : error ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          ) : races.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏁</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-4">
              {races.map((r, i) => {
                const cfg = STATUS_CONFIG[(r.status ?? '').toLowerCase() as keyof typeof STATUS_CONFIG];
                return (
                  <motion.div key={r.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="glass-panel rounded-2xl overflow-hidden border border-glass-border hover:border-gold/30 hover:bg-gold/[0.02] transition-all group relative">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <div className="p-6 flex items-start gap-5 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0 mt-2">{i + 1}</div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/20 ring-1 ring-gold/20 flex items-center justify-center shrink-0">
                        <Flag size={20} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-base font-serif text-white group-hover:text-champagne transition-colors">{r.horseName ?? `Ngựa #${r.horseId}`}</h3>
                          {cfg && <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted mb-3">
                          {r.tournamentName && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border"><Trophy size={10} className="text-gold/60" /> {r.tournamentName}</span>}
                          {r.startDate && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border"><Calendar size={10} className="text-gold/60" /> {r.startDate}{r.endDate ? ` → ${r.endDate}` : ''}</span>}
                        </div>
                        <div className="flex items-center gap-5 p-3 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all w-fit">
                          <div className="text-sm font-bold text-white group-hover:text-champagne transition-colors">🐴 {r.horseName ?? `Ngựa #${r.horseId}`}</div>
                          <div className="flex items-center gap-1 text-xs text-muted"><ShieldCheck size={11} className="text-emerald-400" /> Chủ: <span className="text-champagne font-semibold">{r.ownerName ?? `Owner #${r.ownerId ?? '—'}`}</span></div>
                        </div>
                      </div>
                      <button className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors shrink-0 font-medium">
                        Chi tiết <ChevronRight size={14} />
                      </button>
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
