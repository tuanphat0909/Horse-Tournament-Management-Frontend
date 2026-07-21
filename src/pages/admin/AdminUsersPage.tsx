import { useState, useEffect } from 'react';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Eye, EyeOff, ArrowUpDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRoles, createAccount, getAccounts, updateUserStatus } from '../../api/adminService';
import { parseApiError, parseFieldErrors } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatUtcDateTime } from '../../utils/format';
import { Pager, paginate } from '../../components/ui/Pager';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type RoleFilter = 'all' | 'owner' | 'jockey' | 'referee' | 'spectator' | 'admin';

const ROLE_LABELS: Record<string, string> = { owner: 'Horse Owner', jockey: 'Jockey', referee: 'Referee', spectator: 'Spectator', admin: 'Admin' };

const NEEDS_LICENSE = ['Jockey', 'Referee'];

const INIT_FORM = { fullName: '', email: '', password: '', role: '', licenseNumber: '', experienceYears: '' };

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const INPUT_ERROR = 'w-full bg-navy/50 border border-red-500/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-red-400 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

type FormErrors = Partial<Record<'fullName' | 'email' | 'password' | 'role' | 'licenseNumber' | 'experienceYears', string>>;

// Kiểm tra ngay tại FE để chỉ đúng ô nào sai, thay vì đợi BE trả một câu chung chung.
// Các luật này khớp với AdminService.CreateAccountAsync bên BE.
/**
 * Cùng bộ luật như bản kiểm tra thủ công trước đây, viết lại bằng Yup:
 * bắt buộc nhập, email đúng định dạng, mật khẩu >= 6 ký tự, Referee bắt buộc
 * có số giấy phép, số năm kinh nghiệm là số nguyên 0..80.
 */
const accountSchema = Yup.object({
  fullName: Yup.string().trim().required('Full name is required.'),
  email: Yup.string().trim()
    .required('Email is required.')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format.'),
  password: Yup.string()
    .required('Password is required.')
    .min(6, 'Password must be at least 6 characters.'),
  role: Yup.string().required('Please select a role.'),
  licenseNumber: Yup.string().when('role', {
    is: 'Referee',
    then: schema => schema.trim().required('License number is required for Referee.'),
    otherwise: schema => schema.notRequired(),
  }),
  experienceYears: Yup.string().test(
    'valid-years',
    'Years of experience must be a whole number of 0 or more.',
    value => {
      if (!value) return true;
      const years = Number(value);
      return Number.isInteger(years) && years >= 0;
    },
  ).test(
    'not-too-large',
    'Years of experience looks too large.',
    value => !value || Number(value) <= 80,
  ),
});


// BE báo lỗi bằng một câu văn (vd "Email already exists.") → dò về đúng ô để tô đỏ.
function mapMessageToField(message: string): keyof FormErrors | null {
  const m = message.toLowerCase();
  if (m.includes('email')) return 'email';
  if (m.includes('password')) return 'password';
  if (m.includes('license')) return 'licenseNumber';
  if (m.includes('full name')) return 'fullName';
  if (m.includes('role')) return 'role';
  if (m.includes('experience')) return 'experienceYears';
  return null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-red-400">{message}</p>;
}

export function AdminUsersPage() {
  const confirm = useConfirm();
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
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function handleToggleStatus(id: number, currentStatus: string) {
    const ok = await confirm({
      title: currentStatus === 'Active' ? 'Lock account' : 'Unlock account',
      message: `Are you sure you want to ${currentStatus === 'Active' ? 'lock' : 'unlock'} this account?`,
      confirmText: currentStatus === 'Active' ? 'Lock' : 'Unlock',
      danger: currentStatus === 'Active',
    });
    if (!ok) return;
    setTogglingId(id);
    try {
      await updateUserStatus(id);
      fetchAccounts();
    } catch (err: unknown) {
      showToast('Error', parseApiError(err as Error), 'error');
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
    // Gõ lại thì xoá lỗi của riêng ô đó để người dùng thấy mình đã sửa được
    setFieldErrors(prev => (prev[field as keyof FormErrors] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleCreate() {
    setError(''); setSuccess('');

    // Yup kiểm tra toàn bộ form, gom lỗi về đúng từng ô như trước
    try {
      await accountSchema.validate(form, { abortEarly: false });
    } catch (validationError) {
      const invalid: FormErrors = {};
      if (validationError instanceof Yup.ValidationError) {
        validationError.inner.forEach(e => {
          if (e.path && !invalid[e.path as keyof FormErrors]) {
            invalid[e.path as keyof FormErrors] = e.message;
          }
        });
      }
      setFieldErrors(invalid);
      setError('Please fix the highlighted fields below.');
      return;
    }
    setFieldErrors({});
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
      showToast('Success', newId != null ? `Account created successfully! ID = ${newId}` : 'Account created successfully!');
      closeModal();
      fetchAccounts();
    } catch (err: unknown) {
      const message = parseApiError(err as Error);
      // Ưu tiên map lỗi BE về đúng ô; nếu không nhận ra thì chỉ hiện ở khung lỗi chung
      const fromBody = parseFieldErrors(err as Error) as FormErrors;
      const matched = mapMessageToField(message);
      setFieldErrors(
        Object.keys(fromBody).length > 0 ? fromBody
        : matched ? { [matched]: message }
        : {}
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setError(''); setSuccess('');
    setFieldErrors({});
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
            title="User Management"
            subtitle="All accounts in the system"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Add User
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
                  placeholder="Search by name or email..."
                  className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.04] border border-glass-border text-muted"><span className="text-champagne font-semibold">{filteredAccounts.length}</span> results</span>
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
                <div className="text-muted text-sm">No accounts match your search</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border text-xs text-muted uppercase font-bold tracking-wider">
                      <th className="py-4 px-6">Full Name</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Created</th>
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
                            {togglingId === user.userId ? '...' : user.status === 'Active' ? 'Lock' : 'Unlock'}
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
              <h2 className="text-xl font-serif text-white">Create New Account</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className={LABEL}>Full Name *</label>
                <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="E.g.: John Smith" className={fieldErrors.fullName ? INPUT_ERROR : INPUT} />
                <FieldError message={fieldErrors.fullName} />
              </div>

              {/* Email */}
              <div>
                <label className={LABEL}>Email *</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="example@email.com" className={fieldErrors.email ? INPUT_ERROR : INPUT} />
                <FieldError message={fieldErrors.email} />
              </div>

              {/* Password */}
              <div>
                <label className={LABEL}>Password *</label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    className={(fieldErrors.password ? INPUT_ERROR : INPUT) + ' pr-10'}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-white">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
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
                    className={fieldErrors.role ? INPUT_ERROR : INPUT}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">-- Select Role --</option>
                    {roles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
                <FieldError message={fieldErrors.role} />
              </div>

              {/* Conditional: Jockey / Referee only */}
              {NEEDS_LICENSE.includes(form.role) && (
                <>
                  <div>
                    <label className={LABEL}>License Number{form.role === 'Referee' ? ' *' : ''}</label>
                    <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="E.g.: LIC-2024-001" className={fieldErrors.licenseNumber ? INPUT_ERROR : INPUT} />
                    <FieldError message={fieldErrors.licenseNumber} />
                  </div>
                  <div>
                    <label className={LABEL}>Years of Experience</label>
                    <input value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} type="number" min="0" placeholder="E.g.: 5" className={fieldErrors.experienceYears ? INPUT_ERROR : INPUT} />
                    <FieldError message={fieldErrors.experienceYears} />
                  </div>
                </>
              )}

              {/* Error / Success */}
              {error && (
                <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 whitespace-pre-line">{error}</div>
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
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
