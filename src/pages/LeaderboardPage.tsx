import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Flag, Users, ArrowRight } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SectionScroller } from '../components/landing/SectionScroller';
import { getHorseRankings, getJockeyRankings, getRaceSchedule, getRaceEntries } from '../api/publicService';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Pager, paginate } from '../components/ui/Pager';

type Tab = 'horses' | 'jockeys';

// Huy chương cho 3 hạng đầu, các hạng sau dùng số thứ tự
const RANK_STYLE = [
  'bg-gradient-to-br from-[#FFE07A] to-[#F5A623] text-[#2A1D00] border-gold/40',
  'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border-slate-300/40',
  'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 border-amber-600/40',
];

const PAGE_SIZE = 10;

export function LeaderboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('horses');
  const [page, setPage] = useState(1);
  const [horses, setHorses] = useState<any[]>([]);
  const [jockeys, setJockeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [h, j, schedule] = await Promise.allSettled([
        getHorseRankings(),
        getJockeyRankings(),
        getRaceSchedule(),
      ]);
      const pick = (r: PromiseSettledResult<any>) =>
        r.status === 'fulfilled' ? ((r.value as any)?.result ?? (Array.isArray(r.value) ? r.value : [])) : [];

      // API xếp hạng không trả số trận đã đua, nên đếm trực tiếp từ danh sách
      // ngựa/kỵ sĩ tham gia các cuộc đua đã kết thúc — số liệu thật, không phỏng đoán.
      const finishedRaces = (pick(schedule) as any[]).filter(
        r => ['finished', 'completed', 'published'].includes(String(r.status ?? '').toLowerCase())
      );
      const entryLists = await Promise.allSettled(
        finishedRaces.map(r => getRaceEntries(r.raceId ?? r.id))
      );
      const horseStats = new Map<number, { races: number; wins: number }>();
      const jockeyStats = new Map<number, { races: number; wins: number }>();
      for (const res of entryLists) {
        if (res.status !== 'fulfilled') continue;
        const entries = (res.value as any)?.result ?? [];
        for (const e of Array.isArray(entries) ? entries : []) {
          const won = Number(e.finishPosition) === 1;
          for (const [map, id] of [[horseStats, e.horseId], [jockeyStats, e.jockeyId]] as const) {
            if (id == null) continue;
            const cur = map.get(id) ?? { races: 0, wins: 0 };
            map.set(id, { races: cur.races + 1, wins: cur.wins + (won ? 1 : 0) });
          }
        }
      }

      const withStats = (list: any[], map: Map<number, { races: number; wins: number }>, key: string) =>
        list.map(item => {
          const s = map.get(item[key]) ?? { races: 0, wins: 0 };
          // Ưu tiên số thắng đếm được để không bao giờ có cảnh "0 trận nhưng 1 thắng"
          const wins = s.races > 0 ? s.wins : (item.winsCount ?? 0);
          return { ...item, races: s.races, wins, winRate: s.races > 0 ? Math.round((s.wins / s.races) * 100) : null };
        }).sort((a, b) => (b.wins - a.wins) || (b.races - a.races));

      setHorses(withStats(pick(h), horseStats, 'horseId'));
      setJockeys(withStats(pick(j), jockeyStats, 'jockeyId'));
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, []);

  const rows = tab === 'horses' ? horses : jockeys;
  const { paged: pagedRows, totalPages, total, page: safePage } = paginate(rows, page, PAGE_SIZE);

  return (
    <div className="min-h-screen bg-navy text-body font-sans selection:bg-gold/30">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="landing-section text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">Season 2026</span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            Championship <span className="text-champagne italic">Leaderboard</span>
          </h1>
          <p className="text-sm text-muted max-w-xl mx-auto">
            Live standings from every official race in the Equestria system — updated as soon as
            referees confirm the results.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="landing-section flex justify-center gap-2 mb-8">
          {([['horses', 'Horses', Flag], ['jockeys', 'Jockeys', Users]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(1); }}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 border ${
                tab === key
                  ? 'bg-gold/15 border-gold/40 text-champagne'
                  : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSkeleton rows={6} h="h-16" />
        ) : rows.length === 0 ? (
          <div className="glass-panel rounded-2xl py-20 text-center">
            <Trophy size={36} className="mx-auto mb-4 text-gold opacity-40" />
            <p className="text-sm text-muted">No ranking data available yet.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl overflow-hidden border border-glass-border"
          >
            <div className="overflow-x-auto">
              {/* Cột bám đúng dữ liệu API trả về: ngựa có breed/owner/wins,
                  kỵ sĩ có kinh nghiệm/điểm xếp hạng. API không trả số trận đã đua
                  nên không hiển thị cột Races hay win rate (sẽ luôn sai). */}
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-glass-border bg-white/[0.02] text-[11px] font-bold text-muted uppercase tracking-wider">
                    <th className="px-6 py-4 w-20">Rank</th>
                    <th className="px-6 py-4">{tab === 'horses' ? 'Horse' : 'Jockey'}</th>
                    <th className="px-6 py-4">{tab === 'horses' ? 'Owner' : 'Experience'}</th>
                    <th className="px-6 py-4 text-center">Races</th>
                    <th className="px-6 py-4 text-center">Wins</th>
                    <th className="px-6 py-4 text-right">Win rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/40 text-sm">
                  {pagedRows.map((r, i) => {
                    const rank = (safePage - 1) * PAGE_SIZE + i;
                    const name = r.name ?? r.fullName ?? r.horseName ?? r.jockeyName ?? `#${r.horseId ?? r.jockeyId ?? rank + 1}`;
                    return (
                      <tr key={r.horseId ?? r.jockeyId ?? rank} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span
                            className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${
                              rank < 3 ? RANK_STYLE[rank] : 'bg-white/[0.03] border-glass-border text-muted'
                            }`}
                          >
                            {rank < 3 ? <Medal size={14} /> : rank + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-serif font-bold text-white">{name}</div>
                          {tab === 'horses' && r.breed && (
                            <div className="text-[11px] text-muted mt-0.5">{r.breed}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted">
                          {tab === 'horses'
                            ? (r.ownerName || '—')
                            : (r.experienceYears != null ? `${r.experienceYears} yrs` : '—')}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-muted">{r.races}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-gold">{r.wins}</td>
                        <td className="px-6 py-4 text-right">
                          {/* Chưa đua trận nào thì không có tỉ lệ để tính */}
                          {r.winRate == null ? (
                            <span className="text-muted/50">—</span>
                          ) : (
                            <span className={`font-mono font-bold ${r.winRate >= 50 ? 'text-emerald-400' : 'text-muted'}`}>
                              {r.winRate}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
            )}
          </motion.div>
        )}

        {/* CTA */}
        <div className="landing-section mt-12 text-center">
          <p className="text-sm text-muted mb-4">Want to follow races live and place your predictions?</p>
          <button
            onClick={() => navigate('/register')}
            className="btn-gold px-7 py-3 rounded-lg text-xs font-bold inline-flex items-center gap-2"
          >
            Create your account <ArrowRight size={14} />
          </button>
        </div>
      </main>

      <Footer />
      <SectionScroller />
    </div>
  );
}
