import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Users, Flag, Clock, Edit2, Eye, ChevronDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { createRace } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

const TOURNAMENTS = [
  { id: 1, name: 'Giải Đua Mùa Xuân 2026' },
  { id: 2, name: 'Cúp Vô Địch Quốc Gia 2026' },
  { id: 3, name: 'Giải Khai Mạc Hè 2026' },
];

const RACES_BY_TOURNAMENT: Record<number, {
  id: number; name: string; round: number; date: string; time: string;
  horses: number; distance: string; status: 'scheduled' | 'in_progress' | 'completed';
}[]> = {
  1: [
    { id: 1, name: 'Vòng 1 - Chặng Mở Đầu', round: 1, date: '10/06/2026', time: '08:00', horses: 12, distance: '1.200m', status: 'completed' },
    { id: 2, name: 'Vòng 2 - Chặng Tốc Độ', round: 2, date: '12/06/2026', time: '09:30', horses: 10, distance: '1.600m', status: 'completed' },
    { id: 3, name: 'Vòng 3 - Chặng Sức Bền', round: 3, date: '15/06/2026', time: '08:00', horses: 14, distance: '2.000m', status: 'in_progress' },
    { id: 4, name: 'Vòng 4 - Bán Kết', round: 4, date: '20/06/2026', time: '09:00', horses: 8, distance: '1.800m', status: 'scheduled' },
    { id: 5, name: 'Chung Kết', round: 5, date: '28/06/2026', time: '10:00', horses: 6, distance: '2.400m', status: 'scheduled' },
  ],
  2: [
    { id: 6, name: 'Vòng Loại 1', round: 1, date: '15/07/2026', time: '08:00', horses: 20, distance: '1.000m', status: 'scheduled' },
    { id: 7, name: 'Vòng Loại 2', round: 2, date: '18/07/2026', time: '09:00', horses: 20, distance: '1.200m', status: 'scheduled' },
    { id: 8, name: 'Tứ Kết', round: 3, date: '25/07/2026', time: '08:30', horses: 16, distance: '1.600m', status: 'scheduled' },
  ],
  3: [
    { id: 9, name: 'Vòng 1 - Khởi Động', round: 1, date: '10/07/2026', time: '07:30', horses: 10, distance: '1.000m', status: 'scheduled' },
    { id: 10, name: 'Chung Kết', round: 2, date: '15/07/2026', time: '09:00', horses: 6, distance: '1.400m', status: 'scheduled' },
  ],
};

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  in_progress: { label: 'In Progress', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400 animate-pulse' },
  completed: { label: 'Completed', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
};

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_FORM = { roundId: '', name: '', raceDate: '', distanceMeter: '', maxLanes: '' };

export function AdminRacesPage() {
  const [selectedTournament, setSelectedTournament] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const races = RACES_BY_TOURNAMENT[selectedTournament] ?? [];
  const tournament = TOURNAMENTS.find(t => t.id === selectedTournament)!;

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    setError(''); setSuccess('');
    if (!form.roundId || !form.name || !form.raceDate || !form.distanceMeter || !form.maxLanes) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    setLoading(true);
    try {
      await createRace({
        roundId: Number(form.roundId),
        name: form.name,
        raceDate: form.raceDate,
        distanceMeter: Number(form.distanceMeter),
        maxLanes: Number(form.maxLanes),
      });
      setSuccess('Tạo cuộc đua thành công!');
      setForm(INIT_FORM);
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

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Quản lý cuộc đua"
            subtitle="Lập lịch và theo dõi các vòng đua"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Thêm cuộc đua
              </button>
            }
          />

          {/* Tournament Selector */}
          <div className="relative w-fit">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 glass-panel border border-glass-border hover:border-gold/30 rounded-xl px-5 py-3 text-sm font-medium text-white transition-all"
            >
              <Flag size={16} className="text-gold" />
              {tournament.name}
              <ChevronDown size={15} className={`text-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showDropdown && (
              <div className="absolute top-full mt-1 left-0 z-20 glass-panel border border-glass-border rounded-xl overflow-hidden shadow-2xl min-w-[280px]">
                {TOURNAMENTS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTournament(t.id); setShowDropdown(false); }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${t.id === selectedTournament ? 'text-champagne bg-gold/10' : 'text-body hover:text-white hover:bg-white/5'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tổng vòng đua', value: races.length, icon: Flag, color: 'text-gold' },
              { label: 'Đã hoàn thành', value: races.filter(r => r.status === 'completed').length, icon: Calendar, color: 'text-emerald-400' },
              { label: 'Đang chạy', value: races.filter(r => r.status === 'in_progress').length, icon: Clock, color: 'text-blue-400' },
              { label: 'Tổng ngựa tham gia', value: races.reduce((s, r) => s + r.horses, 0), icon: Users, color: 'text-purple-400' },
            ].map((s, i) => (
              <div key={i} className="glass-panel rounded-xl p-4 flex items-center gap-4 border border-glass-border">
                <div className={`w-10 h-10 rounded-xl bg-white/5 border border-glass-border flex items-center justify-center ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <div>
                  <div className="text-xl font-serif font-bold text-white">{s.value}</div>
                  <div className="text-[11px] text-muted font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Race List */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden">
            <div className="p-5 border-b border-glass-border">
              <h2 className="text-base font-serif text-white">Danh sách cuộc đua — {tournament.name}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border bg-navy-light/30">
                  {['Vòng', 'Tên cuộc đua', 'Ngày giờ', 'Cự ly', 'Số ngựa', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted font-bold px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {races.map((r, i) => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-glass-border/50 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif font-bold text-champagne text-sm">
                          {r.round}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-white">{r.name}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-white">{r.date}</div>
                        <div className="text-xs text-muted">{r.time}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-champagne font-medium">{r.distance}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-white">
                          <Users size={13} className="text-muted" /> {r.horses}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Xem"><Eye size={14} /></button>
                          {r.status === 'scheduled' && (
                            <button className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors" title="Chỉnh sửa"><Edit2 size={14} /></button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>

        </main>
      </div>

      {/* Add Race Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Thêm cuộc đua mới</h2>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Round ID *</label>
                <input value={form.roundId} onChange={e => set('roundId', e.target.value)} type="number" min="1" placeholder="ID vòng đấu" className={INPUT} />
              </div>

              <div>
                <label className={LABEL}>Tên cuộc đua *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Vòng 4 - Bán Kết" className={INPUT} />
              </div>

              <div>
                <label className={LABEL}>Ngày & giờ đua *</label>
                <input
                  type="datetime-local"
                  value={form.raceDate}
                  onChange={e => set('raceDate', e.target.value)}
                  className={INPUT}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Cự ly (m) *</label>
                  <input value={form.distanceMeter} onChange={e => set('distanceMeter', e.target.value)} type="number" min="100" placeholder="VD: 1600" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Số làn đua (Max Lanes) *</label>
                  <input value={form.maxLanes} onChange={e => set('maxLanes', e.target.value)} type="number" min="1" placeholder="VD: 12" className={INPUT} />
                </div>
              </div>

              {error && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
              {success && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{success}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Đang tạo…' : 'Lưu cuộc đua'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
