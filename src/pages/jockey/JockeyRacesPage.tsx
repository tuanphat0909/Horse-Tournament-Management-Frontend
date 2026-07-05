import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, Calendar, Trophy, ChevronRight } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getAssignedHorses } from '../../api/jockeyService';
import { getRaceDetail, getRaceEntries } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { Pager, paginate } from '../../components/ui/Pager';
import { RaceTrack3D } from '../../components/ui/RaceTrack3D';
import { X } from 'lucide-react';

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
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAssignedHorses();
        setRaces(data?.result ?? (Array.isArray(data) ? data : []));
      } catch (err: unknown) {
        setError(parseApiError(err as Error));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pgRaces = paginate(races, pageNo, 8);

  // Modal chi tiết cuộc đua: thông tin race + sơ đồ làn (đối thủ cùng đua)
  const [detail, setDetail] = useState<any | null>(null);
  const [detailEntries, setDetailEntries] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  async function openDetail(r: any) {
    setDetail({ ...r });
    setDetailEntries([]);
    if (r.raceId == null) return;
    setDetailLoading(true);
    try {
      const [info, entries] = await Promise.allSettled([
        getRaceDetail(Number(r.raceId)),
        getRaceEntries(Number(r.raceId)),
      ]);
      if (info.status === 'fulfilled') {
        const d = (info.value as any)?.result ?? info.value;
        if (d) setDetail((prev: any) => ({ ...prev, ...d }));
      }
      if (entries.status === 'fulfilled') setDetailEntries((entries.value as any)?.result ?? []);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

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
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          ) : races.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏁</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-4">
              {pgRaces.paged.map((r, i) => {
                const cfg = STATUS_CONFIG[(r.status ?? '').toLowerCase() as keyof typeof STATUS_CONFIG];
                return (
                  <motion.div key={r.raceEntryId ?? r.raceId ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="glass-panel rounded-2xl overflow-hidden border border-glass-border hover:border-gold/30 hover:bg-gold/2 transition-all group relative">
                    <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-blue-500/10 to-transparent blur-2xl pointer-events-none" />
                    <div className="p-6 flex items-start gap-5 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0 mt-2">{i + 1}</div>
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/20 ring-1 ring-gold/20 flex items-center justify-center shrink-0">
                        <Flag size={20} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-base font-serif text-white group-hover:text-champagne transition-colors">{r.raceName ?? `Cuộc đua #${r.raceId}`}</h3>
                          {cfg && <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted mb-3">
                          {r.tournamentName && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/4 border border-glass-border"><Trophy size={10} className="text-gold/60" /> {r.tournamentName}</span>}
                          {r.raceDate && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/4 border border-glass-border"><Calendar size={10} className="text-gold/60" /> {r.raceDate}</span>}
                          {r.laneNo != null && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/4 border border-glass-border">Làn {r.laneNo}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span className="text-champagne font-semibold">🐴 {r.horseName ?? `Ngựa #${r.horseId}`}</span>
                        </div>
                      </div>
                      <button onClick={() => openDetail(r)} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors shrink-0 font-medium">
                        Chi tiết <ChevronRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              <Pager page={pgRaces.page} totalPages={pgRaces.totalPages} total={pgRaces.total} onChange={setPageNo} />
            </div>
          )}

        </main>
      </div>

      {/* Modal chi tiết cuộc đua */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-xl border border-gold/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Flag size={15} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-serif text-white truncate">{detail.raceName ?? detail.name ?? `Cuộc đua #${detail.raceId}`}</h2>
                <p className="text-[11px] text-muted">{detail.tournamentName ?? '—'}</p>
              </div>
              <div className="flex-1" />
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { l: 'Ngày đua', v: detail.raceDate ? new Date(detail.raceDate).toLocaleString('vi-VN') : '—' },
                { l: 'Cự ly', v: detail.distanceMeter != null ? `${detail.distanceMeter}m` : '—' },
                { l: 'Làn của tôi', v: detail.laneNo != null ? `Làn ${detail.laneNo}` : '—' },
                { l: 'Trạng thái', v: detail.status ?? '—' },
              ].map(x => (
                <div key={x.l} className="rounded-lg bg-white/3 border border-glass-border px-3 py-2.5">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider">{x.l}</div>
                  <div className="text-xs text-white font-semibold mt-1">{x.v}</div>
                </div>
              ))}
            </div>

            <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Sơ đồ làn (3D)</div>
            {detailLoading ? (
              <div className="text-center py-6 text-muted text-sm">Đang tải…</div>
            ) : detailEntries.length === 0 ? (
              <div className="text-xs text-muted/60 italic">Chưa có dữ liệu làn cho cuộc đua này.</div>
            ) : (<>
              <RaceTrack3D status={detail.status} maxLanes={Number(detail.maxLanes ?? 0) || detailEntries.length} entries={detailEntries} />
              <div className="mt-3">
              <div className="space-y-1.5">
                {[...detailEntries].sort((a: any, b: any) => (a.laneNo ?? 0) - (b.laneNo ?? 0)).map((e: any, i: number) => {
                  const mine = e.laneNo === detail.laneNo;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${mine ? 'bg-gold/8 border-gold/30' : 'bg-white/2 border-glass-border'}`}>
                      <span className={`w-12 shrink-0 text-xs font-bold ${mine ? 'text-gold' : 'text-muted'}`}>Làn {e.laneNo}</span>
                      <span className="text-sm text-white truncate">🐴 {e.horseName ?? `Ngựa #${e.horseId}`}</span>
                      <span className="text-xs text-muted truncate">{e.jockeyName ? `• ${e.jockeyName}` : ''}</span>
                      {mine && <span className="ml-auto text-[10px] font-bold uppercase text-gold shrink-0">Tôi</span>}
                      {e.finishPosition != null && <span className="ml-auto text-xs font-bold text-champagne shrink-0">Hạng {e.finishPosition}</span>}
                    </div>
                  );
                })}
              </div>
              </div>
            </>)}

            <button onClick={() => setDetail(null)} className="w-full mt-6 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Đóng</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
