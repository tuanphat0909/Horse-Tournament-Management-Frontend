import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { getMyProposals, createJockeyContract } from '../../api/ownerService';
import { parseApiError } from '../../api/authService';

const STATUS_CFG: Record<string, { label: string; color: string; Icon: typeof Clock }> = {
  Active:   { label: 'Đã xác nhận',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle },
  active:   { label: 'Đã xác nhận',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle },
  Pending:  { label: 'Chờ phản hồi', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  Icon: Clock },
  pending:  { label: 'Chờ phản hồi', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  Icon: Clock },
  Rejected: { label: 'Từ chối',      color: 'text-red-400 bg-red-500/10 border-red-500/20',            Icon: XCircle },
  rejected: { label: 'Từ chối',      color: 'text-red-400 bg-red-500/10 border-red-500/20',            Icon: XCircle },
};
const DEFAULT_CFG = { label: 'Không rõ', color: 'text-muted bg-white/5 border-glass-border', Icon: Clock };

const INIT_FORM = { horseId: '', tournamentId: '', jockeyId: '', startDate: '', endDate: '' };
const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

export function OwnerJockeysPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await getMyProposals();
      setProposals(data?.result ?? (Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleInvite() {
    setSubmitError(''); setSubmitSuccess('');
    if (!form.horseId || !form.tournamentId || !form.jockeyId || !form.startDate || !form.endDate) {
      setSubmitError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSubmitLoading(true);
    try {
      await createJockeyContract({
        horseId: Number(form.horseId),
        tournamentId: Number(form.tournamentId),
        jockeyId: Number(form.jockeyId),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      setSubmitSuccess('Gửi lời mời thành công!');
      setForm(INIT_FORM);
      load();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  function closeInvite() {
    setShowInvite(false);
    setSubmitError(''); setSubmitSuccess('');
    setForm(INIT_FORM);
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Nài ngựa"
            subtitle="Quản lý hợp đồng nài ngựa"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 58%"
            actions={
              <button onClick={() => setShowInvite(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Mời Jockey
              </button>
            }
          />

          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          <div>
            <h2 className="text-base font-medium text-white mb-4">Danh sách hợp đồng</h2>
            {loading ? (
              <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p, i) => {
                  const cfg = STATUS_CFG[p.status] ?? DEFAULT_CFG;
                  const { Icon } = cfg;
                  return (
                    <motion.div key={p.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="glass-panel rounded-xl p-5 flex items-center gap-5 border border-glass-border hover:border-gold/20 transition-all">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/20 flex items-center justify-center font-serif font-bold text-blue-300 text-lg shrink-0">
                        {(p.jockeyName ?? 'J')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-serif text-white mb-0.5">{p.jockeyName ?? `Jockey #${p.jockeyId}`}</div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span>🐴 {p.horseName ?? `Ngựa #${p.horseId}`}</span>
                          {p.startDate && <span>Từ: {p.startDate}</span>}
                          {p.endDate && <span>Đến: {p.endDate}</span>}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${cfg.color}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </motion.div>
                  );
                })}
                {proposals.length === 0 && (
                  <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Chưa có hợp đồng nào</div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-md border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Mời Jockey</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>ID Ngựa *</label>
                  <input type="number" value={form.horseId} onChange={e => setForm(p => ({...p, horseId: e.target.value}))} placeholder="ID ngựa" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>ID Jockey *</label>
                  <input type="number" value={form.jockeyId} onChange={e => setForm(p => ({...p, jockeyId: e.target.value}))} placeholder="ID jockey" className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>ID Giải đấu *</label>
                <input type="number" value={form.tournamentId} onChange={e => setForm(p => ({...p, tournamentId: e.target.value}))} placeholder="ID giải đấu" className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ngày bắt đầu *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} className={INPUT} style={{colorScheme:'dark'}} />
                </div>
                <div>
                  <label className={LABEL}>Ngày kết thúc *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))} className={INPUT} style={{colorScheme:'dark'}} />
                </div>
              </div>
              {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
              {submitSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{submitSuccess}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeInvite} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleInvite} disabled={submitLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">
                {submitLoading ? 'Đang gửi…' : 'Gửi lời mời'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
