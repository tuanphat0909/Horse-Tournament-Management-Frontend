import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreHorizontal, CheckCircle, XCircle, Edit2, Users, Eye, EyeOff } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { getRoles, createAccount } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

type RoleFilter = 'all' | 'owner' | 'jockey' | 'referee' | 'spectator' | 'admin';

const USERS = [
  { id: 1, name: 'Nguyễn Văn An', email: 'nvan@email.com', role: 'owner', status: 'active', joined: '01/03/2026', horses: 3 },
  { id: 2, name: 'Trần Thị Bình', email: 'ttbinh@email.com', role: 'jockey', status: 'active', joined: '15/03/2026', horses: 0 },
  { id: 3, name: 'Lê Hoàng Nam', email: 'lhnam@email.com', role: 'referee', status: 'active', joined: '20/02/2026', horses: 0 },
  { id: 4, name: 'Phạm Thu Hà', email: 'ptha@email.com', role: 'spectator', status: 'active', joined: '05/04/2026', horses: 0 },
  { id: 5, name: 'Vũ Đức Minh', email: 'vdminh@email.com', role: 'owner', status: 'pending', joined: '09/06/2026', horses: 1 },
  { id: 6, name: 'Hoàng Thị Lan', email: 'htlan@email.com', role: 'jockey', status: 'active', joined: '10/04/2026', horses: 0 },
  { id: 7, name: 'Đỗ Quang Huy', email: 'dqhuy@email.com', role: 'owner', status: 'suspended', joined: '01/01/2026', horses: 2 },
  { id: 8, name: 'Bùi Thị Mai', email: 'btmai@email.com', role: 'spectator', status: 'active', joined: '20/05/2026', horses: 0 },
  { id: 9, name: 'Trương Văn Tú', email: 'tvtu@email.com', role: 'referee', status: 'active', joined: '01/02/2026', horses: 0 },
  { id: 10, name: 'Ngô Minh Khoa', email: 'nmkhoa@email.com', role: 'jockey', status: 'pending', joined: '08/06/2026', horses: 0 },
];

const ROLE_LABELS: Record<string, string> = { owner: 'Horse Owner', jockey: 'Jockey', referee: 'Referee', spectator: 'Spectator', admin: 'Admin' };
const ROLE_COLORS: Record<string, string> = {
  owner: 'text-gold bg-gold/10 border-gold/20',
  jockey: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  referee: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  spectator: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  admin: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-500/10',
  pending: 'text-yellow-400 bg-yellow-500/10',
  suspended: 'text-red-400 bg-red-500/10',
};
const STATUS_LABELS: Record<string, string> = { active: 'Hoạt động', pending: 'Chờ duyệt', suspended: 'Tạm khóa' };

const ROLE_COUNTS = USERS.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {} as Record<string, number>);

const NEEDS_LICENSE = ['Jockey', 'Referee'];

const INIT_FORM = { fullName: '', email: '', password: '', role: '', licenseNumber: '', experienceYears: '' };

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

export function AdminUsersPage() {
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [form, setForm] = useState(INIT_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
      await createAccount(body);
      setSuccess('Tạo tài khoản thành công!');
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

  const filtered = USERS.filter(u =>
    (filter === 'all' || u.role === filter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

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
                className={`glass-panel rounded-xl p-4 text-left border transition-all ${filter === r ? 'border-gold/40 bg-gold/5' : 'border-glass-border hover:border-gold/20'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className={filter === r ? 'text-gold' : 'text-muted'} />
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                    {r === 'all' ? 'Tất cả' : ROLE_LABELS[r]}
                  </span>
                </div>
                <div className="text-xl font-serif font-bold text-white">
                  {r === 'all' ? USERS.length : ROLE_COUNTS[r] ?? 0}
                </div>
              </button>
            ))}
          </div>

          {/* Search + Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl overflow-hidden">
            <div className="p-5 border-b border-glass-border flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 flex-1 max-w-xs">
                <Search size={15} className="text-muted shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
                />
              </div>
              <span className="text-sm text-muted">{filtered.length} kết quả</span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border bg-navy-light/30">
                  {['Người dùng', 'Role', 'Trạng thái', 'Ngày tham gia', 'Ngựa', 'Thao tác'].map(h => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted font-bold px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-glass-border/50 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{u.name}</div>
                          <div className="text-xs text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_COLORS[u.status]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {STATUS_LABELS[u.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">{u.joined}</td>
                    <td className="px-5 py-4 text-sm text-white font-medium">{u.horses > 0 ? u.horses : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.status === 'pending' && (
                          <>
                            <button className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Duyệt">
                              <CheckCircle size={14} />
                            </button>
                            <button className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Từ chối">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors" title="Chỉnh sửa">
                          <Edit2 size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/5 text-muted hover:text-white hover:bg-white/10 transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

        </main>
      </div>

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-serif text-white mb-6">Tạo tài khoản mới</h2>

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

              {/* Role */}
              <div>
                <label className={LABEL}>Role *</label>
                {roles.length === 0 ? (
                  <div className="text-xs text-muted py-2">Đang tải danh sách role…</div>
                ) : (
                  <select
                    value={form.role}
                    onChange={e => set('role', e.target.value)}
                    className={INPUT}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">-- Chọn role --</option>
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
                    <label className={LABEL}>Số năm kinh nghiệm</label>
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
                Hủy
              </button>
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
