import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, TrendingUp, DollarSign, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getPredictions, getPredictionStats } from '../../api/adminService';

type TabType = 'all' | 'correct' | 'incorrect' | 'pending';

const TAB_LABELS: Record<TabType, string> = {
  all:       'Tất cả',
  pending:   'Chưa có kết quả',
  correct:   'Đúng',
  incorrect: 'Sai',
};

function fmtDate(s?: string) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
}

export function AdminPredictionsPage() {
  const [tab, setTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPredictions()
        .then((d: any) => d?.result ?? (Array.isArray(d) ? d : []))
        .catch(() => [] as any[]),
      getPredictionStats()
        .then((d: any) => d?.result ?? d ?? null)
        .catch(() => null),
    ]).then(([preds, st]) => {
      setPredictions(preds);
      setStats(st);
    }).finally(() => setLoading(false));
  }, []);

  const byTab = (t: TabType): any[] => {
    if (t === 'all') return predictions;
    return predictions.filter(p => (p.status ?? '').toLowerCase() === t);
  };

  const filtered = byTab(tab).filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.spectatorName ?? p.spectator?.fullName ?? '').toLowerCase().includes(q) ||
           (p.horseName ?? p.horse?.name ?? '').toLowerCase().includes(q);
  });

  const statCards = [
    { label: 'Tổng dự đoán',    value: loading ? '…' : String(stats?.totalPredictions ?? stats?.total ?? predictions.length), icon: Target,      color: 'text-blue-400',   bg: 'from-blue-500/15 to-blue-900/20' },
    { label: 'Dự đoán đúng',    value: loading ? '…' : String(stats?.correctPredictions ?? stats?.correct ?? byTab('correct').length), icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
    { label: 'Đã trả thưởng',   value: loading ? '…' : String(stats?.paidOut ?? stats?.totalPaidOut ?? '—'), icon: DollarSign,  color: 'text-gold',       bg: 'from-gold/15 to-amber-900/20' },
    { label: 'Tỉ lệ chính xác', value: loading ? '…' : (stats?.accuracyRate != null ? (stats.accuracyRate * 100).toFixed(1) + '%' : stats?.accuracy != null ? stats.accuracy + '%' : '—'), icon: TrendingUp, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20' },
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
            {statCards.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden">
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

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-glass-border pb-0">
            {(['all', 'pending', 'correct', 'incorrect'] as TabType[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {TAB_LABELS[t]}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? 'bg-gold/10 text-gold' : 'bg-white/5 text-muted'}`}>
                  {loading ? '…' : byTab(t).length}
                </span>
              </button>
            ))}
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khán giả, ngựa..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {/* List */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            {loading ? (
              <div className="p-12 text-center text-muted text-sm">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl opacity-40 mb-3">🎯</div>
                <div className="text-muted text-sm">{search ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}</div>
              </div>
            ) : (
              <div className="divide-y divide-glass-border relative z-10">
                {filtered.map((p, i) => {
                  const sk = (p.status ?? '').toLowerCase();
                  const statusCls = sk === 'correct' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : sk === 'incorrect' ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                  return (
                    <div key={p.id ?? p.predictionId ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                      <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-serif font-bold text-champagne shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">
                          {p.spectatorName ?? p.spectator?.fullName ?? '—'}
                        </div>
                        <div className="text-xs text-muted truncate">
                          Ngựa: {p.horseName ?? p.horse?.name ?? '—'}
                          {(p.raceName ?? p.race?.name) ? ` • ${p.raceName ?? p.race?.name}` : ''}
                        </div>
                      </div>
                      {p.amount != null && <span className="text-xs text-champagne font-bold shrink-0">{Number(p.amount).toLocaleString()}</span>}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCls}`}>{p.status ?? '—'}</span>
                      <span className="text-xs text-muted shrink-0 hidden md:block">{fmtDate(p.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </main>
      </div>
    </div>
  );
}
