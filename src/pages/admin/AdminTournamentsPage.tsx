import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trophy, Calendar, Users, DollarSign, Edit2, Trash2, Eye, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { createTournament } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

type StatusFilter = 'all' | 'upcoming' | 'active' | 'completed';

const TOURNAMENTS = [
  { id: 1, name: 'Giải Đua Mùa Xuân 2026', start: '01/06/2026', end: '30/06/2026', horses: 42, races: 8, prize: '₫850.000.000', status: 'active', location: 'Trường đua Phú Thọ' },
  { id: 2, name: 'Cúp Vô Địch Quốc Gia 2026', start: '15/07/2026', end: '20/08/2026', horses: 60, races: 12, prize: '₫2.400.000.000', status: 'upcoming', location: 'Trường đua Đại Nam' },
  { id: 3, name: 'Giải Khai Mạc Hè 2026', start: '10/07/2026', end: '15/07/2026', horses: 24, races: 4, prize: '₫320.000.000', status: 'upcoming', location: 'Trường đua Phú Thọ' },
  { id: 4, name: 'Giải Truyền Thống 2025', start: '05/11/2025', end: '30/11/2025', horses: 38, races: 10, prize: '₫680.000.000', status: 'completed', location: 'Trường đua Đại Nam' },
  { id: 5, name: 'Giải Cuối Năm 2025', start: '10/12/2025', end: '25/12/2025', horses: 30, races: 6, prize: '₫450.000.000', status: 'completed', location: 'Trường đua Phú Thọ' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Đang diễn ra', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  upcoming: { label: 'Sắp diễn ra', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  completed: { label: 'Đã kết thúc', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
};

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_FORM = { name: '', startDate: '', endDate: '', numberOfRounds: '' };

export function AdminTournamentsPage() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const filtered = TOURNAMENTS.filter(t =>
    (filter === 'all' || t.status === filter) &&
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    setError(''); setSuccess('');
    if (!form.name || !form.startDate || !form.endDate || !form.numberOfRounds) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    setLoading(true);
    try {
      await createTournament({
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        numberOfRounds: Number(form.numberOfRounds),
      });
      setSuccess('Tạo giải đấu thành công!');
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
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

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
                  filter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {s === 'all' ? 'Tất cả' : STATUS_CONFIG[s].label}
                <span className="ml-2 text-[11px] font-bold text-current opacity-60">
                  {s === 'all' ? TOURNAMENTS.length : TOURNAMENTS.filter(t => t.status === s).length}
                </span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giải đấu..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {/* Tournament Cards */}
          <div className="space-y-3">
            {filtered.map((t, i) => {
              const cfg = STATUS_CONFIG[t.status];
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/20 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center shrink-0">
                      <Trophy size={20} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-serif text-white group-hover:text-champagne transition-colors">{t.name}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${t.status === 'active' ? 'animate-pulse' : ''}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1"><Calendar size={11} className="text-gold/60" /> {t.start} – {t.end}</span>
                        <span className="flex items-center gap-1"><Users size={11} className="text-gold/60" /> {t.horses} ngựa</span>
                        <span className="flex items-center gap-1"><Trophy size={11} className="text-gold/60" /> {t.races} cuộc đua</span>
                        <span className="flex items-center gap-1"><DollarSign size={11} className="text-gold/60" /> {t.prize}</span>
                        <span className="text-muted/60">{t.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Xem chi tiết">
                        <Eye size={15} />
                      </button>
                      <button className="p-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors" title="Chỉnh sửa">
                        <Edit2 size={15} />
                      </button>
                      {t.status !== 'active' && (
                        <button className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Xóa">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {t.status === 'active' && (
                    <div className="mt-4 pt-4 border-t border-glass-border">
                      <div className="flex justify-between text-[11px] text-muted mb-1.5 font-medium">
                        <span>Tiến độ giải đấu</span>
                        <span className="text-gold font-bold">62%</span>
                      </div>
                      <div className="h-1.5 bg-navy rounded-full overflow-hidden border border-glass-border">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gold to-champagne rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '62%' }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

        </main>
      </div>

      {/* Create Tournament Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20"
          >
            <h2 className="text-xl font-serif text-white mb-6">Tạo giải đấu mới</h2>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Tên giải đấu *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Giải Đua Mùa Thu 2026" className={INPUT} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className={LABEL}>Ngày kết thúc *</label>
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
    </div>
  );
}
