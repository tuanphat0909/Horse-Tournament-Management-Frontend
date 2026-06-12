import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Calendar, Trophy } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { createRegistration, getMyRegistrations, getMyHorses } from '../../api/ownerService';
import { parseApiError } from '../../api/authService';

type Tab = 'pending' | 'approved' | 'rejected';

function normalizeStatus(s: string): Tab {
  const key = (s ?? '').toLowerCase();
  if (key === 'approved') return 'approved';
  if (key === 'rejected') return 'rejected';
  return 'pending';
}

const STATUS_CONFIG = {
  pending:  { label: 'Chờ Admin duyệt', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  approved: { label: 'Đã duyệt',        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  rejected: { label: 'Bị từ chối',      color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

export function OwnerRegistrationsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('pending');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ horseId: '', tournamentId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [regData, horseData] = await Promise.all([getMyRegistrations(), getMyHorses()]);
      setRegistrations(regData?.result ?? (Array.isArray(regData) ? regData : []));
      setHorses(horseData?.result ?? (Array.isArray(horseData) ? horseData : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit() {
    setSubmitError(''); setSubmitSuccess('');
    if (!form.horseId || !form.tournamentId) {
      setSubmitError('Vui lòng chọn ngựa và nhập ID giải đấu.');
      return;
    }
    setSubmitLoading(true);
    try {
      await createRegistration({ horseId: Number(form.horseId), tournamentId: Number(form.tournamentId) });
      setSubmitSuccess('Đăng ký thành công!');
      setForm({ horseId: '', tournamentId: '' });
      load();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSubmitError(''); setSubmitSuccess('');
    setForm({ horseId: '', tournamentId: '' });
  }

  const filtered = registrations.filter(r => normalizeStatus(r.status) === tab);
  const counts = {
    pending:  registrations.filter(r => normalizeStatus(r.status) === 'pending').length,
    approved: registrations.filter(r => normalizeStatus(r.status) === 'approved').length,
    rejected: registrations.filter(r => normalizeStatus(r.status) === 'rejected').length,
  };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Đăng ký thi đấu"
            subtitle="Quản lý đăng ký tham gia giải đấu"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 58%"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Đăng ký ngựa
              </button>
            }
          />

          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          <div className="flex items-center gap-1 border-b border-glass-border pb-0">
            {([['pending', 'Chờ duyệt'], ['approved', 'Đã duyệt'], ['rejected', 'Bị từ chối']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? 'bg-gold/10 text-gold' : 'bg-white/5 text-muted'}`}>
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r, i) => {
                const statusKey = normalizeStatus(r.status);
                const cfg = STATUS_CONFIG[statusKey];
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-panel rounded-xl p-5 flex items-center gap-5 border border-glass-border hover:border-gold/20 transition-all">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center text-xl shrink-0">🐴</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-serif text-white">{r.horseName ?? `Ngựa #${r.horseId}`}</div>
                      <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                        <span className="flex items-center gap-1"><Trophy size={10} className="text-gold/60" /> {r.tournamentName ?? `Giải đấu #${r.tournamentId}`}</span>
                        {r.createdAt && <span className="flex items-center gap-1"><Calendar size={10} className="text-gold/60" /> {r.createdAt}</span>}
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    {statusKey === 'pending' && (
                      <button className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0" title="Hủy đăng ký">
                        <XCircle size={15} />
                      </button>
                    )}
                    {statusKey === 'approved' && (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                        <CheckCircle size={13} /> Đã duyệt
                      </span>
                    )}
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Không có đăng ký nào</div>
              )}
            </div>
          )}

        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-md border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Đăng ký ngựa thi đấu</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Chọn ngựa *</label>
                <select value={form.horseId} onChange={e => setForm(p => ({...p, horseId: e.target.value}))}
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40">
                  <option value="">-- Chọn ngựa --</option>
                  {horses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">ID Giải đấu *</label>
                <input type="number" min="1" value={form.tournamentId} onChange={e => setForm(p => ({...p, tournamentId: e.target.value}))}
                  placeholder="Nhập ID giải đấu" className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors" />
              </div>
              {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
              {submitSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{submitSuccess}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleSubmit} disabled={submitLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">
                {submitLoading ? 'Đang gửi…' : 'Nộp đăng ký'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
