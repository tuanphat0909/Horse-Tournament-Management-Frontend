import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ShieldCheck, Edit2, Trash2, Eye, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { getMyHorses, createHorse, getHorse, updateHorse, deleteHorse } from '../../api/ownerService';
import { parseApiError } from '../../api/authService';

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_CREATE = { name: '', breed: '', age: '', gender: 'Male' };
const INIT_EDIT   = { name: '', breed: '', age: '', gender: 'Male', healthStatus: '' };

export function OwnerHorsesPage() {
  const [horses, setHorses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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
      await createHorse({ name: createForm.name, breed: createForm.breed, age: Number(createForm.age), gender: createForm.gender });
      setShowCreate(false);
      setCreateForm(INIT_CREATE);
      loadHorses();
    } catch (err: unknown) {
      setCreateError(parseApiError(err as Error));
    } finally {
      setCreateLoading(false);
    }
  }

  function openEdit(horse: any) {
    setEditHorse(horse);
    setEditForm({ name: horse.name ?? '', breed: horse.breed ?? '', age: String(horse.age ?? ''), gender: horse.gender ?? 'Male', healthStatus: horse.healthStatus ?? '' });
    setEditError('');
  }

  async function handleEdit() {
    if (!editHorse) return;
    setEditError('');
    setEditLoading(true);
    try {
      await updateHorse(editHorse.id, { name: editForm.name, breed: editForm.breed, age: Number(editForm.age), gender: editForm.gender, healthStatus: editForm.healthStatus });
      setEditHorse(null);
      loadHorses();
    } catch (err: unknown) {
      setEditError(parseApiError(err as Error));
    } finally {
      setEditLoading(false);
    }
  }

  async function openView(id: number) {
    setViewLoading(true);
    setViewHorse({});
    try {
      const data = await getHorse(id);
      setViewHorse(data?.result ?? data);
    } catch {
      setViewHorse(horses.find(h => h.id === id) ?? null);
    } finally {
      setViewLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Xác nhận xóa ngựa này?')) return;
    setDeletingId(id);
    try {
      await deleteHorse(id);
      setHorses(prev => prev.filter(h => h.id !== id));
    } catch (err: unknown) {
      alert(parseApiError(err as Error));
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = horses.filter(h => (h.name ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
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

          <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-72">
            <Search size={15} className="text-muted shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên ngựa..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
          </div>

          {loading && <div className="text-center py-16 text-muted text-sm">Đang tải...</div>}
          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-panel rounded-2xl overflow-hidden border border-glass-border hover:border-gold/25 transition-all group">
                  <div className="relative h-36 overflow-hidden bg-gradient-to-br from-gold/10 to-navy/80 flex items-center justify-center">
                    <span className="text-5xl">🐴</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-serif text-white group-hover:text-champagne transition-colors">{h.name}</h3>
                        <p className="text-xs text-muted">{h.breed} • {h.age} tuổi • {h.gender === 'Male' ? 'Đực' : 'Cái'}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openView(h.id)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"><Eye size={13} /></button>
                        <button onClick={() => openEdit(h)} className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(h.id)} disabled={deletingId === h.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {h.healthStatus && (
                      <div className="flex justify-between text-[11px] text-muted font-medium">
                        <span className="flex items-center gap-1"><ShieldCheck size={10} /> Sức khỏe</span>
                        <span className="text-champagne">{h.healthStatus}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full glass-panel rounded-xl p-12 text-center text-muted text-sm">
                  {horses.length === 0 ? 'Chưa có ngựa nào. Nhấn "Thêm ngựa" để bắt đầu.' : 'Không tìm thấy ngựa phù hợp.'}
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
                  <label className={LABEL}>Tuổi *</label>
                  <input type="number" min="0" value={createForm.age} onChange={e => setCreateForm(p => ({...p, age: e.target.value}))} placeholder="VD: 3" className={INPUT} />
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
                  <label className={LABEL}>Tuổi</label>
                  <input type="number" min="0" value={editForm.age} onChange={e => setEditForm(p => ({...p, age: e.target.value}))} className={INPUT} />
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
                <input value={editForm.healthStatus} onChange={e => setEditForm(p => ({...p, healthStatus: e.target.value}))} placeholder="VD: Tốt, Bị chấn thương..." className={INPUT} />
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-md border border-gold/20">
            {viewLoading ? (
              <div className="text-center py-8 text-muted text-sm">Đang tải...</div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">🐴</div>
                  <h2 className="text-2xl font-serif text-white">{viewHorse.name}</h2>
                  <p className="text-sm text-muted mt-1">{viewHorse.breed}</p>
                </div>
                <div className="space-y-1">
                  {[
                    { l: 'Tuổi', v: viewHorse.age != null ? `${viewHorse.age} tuổi` : '—' },
                    { l: 'Giới tính', v: viewHorse.gender === 'Male' ? 'Đực' : viewHorse.gender === 'Female' ? 'Cái' : '—' },
                    { l: 'Sức khỏe', v: viewHorse.healthStatus ?? '—' },
                  ].map(row => (
                    <div key={row.l} className="flex justify-between py-2.5 border-b border-glass-border text-sm">
                      <span className="text-muted">{row.l}</span>
                      <span className="text-white font-medium">{row.v}</span>
                    </div>
                  ))}
                </div>
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
