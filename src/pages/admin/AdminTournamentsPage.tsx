import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trophy, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createTournament } from '../../api/adminService';
import { getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';

type StatusFilter = 'all' | 'upcoming' | 'active' | 'completed';

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

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

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
    if (!form.name || !form.startDate || !form.endDate || !form.numberOfRounds) {
      setError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    setLoading(true);
    try {
      const data: any = await createTournament({
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate,
        numberOfRounds: Number(form.numberOfRounds),
      });
      const newId = data?.tournamentId ?? data?.result?.tournamentId ?? data?.result?.id;
      setSuccess(newId != null
        ? `Đã tạo giải đấu thành công! ID = ${newId} — dùng ID này cho bước tạo giải thưởng / đăng ký thi đấu.`
        : 'Tạo giải đấu thành công!');
      setForm(INIT_FORM);
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

    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
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
                  {statsCounts[s] ?? 0}
                </span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giải đấu..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {/* Tournament Cards */}
          {loadingTournaments ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải danh sách giải đấu...</div>
          ) : filteredTournaments.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
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
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {config.label}
                      </span>
                      <span className="text-xs text-muted font-medium">ID: {t.tournamentId}</span>
                    </div>
                    <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-3 line-clamp-1">{t.name}</h3>
                    <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-glass-border/40">
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
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Tạo giải đấu mới</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

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
