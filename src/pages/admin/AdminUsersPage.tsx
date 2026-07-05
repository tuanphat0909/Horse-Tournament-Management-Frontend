import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Users, Eye, EyeOff } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRoles, createAccount, getAccounts } from '../../api/adminService';
import { parseApiError } from '../../api/authService';
import { Pager, paginate } from '../../components/ui/Pager';

type RoleFilter = 'all' | 'owner' | 'jockey' | 'referee' | 'spectator' | 'admin';

const ROLE_LABELS: Record<string, string> = { owner: 'Horse Owner', jockey: 'Jockey', referee: 'Referee', spectator: 'Spectator', admin: 'Admin' };

const NEEDS_LICENSE = ['Jockey', 'Referee'];

const INIT_FORM = { fullName: '', email: '', password: '', role: '', licenseNumber: '', experienceYears: '' };

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const ROLE_BADGE: Record<string, string> = {
  owner: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  jockey: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  referee: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  spectator: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  admin: 'text-gold bg-gold/10 border-gold/20',
};

export function AdminUsersPage() {
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [form, setForm] = useState(INIT_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAccounts()
      .then((d: any) => setAccounts(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
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
      setSuccess(newId != null ? `Đã tạo tài khoản thành công! ID = ${newId}` : 'Tạo tài khoản thành công!');
      setForm(INIT_FORM);
      // refresh list sau khi tạo thành công
      getAccounts()
        .then((d: any) => setAccounts(d?.result ?? (Array.isArray(d) ? d : [])))
        .catch(() => {});
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

  // DB trả vai trò chủ ngựa là 'horseowner' (không phải 'owner') → chuẩn hóa để lọc/đếm đúng.
  const matchesRole = (roleName: string, key: RoleFilter) => {
    const r = (roleName ?? '').toLowerCase();
    if (key === 'owner') return r === 'owner' || r === 'horseowner';
    return r === key;
  };

  const roleCounts: Record<RoleFilter, number> = {
    all: accounts.length,
    owner: accounts.filter(a => matchesRole(a.roleName, 'owner')).length,
    jockey: accounts.filter(a => matchesRole(a.roleName, 'jockey')).length,
    referee: accounts.filter(a => matchesRole(a.roleName, 'referee')).length,
    spectator: accounts.filter(a => matchesRole(a.roleName, 'spectator')).length,
    admin: accounts.filter(a => matchesRole(a.roleName, 'admin')).length,
  };

  const filtered = accounts
    .filter(a => filter === 'all' || matchesRole(a.roleName, filter))
    .filter(a => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (a.fullName ?? '').toLowerCase().includes(q) || (a.email ?? '').toLowerCase().includes(q);
    });

  const { paged, totalPages, total, page: safePage } = paginate(filtered, page, 10);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: 'var(--page-bg)' }}>
      <Sidebar />
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Quản lý người dùng"
            subtitle="Tất cả tài khoản trong hệ thống"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Thêm người dùng
              </button>
            }
          />

          {/* Role Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(['all', 'owner', 'jockey', 'referee', 'spectator'] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`glass-panel rounded-xl p-4 text-left border transition-all relative overflow-hidden group ${filter === r ? 'border-gold/40 bg-gold/5' : 'border-glass-border hover:border-gold/30 hover:bg-gold/3'}`}
              >
                <div className="absolute top-0 left-3 right-3 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-linear-to-br from-gold/10 to-transparent blur-[30px] pointer-events-none" />
                <div className="relative z-10 flex items-center gap-2 mb-1">
                  <Users size={14} className={filter === r ? 'text-gold' : 'text-muted'} />
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                    {r === 'all' ? 'Tất cả' : ROLE_LABELS[r]}
                  </span>
                </div>
                <div className="relative z-10 text-xl font-serif font-bold text-white">
                  {accountsLoading ? '…' : roleCounts[r]}
                </div>
              </button>
            ))}
          </div>

          {/* Search + Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-gold/10 to-transparent blur-2xl pointer-events-none" />
            <div className="relative p-5 border-b border-glass-border flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/4 border border-glass-border rounded-lg px-3 py-2 flex-1 max-w-xs">
                <Search size={15} className="text-muted shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/4 border border-glass-border text-muted">
                <span className="text-champagne font-semibold">{accountsLoading ? '…' : filtered.length}</span> kết quả
              </span>
            </div>

            {accountsLoading ? (
              <div className="p-12 text-center">
                <div className="text-muted text-sm">Đang tải...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl opacity-40 mb-3">👥</div>
                <div className="text-muted text-sm">{search ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}</div>
              </div>
            ) : (
              <div className="divide-y divide-glass-border relative z-10">
                {paged.map((a, i) => {
                  const rk = (a.roleName ?? '').toLowerCase();
                  const roleCls = ROLE_BADGE[rk] ?? 'text-muted bg-white/4 border-glass-border';
                  const sk = (a.status ?? '').toLowerCase();
                  const statusCls = sk === 'active' ? 'text-emerald-400' : (sk === 'inactive' || sk === 'banned') ? 'text-red-400' : 'text-yellow-400';
                  const createdAt = a.createdAt
                    ? (() => { try { return new Date(a.createdAt).toLocaleDateString('vi-VN'); } catch { return a.createdAt; } })()
                    : '—';
                  return (
                    <div key={a.userId ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-sm font-serif font-bold text-champagne shrink-0">{(safePage - 1) * 10 + i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">{a.fullName ?? '—'}</div>
                        <div className="text-xs text-muted truncate">{a.email ?? '—'}</div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${roleCls}`}>{a.roleName ?? '—'}</span>
                      <span className={`text-xs font-medium shrink-0 hidden sm:block w-16 text-right ${statusCls}`}>{a.status ?? '—'}</span>
                      <span className="text-xs text-muted shrink-0 hidden md:block w-24 text-right">{createdAt}</span>
                    </div>
                  );
                })}
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
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Plus size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Tạo tài khoản mới</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Họ và tên *</label>
                <input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email *</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="example@email.com" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Mật khẩu *</label>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    className={INPUT + ' pr-10'}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-white">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL}>Role *</label>
                {roles.length === 0 ? (
                  <div className="text-xs text-muted py-2">Đang tải danh sách role…</div>
                ) : (
                  <select value={form.role} onChange={e => set('role', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }}>
                    <option value="">-- Chọn role --</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
              {NEEDS_LICENSE.includes(form.role) && (
                <>
                  <div>
                    <label className={LABEL}>Số giấy phép (License Number)</label>
                    <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="VD: LIC-2024-001" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Số năm kinh nghiệm</label>
                    <input value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} type="number" min="0" placeholder="VD: 5" className={INPUT} />
                  </div>
                </>
              )}
              {error && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
              {success && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{success}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Đang tạo…' : 'Tạo tài khoản'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
