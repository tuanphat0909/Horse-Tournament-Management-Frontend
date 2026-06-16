import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getOwnerResults } from '../../api/ownerService';

function fmtDate(s?: string) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
}

export function OwnerResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOwnerResults()
      .then((d: any) => setResults(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Kết quả thi đấu"
            subtitle="Kết quả và thành tích mùa giải"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 58%"
          />

          {/* Results Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="p-5 border-b border-glass-border relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-base font-serif text-white whitespace-nowrap">Lịch sử thi đấu</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              {!loading && <span className="text-xs text-muted">{results.length} kết quả</span>}
            </div>
            <div className="relative z-10">
              {loading ? (
                <div className="p-12 text-center text-muted text-sm">Đang tải...</div>
              ) : results.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              ) : (
                <div className="divide-y divide-glass-border">
                  {results.map((r, i) => {
                    const pos = r.finishPosition ?? r.position;
                    const posCls = pos === 1 ? 'text-gold border-gold/30 bg-gold/10'
                      : pos === 2 ? 'text-slate-300 border-slate-500/30 bg-slate-500/10'
                      : pos === 3 ? 'text-amber-600 border-amber-600/30 bg-amber-600/10'
                      : 'text-muted border-glass-border bg-white/[0.02]';
                    return (
                      <div key={r.raceId ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold font-serif shrink-0 ${posCls}`}>
                          {pos ?? '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">
                            {r.raceName ?? r.race?.name ?? `Cuộc đua #${r.raceId ?? i}`}
                          </div>
                          <div className="text-xs text-muted truncate">
                            🐴 {r.horseName ?? r.horse?.name ?? '—'}
                            {(r.tournamentName ?? r.tournament?.name) ? ` • ${r.tournamentName ?? r.tournament?.name}` : ''}
                          </div>
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
