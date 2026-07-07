import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, TrendingUp, DollarSign, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getPredictionStats, getPredictions } from '../../api/adminService';
import { Pager, paginate } from '../../components/ui/Pager';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type TabType = 'all' | 'correct' | 'incorrect' | 'pending';

interface Prediction {
  predictionId: number;
  spectatorName: string;
  raceName: string;
  predictedWinner: string;
  point: number;
  isCorrect: boolean | null;
  status: string;
  predictedAt: string;
}

interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  wrongPredictions: number;
  accuracyRate: number;
}

export function AdminPredictionsPage() {
  const [tab, setTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPredictionStats(), getPredictions()])
      .then(([statsRes, listRes]) => {
        if (statsRes.data && statsRes.data.result) {
          setStats(statsRes.data.result);
        }
        if (listRes.data && listRes.data.result) {
          setPredictions(listRes.data.result);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Không thể tải dữ liệu dự đoán');
        setLoading(false);
      });
  }, []);

  const getFilteredPredictions = () => {
    return predictions.filter(p => {
      // Tab filter
      let tabMatch = true;
      if (tab === 'pending') tabMatch = p.isCorrect === null;
      else if (tab === 'correct') tabMatch = p.isCorrect === true;
      else if (tab === 'incorrect') tabMatch = p.isCorrect === false;

      // Search filter
      const query = search.toLowerCase();
      const searchMatch = !search ||
        p.spectatorName?.toLowerCase().includes(query) ||
        p.predictedWinner?.toLowerCase().includes(query) ||
        p.raceName?.toLowerCase().includes(query);

      return tabMatch && searchMatch;
    });
  };

  const getTabCount = (t: TabType) => {
    if (t === 'all') return predictions.length;
    if (t === 'pending') return predictions.filter(p => p.isCorrect === null).length;
    if (t === 'correct') return predictions.filter(p => p.isCorrect === true).length;
    if (t === 'incorrect') return predictions.filter(p => p.isCorrect === false).length;
    return 0;
  };

  const filteredPredictions = getFilteredPredictions();
  const { paged: pagedPredictions, totalPages, total, page: safePage } = paginate(filteredPredictions, page, 10);

  // Calculated reward paid points
  const totalRewardedPoints = predictions
    .filter(p => p.isCorrect === true)
    .reduce((sum, p) => sum + (p.point * 2), 0); // Assuming 2x payout

  const statsDisplay = [
    { label: 'Tổng dự đoán', value: loading ? '...' : (stats?.totalPredictions ?? 0), icon: Target, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20' },
    { label: 'Dự đoán đúng', value: loading ? '...' : (stats?.correctPredictions ?? 0), icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
    { label: 'Điểm trả thưởng', value: loading ? '...' : totalRewardedPoints, icon: DollarSign, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20' },
    { label: 'Tỉ lệ chính xác', value: loading ? '...' : `${stats?.accuracyRate?.toFixed(1) ?? '0'}%`, icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20' },
  ];

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Quản lý dự đoán"
            subtitle="Theo dõi và xét duyệt dự đoán khán giả"
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
                <div className="relative z-10 text-2xl font-serif font-bold text-white">{s.value}</div>
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
            {(['all', 'pending', 'correct', 'incorrect'] as TabType[]).map(t => {
              const count = getTabCount(t);
              const label = t === 'all' ? 'Tất cả' : t === 'pending' ? 'Chờ kết quả' : t === 'correct' ? 'Đúng' : 'Sai';
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
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input 
                value={search} 
                onChange={e => { setSearch(e.target.value); setPage(1); }} 
                placeholder="Tìm khán giả, ngựa..." 
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" 
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <LoadingSkeleton />
          ) : filteredPredictions.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🎯</div>
              <div className="text-muted text-sm">Chưa có dữ liệu dự đoán nào</div>
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
                      <th className="px-6 py-4">Mã</th>
                      <th className="px-6 py-4">Khán giả</th>
                      <th className="px-6 py-4">Cuộc đua</th>
                      <th className="px-6 py-4">Ngựa dự đoán</th>
                      <th className="px-6 py-4">Điểm đặt</th>
                      <th className="px-6 py-4">Kết quả</th>
                      <th className="px-6 py-4">Ngày dự đoán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                    {pagedPredictions.map((pred) => (
                      <tr key={pred.predictionId} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted">#{pred.predictionId}</td>
                        <td className="px-6 py-4 font-medium">{pred.spectatorName}</td>
                        <td className="px-6 py-4 text-muted">{pred.raceName}</td>
                        <td className="px-6 py-4 text-gold font-semibold">{pred.predictedWinner}</td>
                        <td className="px-6 py-4 font-mono text-xs">{pred.point} điểm</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            pred.isCorrect === null ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            pred.isCorrect === true ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {pred.isCorrect === null ? 'Chờ kết quả' : pred.isCorrect === true ? 'Chính xác' : 'Sai biệt'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted">
                          {pred.predictedAt ? new Date(pred.predictedAt).toLocaleString('vi-VN') : ''}
                        </td>
                      </tr>
                    ))}
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
