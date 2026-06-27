import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, TrendingUp, DollarSign, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getPredictions, getPredictionStats } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

export function AdminPredictionsPage() {
  const [search, setSearch] = useState('');

  const [stats, setStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [predictions, setPredictions] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    setStatsLoading(true);
    setStatsError('');
    getPredictionStats()
      .then((data: any) => {
        const raw = data?.result ?? data;
        // Admin stats returns a single object; if an array, take the first element.
        setStats(Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null));
      })
      .catch((err: unknown) => setStatsError(parseApiError(err as Error)))
      .finally(() => setStatsLoading(false));

    setListLoading(true);
    setListError('');
    getPredictions()
      .then((data: any) => {
        const list = data?.result ?? (Array.isArray(data) ? data : []);
        setPredictions(list);
      })
      .catch((err: unknown) => setListError(parseApiError(err as Error)))
      .finally(() => setListLoading(false));
  }, []);

  // fields verified: stats = { totalPredictions, correctPredictions, wrongPredictions, accuracyRate }
  const show = (v: any) => (v == null ? '—' : String(v));

  const STATS = [
    { label: 'Tổng dự đoán', value: show(stats?.totalPredictions), icon: Target, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20' },
    { label: 'Đúng', value: show(stats?.correctPredictions), icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
    { label: 'Sai', value: show(stats?.wrongPredictions), icon: DollarSign, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20' },
    { label: 'Độ chính xác %', value: stats?.accuracyRate != null ? `${Math.round(stats.accuracyRate)}%` : '—', icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20' },
  ];

  const filtered = predictions.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.raceName ?? '').toLowerCase().includes(q) ||
      (p.predictedWinner ?? '').toString().toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-400 mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Quản lý dự đoán"
            subtitle="Theo dõi và xét duyệt dự đoán khán giả"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Stats */}
          {statsError && (
            <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{statsError}</div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden"
              >
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-linear-to-br ${s.bg} blur-[30px] opacity-60`} />
                <div className="relative z-10 flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.bg} border border-white/8 flex items-center justify-center ${s.color}`}>
                    <s.icon size={16} />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted font-bold">{s.label}</span>
                </div>
                <div className="relative z-10 text-2xl font-serif font-bold text-white">{statsLoading ? '…' : s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 border-b border-glass-border pb-3">
            <div className="ml-auto flex items-center gap-2 bg-white/4 border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm cuộc đua, ngựa..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {/* List */}
          {listError ? (
            <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{listError}</div>
          ) : listLoading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🎯</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-glass-border">
                    <th className="px-5 py-3 font-bold">Cuộc đua</th>
                    <th className="px-5 py-3 font-bold">Dự đoán</th>
                    <th className="px-5 py-3 font-bold">Trạng thái</th>
                    <th className="px-5 py-3 font-bold">Điểm</th>
                    <th className="px-5 py-3 font-bold">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.predictionId ?? p.id ?? i} className="border-b border-glass-border/40 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{p.raceName ?? '—'}</td>
                      <td className="px-5 py-3 text-body">{p.predictedWinner ?? '—'}</td>
                      <td className="px-5 py-3 text-body">{p.status ?? '—'}</td>
                      <td className="px-5 py-3 text-gold">{p.point ?? '—'}</td>
                      <td className="px-5 py-3 text-muted">{p.predictedAt ? new Date(p.predictedAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
