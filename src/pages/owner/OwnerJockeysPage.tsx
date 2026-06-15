import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Clock, Users, Calendar } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getMyProposals, createJockeyContract, getMyHorses } from '../../api/ownerService';
import { getJockeyRankings } from '../../api/publicService';
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
  const [horses, setHorses] = useState<any[]>([]);
  const [jockeys, setJockeys] = useState<any[]>([]);
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
      const [propData, horseData, jockeyData] = await Promise.all([getMyProposals(), getMyHorses(), getJockeyRankings()]);
      setProposals(propData?.result ?? (Array.isArray(propData) ? propData : []));
      setHorses(horseData?.result ?? (Array.isArray(horseData) ? horseData : []));
      setJockeys(jockeyData?.result ?? (Array.isArray(jockeyData) ? jockeyData : []));
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
        <PageAmbience accent="emerald" />
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
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Users size={15} className="text-gold" />
              </div>
              <h2 className="text-base font-medium font-serif text-white whitespace-nowrap">Danh sách hợp đồng</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            {loading ? (
              <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
            ) : (
              <div className="space-y-3">
                {proposals.map((p, i) => {
                  const cfg = STATUS_CFG[p.status] ?? DEFAULT_CFG;
                  const { Icon } = cfg;
                  return (
                    <motion.div key={p.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="glass-panel rounded-xl p-5 flex items-center gap-5 border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                      <div className="relative z-10 w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                      <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/20 ring-1 ring-gold/30 flex items-center justify-center font-serif font-bold text-blue-300 text-lg shrink-0">
                        {(p.jockeyName ?? 'J')[0]}
                      </div>
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="text-base font-serif text-white mb-1 group-hover:text-champagne transition-colors">{p.jockeyName ?? `Jockey #${p.jockeyId}`}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-champagne">🐴 {p.horseName ?? `Ngựa #${p.horseId}`}</span>
                          {p.startDate && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted inline-flex items-center gap-1"><Calendar size={9} className="text-gold/60" /> Từ: {p.startDate}</span>}
                          {p.endDate && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted inline-flex items-center gap-1"><Calendar size={9} className="text-gold/60" /> Đến: {p.endDate}</span>}
                        </div>
                      </div>
                      <span className={`relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${cfg.color}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </motion.div>
                  );
                })}
                {proposals.length === 0 && (
                  <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <div className="relative z-10">
                      <div className="text-4xl opacity-40 mb-3">🏇</div>
                      Chưa có hợp đồng nào
                      <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                    </div>
                  </div>
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
              <div>
                <label className={LABEL}>Chọn ngựa *</label>
                <select value={form.horseId} onChange={e => setForm(p => ({...p, horseId: e.target.value}))} className={INPUT}>
                  <option value="">-- Chọn ngựa của bạn --</option>
                  {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                {horses.length === 0 && <p className="text-[10px] text-muted/60 mt-1">Chưa có ngựa — hãy tạo ở trang "Quản lý ngựa" trước.</p>}
              </div>
              <div>
                <label className={LABEL}>Chọn Jockey *</label>
                <select value={form.jockeyId} onChange={e => setForm(p => ({...p, jockeyId: e.target.value}))} className={INPUT}>
                  <option value="">-- Chọn jockey --</option>
                  {jockeys.map(j => (
                    <option key={j.id ?? j.jockeyId} value={j.id ?? j.jockeyId}>
                      {j.fullName ?? j.name ?? `Jockey #${j.id ?? j.jockeyId}`}
                      {j.totalWins != null ? ` (${j.totalWins} thắng)` : ''}
                    </option>
                  ))}
                </select>
                {jockeys.length === 0 && <p className="text-[10px] text-muted/60 mt-1">Danh sách jockey đang tải hoặc trống.</p>}
              </div>
              {/* TODO: cần BE bổ sung GET danh sách giải đấu để thay ô nhập tay bằng dropdown */}
              <div>
                <label className={LABEL}>ID Giải đấu * <span className="text-muted/50 normal-case font-normal">— nhập ID (BE chưa có API danh sách giải đấu)</span></label>
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
