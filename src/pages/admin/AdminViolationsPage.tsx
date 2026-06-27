import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getViolations, updateViolationStatus } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

export function AdminViolationsPage() {
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  function loadViolations() {
    setLoading(true); setError('');
    getViolations()
      .then((data: any) => setViolations(data?.result ?? (Array.isArray(data) ? data : [])))
      .catch((err: unknown) => setError(parseApiError(err as Error)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadViolations(); }, []);

  async function handleStatus(id: number, status: string) {
    setStatusLoading(id);
    try {
      await updateViolationStatus(id, status);
      setViolations(prev => prev.map(v => (v.violationId ?? v.id) === id ? { ...v, status } : v));
    } catch (err: unknown) {
      alert(parseApiError(err as Error));
    } finally {
      setStatusLoading(null);
    }
  }

  const total = violations.length;
  const withPenalty = violations.filter(v => v.penalty != null && String(v.penalty).trim() !== '').length;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-400 mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Xử lý vi phạm"
            subtitle="Danh sách vi phạm được ghi nhận"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Flow — quy trình xử lý vi phạm (giữ từ bản nhóm) */}
          <div className="glass-panel rounded-xl p-4 border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-gold/10 to-transparent blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted font-bold shrink-0">Quy trình:</span>
              {[
                { label: 'Trọng tài ghi nhận',       active: false },
                { label: '→', sep: true },
                { label: 'Jockey khiếu nại (30 phút)', active: false },
                { label: '→', sep: true },
                { label: 'Trọng tài ra quyết định',   active: false },
                { label: '→', sep: true },
                { label: 'Admin nhận thông báo',       active: false, note: true },
                { label: '→', sep: true },
                { label: 'Kháng cáo án nặng (48h)',   active: true },
              ].map((s, i) =>
                s.sep ? <span key={i} className="text-muted/30">→</span>
                  : <span key={i} className={`px-2.5 py-1 rounded-lg border text-white/80 ${s.active ? 'bg-gold/10 border-gold/20 text-gold font-bold' : s.note ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/3 border-glass-border'}`}>{s.label}</span>
              )}
            </div>
          </div>

          {/* Stats — số liệu thật từ getViolations */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tổng vi phạm', value: loading ? '—' : String(total), color: 'text-red-400', bg: 'from-red-500/15 to-red-900/20', icon: AlertTriangle },
              { label: 'Có hình phạt', value: loading ? '—' : String(withPenalty), color: 'text-orange-400', bg: 'from-orange-500/15 to-orange-900/20', icon: AlertTriangle },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden border border-glass-border hover:border-gold/30 transition-all">
                <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-linear-to-br ${s.bg} blur-[30px] opacity-60 pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.bg} border border-white/8 flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className="relative z-10 text-2xl font-serif font-bold text-white">{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* List — danh sách vi phạm thật */}
          {error ? (
            <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>
          ) : loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : violations.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-glass-border">
                    <th className="px-5 py-3 font-bold">Cuộc đua</th>
                    <th className="px-5 py-3 font-bold">Mô tả</th>
                    <th className="px-5 py-3 font-bold">Hình phạt</th>
                    <th className="px-5 py-3 font-bold">Trạng thái</th>
                    <th className="px-5 py-3 font-bold">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, i) => {
                    const vid = v.violationId ?? v.id;
                    const status = v.status ?? 'Pending';
                    return (
                    <tr key={vid ?? i} className="border-b border-glass-border/40 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{v.raceName ?? '—'}</td>
                      <td className="px-5 py-3 text-body">{v.note ?? v.description ?? '—'}</td>
                      <td className="px-5 py-3 text-red-400">{v.penalty ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          status === 'Confirmed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : status === 'Rejected' ? 'text-muted bg-white/5 border-glass-border'
                          : 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                        }`}>{status}</span>
                      </td>
                      <td className="px-5 py-3">
                        {status === 'Pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStatus(vid, 'Confirmed')}
                              disabled={statusLoading === vid}
                              className="p-1.5 rounded-lg text-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                              title="Xác nhận"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleStatus(vid, 'Rejected')}
                              disabled={statusLoading === vid}
                              className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              title="Từ chối"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
