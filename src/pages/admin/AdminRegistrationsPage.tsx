import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, X, RefreshCw, ArrowUpDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { approveRegistration, getRegistrations, rejectRegistration } from '../../api/adminService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';
import { Pager, paginate } from '../../components/ui/Pager';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type TabType = 'pending' | 'approved' | 'rejected';

const TAB_CONFIG = {
  pending:  { label: 'Awaiting Approval', color: 'text-yellow-400',  bg: 'border-yellow-400/40 bg-yellow-400/5',   statusValue: 'Pending'  },
  approved: { label: 'Approved',  color: 'text-emerald-400', bg: 'border-emerald-400/40 bg-emerald-400/5', statusValue: 'Approved' },
  rejected: { label: 'Decline',   color: 'text-red-400',     bg: 'border-red-400/40 bg-red-400/5',         statusValue: 'Rejected' },
};

interface Registration {
  registrationId: number;
  tournamentId: number;
  tournamentName: string;
  horseId: number;
  horseName: string;
  ownerName: string;
  status: string;
  registeredAt: string;
  jockeyContractStatus?: string;
  jockeyName?: string;
}

export function AdminRegistrationsPage() {
  const { showToast } = useNotifications();
  const [tab, setTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'horse'>('newest');
  const [page, setPage] = useState(1);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  async function loadRegistrations() {
    setLoading(true);
    setError('');
    try {
      // api.js returns raw JSON (not Axios wrapper), so use result directly
      const res = await getRegistrations();
      // getRegistrations calls api.get which returns raw JSON: { message, result: [...] }
      const raw = Array.isArray(res) ? res
        : Array.isArray(res?.result) ? res.result
        : Array.isArray(res?.data?.result) ? res.data.result
        : Array.isArray(res?.data) ? res.data
        : [];
      setRegistrations(raw);
    } catch (err) {
      console.error(err);
      setError('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRegistrations(); }, []);

  async function handleReview(registrationId: number, status: 'Approved' | 'Rejected') {
    try {
      setProcessingId(registrationId);
      await (status === 'Approved'
        ? approveRegistration(registrationId)
        : rejectRegistration(registrationId));
      showToast(
        status === 'Approved' ? 'Approved successfully' : 'Rejected successfully',
        `Registration request #${registrationId} has been processed.`,
        'success'
      );
      await loadRegistrations();
    } catch (err: any) {
      console.error('Error reviewing registration:', err);
      // BE tự chặn duyệt khi horse chưa có hợp đồng jockey Accepted — dịch thông báo cho dễ hiểu
      const raw = parseApiError(err) ?? '';
      let msg = raw;
      if (/no jockey contract/i.test(raw)) {
        msg = 'Cannot approve: this horse has NO jockey contract for the tournament. The horse owner must invite a jockey and have the invitation accepted first.';
      } else if (/jockey contract status/i.test(raw)) {
        msg = "Cannot approve: this horse's jockey contract has not been accepted by the jockey yet (status is not Accepted).";
      }
      showToast('Failed', msg, 'error');
    } finally {
      setProcessingId(null);
    }
  }

  // Filter by tab status and search query
  const filteredRegistrations = registrations.filter(r => {
    const statusMatch = (r.status ?? '').toLowerCase() === TAB_CONFIG[tab].statusValue.toLowerCase();
    const query = search.toLowerCase();
    const searchMatch = !search ||
      r.horseName?.toLowerCase().includes(query) ||
      r.ownerName?.toLowerCase().includes(query) ||
      r.tournamentName?.toLowerCase().includes(query);
    return statusMatch && searchMatch;
  });

  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    switch (sortBy) {
      case 'horse': return String(a.horseName ?? '').localeCompare(String(b.horseName ?? ''), 'vi');
      case 'oldest': return new Date(a.registeredAt ?? 0).getTime() - new Date(b.registeredAt ?? 0).getTime();
      case 'newest':
      default: return new Date(b.registeredAt ?? 0).getTime() - new Date(a.registeredAt ?? 0).getTime();
    }
  });

  const { paged: pagedRegistrations, totalPages, total, page: safePage } = paginate(sortedRegistrations, page, 10);

  const getCount = (t: TabType) => {
    const statusVal = TAB_CONFIG[t].statusValue.toLowerCase();
    return registrations.filter(r => (r.status ?? '').toLowerCase() === statusVal).length;
  };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Approve Registrations"
            subtitle="Review tournament registration requests from horse owners"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Tabs + Search */}
          <div className="flex items-center gap-2 border-b border-glass-border pb-0">
            {(['pending', 'approved', 'rejected'] as TabType[]).map(t => {
              const cfg = TAB_CONFIG[t];
              const isActive = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => { setTab(t); setPage(1); }}
                  className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${
                    isActive ? `${cfg.color} border-current` : 'text-muted border-transparent hover:text-white'
                  }`}
                >
                  {cfg.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${isActive ? cfg.bg + ' ' + cfg.color : 'bg-white/5 text-muted'}`}>
                    {getCount(t)}
                  </span>
                </button>
              );
            })}
            <div className="ml-auto mb-1 flex items-center gap-3">
              <button
                onClick={loadRegistrations}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-white bg-white/[0.04] border border-glass-border hover:border-gold/30 transition-colors"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
              <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
                <Search size={13} className="text-muted shrink-0" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search horse, owner..."
                  className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-muted" />
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                  className="bg-navy/50 border border-glass-border rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-gold/40 transition-colors"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="horse">Name horse A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4">
            {(['pending', 'approved', 'rejected'] as TabType[]).map(t => {
              const cfg = TAB_CONFIG[t];
              const count = getCount(t);
              return (
                <div key={t} className={`glass-panel rounded-xl p-4 border ${tab === t ? cfg.bg : 'border-glass-border'}`}>
                  <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
                  <div className="text-xs text-muted mt-0.5">{cfg.label}</div>
                </div>
              );
            })}
          </div>

          {/* Điều kiện duyệt: BE chỉ cho Approve khi horse đã có hợp đồng jockey Accepted cho giải đó.
              Hiện API GET /admin/registrations chưa trả thông tin jockey nên FE chưa hiển thị trước được
              — khi bấm Approve, hệ thống sẽ tự kiểm tra và báo rõ nếu thiếu jockey. */}
          {tab === 'pending' && (
            <div className="text-[11px] text-champagne/80 bg-gold/5 border border-gold/15 rounded-lg px-3 py-2 leading-relaxed">
              ⓘ A registration can only be approved when the horse <b>has a jockey with an Accepted contract</b> for that tournament — the system checks this automatically on Approve and shows a clear error if the horse has no jockey.
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
              <button onClick={loadRegistrations} className="ml-3 underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Loading / Empty / Table */}
          {loading ? (
            <LoadingSkeleton />
          ) : filteredRegistrations.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">📝</div>
              <div className="text-muted text-sm">
                {registrations.length === 0
                  ? 'No registrations in the system yet'
                  : `No registrations with status "${TAB_CONFIG[tab].label}"`}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                      <th className="px-6 py-4">Reg. ID</th>
                      <th className="px-6 py-4">Horse</th>
                      <th className="px-6 py-4">Jockey</th>
                      <th className="px-6 py-4">Horse Owner</th>
                      <th className="px-6 py-4">Tournaments</th>
                      <th className="px-6 py-4">Registration Date</th>
                      <th className="px-6 py-4">Status</th>
                      {tab === 'pending' && <th className="px-6 py-4 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                    {pagedRegistrations.map(reg => (
                      <tr key={reg.registrationId} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted">#{reg.registrationId}</td>
                        <td className="px-6 py-4 font-medium">🐴 {reg.horseName}</td>
                        <td className="px-6 py-4">
                          {reg.jockeyName ? (
                            <span className="text-white font-medium flex items-center gap-1.5">
                              🏇 {reg.jockeyName}
                            </span>
                          ) : (
                            <span className="text-amber-400/90 text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              Missing Jockey (Not Assigned)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted">{reg.ownerName}</td>
                        <td className="px-6 py-4 text-muted">{reg.tournamentName}</td>
                        <td className="px-6 py-4 text-muted">
                          {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-6 py-4">
                          {reg.status === 'Pending' ? (
                            reg.jockeyContractStatus === 'Accepted' ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                Awaiting Approval
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                Awaiting Jockey acceptance
                              </span>
                            )
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              reg.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {reg.status === 'Approved' ? 'Approved' : 'Declined'}
                            </span>
                          )}
                        </td>
                        {tab === 'pending' && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleReview(reg.registrationId, 'Approved')}
                                disabled={processingId === reg.registrationId || reg.jockeyContractStatus !== 'Accepted'}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Check size={12} />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReview(reg.registrationId, 'Rejected')}
                                disabled={processingId === reg.registrationId}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <X size={12} />
                                Reject
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
