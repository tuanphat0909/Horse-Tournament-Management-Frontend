import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Calendar, Trophy } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createRegistration, getMyRegistrations, getMyHorses, getMyProposals } from '../../api/ownerService';
import { getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { toast } from '../../components/ui/Toast';
import { Pager, paginate } from '../../components/ui/Pager';

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
  const [tournaments, setTournaments] = useState<any[]>([]);
  // Hợp đồng jockey của owner — dùng để ràng buộc: chỉ ngựa có jockey ĐÃ CHẤP NHẬN
  // hợp đồng (Active) trong giải mới được nộp đơn đăng ký thi đấu.
  const [contracts, setContracts] = useState<any[]>([]);
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
      const [regData, horseData, tournamentData, contractData] = await Promise.all([
        getMyRegistrations(),
        getMyHorses(),
        getTournaments(),
        getMyProposals()
      ]);
      setRegistrations(regData?.result ?? (Array.isArray(regData) ? regData : []));
      setHorses(horseData?.result ?? (Array.isArray(horseData) ? horseData : []));
      setTournaments(tournamentData?.result ?? (Array.isArray(tournamentData) ? tournamentData : []));
      setContracts(contractData?.result ?? (Array.isArray(contractData) ? contractData : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Ngựa có jockey đã CHẤP NHẬN hợp đồng (Active) cho giải này chưa?
  function hasActiveContract(horseId: number, tournamentId: number) {
    return contracts.some(c =>
      Number(c.horseId) === horseId &&
      Number(c.tournamentId) === tournamentId &&
      (c.status ?? '').toLowerCase() === 'active');
  }

  // Trạng thái jockey của 1 đơn đăng ký (hiển thị trên card):
  // active = đã có jockey ký • pending = đã mời, chờ phản hồi • none = chưa mời ai
  function jockeyStatusFor(r: any): { key: 'active' | 'pending' | 'none'; label: string; cls: string } {
    const match = contracts.filter(c =>
      Number(c.horseId) === Number(r.horseId) && Number(c.tournamentId) === Number(r.tournamentId));
    const active = match.find(c => (c.status ?? '').toLowerCase() === 'active');
    if (active) return { key: 'active', label: `Jockey: ${active.jockeyName ?? '#' + active.jockeyId}`, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    const pending = match.find(c => (c.status ?? '').toLowerCase() === 'pending');
    if (pending) return { key: 'pending', label: `Chờ jockey "${pending.jockeyName ?? '#' + pending.jockeyId}" phản hồi`, cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { key: 'none', label: 'Chưa có jockey', cls: 'text-red-400 bg-red-500/10 border-red-500/20' };
  }

  async function handleSubmit() {
    setSubmitError(''); setSubmitSuccess('');
    if (!form.horseId || !form.tournamentId) {
      setSubmitError('Vui lòng chọn ngựa và giải đấu.');
      return;
    }
    // RÀNG BUỘC QUY TRÌNH: phải có jockey chấp nhận hợp đồng trước khi nộp đơn.
    // Nếu jockey từ chối/chưa phản hồi → không thể gửi đơn lên Admin.
    if (!hasActiveContract(Number(form.horseId), Number(form.tournamentId))) {
      setSubmitError('Ngựa này chưa có nài ngựa (jockey) chấp nhận hợp đồng cho giải đã chọn. Hãy mời jockey ở trang "Nài ngựa" và chờ jockey đồng ý trước khi nộp đơn.');
      return;
    }
    setSubmitLoading(true);
    try {
      await createRegistration({ horseId: Number(form.horseId), tournamentId: Number(form.tournamentId) });
      toast.success('Đã nộp đơn đăng ký thi đấu thành công! Chờ Admin duyệt.');
      closeModal();
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

  const [pageNo, setPageNo] = useState(1);
  const pg = paginate(filtered, pageNo, 8);
  const counts = {
    pending:  registrations.filter(r => normalizeStatus(r.status) === 'pending').length,
    approved: registrations.filter(r => normalizeStatus(r.status) === 'approved').length,
    rejected: registrations.filter(r => normalizeStatus(r.status) === 'rejected').length,
  };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="max-w-400 mx-auto px-8 py-6 space-y-6 relative z-10">

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
              {pg.paged.map((r, i) => {
                const statusKey = normalizeStatus(r.status);
                const cfg = STATUS_CONFIG[statusKey];
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-panel rounded-xl p-5 flex items-center gap-5 border border-glass-border hover:border-gold/30 hover:bg-gold/4 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />
                    <div className="relative z-10 w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                    <div className="relative z-10 w-11 h-11 rounded-xl bg-linear-to-br from-gold/20 to-gold/5 border border-gold/20 ring-1 ring-gold/30 flex items-center justify-center text-xl shrink-0">🐴</div>
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="text-base font-serif text-white group-hover:text-champagne transition-colors">{r.horseName ?? `Ngựa #${r.horseId}`}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-champagne"><Trophy size={10} className="text-gold/60" /> {r.tournamentName ?? `Giải đấu #${r.tournamentId}`}</span>
                        {(r.registeredAt ?? r.createdAt) && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-muted"><Calendar size={10} className="text-gold/60" /> {r.registeredAt ?? r.createdAt}</span>}
                        {/* Trạng thái jockey — Owner biết ngay đơn này đã có nài ngựa hay chưa */}
                        {(() => {
                          const js = jockeyStatusFor(r);
                          return (
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${js.cls}`}>
                              🏇 {js.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <span className={`relative z-10 text-[11px] font-bold px-3 py-1 rounded-full border shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    {statusKey === 'pending' && (
                      <button
                        onClick={() => toast.info('Backend chưa hỗ trợ API hủy đơn đăng ký — hãy liên hệ Admin để từ chối đơn này.')}
                        className="relative z-10 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors shrink-0" title="Hủy đăng ký (BE chưa hỗ trợ)">
                        <XCircle size={15} />
                      </button>
                    )}
                    {statusKey === 'approved' && (
                      <span className="relative z-10 text-xs text-emerald-400 font-medium flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle size={13} /> Đã duyệt
                      </span>
                    )}
                  </motion.div>
                );
              })}
              <Pager page={pg.page} totalPages={pg.totalPages} total={pg.total} onChange={setPageNo} />
              {filtered.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-4xl opacity-40 mb-3">🐴</div>
                    Không có đăng ký nào
                    <div className="mx-auto mt-4 w-24 h-px bg-linear-to-r from-transparent via-gold/30 to-transparent" />
                  </div>
                </div>
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
              {/* Ràng buộc quy trình */}
              <div className="text-[11px] text-champagne/80 bg-gold/5 border border-gold/15 rounded-lg px-3 py-2 leading-relaxed">
                Quy trình: <b>Mời jockey → jockey chấp nhận hợp đồng → nộp đơn đăng ký → Admin duyệt</b>.
                Chỉ hiển thị ngựa <b>đã có jockey chấp nhận hợp đồng</b> cho giải được chọn và <b>chưa đăng ký</b> giải đó.
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Chọn Giải đấu *</label>
                <select value={form.tournamentId} onChange={e => setForm(p => ({...p, tournamentId: e.target.value, horseId: ''}))}
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40 transition-colors" style={{colorScheme:'dark'}}>
                  <option value="">-- Chọn giải đấu --</option>
                  {tournaments.map(t => (
                    <option key={t.tournamentId ?? t.id} value={t.tournamentId ?? t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Chọn ngựa *</label>
                {(() => {
                  const tid = Number(form.tournamentId);
                  const eligible = !form.tournamentId ? [] : horses.filter(h => {
                    // (1) Chưa đăng ký giải này (trừ đơn đã bị từ chối)
                    const notRegistered = !registrations.some(r =>
                      Number(r.horseId) === Number(h.id) &&
                      Number(r.tournamentId) === tid &&
                      (r.status ?? '').toLowerCase() !== 'rejected');
                    // (2) Đã có jockey CHẤP NHẬN hợp đồng (Active) cho giải này
                    return notRegistered && hasActiveContract(Number(h.id), tid);
                  });
                  return (
                    <>
                      <select value={form.horseId} onChange={e => setForm(p => ({...p, horseId: e.target.value}))}
                        disabled={!form.tournamentId}
                        className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40 disabled:opacity-50">
                        <option value="">{!form.tournamentId ? '-- Chọn giải đấu trước --' : '-- Chọn ngựa đủ điều kiện --'}</option>
                        {eligible.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                      {form.tournamentId && eligible.length === 0 && (
                        <p className="text-[10px] text-yellow-400/80 mt-1.5 leading-relaxed">
                          Không có ngựa đủ điều kiện: cần jockey chấp nhận hợp đồng cho giải này trước
                          (mời jockey ở trang <b>Nài ngựa</b>), hoặc ngựa đã đăng ký giải này rồi.
                        </p>
                      )}
                    </>
                  );
                })()}
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
