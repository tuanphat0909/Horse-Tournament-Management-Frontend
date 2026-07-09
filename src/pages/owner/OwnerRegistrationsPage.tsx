import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Calendar, Trophy, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createRegistration, getMyRegistrations, getMyHorses } from '../../api/ownerService';
import { getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
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
  const { showToast } = useNotifications();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ horseId: '', tournamentId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [regData, horseData, tournamentData] = await Promise.all([
        getMyRegistrations(),
        getMyHorses(),
        getTournaments(),
      ]);
      setRegistrations(regData?.result ?? (Array.isArray(regData) ? regData : []));
      setHorses(horseData?.result ?? (Array.isArray(horseData) ? horseData : []));
      setTournaments(tournamentData?.result ?? (Array.isArray(tournamentData) ? tournamentData : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Gate sức khỏe theo quy trình: chỉ ngựa Khỏe mạnh (Healthy) mới được đăng ký vào giải.
  // Chủ ngựa là role duy nhất đọc được healthStatus qua API nên chặn tại bước này.
  const isHealthy = (h: any) => {
    const s = String(h?.healthStatus ?? 'Healthy').toLowerCase();
    return s === 'healthy' || s === 'good';
  };
  const unhealthyHorses = horses.filter(h => !isHealthy(h));

  async function handleSubmit() {
    setSubmitError('');
    if (!form.horseId || !form.tournamentId) {
      setSubmitError('Vui lòng chọn ngựa và giải đấu.');
      return;
    }
    const selectedHorse = horses.find(h => String(h.id) === String(form.horseId));
    if (selectedHorse && !isHealthy(selectedHorse)) {
      setSubmitError(`Ngựa "${selectedHorse.name}" đang có tình trạng "${selectedHorse.healthStatus}" — chỉ ngựa Khỏe mạnh (Healthy) mới được đăng ký thi đấu. Hãy cập nhật tình trạng ở trang Ngựa của tôi khi ngựa đã hồi phục.`);
      return;
    }
    setSubmitLoading(true);
    try {
      await createRegistration({ horseId: Number(form.horseId), tournamentId: Number(form.tournamentId) });
      setShowModal(false);
      setForm({ horseId: '', tournamentId: '' });
      showToast('Thành công', 'Đăng ký ngựa thi đấu thành công!');
      load();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSubmitError('');
    setForm({ horseId: '', tournamentId: '' });
  }

  const filtered = registrations.filter(r => {
    if (normalizeStatus(r.status) !== tab) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (r.horseName ?? '').toLowerCase().includes(q)
      || (r.tournamentName ?? '').toLowerCase().includes(q);
  });
  const counts = {
    pending:  registrations.filter(r => normalizeStatus(r.status) === 'pending').length,
    approved: registrations.filter(r => normalizeStatus(r.status) === 'approved').length,
    rejected: registrations.filter(r => normalizeStatus(r.status) === 'rejected').length,
  };

  const filteredTournamentsForRegister = form.horseId
    ? tournaments.filter(t => 
        !registrations.some(r => 
          String(r.horseId) === String(form.horseId) && 
          r.tournamentId === t.tournamentId && 
          normalizeStatus(r.status) !== 'rejected'
        )
      )
    : tournaments;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
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
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm ngựa, giải đấu..."
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-3">
              {filtered.map((r, i) => {
                const statusKey = normalizeStatus(r.status);
                const cfg = STATUS_CONFIG[statusKey];
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-panel rounded-xl p-5 flex items-center gap-5 border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <div className="relative z-10 w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                    <div className="relative z-10 w-11 h-11 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 ring-1 ring-gold/30 flex items-center justify-center text-xl shrink-0">🐴</div>
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="text-base font-serif text-white group-hover:text-champagne transition-colors">{r.horseName ?? `Ngựa #${r.horseId}`}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-champagne"><Trophy size={10} className="text-gold/60" /> {r.tournamentName ?? `Giải đấu #${r.tournamentId}`}</span>
                        {r.createdAt && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted"><Calendar size={10} className="text-gold/60" /> {r.createdAt}</span>}
                      </div>
                    </div>
                    <span className={`relative z-10 text-[11px] font-bold px-3 py-1 rounded-full border shrink-0 ${cfg.color}`}>{cfg.label}</span>
                    {statusKey === 'pending' && (
                      <button className="relative z-10 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors shrink-0" title="Hủy đăng ký">
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
              {filtered.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-4xl opacity-40 mb-3">🐴</div>
                    Không có đăng ký nào
                    <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
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
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Chọn ngựa *</label>
                <select 
                  value={form.horseId} 
                  onChange={e => {
                    const nextHorseId = e.target.value;
                    setForm(p => {
                      const isInvalid = p.tournamentId && registrations.some(r => 
                        String(r.horseId) === String(nextHorseId) && 
                        String(r.tournamentId) === String(p.tournamentId) &&
                        normalizeStatus(r.status) !== 'rejected'
                      );
                      return {
                        ...p,
                        horseId: nextHorseId,
                        tournamentId: isInvalid ? '' : p.tournamentId
                      };
                    });
                  }}
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40"
                >
                  <option value="">-- Chọn ngựa --</option>
                  {/* Ngựa không đủ sức khỏe bị khóa chọn — gate quy trình trước khi ghép làn */}
                  {horses.map(h => (
                    <option key={h.id} value={h.id} disabled={!isHealthy(h)}>
                      {h.name}{!isHealthy(h) ? ` — không đủ sức khỏe (${h.healthStatus})` : ''}
                    </option>
                  ))}
                </select>
                {unhealthyHorses.length > 0 && (
                  <div className="text-[11px] text-yellow-400/90 mt-1.5 leading-relaxed">
                    ⚠ {unhealthyHorses.length} ngựa bị khóa vì sức khỏe không đạt: {unhealthyHorses.map(h => h.name).join(', ')}.
                    Chỉ ngựa <b>Khỏe mạnh (Healthy)</b> được đăng ký — cập nhật tình trạng tại trang Ngựa của tôi khi đã hồi phục.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Chọn giải đấu *</label>
                <select 
                  value={form.tournamentId} 
                  onChange={e => setForm(p => ({...p, tournamentId: e.target.value}))}
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40"
                  disabled={!form.horseId}
                >
                  <option value="">
                    {!form.horseId ? '-- Chọn ngựa trước --' : '-- Chọn giải đấu --'}
                  </option>
                  {filteredTournamentsForRegister.map(t => (
                    <option key={t.tournamentId} value={t.tournamentId}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {form.horseId && filteredTournamentsForRegister.length === 0 && (
                  <div className="text-[11px] text-yellow-400 mt-1.5">
                    Con ngựa này đã đăng ký tham gia tất cả các giải đấu hiện tại.
                  </div>
                )}
                {tournaments.length === 0 && (
                  <div className="text-[11px] text-yellow-400 mt-1.5">
                    Chưa có giải đấu nào. Admin cần tạo giải đấu trước khi đăng ký ngựa.
                  </div>
                )}
              </div>
              {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
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
