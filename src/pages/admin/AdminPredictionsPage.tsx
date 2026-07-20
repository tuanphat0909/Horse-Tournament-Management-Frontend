import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, DollarSign, Search, Coins } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getBetStats, getBets, getPredictionStats, getPredictions } from '../../api/adminService';
import { Pager, paginate } from '../../components/ui/Pager';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

type TabType = 'all' | 'pending' | 'won' | 'lost';

interface Bet {
  betId: number;
  spectatorName: string;
  raceName: string;
  horseName: string;
  amount: number;
  odds: number;
  potentialPayout: number;
  status: string;
  createdAt: string;
}

interface BetStats {
  totalBets: number;
  totalAmount: number;
  wonBets: number;
  pendingBets: number;
  lostBets: number;
  totalPayoutsPaid: number;
  houseProfit: number;
}

export function AdminPredictionsPage() {
  const [tab, setTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Try loading Bet Management data first, fallback to Predictions if bets empty
    Promise.all([getBetStats(), getBets()])
      .then(([statsRes, listRes]) => {
        let loadedBets: Bet[] = [];
        let loadedStats: BetStats | null = null;

        if (listRes.data && Array.isArray(listRes.data.result) && listRes.data.result.length > 0) {
          loadedBets = listRes.data.result;
        }

        if (statsRes.data && statsRes.data.result) {
          loadedStats = statsRes.data.result;
        }

        if (loadedBets.length > 0 || (loadedStats && loadedStats.totalBets > 0)) {
          setBets(loadedBets);
          setStats(loadedStats);
          setLoading(false);
        } else {
          // Fallback check predictions
          return Promise.all([getPredictionStats(), getPredictions()]).then(([pStatsRes, pListRes]) => {
            if (pListRes.data && Array.isArray(pListRes.data.result) && pListRes.data.result.length > 0) {
              const mapped: Bet[] = pListRes.data.result.map((p: any) => ({
                betId: p.predictionId,
                spectatorName: p.spectatorName,
                raceName: p.raceName,
                horseName: p.predictedWinner,
                amount: p.point || 0,
                odds: 2.0,
                potentialPayout: (p.point || 0) * 2,
                status: p.isCorrect === null ? 'Pending' : p.isCorrect ? 'Won' : 'Lost',
                createdAt: p.predictedAt
              }));
              setBets(mapped);

              const totalCount = pStatsRes.data?.result?.totalPredictions || mapped.length;
              const wonCount = pStatsRes.data?.result?.correctPredictions || mapped.filter(m => m.status === 'Won').length;
              const lostCount = pStatsRes.data?.result?.wrongPredictions || mapped.filter(m => m.status === 'Lost').length;
              const pendingCount = mapped.filter(m => m.status === 'Pending').length;
              const totalAmount = mapped.reduce((s, m) => s + m.amount, 0);
              const totalPayouts = mapped.filter(m => m.status === 'Won').reduce((s, m) => s + m.potentialPayout, 0);

              setStats({
                totalBets: totalCount,
                totalAmount: totalAmount,
                wonBets: wonCount,
                pendingBets: pendingCount,
                lostBets: lostCount,
                totalPayoutsPaid: totalPayouts,
                houseProfit: totalAmount - totalPayouts
              });
            } else {
              setBets([]);
              setStats({
                totalBets: 0,
                totalAmount: 0,
                wonBets: 0,
                pendingBets: 0,
                lostBets: 0,
                totalPayoutsPaid: 0,
                houseProfit: 0
              });
            }
            setLoading(false);
          });
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load bet management data');
        setLoading(false);
      });
  }, []);

  const getFilteredBets = () => {
    return bets.filter(b => {
      // Tab filter
      let tabMatch = true;
      const s = b.status?.toLowerCase() || '';
      if (tab === 'pending') tabMatch = s === 'pending';
      else if (tab === 'won') tabMatch = s === 'won' || s === 'paidout';
      else if (tab === 'lost') tabMatch = s === 'lost';

      // Search filter
      const query = search.toLowerCase();
      const searchMatch = !search ||
        b.spectatorName?.toLowerCase().includes(query) ||
        b.horseName?.toLowerCase().includes(query) ||
        b.raceName?.toLowerCase().includes(query);

      return tabMatch && searchMatch;
    });
  };

  const getTabCount = (t: TabType) => {
    if (t === 'all') return bets.length;
    if (t === 'pending') return bets.filter(b => (b.status?.toLowerCase() || '') === 'pending').length;
    if (t === 'won') return bets.filter(b => (b.status?.toLowerCase() || '') === 'won' || (b.status?.toLowerCase() || '') === 'paidout').length;
    if (t === 'lost') return bets.filter(b => (b.status?.toLowerCase() || '') === 'lost').length;
    return 0;
  };

  const filteredBets = getFilteredBets();
  const { paged: pagedBets, totalPages, total, page: safePage } = paginate(filteredBets, page, 10);

  const statsDisplay = [
    { 
      label: 'Total Bet Volume', 
      value: loading ? '...' : `${(stats?.totalAmount ?? 0).toLocaleString('vi-VN')} đ`, 
      icon: DollarSign, 
      color: 'text-blue-400', 
      bg: 'from-blue-500/15 to-blue-900/20' 
    },
    { 
      label: 'Total Tickets Staked', 
      value: loading ? '...' : (stats?.totalBets ?? 0), 
      icon: Target, 
      color: 'text-emerald-400', 
      bg: 'from-emerald-500/15 to-emerald-900/20' 
    },
    { 
      label: 'Total Payouts Paid', 
      value: loading ? '...' : `${(stats?.totalPayoutsPaid ?? 0).toLocaleString('vi-VN')} đ`, 
      icon: Coins, 
      color: 'text-gold', 
      bg: 'from-gold/15 to-amber-900/20' 
    },
    { 
      label: 'House Profit', 
      value: loading ? '...' : `${(stats?.houseProfit ?? 0).toLocaleString('vi-VN')} đ`, 
      icon: TrendingUp, 
      color: (stats?.houseProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400', 
      bg: 'from-purple-500/15 to-purple-900/20' 
    },
  ];

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Bet Management"
            subtitle="Track and review spectator betting tickets, odds, and payouts"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsDisplay.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden"
              >
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.bg} blur-[30px] opacity-60`} />
                <div className="relative z-10 flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} border border-white/[0.08] flex items-center justify-center ${s.color}`}>
                    <s.icon size={16} />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted font-bold">{s.label}</span>
                </div>
                <div className="relative z-10 text-xl font-serif font-bold text-white">{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Tabs + Table */}
          <div className="flex items-center gap-2 border-b border-glass-border pb-0">
            {(['all', 'pending', 'won', 'lost'] as TabType[]).map(t => {
              const count = getTabCount(t);
              const label = t === 'all' ? 'All' : t === 'pending' ? 'Pending' : t === 'won' ? 'Won' : 'Lost';
              return (
                <button
                  key={t}
                  onClick={() => { setTab(t); setPage(1); }}
                  className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}
                >
                  {label}
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? 'bg-gold/10 text-gold' : 'bg-white/5 text-muted'}`}>{count}</span>
                </button>
              );
            })}
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-64">
              <Search size={13} className="text-muted shrink-0" />
              <input 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }} 
                placeholder="Search spectator, horse, race..."
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" 
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <LoadingSkeleton />
          ) : filteredBets.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🎲</div>
              <div className="text-muted text-sm">No betting data recorded yet</div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                      <th className="px-6 py-4">Ticket ID</th>
                      <th className="px-6 py-4">Spectator</th>
                      <th className="px-6 py-4">Race</th>
                      <th className="px-6 py-4">Selected Horse</th>
                      <th className="px-6 py-4">Staked Amount</th>
                      <th className="px-6 py-4">Odds</th>
                      <th className="px-6 py-4">Potential Payout</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Bet Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                    {pagedBets.map((b) => {
                      const st = b.status?.toLowerCase() || '';
                      return (
                        <tr key={b.betId} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-muted">#{b.betId}</td>
                          <td className="px-6 py-4 font-medium">{b.spectatorName}</td>
                          <td className="px-6 py-4 text-muted">{b.raceName}</td>
                          <td className="px-6 py-4 text-gold font-semibold">{b.horseName}</td>
                          <td className="px-6 py-4 font-mono text-xs">{b.amount.toLocaleString('vi-VN')} đ</td>
                          <td className="px-6 py-4 font-mono text-xs text-amber-400 font-bold">x{b.odds?.toFixed(2) || '1.00'}</td>
                          <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-semibold">{b.potentialPayout.toLocaleString('vi-VN')} đ</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                              st === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              st === 'won' || st === 'paidout' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {st === 'pending' ? 'Pending' : st === 'won' || st === 'paidout' ? 'Won' : 'Lost'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted">
                            {b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
