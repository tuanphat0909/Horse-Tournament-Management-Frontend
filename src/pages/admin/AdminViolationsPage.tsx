import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, ArrowUpCircle, Check, X, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getViolations, updateViolationStatus } from '../../api/adminService';
import { Pager, paginate } from '../../components/ui/Pager';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type Tab = 'pending' | 'confirmed' | 'rejected';

interface Violation {
  violationId: number;
  raceId: number;
  raceName: string;
  type: string;
  note: string;
  penalty: string;
  status: string;
  createdAt: string;
}

export function AdminViolationsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const res = await getViolations();
      const raw = Array.isArray(res) ? res
        : Array.isArray(res?.result) ? res.result
        : [];
      setViolations(raw);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách vi phạm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const handleReview = async (id: number, status: 'Confirmed' | 'Rejected') => {
    try {
      setProcessingId(id);
      await updateViolationStatus(id, status);
      await fetchViolations();
    } catch (err: any) {
      console.error('Error reviewing violation:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái vi phạm');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter violations based on new Status column
  const pendingViolations = violations.filter(v => (v.status || 'Pending') === 'Pending');
  const confirmedViolations = violations.filter(v => v.status === 'Confirmed');
  const rejectedViolations = violations.filter(v => v.status === 'Rejected');

  // Phân trang cho tab đang mở (kèm tìm kiếm theo cuộc đua / loại vi phạm / ghi chú)
  const activeList = (tab === 'pending' ? pendingViolations : tab === 'confirmed' ? confirmedViolations : rejectedViolations)
    .filter(v => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (v.raceName ?? '').toLowerCase().includes(q)
        || (v.type ?? '').toLowerCase().includes(q)
        || (v.note ?? '').toLowerCase().includes(q);
    });
  const { paged: pagedViolations, totalPages, total, page: safePage } = paginate(activeList, page, 10);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Xử lý vi phạm & Kháng cáo"
            subtitle="Xem xét các ghi nhận vi phạm từ trọng tài và đưa ra quyết định xác nhận hoặc bác bỏ"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Flow */}
          <div className="glass-panel rounded-xl p-4 border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted font-bold shrink-0">Quy trình:</span>
              {[
                { label: 'Trọng tài ghi nhận', active: false },
                { label: '→', sep: true },
                { label: 'Lưu dưới dạng Chờ duyệt (Pending)', active: false, note: true },
                { label: '→', sep: true },
                { label: 'Admin xem xét chứng cứ / video', active: false },
                { label: '→', sep: true },
                { label: 'Xác nhận (Confirmed) / Bác bỏ (Rejected)', active: true },
              ].map((s, i) =>
                s.sep ? <span key={i} className="text-muted/30">→</span>
                  : <span key={i} className={`px-2.5 py-1 rounded-lg border text-white/80 ${s.active ? 'bg-gold/10 border-gold/20 text-gold font-bold' : s.note ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.03] border-glass-border'}`}>{s.label}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Kháng cáo chờ xử lý', value: loading ? '...' : pendingViolations.length, color: 'text-orange-400', bg: 'from-orange-500/15 to-orange-900/20', icon: ArrowUpCircle },
              { label: 'Vi phạm đã xác nhận', value: loading ? '...' : confirmedViolations.length, color: 'text-red-400', bg: 'from-red-500/15 to-red-900/20', icon: AlertTriangle },
              { label: 'Vi phạm bị bác bỏ', value: loading ? '...' : rejectedViolations.length, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', icon: CheckCircle },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden border border-glass-border hover:border-gold/30 transition-all">
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.bg} blur-[30px] opacity-60 pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} border border-white/[0.08] flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className="relative z-10 text-2xl font-serif font-bold text-white">{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {([
              ['pending', `Chờ xử lý (${loading ? 0 : pendingViolations.length})`, 'text-orange-400 border-orange-400'],
              ['confirmed', `Đã xác nhận (${loading ? 0 : confirmedViolations.length})`, 'text-red-400 border-red-400'],
              ['rejected', `Đã bác bỏ (${loading ? 0 : rejectedViolations.length})`, 'text-emerald-400 border-emerald-400'],
            ] as [Tab, string, string][]).map(([t, label, ac]) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? ac : 'text-muted border-transparent hover:text-white'}`}>
                {label}
              </button>
            ))}
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm cuộc đua, loại vi phạm..."
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
              />
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div>
              {tab === 'pending' && (
                pendingViolations.length === 0 ? (
                  <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="text-4xl opacity-40 mb-3">✔️</div>
                    <div className="text-muted text-sm">Không có khiếu nại/vi phạm nào chờ xử lý</div>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                            <th className="px-6 py-4">Mã VP</th>
                            <th className="px-6 py-4">Cuộc đua</th>
                            <th className="px-6 py-4">Loại vi phạm</th>
                            <th className="px-6 py-4">Mô tả / Chi tiết</th>
                            <th className="px-6 py-4">Hình phạt dự kiến</th>
                            <th className="px-6 py-4 text-right">Thao tác duyệt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                          {pagedViolations.map((v) => (
                            <tr key={v.violationId} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-muted">#{v.violationId}</td>
                              <td className="px-6 py-4 font-medium">{v.raceName}</td>
                              <td className="px-6 py-4 text-orange-400 font-semibold">{v.type}</td>
                              <td className="px-6 py-4 text-muted">{v.note}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-semibold">
                                  {v.penalty}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleReview(v.violationId, 'Confirmed')}
                                    disabled={processingId === v.violationId}
                                    className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all flex items-center gap-1 text-xs font-semibold disabled:opacity-40"
                                    title="Xác nhận vi phạm"
                                  >
                                    <Check size={12} />
                                    <span>Xác nhận</span>
                                  </button>
                                  <button
                                    onClick={() => handleReview(v.violationId, 'Rejected')}
                                    disabled={processingId === v.violationId}
                                    className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex items-center gap-1 text-xs font-semibold disabled:opacity-40"
                                    title="Bác bỏ vi phạm"
                                  >
                                    <X size={12} />
                                    <span>Bác bỏ</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
                  </motion.div>
                )
              )}

              {tab === 'confirmed' && (
                confirmedViolations.length === 0 ? (
                  <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="text-4xl opacity-40 mb-3">⚠️</div>
                    <div className="text-muted text-sm">Chưa có thông báo vi phạm được xác nhận</div>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                            <th className="px-6 py-4">Mã VP</th>
                            <th className="px-6 py-4">Cuộc đua</th>
                            <th className="px-6 py-4">Loại vi phạm</th>
                            <th className="px-6 py-4">Mô tả</th>
                            <th className="px-6 py-4">Hình phạt áp dụng</th>
                            <th className="px-6 py-4">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                          {pagedViolations.map((v) => (
                            <tr key={v.violationId} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-muted">#{v.violationId}</td>
                              <td className="px-6 py-4 font-medium">{v.raceName}</td>
                              <td className="px-6 py-4 text-red-400 font-semibold">{v.type}</td>
                              <td className="px-6 py-4 text-muted">{v.note}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-semibold">
                                  {v.penalty}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1 w-fit">
                                  <AlertTriangle size={10} />
                                  Đã xác nhận
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
                  </motion.div>
                )
              )}

              {tab === 'rejected' && (
                rejectedViolations.length === 0 ? (
                  <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="text-4xl opacity-40 mb-3">⚠️</div>
                    <div className="text-muted text-sm">Chưa có vi phạm nào bị bác bỏ</div>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                            <th className="px-6 py-4">Mã VP</th>
                            <th className="px-6 py-4">Cuộc đua</th>
                            <th className="px-6 py-4">Loại vi phạm</th>
                            <th className="px-6 py-4">Mô tả</th>
                            <th className="px-6 py-4">Hình phạt đề xuất</th>
                            <th className="px-6 py-4">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                          {pagedViolations.map((v) => (
                            <tr key={v.violationId} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 font-mono text-xs text-muted">#{v.violationId}</td>
                              <td className="px-6 py-4 font-medium">{v.raceName}</td>
                              <td className="px-6 py-4 text-emerald-400 font-semibold">{v.type}</td>
                              <td className="px-6 py-4 text-muted">{v.note}</td>
                              <td className="px-6 py-4 text-muted/65 line-through">{v.penalty}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1 w-fit">
                                  <CheckCircle size={10} />
                                  Đã bác bỏ
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
                  </motion.div>
                )
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
