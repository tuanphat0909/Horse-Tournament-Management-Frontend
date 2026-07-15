import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Eye, EyeOff, ArrowUpDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRoles, createAccount, getAccounts, updateUserStatus } from '../../api/adminService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';
import { formatUtcDateTime } from '../../utils/format';
import { Pager, paginate } from '../../components/ui/Pager';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type RoleFilter = 'all' | 'owner' | 'jockey' | 'referee' | 'spectator' | 'admin';

const ROLE_LABELS: Record<string, string> = { owner: 'Horse Owner', jockey: 'Jockey', referee: 'Referee', spectator: 'Spectator', admin: 'Admin' };

const NEEDS_LICENSE = ['Jockey', 'Referee'];

const INIT_FORM = { fullName: '', email: '', password: '', role: '', licenseNumber: '', experienceYears: '' };

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

export function AdminUsersPage() {
  const { showToast } = useNotifications();
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [form, setForm] = useState(INIT_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function handleToggleStatus(id: number, currentStatus: string) {
    if (!confirm(`Bạn có chắc muốn ${currentStatus === 'Active' ? 'Khóa' : 'Mở khóa'} tài khoản này?`)) return;
    setTogglingId(id);
    try {
      await updateUserStatus(id);
      fetchAccounts();
    } catch (err: unknown) {
      alert(parseApiError(err as Error));
    } finally {
      setTogglingId(null);
    }
  }

  const fetchAccounts = () => {
    setLoadingAccounts(true);
    getAccounts()
      .then((data: any) => {
        const raw = Array.isArray(data) ? data
          : Array.isArray(data?.result) ? data.result
          : [];
        setAccounts(raw);
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    getRoles()
      .then((data: unknown) => {
        const raw = Array.isArray(data) ? data
          : Array.isArray((data as { result?: unknown }).result) ? (data as { result: unknown[] }).result
          : [];
        setRoles(raw.map((r: unknown) => (typeof r === 'string' ? r : (r as { name?: string }).name ?? '')).filter(Boolean));
      })
      .catch(() => setRoles([]));
  }, [showModal]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    setError(''); setSuccess('');
    if (!form.fullName || !form.email || !form.password || !form.role) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      };
      if (NEEDS_LICENSE.includes(form.role)) {
        if (form.licenseNumber) body.licenseNumber = form.licenseNumber;
        if (form.experienceYears) body.experienceYears = Number(form.experienceYears);
      }
      const data: any = await createAccount(body);
      const newId = data?.result?.id ?? data?.result?.accountId ?? data?.result?.user?.id;
      showToast('Success', newId != null ? `Đã tạo tài khoản successful! ID = ${newId}` : 'Tạo tài khoản successful!');
      closeModal();
      fetchAccounts();
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

  const counts = {
    all: accounts.length,
    admin: accounts.filter(a => (a.roleName ?? '').toLowerCase() === 'admin').length,
    owner: accounts.filter(a => (a.roleName ?? '').toLowerCase() === 'horseowner').length,
    jockey: accounts.filter(a => (a.roleName ?? '').toLowerCase() === 'jockey').length,
    referee: accounts.filter(a => (a.roleName ?? '').toLowerCase() === 'referee').length,
    spectator: accounts.filter(a => (a.roleName ?? '').toLowerCase() === 'spectator').length,
  };

  const filteredAccounts = accounts.filter(acc => {
    // 1. Role Filter
    if (filter !== 'all') {
      const targetRole = filter === 'owner' ? 'horseowner' : filter.toLowerCase();
      if ((acc.roleName ?? '').toLowerCase() !== targetRole) return false;
    }
    // 2. Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        acc.fullName?.toLowerCase().includes(q) ||
        acc.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    switch (sortBy) {
      case 'name': return String(a.fullName ?? '').localeCompare(String(b.fullName ?? ''), 'vi');
      case 'oldest': return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      case 'newest':
      default: return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    }
  });

  const { paged: pagedAccounts, totalPages, total, page: safePage } = paginate(sortedAccounts, page, 10);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Quản lý người dùng"
            subtitle="All tài khoản trong hệ thống"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Thêm người dùng
              </button>
            }
          />

          {/* Role Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {(['all', 'admin', 'owner', 'jockey', 'referee', 'spectator'] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => { setFilter(r); setPage(1); }}
                className={`glass-panel rounded-xl p-4 text-left border transition-all relative overflow-hidden group ${filter === r ? 'border-gold/40 bg-gold/5' : 'border-glass-border hover:border-gold/30 hover:bg-gold/[0.03]'}`}
              >
                <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[30px] pointer-events-none" />
                <div className="relative z-10 flex items-center gap-2 mb-1">
                  <Users size={14} className={filter === r ? 'text-gold' : 'text-muted'} />
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                    {r === 'all' ? 'All' : ROLE_LABELS[r]}
                  </span>
                </div>
                <div className="relative z-10 text-xl font-serif font-bold text-white">
                  {counts[r]}
                </div>
              </button>
            ))}
          </div>

          {/* Search + Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative p-5 border-b border-glass-border flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 flex-1 max-w-xs">
                <Search size={15} className="text-muted shrink-0" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm theo tên hoặc email..."
                  className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.04] border border-glass-border text-muted"><span className="text-champagne font-semibold">{filteredAccounts.length}</span> kết quả</span>
              <div className="ml-auto flex items-center gap-2">
                <ArrowUpDown size={14} className="text-muted" />
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                  className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 transition-colors"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {loadingAccounts ? (
              <LoadingSkeleton />
            ) : filteredAccounts.length === 0 ? (
              <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">👥</div>
                <div className="text-muted text-sm">Không tìm thấy tài khoản nào khớp yêu cầu</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border text-xs text-muted uppercase font-bold tracking-wider">
                      <th className="py-4 px-6">Họ và tên</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Ngày tạo</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/30 text-sm">
                    {pagedAccounts.map((user) => (
                      <tr key={user.userId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-semibold text-white">{user.fullName}</td>
                        <td className="py-4 px-6 text-muted">{user.email}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            user.roleName === 'Admin' ? 'text-gold bg-gold/10 border-gold/20' :
                            user.roleName === 'HorseOwner' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                            user.roleName === 'Jockey' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            user.roleName === 'Referee' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' :
                            'text-gray-400 bg-gray-500/10 border-gray-500/20'
                          }`}>
                            {ROLE_LABELS[user.roleName?.toLowerCase()] ?? user.roleName}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            user.status === 'Active' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {user.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-muted">
                          {formatUtcDateTime(user.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleStatus(user.userId, user.status)}
                            disabled={user.roleName === 'Admin' || togglingId === user.userId}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                              user.roleName === 'Admin' ? 'opacity-30 cursor-not-allowed bg-glass-border/30 text-muted' :
                              user.status === 'Active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' :
                              'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                            }`}
                          >
                            {togglingId === user.userId ? '...' : user.status === 'Active' ? 'Khóa' : 'Mở khóa'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
          </motion.div>

        </main>
      </div>

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 max-h-[90vh] overflow-y-auto relative"
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Plus size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Tạo tài khoản mới</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className={LABEL}>Họ và tên *</label>
                <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" className={INPUT} />
              </div>

              {/* Email */}
              <div>
                <label className={LABEL}>Email *</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="example@email.com" className={INPUT} />
              </div>

              {/* Password */}
              <div>
                <label className={LABEL}>Password *</label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Dark thiểu 6 ký tự"
                    className={INPUT + ' pr-10'}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-white">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className={LABEL}>Role *</label>
                {roles.length === 0 ? (
                  <LoadingSkeleton />
                ) : (
                  <select
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">-- Select Role --</option>
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Conditional: Jockey / Referee only */}
              {NEEDS_LICENSE.includes(form.role) && (
                <>
                  <div>
                    <label className={LABEL}>Số giấy phép (License Number)</label>
                    <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="VD: LIC-2024-001" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Số years of experience</label>
                    <input value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} type="number" min="0" placeholder="VD: 5" className={INPUT} />
                  </div>
                </>
              )}

              {/* Error / Success */}
              {error && (
                <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>
              )}
              {success && (
                <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{success}</div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Creating...' : 'Tạo tài khoản'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
