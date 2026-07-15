import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getJockeyViolations } from '../../api/jockeyService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
interface JockeyViolation {
  violationId: number;
  raceName: string;
  type: string;
  note: string;
  penalty: string;
  createdAt: string;
}

export function JockeyViolationsPage() {
  const [violations, setViolations] = useState<JockeyViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJockeyViolations()
      .then(res => {
        if (res && res.result) {
          setViolations(res.result);
        } else {
          setViolations([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Không thể tải danh sách vi phạm');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Violation của tôi"
            subtitle="Các đơn vi phạm và khiếu nại ghi nhận của bạn"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {/* Info */}
          <div className="glass-panel rounded-xl p-4 border border-blue-500/15 bg-blue-500/[0.02] flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 ring-1 ring-gold/20 flex items-center justify-center shrink-0 relative z-10"><Clock size={15} className="text-blue-400" /></div>
            <div className="text-xs text-muted leading-relaxed space-y-1 relative z-10">
              <div>Khi trọng tài ghi nhận vi phạm, bạn có <span className="text-white font-bold">30 minutes</span> để gửi khiếu nại — trước khi kết quả races được công bố chính thức.</div>
              <div>Referee sẽ xem lại footage và ra phán quyết cuối cùng. Với án <span className="text-red-400 font-bold">truất quyền</span>, bạn có thêm <span className="text-white font-bold">48 giờ</span> để kháng cáo lên Ban tổ chức.</div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <LoadingSkeleton />
          ) : violations.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">✔️</div>
              <div className="text-emerald-400 text-sm font-semibold">Tuyệt vời! Bạn không có vi phạm nào được ghi nhận</div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glass-panel rounded-xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="p-5 border-b border-glass-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} className="text-red-400" />
                </div>
                <h2 className="text-base font-serif text-white">Danh sách lỗi vi phạm</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-red-500/20 via-glass-border to-transparent" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Race</th>
                      <th className="px-6 py-4">Loại vi phạm</th>
                      <th className="px-6 py-4">Detail</th>
                      <th className="px-6 py-4">Penalty</th>
                      <th className="px-6 py-4">Ngày ghi nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                    {violations.map((v) => (
                      <tr key={v.violationId} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted">#{v.violationId}</td>
                        <td className="px-6 py-4 font-medium">{v.raceName}</td>
                        <td className="px-6 py-4 text-red-400 font-semibold">{v.type}</td>
                        <td className="px-6 py-4 text-muted">{v.note}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-semibold">
                            {v.penalty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted">
                          {v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
