import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { getMyBets, placeBet } from '../../api/spectatorService';
import { parseApiError } from '../../api/authService';

type BetStatus = 'correct' | 'incorrect' | 'pending';
type Tab = BetStatus | 'all';

function normalizeStatus(s: string): BetStatus {
  const key = (s ?? '').toLowerCase();
  if (key === 'win' || key === 'won' || key === 'correct') return 'correct';
  if (key === 'lose' || key === 'lost' || key === 'incorrect') return 'incorrect';
  return 'pending';
}

const RESULT_CONFIG: Record<BetStatus, { label: string; color: string; icon: typeof Clock }> = {
  correct:   { label: 'Thắng',       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  incorrect: { label: 'Thua',        color: 'text-red-400 bg-red-500/10 border-red-500/20',            icon: XCircle },
  pending:   { label: 'Chờ kết quả', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  icon: Clock },
};

const TABS: [Tab, string][] = [['all', 'Tất cả'], ['pending', 'Chờ kết quả'], ['correct', 'Thắng'], ['incorrect', 'Thua']];

const INPUT = 'w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';

export function SpectatorPredictionsPage() {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ raceId: '', horseId: '', amount: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await getMyBets();
      setBets(data?.result ?? (Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handlePlaceBet() {
    setSubmitError(''); setSubmitSuccess('');
    if (!form.raceId || !form.horseId || !form.amount) {
      setSubmitError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSubmitLoading(true);
    try {
      await placeBet({ raceId: Number(form.raceId), horseId: Number(form.horseId), amount: Number(form.amount) });
      setSubmitSuccess('Đặt cược thành công!');
      setForm({ raceId: '', horseId: '', amount: '' });
      load();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  function closeModal() {
    setShowAdd(false);
    setSubmitError(''); setSubmitSuccess('');
    setForm({ raceId: '', horseId: '', amount: '' });
  }

  const filtered = tab === 'all' ? bets : bets.filter(b => normalizeStatus(b.status) === tab);
  const counts: Record<Tab, number> = {
    all: bets.length,
    pending: bets.filter(b => normalizeStatus(b.status) === 'pending').length,
    correct: bets.filter(b => normalizeStatus(b.status) === 'correct').length,
    incorrect: bets.filter(b => normalizeStatus(b.status) === 'incorrect').length,
  };

  const totalWon = bets.filter(b => normalizeStatus(b.status) === 'correct').reduce((s, b) => s + (b.prize ?? b.reward ?? 0), 0);
  const totalBets = counts.correct + counts.incorrect;
  const accuracy = totalBets > 0 ? `${Math.round((counts.correct / totalBets) * 100)}%` : '—';

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Dự đoán & Cược"
            subtitle="Đặt cược và theo dõi kết quả"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            actions={
              <button onClick={() => setShowAdd(true)} className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Plus size={14} /> Đặt cược
              </button>
            }
          />

          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tổng tiền thắng', value: totalWon > 0 ? `${totalWon.toLocaleString()} coins` : '—', icon: Sparkles, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20' },
              { label: 'Tỉ lệ thắng', value: accuracy, icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
              { label: 'Tổng cược', value: bets.length, icon: CheckCircle, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden">
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.bg} blur-[30px] opacity-60`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} border border-white/[0.08] flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className="relative z-10 text-2xl font-serif font-bold text-white">{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {TABS.map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {label} <span className="ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 text-muted">{counts[t]}</span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((b, i) => {
                const statusKey = normalizeStatus(b.status);
                const cfg = RESULT_CONFIG[statusKey];
                const Icon = cfg.icon;
                return (
                  <motion.div key={b.id ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/20 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base font-serif font-bold text-white">{b.horseName ?? `Ngựa #${b.horseId}`}</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            <Icon size={10} /> {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted">
                          {b.raceName && <span>{b.raceName}</span>}
                          {b.raceId && !b.raceName && <span>Race #{b.raceId}</span>}
                          {b.createdAt && <span className="text-muted/60">{b.createdAt}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted">Cược: <span className="text-white font-medium">{Number(b.amount ?? 0).toLocaleString()} coins</span></div>
                        {b.prize != null && b.prize > 0 && (
                          <div className="text-sm font-bold text-gold">+{Number(b.prize).toLocaleString()} coins</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Không có cược nào</div>}
            </div>
          )}

          {/* Place bet modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-md border border-glass-border">
                <h3 className="text-lg font-serif text-white mb-5">Đặt cược mới</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">ID Cuộc đua *</label>
                    <input type="number" value={form.raceId} onChange={e => setForm(p => ({...p, raceId: e.target.value}))} placeholder="Nhập ID cuộc đua" className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">ID Ngựa cược *</label>
                    <input type="number" value={form.horseId} onChange={e => setForm(p => ({...p, horseId: e.target.value}))} placeholder="Nhập ID ngựa" className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Số coins cược *</label>
                    <input type="number" min="1" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} placeholder="VD: 100" className={INPUT} />
                  </div>
                  {submitError && <div className="text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{submitError}</div>}
                  {submitSuccess && <div className="text-xs text-emerald-400 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{submitSuccess}</div>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeModal} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">Hủy</button>
                  <button onClick={handlePlaceBet} disabled={submitLoading} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-60">
                    {submitLoading ? 'Đang đặt…' : 'Xác nhận cược'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
