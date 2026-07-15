import { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

/**
 * Sơ đồ lanes đua 3D (CSS 3D transforms — không cần thư viện ngoài).
 *
 * 3 trạng thái theo `status` của races:
 *  - scheduled : đường đua phối cảnh 3D, horse đứng ở cổng xuất phát theo lanes
 *  - live      : như scheduled + horse phi (animation) và nhãn LIVE
 *  - finished  : bục trao giải 3D — horse & jockey xếp theo thứ hạng (finishPosition)
 *
 * entries: [{ laneNo, horseName, horseId, jockeyName, finishPosition }]
 */

type Entry = {
  laneNo?: number;
  horseName?: string;
  horseId?: number;
  jockeyName?: string;
  finishPosition?: number | null;
};

function normStatus(s?: string): 'scheduled' | 'live' | 'finished' {
  const k = (s ?? '').toLowerCase();
  if (k === 'finished' || k === 'completed') return 'finished';
  if (k === 'live' || k === 'ongoing' || k === 'running' || k === 'inprogress') return 'live';
  return 'scheduled';
}

const horseLabel = (e: Entry) => e.horseName ?? (e.horseId != null ? `Horse #${e.horseId}` : '—');

/* ───────────────────── Race Track 3D (scheduled / live) ───────────────────── */

function Track3D({ maxLanes, entries, live }: { maxLanes: number; entries: Entry[]; live: boolean }) {
  const lanes = Array.from({ length: maxLanes }, (_, i) => i + 1);
  // Độ nghiêng nhẹ để các lanes đầu (1, 2) vẫn cao, tên horse/jockey dễ đọc
  const TILT = 20;
  const PERSP = 800;

  // rotateX chỉ xoay hình ảnh, KHÔNG thu gọn chiều cao layout → phần đỉnh đường đua
  // co lại theo phối cảnh và để lại khoảng empty phía trên. Đo trực tiếp kích thước
  // đã render (getBoundingClientRect có tính transform, cạnh đáy cố định tại gốc xoay)
  // rồi kéo khối lên bằng margin âm cho khít khung — chạy 2 lần vì tâm phối cảnh
  // phụ thuộc chiều cao khung, đổi margin xong hình chiếu thay đổi nhẹ.
  const trackRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.marginTop = '0px';
    for (let i = 0; i < 2; i++) {
      const gap = el.offsetHeight - el.getBoundingClientRect().height;
      el.style.marginTop = `-${Math.max(0, gap)}px`;
    }
  }, [maxLanes]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-glass-border bg-gradient-to-b from-[#0a1a12] to-[#132b1d] p-4"
      style={{ perspective: `${PERSP}px` }}>
      {/* bầu trời + vạch đích xa */}
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-sky-900/40 to-transparent pointer-events-none" />
      {live && (
        <span className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
        </span>
      )}

      {/* Mặt đường đua nghiêng 3D — marginTop âm (đo runtime) cắt bỏ khoảng empty do phép nghiêng tạo ra */}
      <div ref={trackRef} className="relative mx-auto" style={{ transform: `rotateX(${TILT}deg)`, transformStyle: 'preserve-3d', transformOrigin: 'center bottom' }}>
        {/* Vạch đích phía xa */}
        <div className="h-3 mb-1 rounded-sm opacity-80"
          style={{ backgroundImage: 'repeating-conic-gradient(#fff 0% 25%, #111 0% 50%)', backgroundSize: '10px 10px' }} />
        {lanes.map(laneNo => {
          const e = entries.find(x => x.laneNo === laneNo);
          return (
            <div key={laneNo}
              className={`relative flex items-center h-11 border-b border-dashed ${e ? 'border-white/25' : 'border-white/10'}`}
              style={{ background: laneNo % 2 ? 'rgba(50, 90, 55, 0.45)' : 'rgba(38, 72, 44, 0.45)' }}>
              {/* số lanes */}
              <span className="w-8 shrink-0 text-center text-[10px] font-bold text-white/60 border-r border-white/15">{laneNo}</span>
              {e ? (
                <div className="flex items-center gap-2 pl-2 min-w-0">
                  {/* chú horse */}
                  <motion.span
                    className="text-2xl drop-shadow-[0_3px_4px_rgba(0,0,0,0.6)]"
                    style={{ display: 'inline-block', transform: 'scaleX(-1)' }}
                    animate={live
                      ? { x: [0, 110, 220], y: [0, -2, 0] }
                      : { y: [0, -1.5, 0] }}
                    transition={live
                      ? { duration: 3.2, repeat: Infinity, ease: 'linear', delay: laneNo * 0.35 }
                      : { duration: 1.8, repeat: Infinity, delay: laneNo * 0.2 }}>
                    🏇
                  </motion.span>
                  <div className="min-w-0 leading-tight" style={{ transform: 'rotateX(-20deg)' }}>
                    <div className="text-[11px] font-bold text-white truncate max-w-40">{horseLabel(e)}</div>
                    <div className="text-[9px] text-white/60 truncate max-w-40">{e.jockeyName ? `🏻 ${e.jockeyName}` : 'No jockey'}</div>
                  </div>
                </div>
              ) : (
                <span className="pl-3 text-[10px] italic text-white/30">Empty lane</span>
              )}
            </div>
          );
        })}
        {/* Cổng xuất phát */}
        <div className="h-1.5 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full mt-0.5" />
      </div>
      <div className="text-center text-[10px] text-white/40 mt-2">
        {live ? 'Race is live' : 'Horses are at the starting gates'} • vạch đích phía xa
      </div>
    </div>
  );
}

/* ───────────────────── Bục trao giải 3D (finished) ───────────────────── */

function Podium3D({ entries }: { entries: Entry[] }) {
  // Xếp theo finishPosition (1 → N). Horse không có hạng đứng cuối.
  const ranked = [...entries].sort((a, b) => (a.finishPosition ?? 999) - (b.finishPosition ?? 999));
  const top3 = ranked.filter(e => (e.finishPosition ?? 999) <= 3).slice(0, 3);
  const rest = ranked.filter(e => !top3.includes(e));

  const spot = (pos: number) => top3.find(e => e.finishPosition === pos);
  // Thứ tự hiển thị trên bục: 2 - 1 - 3
  const podiumOrder: { pos: number; h: number; cls: string; medal: string }[] = [
    { pos: 2, h: 64, cls: 'from-slate-300/80 to-slate-500/80 border-slate-300/60', medal: '🥈' },
    { pos: 1, h: 96, cls: 'from-yellow-300/90 to-amber-600/90 border-yellow-300/70', medal: '🥇' },
    { pos: 3, h: 44, cls: 'from-orange-300/80 to-orange-700/80 border-orange-400/60', medal: '🥉' },
  ];

  return (
    <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#171226] to-[#0d1220] p-5 relative overflow-hidden">
      {/* đèn sân khấu */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-40 bg-gold/15 blur-3xl rounded-full pointer-events-none" />
      <div className="relative flex items-center justify-center gap-1.5 mb-3 text-gold text-xs font-bold uppercase tracking-widest">
        <Trophy size={13} /> Award Ceremony
      </div>

      <div className="relative flex items-end justify-center gap-3" style={{ perspective: '600px' }}>
        {podiumOrder.map(({ pos, h, cls, medal }) => {
          const e = spot(pos);
          return (
            <div key={pos} className="flex flex-col items-center w-28">
              {e ? (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pos === 1 ? 0.15 : pos === 2 ? 0.3 : 0.45 }}
                  className="flex flex-col items-center mb-1.5">
                  <span className="text-lg leading-none mb-0.5">{medal}</span>
                  <motion.span className="text-3xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)]"
                    animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, delay: pos * 0.3 }}>
                    🏇
                  </motion.span>
                  <div className="text-center leading-tight mt-1">
                    <div className="text-[11px] font-bold text-white truncate max-w-27">{horseLabel(e)}</div>
                    <div className="text-[9px] text-white/60 truncate max-w-27">{e.jockeyName ? `Jockey: ${e.jockeyName}` : 'Jockey: —'}</div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-[10px] text-white/30 italic mb-1.5">—</div>
              )}
              {/* Khối bục 3D: mặt trên + mặt trước */}
              <div className="w-full" style={{ transformStyle: 'preserve-3d' }}>
                <div className={`w-full h-3 bg-gradient-to-b ${cls} border rounded-t-sm opacity-90`}
                  style={{ transform: 'rotateX(55deg)', transformOrigin: 'center bottom' }} />
                <div className={`w-full bg-gradient-to-b ${cls} border border-t-0 rounded-b-sm flex items-start justify-center pt-1`}
                  style={{ height: h }}>
                  <span className="font-serif font-bold text-xl text-black/60">{pos}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Các hạng còn lại */}
      {rest.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 text-center">Other positions</div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {rest.map((e, i) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                {e.finishPosition != null ? `#${e.finishPosition} ` : ''}🐴 {horseLabel(e)}{e.jockeyName ? ` • ${e.jockeyName}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────── Component chính ───────────────────── */

export function RaceTrack3D({ status, maxLanes, entries }: { status?: string; maxLanes: number; entries: Entry[] }) {
  const st = normStatus(status);
  if (st === 'finished') {
    if (entries.length === 0) {
      return <div className="rounded-xl border border-glass-border p-8 text-center text-muted text-xs italic">The race has finished but no results are available yet.</div>;
    }
    return <Podium3D entries={entries} />;
  }
  if (maxLanes <= 0) {
    return <div className="rounded-xl border border-glass-border p-8 text-center text-muted text-xs italic">Lanes have not been declared for this race yet.</div>;
  }

  // DỮ LIỆU LỖI: entry có laneNo vượt quá số lanes của races (vd 9 horse / 8 lanes)
  // → không vẽ lên đường đua, hiển thị cảnh báo đỏ để admin xử lý.
  const overflow = entries.filter(e => (e.laneNo ?? 0) > maxLanes);
  const valid = entries.filter(e => (e.laneNo ?? 0) <= maxLanes);

  return (
    <div className="space-y-2">
      <Track3D maxLanes={maxLanes} entries={valid} live={st === 'live'} />
      {overflow.length > 0 && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5">
          <div className="text-[11px] font-bold text-red-400 mb-1">
            ⚠ Data error: {overflow.length} horses assigned exceeds maximum lanes ({maxLanes} lanes)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {overflow.map((e, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300">
                Lane {e.laneNo} • {horseLabel(e)}{e.jockeyName ? ` • ${e.jockeyName}` : ''}
              </span>
            ))}
          </div>
          <div className="text-[10px] text-red-300/70 mt-1.5">
            This error is caused by backend data inconsistency (entry laneNo &gt; maxLanes). Please recreate the race or contact backend support.
          </div>
        </div>
      )}
    </div>
  );
}
