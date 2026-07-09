import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ShieldCheck, Edit2, Trash2, Eye, Search, ArrowUpDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getMyHorses, createHorse, getHorse, updateHorse, deleteHorse, getOwnerResults } from '../../api/ownerService';
import { parseApiError } from '../../api/authService';
import { calculateAge, formatDateOnly } from '../../utils/format';
import { useNotifications } from '../../context/NotificationContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_CREATE = { name: '', breed: '', age: '', gender: 'Male' };
const INIT_EDIT   = { name: '', breed: '', age: '', gender: 'Male', healthStatus: 'Healthy' };

// Giá trị lưu bằng tiếng Anh cho khớp dữ liệu BE (Horse.HealthStatus mặc định "Healthy")
const HEALTH_OPTIONS = [
  { value: 'Healthy',    label: 'Khỏe mạnh (Healthy)' },
  { value: 'Injured',    label: 'Chấn thương (Injured)' },
  { value: 'Sick',       label: 'Bị bệnh (Sick)' },
  { value: 'Recovering', label: 'Đang hồi phục (Recovering)' },
  { value: 'Retired',    label: 'Ngừng thi đấu (Retired)' },
];

export function OwnerHorsesPage() {
  const { showToast } = useNotifications();
  const [horses, setHorses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'ageAsc' | 'ageDesc'>('name');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(INIT_CREATE);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editHorse, setEditHorse] = useState<any | null>(null);
  const [editForm, setEditForm] = useState(INIT_EDIT);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [viewHorse, setViewHorse] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [horseRaces, setHorseRaces] = useState<any[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadHorses() {
    setLoading(true); setError('');
    try {
      const data = await getMyHorses();
      setHorses(data?.result ?? (Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadHorses(); }, []);

  async function handleCreate() {
    setCreateError('');
    if (!createForm.name || !createForm.breed || !createForm.age) {
      setCreateError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setCreateLoading(true);
    try {
      await createHorse({ name: createForm.name, breed: createForm.breed, age: createForm.age, gender: createForm.gender });
      setShowCreate(false);
      setCreateForm(INIT_CREATE);
      showToast('Thành công', 'Đã thêm ngựa mới thành công!');
      loadHorses();
    } catch (err: unknown) {
      setCreateError(parseApiError(err as Error));
    } finally {
      setCreateLoading(false);
    }
  }

  function openEdit(horse: any) {
    setEditHorse(horse);
    setEditForm({ name: horse.name ?? '', breed: horse.breed ?? '', age: horse.age ? horse.age.split('T')[0] : '', gender: horse.gender ?? 'Male', healthStatus: horse.healthStatus || 'Healthy' });
    setEditError('');
  }

  async function handleEdit() {
    if (!editHorse) return;
    setEditError('');
    setEditLoading(true);
    try {
      await updateHorse(editHorse.id, { name: editForm.name, breed: editForm.breed, age: editForm.age, gender: editForm.gender, healthStatus: editForm.healthStatus });
      setEditHorse(null);
      showToast('Thành công', 'Đã cập nhật thông tin ngựa thành công!');
      loadHorses();
    } catch (err: unknown) {
      setEditError(parseApiError(err as Error));
    } finally {
      setEditLoading(false);
    }
  }

  async function openView(id: number) {
    setViewLoading(true);
    setLoadingRaces(true);
    setHorseRaces([]);
    setActiveTab('info');
    setViewHorse({});
    try {
      const data = await getHorse(id);
      const horseData = data?.result ?? data;
      setViewHorse(horseData);

      const resultsData = await getOwnerResults();
      const allResults = resultsData?.result ?? (Array.isArray(resultsData) ? resultsData : []);
      if (horseData?.name) {
        const filtered = allResults.filter((r: any) => r.horseName === horseData.name);
        setHorseRaces(filtered);
      }
    } catch (err) {
      console.error(err);
      setViewHorse(horses.find(h => h.id === id) ?? null);
    } finally {
      setViewLoading(false);
      setLoadingRaces(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Xác nhận xóa ngựa này?')) return;
    setDeletingId(id);
    try {
      await deleteHorse(id);
      setHorses(prev => prev.filter(h => h.id !== id));
      showToast('Thành công', 'Đã xóa ngựa thành công!', 'success');
    } catch (err: unknown) {
      showToast('Thất bại', parseApiError(err as Error), 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = horses
    .filter(h => (h.name ?? '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'ageAsc': return new Date(b.age ?? 0).getTime() - new Date(a.age ?? 0).getTime(); // sinh sau = trẻ hơn
        case 'ageDesc': return new Date(a.age ?? 0).getTime() - new Date(b.age ?? 0).getTime();
        case 'name':
        default: return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'vi');
      }
    });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Quản lý ngựa"
            subtitle="Danh sách ngựa trong chuồng của bạn"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 58%"
            actions={
              <button onClick={() => setShowCreate(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Thêm ngựa
              </button>
            }
          />

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border focus-within:border-gold/40 rounded-lg px-3 py-2 w-72 transition-colors">
              <Search size={15} className="text-gold/60 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên ngựa..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 transition-colors"
                style={{ colorScheme: 'dark' }}
              >
                <option value="name">Tên A-Z</option>
                <option value="ageAsc">Trẻ nhất</option>
                <option value="ageDesc">Lớn tuổi nhất</option>
              </select>
            </div>
          </div>

          {loading && <LoadingSkeleton />}
          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-panel rounded-2xl overflow-hidden border border-glass-border hover:border-gold/25 transition-all group relative">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent z-10 pointer-events-none" />
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-gold/10 to-navy/80 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)', backgroundSize: '18px 18px' }} />
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/15 to-transparent blur-[30px] pointer-events-none" />
                    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/25 ring-1 ring-gold/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <span className="text-5xl drop-shadow-[0_2px_8px_rgba(201,168,76,0.35)]">🐴</span>
                    </div>
                    <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-navy/70 backdrop-blur-sm border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-xs">{i + 1}</div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                  </div>
                  <div className="p-5 relative">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-serif text-white group-hover:text-champagne transition-colors">{h.name}</h3>
                        <p className="text-xs text-muted mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted">{h.breed}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-champagne">{calculateAge(h.age)} tuổi</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted">{h.gender === 'Male' ? 'Đực' : 'Cái'}</span>
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openView(h.id)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"><Eye size={13} /></button>
                        <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(h.id)} disabled={deletingId === h.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {h.healthStatus && (
                      <div className="flex justify-between items-center text-[11px] text-muted font-medium mt-1 pt-3 border-t border-glass-border/60">
                        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><ShieldCheck size={10} /></span> Sức khỏe</span>
                        <span className="text-champagne font-semibold px-2 py-0.5 rounded-full bg-gold/[0.06] border border-gold/20">{h.healthStatus}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full glass-panel rounded-xl p-12 text-center text-muted text-sm relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-4xl opacity-40 mb-3">🐴</div>
                    {horses.length === 0 ? 'Chưa có ngựa nào. Nhấn "Thêm ngựa" để bắt đầu.' : 'Không tìm thấy ngựa phù hợp.'}
                    <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Thêm ngựa mới</h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Tên ngựa *</label>
                <input value={createForm.name} onChange={e => setCreateForm(p => ({...p, name: e.target.value}))} placeholder="VD: Thunder King" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Giống ngựa *</label>
                <input value={createForm.breed} onChange={e => setCreateForm(p => ({...p, breed: e.target.value}))} placeholder="VD: Thoroughbred" className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ngày sinh *</label>
                  <input type="date" value={createForm.age} onChange={e => setCreateForm(p => ({...p, age: e.target.value}))} className={INPUT} style={{colorScheme: 'dark'}} />
                </div>
                <div>
                  <label className={LABEL}>Giới tính *</label>
                  <select value={createForm.gender} onChange={e => setCreateForm(p => ({...p, gender: e.target.value}))} className={INPUT}>
                    <option value="Male">Đực</option>
                    <option value="Female">Cái</option>
                  </select>
                </div>
              </div>
              {createError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{createError}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreate(false); setCreateForm(INIT_CREATE); setCreateError(''); }}
                className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleCreate} disabled={createLoading}
                className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">
                {createLoading ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit modal */}
      {editHorse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Chỉnh sửa — {editHorse.name}</h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Tên ngựa</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Giống ngựa</label>
                <input value={editForm.breed} onChange={e => setEditForm(p => ({...p, breed: e.target.value}))} className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ngày sinh *</label>
                  <input type="date" value={editForm.age} onChange={e => setEditForm(p => ({...p, age: e.target.value}))} className={INPUT} style={{colorScheme: 'dark'}} />
                </div>
                <div>
                  <label className={LABEL}>Giới tính</label>
                  <select value={editForm.gender} onChange={e => setEditForm(p => ({...p, gender: e.target.value}))} className={INPUT}>
                    <option value="Male">Đực</option>
                    <option value="Female">Cái</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Tình trạng sức khỏe</label>
                <select value={editForm.healthStatus} onChange={e => setEditForm(p => ({...p, healthStatus: e.target.value}))} className={INPUT} style={{colorScheme: 'dark'}}>
                  {HEALTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  {/* Dữ liệu cũ nhập tay không nằm trong danh sách chuẩn — giữ lại để không bị mất khi lưu */}
                  {editForm.healthStatus && !HEALTH_OPTIONS.some(o => o.value === editForm.healthStatus) && (
                    <option value={editForm.healthStatus}>{editForm.healthStatus} (giá trị cũ)</option>
                  )}
                </select>
              </div>
              {editError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{editError}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditHorse(null); setEditError(''); }}
                className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleEdit} disabled={editLoading}
                className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">
                {editLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* View detail modal */}
      {viewHorse !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-xl border border-gold/20">
            {viewLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-gold/10 border border-gold/25 ring-1 ring-gold/30 flex items-center justify-center">
                    <span className="text-5xl drop-shadow-[0_2px_8px_rgba(201,168,76,0.35)]">🐴</span>
                  </div>
                  <h2 className="text-2xl font-serif text-white">{viewHorse.name}</h2>
                  <p className="text-sm text-muted mt-1">{viewHorse.breed}</p>
                  <div className="mx-auto mt-3 w-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-glass-border mb-6">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                      activeTab === 'info' 
                        ? 'border-gold text-gold' 
                        : 'border-transparent text-muted hover:text-white'
                    }`}
                  >
                    Thông tin & Thống kê
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                      activeTab === 'history' 
                        ? 'border-gold text-gold' 
                        : 'border-transparent text-muted hover:text-white'
                    }`}
                  >
                    Lịch sử thi đấu
                  </button>
                </div>

                {activeTab === 'info' ? (
                  <div className="space-y-6">
                    <div className="space-y-1">
                      {[
                        { l: 'Ngày sinh', v: formatDateOnly(viewHorse.age) },
                        { l: 'Tuổi', v: viewHorse.age != null ? `${calculateAge(viewHorse.age)} tuổi` : '—' },
                        { l: 'Giới tính', v: viewHorse.gender === 'Male' ? 'Đực' : viewHorse.gender === 'Female' ? 'Cái' : '—' },
                        { l: 'Sức khỏe', v: viewHorse.healthStatus ?? '—' },
                      ].map(row => (
                        <div key={row.l} className="flex justify-between py-2.5 border-b border-glass-border text-sm">
                          <span className="text-muted">{row.l}</span>
                          <span className="text-white font-medium">{row.v}</span>
                        </div>
                      ))}
                    </div>

                    {/* Overall Stats Cards */}
                    <div>
                      <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Thống kê hiệu suất</h3>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="bg-white/[0.02] border border-glass-border rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Tổng số trận</div>
                          <div className="text-lg font-bold text-white font-mono">{viewHorse.statistic?.totalRaces ?? 0}</div>
                        </div>
                        <div className="bg-white/[0.02] border border-glass-border rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Số lần thắng (🥇)</div>
                          <div className="text-lg font-bold text-gold font-mono">{viewHorse.statistic?.totalWins ?? 0}</div>
                        </div>
                        <div className="bg-white/[0.02] border border-glass-border rounded-xl p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">Tốc độ TB</div>
                          <div className="text-sm font-bold text-white font-mono mt-0.5">{viewHorse.statistic?.averageSpeed ? `${Number(viewHorse.statistic.averageSpeed).toFixed(1)} m/s` : '—'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex justify-between p-2.5 rounded-lg bg-white/[0.01] border border-glass-border">
                          <span className="text-slate-300">🥈 Về nhì (Hạng 2)</span>
                          <span className="font-bold text-white font-mono">{viewHorse.statistic?.totalSecondPlaces ?? 0} lần</span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded-lg bg-white/[0.01] border border-glass-border">
                          <span className="text-amber-600">🥉 Về ba (Hạng 3)</span>
                          <span className="font-bold text-white font-mono">{viewHorse.statistic?.totalThirdPlaces ?? 0} lần</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {loadingRaces ? (
                      <LoadingSkeleton rows={4} h="h-10" />
                    ) : horseRaces.length === 0 ? (
                      <div className="text-center py-12 text-muted text-sm">
                        <div className="text-3xl opacity-40 mb-2">📋</div>
                        <div>Chưa tham gia cuộc đua nào.</div>
                      </div>
                    ) : (
                      horseRaces.map((r, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/20 transition-all flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{r.raceName}</div>
                            <div className="text-[10px] text-muted truncate mt-0.5">{r.tournamentName}</div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.finishPosition === 1 ? 'bg-gold/20 text-gold border border-gold/30' :
                                r.finishPosition === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                r.finishPosition === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                                'bg-white/10 text-white'
                              }`}>
                                Hạng {r.finishPosition}
                              </span>
                              <div className="text-[10px] text-muted font-mono mt-1 text-right">{r.finishTime ? `${r.finishTime}s` : '—'}</div>
                            </div>
                            {r.prizeAmount > 0 && (
                              <div className="text-right border-l border-glass-border pl-3 min-w-[70px]">
                                <div className="text-[10px] text-muted leading-none mb-1">Thưởng</div>
                                <div className="text-xs font-mono font-bold text-emerald-400">+{r.prizeAmount.toLocaleString('vi-VN')}đ</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <button onClick={() => setViewHorse(null)} className="w-full mt-6 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">
                  Đóng
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
