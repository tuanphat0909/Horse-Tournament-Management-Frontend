import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trophy, Search, Pencil, Star, Eye, X, CalendarClock } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createTournament, updateTournament, generateFinalRace, closeRegistration } from '../../api/adminService';
import { getTournaments, getTournamentDetail } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { toast } from '../../components/ui/Toast';

type StatusFilter = 'all' | 'upcoming' | 'active' | 'completed';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Đang diễn ra', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  upcoming: { label: 'Sắp diễn ra', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Đã kết thúc', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
};

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_FORM = { name: '', registrationStartDate: '', registrationEndDate: '', startDate: '', endDate: '', numberOfRounds: '' };

export function AdminTournamentsPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // Chi tiết giải đấu (modal)
  const [detailT, setDetailT] = useState<any | null>(null);
  const [detailRounds, setDetailRounds] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [closeRegLoading, setCloseRegLoading] = useState(false);
  const [closeRegMsg, setCloseRegMsg] = useState('');

  async function openDetail(t: any) {
    setDetailT(t);
    setDetailRounds(t.rounds ?? []);
    setCloseRegMsg('');
    setDetailLoading(true);
    try {
      const d: any = await getTournamentDetail(Number(t.tournamentId ?? t.id));
      const full = d?.result ?? d;
      if (full) {
        setDetailT(full);
        setDetailRounds(full.rounds ?? []);
      }
    } catch { /* giữ dữ liệu từ danh sách nếu API chi tiết lỗi */ }
    finally { setDetailLoading(false); }
  }

  async function handleCloseRegistration() {
    if (!detailT) return;
    if (!window.confirm('Đóng đăng ký ngay cho giải này? Owner sẽ không thể nộp đơn nữa.')) return;
    setCloseRegLoading(true); setCloseRegMsg('');
    try {
      await closeRegistration(Number(detailT.tournamentId ?? detailT.id));
      toast.success(`Đã đóng đăng ký cho giải "${detailT.name}"!`);
      setDetailT(null);
      loadTournaments();
    } catch (err: unknown) {
      setCloseRegMsg(parseApiError(err as Error));
    } finally {
      setCloseRegLoading(false);
    }
  }

  // Generate final race — BE tự lấy các ngựa thắng vòng trước để tạo trận chung kết
  const [finalLoading, setFinalLoading] = useState<number | null>(null);

  async function handleGenerateFinal(id: number, name?: string) {
    if (!window.confirm(`Tạo trận CHUNG KẾT cho giải "${name ?? '#' + id}"?\nYêu cầu: các cuộc đua vòng trước phải có kết quả.`)) return;
    setFinalLoading(id);
    try {
      const d: any = await generateFinalRace(id);
      const raceName = d?.result?.name;
      toast.success(raceName ? `Đã tạo trận chung kết "${raceName}"! Xem ở trang Quản lý cuộc đua.` : 'Đã tạo trận chung kết thành công!');
      loadTournaments();
    } catch (err: unknown) {
      toast.error(`Không tạo được chung kết: ${parseApiError(err as Error)}`);
    } finally {
      setFinalLoading(null);
    }
  }

  // Edit tournament
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', registrationStartDate: '', registrationEndDate: '', startDate: '', endDate: '', numberOfRounds: '', status: 'Upcoming' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  async function loadTournaments() {
    setLoadingTournaments(true);
    try {
      const data: any = await getTournaments();
      setTournaments(data?.result ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
      setTournaments([]);
    } finally {
      setLoadingTournaments(false);
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);


  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    setError(''); setSuccess('');
    if (!form.name || !form.registrationStartDate || !form.registrationEndDate || !form.startDate || !form.endDate || !form.numberOfRounds) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    // Ràng buộc giống BE để báo lỗi sớm, rõ ràng bằng tiếng Việt
    if (form.registrationEndDate <= form.registrationStartDate) {
      setError('Hạn chót đăng ký phải sau thời điểm mở đăng ký.');
      return;
    }
    if (form.startDate < form.registrationEndDate) {
      setError('Ngày bắt đầu giải phải từ sau khi đóng đăng ký.');
      return;
    }
    if (form.endDate <= form.startDate) {
      setError('Ngày kết thúc giải phải sau ngày bắt đầu.');
      return;
    }
    setLoading(true);
    try {
      const data: any = await createTournament({
        name: form.name,
        registrationStartDate: form.registrationStartDate,
        registrationEndDate: form.registrationEndDate,
        startDate: form.startDate,
        endDate: form.endDate,
        numberOfRounds: Number(form.numberOfRounds),
      });
      const newId = data?.tournamentId ?? data?.result?.tournamentId ?? data?.result?.id;
      // Submit xong: đóng modal + toast thông báo thành công
      toast.success(newId != null ? `Đã tạo giải đấu thành công! (ID = ${newId})` : 'Tạo giải đấu thành công!');
      closeModal();
      loadTournaments();
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setError(''); setSuccess('');
    setForm(INIT_FORM);
  }

  // Convert an ISO/date string to the value a datetime-local input expects.
  function toLocalInput(v: any): string {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openEdit(t: any) {
    setEditError(''); setEditSuccess('');
    setEditTarget(t);
    setEditForm({
      name: t.name ?? '',
      registrationStartDate: toLocalInput(t.registrationStartDate),
      registrationEndDate: toLocalInput(t.registrationEndDate),
      startDate: toLocalInput(t.startDate),
      endDate: toLocalInput(t.endDate),
      numberOfRounds: String(t.rounds?.length ?? t.numberOfRounds ?? ''),
      status: t.status ?? 'Upcoming',
    });
  }

  function setEdit(field: string, value: string) {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }

  function closeEdit() {
    setEditTarget(null);
    setEditError(''); setEditSuccess('');
  }

  async function handleUpdate() {
    if (!editTarget) return;
    setEditError(''); setEditSuccess('');
    if (!editForm.name || !editForm.registrationStartDate || !editForm.registrationEndDate || !editForm.startDate || !editForm.endDate || !editForm.numberOfRounds) {
      setEditError('Vui lòng điền đầy đủ tất cả các trường (bao gồm thời gian đăng ký).');
      return;
    }
    if (editForm.registrationEndDate <= editForm.registrationStartDate) {
      setEditError('Hạn chót đăng ký phải sau thời điểm mở đăng ký.');
      return;
    }
    if (editForm.startDate < editForm.registrationEndDate) {
      setEditError('Ngày bắt đầu giải phải từ sau khi đóng đăng ký.');
      return;
    }
    if (editForm.endDate <= editForm.startDate) {
      setEditError('Ngày kết thúc giải phải sau ngày bắt đầu.');
      return;
    }
    const id = editTarget.tournamentId ?? editTarget.id;
    setEditLoading(true);
    try {
      await updateTournament(id, {
        name: editForm.name,
        registrationStartDate: editForm.registrationStartDate,
        registrationEndDate: editForm.registrationEndDate,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        numberOfRounds: Number(editForm.numberOfRounds),
        status: editForm.status,
      });
      toast.success(`Đã cập nhật giải đấu "${editForm.name}"!`);
      await loadTournaments();
      closeEdit();
    } catch (err: unknown) {
      setEditError(parseApiError(err as Error));
    } finally {
      setEditLoading(false);
    }
  }

  const statsCounts: Record<StatusFilter, number> = {
    all: tournaments.length,
    active: tournaments.filter(t => t.status?.toLowerCase() === 'active').length,
    upcoming: tournaments.filter(t => t.status?.toLowerCase() === 'upcoming').length,
    completed: tournaments.filter(t => t.status?.toLowerCase() === 'completed').length,
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = (t.name ?? '').toLowerCase().includes(search.toLowerCase());
    const statusLower = t.status?.toLowerCase();
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && statusLower === 'active';
    if (filter === 'upcoming') return matchesSearch && statusLower === 'upcoming';
    if (filter === 'completed') return matchesSearch && statusLower === 'completed';
    return matchesSearch;
  });

  return (

    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: 'var(--page-bg)' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Quản lý giải đấu"
            subtitle="Tạo và quản lý các giải đấu"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Tạo giải đấu
              </button>
            }
          />

          {/* Status Filters */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'upcoming', 'completed'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  filter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/4'
                }`}
              >
                {s === 'all' ? 'Tất cả' : STATUS_CONFIG[s].label}
                <span className="ml-2 text-[11px] font-bold text-current opacity-60">
                  {statsCounts[s] ?? 0}
                </span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/4 border border-glass-border rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giải đấu..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {/* Tournament Cards */}
          {loadingTournaments ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải danh sách giải đấu...</div>
          ) : filteredTournaments.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredTournaments.map((t, i) => {
                const s = t.status?.toLowerCase() ?? 'upcoming';
                const config = STATUS_CONFIG[s] ?? STATUS_CONFIG.upcoming;
                return (
                  <motion.div
                    key={t.tournamentId ?? i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-gold/25 transition-all group relative overflow-hidden text-left"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    {/* Hàng trên: badge trạng thái (mép trái) — ID (mép phải) */}
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {config.label}
                      </span>
                      <span className="text-xs text-muted font-medium">ID: {t.tournamentId ?? t.id}</span>
                    </div>

                    {/* Nội dung */}
                    <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-3 line-clamp-1">{t.name}</h3>
                    <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-glass-border/40">
                      <div className="flex justify-between">
                        <span>Hạn đăng ký:</span>
                        <span className="text-champagne font-medium">{t.registrationEndDate ? new Date(t.registrationEndDate).toLocaleString('vi-VN') : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày bắt đầu:</span>
                        <span className="text-white font-medium">{t.startDate ? new Date(t.startDate).toLocaleString() : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ngày kết thúc:</span>
                        <span className="text-white font-medium">{t.endDate ? new Date(t.endDate).toLocaleString() : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Số vòng đấu:</span>
                        <span className="text-gold font-bold">{t.rounds?.length ?? t.numberOfRounds ?? '—'}</span>
                      </div>
                    </div>

                    {/* Hàng dưới: 3 nút thao tác căn giữa */}
                    <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-glass-border/40">
                      <button
                        onClick={() => openEdit(t)}
                        className="px-3 py-1.5 rounded-lg border border-glass-border text-muted hover:text-gold hover:border-gold/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Pencil size={11} /> Sửa
                      </button>
                      <button
                        onClick={() => openDetail(t)}
                        title="Xem chi tiết giải đấu"
                        className="px-3 py-1.5 rounded-lg border border-glass-border text-muted hover:text-blue-400 hover:border-blue-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye size={11} /> Chi tiết
                      </button>
                      <button
                        onClick={() => handleGenerateFinal(t.tournamentId ?? t.id, t.name)}
                        disabled={finalLoading === (t.tournamentId ?? t.id)}
                        title="Tạo trận chung kết từ các ngựa thắng vòng trước"
                        className="px-3 py-1.5 rounded-lg border border-glass-border text-muted hover:text-gold hover:border-gold/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Star size={11} /> {finalLoading === (t.tournamentId ?? t.id) ? 'Đang tạo…' : 'Final'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}


        </main>
      </div>

      {/* Create Tournament Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-gold/10 to-transparent blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Tạo giải đấu mới</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Tên giải đấu *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Giải Đua Mùa Thu 2026" className={INPUT} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Mở đăng ký *</label>
                  <input
                    type="datetime-local"
                    value={form.registrationStartDate}
                    onChange={e => set('registrationStartDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className={LABEL}>Hạn chót đăng ký *</label>
                  <input
                    type="datetime-local"
                    value={form.registrationEndDate}
                    onChange={e => set('registrationEndDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ngày bắt đầu giải *</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className={LABEL}>Ngày kết thúc giải *</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={e => set('endDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL}>Số vòng đua *</label>
                <input
                  value={form.numberOfRounds}
                  onChange={e => set('numberOfRounds', e.target.value)}
                  type="number"
                  min="1"
                  placeholder="VD: 5"
                  className={INPUT}
                />
              </div>

              {error && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
              {success && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{success}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Đang tạo…' : 'Tạo giải đấu'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Tournament Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-gold/10 to-transparent blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Pencil size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Sửa giải đấu</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Tên giải đấu *</label>
                <input value={editForm.name} onChange={e => setEdit('name', e.target.value)} placeholder="Tên giải đấu" className={INPUT} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Mở đăng ký *</label>
                  <input type="datetime-local" value={editForm.registrationStartDate} onChange={e => setEdit('registrationStartDate', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className={LABEL}>Hạn chót đăng ký *</label>
                  <input type="datetime-local" value={editForm.registrationEndDate} onChange={e => setEdit('registrationEndDate', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ngày bắt đầu giải *</label>
                  <input type="datetime-local" value={editForm.startDate} onChange={e => setEdit('startDate', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className={LABEL}>Ngày kết thúc giải *</label>
                  <input type="datetime-local" value={editForm.endDate} onChange={e => setEdit('endDate', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Số vòng đua *</label>
                  <input value={editForm.numberOfRounds} onChange={e => setEdit('numberOfRounds', e.target.value)} type="number" min="1" placeholder="VD: 5" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Trạng thái</label>
                  <select value={editForm.status} onChange={e => setEdit('status', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }}>
                    <option value="Upcoming">Sắp diễn ra</option>
                    <option value="Active">Đang diễn ra</option>
                    <option value="Completed">Đã kết thúc</option>
                  </select>
                </div>
              </div>

              {editError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{editError}</div>}
              {editSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{editSuccess}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeEdit} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleUpdate} disabled={editLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {editLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Chi tiết giải đấu ── */}
      {detailT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-2xl border border-gold/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-serif text-white truncate">{detailT.name}</h2>
                <p className="text-[11px] text-muted">ID: {detailT.tournamentId ?? detailT.id} • {detailT.status ?? '—'}</p>
              </div>
              <div className="flex-1" />
              <button onClick={() => setDetailT(null)} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            {detailT.description && <p className="text-sm text-muted mb-5 leading-relaxed">{detailT.description}</p>}

            {/* Mốc thời gian */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { l: 'Mở đăng ký', v: detailT.registrationStartDate ? new Date(detailT.registrationStartDate).toLocaleString('vi-VN') : '—' },
                { l: 'Hạn đăng ký', v: detailT.registrationEndDate ? new Date(detailT.registrationEndDate).toLocaleString('vi-VN') : '—' },
                { l: 'Bắt đầu giải', v: detailT.startDate ? new Date(detailT.startDate).toLocaleString('vi-VN') : '—' },
                { l: 'Kết thúc giải', v: detailT.endDate ? new Date(detailT.endDate).toLocaleString('vi-VN') : '—' },
              ].map(x => (
                <div key={x.l} className="rounded-lg bg-white/3 border border-glass-border px-3 py-2.5">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider">{x.l}</div>
                  <div className="text-xs text-white font-semibold mt-1 leading-snug">{x.v}</div>
                </div>
              ))}
            </div>

            {/* Danh sách vòng đấu */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock size={14} className="text-gold" />
                <span className="text-xs font-bold text-muted uppercase tracking-wider">Vòng đấu</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-champagne">{detailRounds.length}</span>
              </div>
              {detailLoading ? (
                <div className="text-center py-6 text-muted text-sm">Đang tải…</div>
              ) : detailRounds.length === 0 ? (
                <div className="text-xs text-muted/60 italic px-1">Chưa có vòng đấu nào cho giải này.</div>
              ) : (
                <div className="space-y-1.5">
                  {[...detailRounds].sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0)).map((r: any, i: number) => (
                    <div key={r.roundId ?? i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/2 border border-glass-border">
                      <span className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-bold text-champagne shrink-0">{r.roundNumber ?? i + 1}</span>
                      <div className="min-w-0">
                        <div className="text-sm text-white font-medium truncate">{r.name ?? `Vòng ${r.roundNumber ?? i + 1}`}</div>
                        <div className="text-[11px] text-muted">
                          {r.startDate ? new Date(r.startDate).toLocaleDateString('vi-VN') : '—'} → {r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—'}
                        </div>
                      </div>
                      <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">{r.status ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted/60 mt-2">Xem & quản lý các cuộc đua của từng vòng tại trang <b>Quản lý cuộc đua</b>.</p>
            </div>

            {closeRegMsg && (
              <div className={`text-sm px-4 py-3 rounded-lg border mb-4 ${closeRegMsg.includes('thành công') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{closeRegMsg}</div>
            )}

            <div className="flex gap-3">
              <button onClick={handleCloseRegistration} disabled={closeRegLoading}
                className="flex-1 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 text-sm font-bold disabled:opacity-60 transition-colors">
                {closeRegLoading ? 'Đang đóng…' : 'Đóng đăng ký ngay'}
              </button>
              <button onClick={() => setDetailT(null)} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Đóng</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
