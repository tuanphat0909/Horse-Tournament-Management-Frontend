import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getOwnerResults } from '../../api/ownerService';
import { parseApiError } from '../../api/authService';
import { Pager, paginate } from '../../components/ui/Pager';

export function OwnerResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOwnerResults()
      .then((data: any) => {
        const list = data?.result ?? (Array.isArray(data) ? data : []);
        setResults(list);
      })
      .catch((err: Error) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const pgResults = paginate(results, pageNo, 10);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Kết quả thi đấu"
            subtitle="Kết quả và thành tích mùa giải"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 58%"
          />

          {/* Results Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="p-5 border-b border-glass-border relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-base font-serif text-white whitespace-nowrap">Lịch sử thi đấu</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            {/* Fields verified against GET /owner/results (finishPosition, raceName, horseName, tournamentName, prizeAmount, finishTime, point) */}
            <div className="relative z-10 p-6 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/6 px-4 py-3 text-sm text-red-400">{error}</div>
              )}

              {loading ? (
                <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải...</div>
              ) : results.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pgResults.paged.map((r, i) => {
                    const position = r.finishPosition;
                    return (
                      <div key={r.id ?? i} className="flex items-center gap-4 p-4 rounded-xl bg-white/2 border border-glass-border hover:border-gold/30 hover:bg-gold/4 transition-all group">
                        <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{position != null ? String(position) : '—'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">{r.raceName ?? '—'}</div>
                          <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                            <span>{r.horseName ?? '—'}</span>
                            {r.tournamentName && <span className="text-[10px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded-full border border-gold/25 uppercase tracking-wider">{r.tournamentName}</span>}
                            {r.finishTime && <span>{String(r.finishTime)}</span>}
                          </div>
                        </div>
                        {r.point != null && (
                          <div className="text-right shrink-0">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted/60">Điểm</div>
                            <div className="text-sm text-champagne font-semibold">{String(r.point)}</div>
                          </div>
                        )}
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted/60">Tiền thưởng</div>
                          <div className="text-sm text-gold font-semibold">{r.prizeAmount != null ? Number(r.prizeAmount).toLocaleString() : '—'}</div>
                        </div>
                      </div>
                    );
                  })}
                  <Pager page={pgResults.page} totalPages={pgResults.totalPages} total={pgResults.total} onChange={setPageNo} />
                </div>
              )}
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
