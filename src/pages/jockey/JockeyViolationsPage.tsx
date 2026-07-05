import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getJockeyViolations } from '../../api/jockeyService';
import { parseApiError } from '../../api/authService';

export function JockeyViolationsPage() {
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJockeyViolations()
      .then((data: any) => {
        const list = data?.result ?? (Array.isArray(data) ? data : []);
        setViolations(list);
      })
      .catch((err: Error) => setError(parseApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Vi phạm của tôi"
            subtitle="Các đơn vi phạm và khiếu nại"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {/* Info */}
          <div className="glass-panel rounded-xl p-4 border border-blue-500/15 bg-blue-500/2 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-blue-500/10 to-transparent blur-2xl pointer-events-none" />
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 ring-1 ring-gold/20 flex items-center justify-center shrink-0 relative z-10"><Clock size={15} className="text-blue-400" /></div>
            <div className="text-xs text-muted leading-relaxed space-y-1 relative z-10">
              <div>Khi trọng tài ghi nhận vi phạm, bạn có <span className="text-white font-bold">30 phút</span> để gửi khiếu nại — trước khi kết quả cuộc đua được công bố chính thức.</div>
              <div>Trọng tài sẽ xem lại footage và ra phán quyết cuối cùng. Với án <span className="text-red-400 font-bold">truất quyền</span>, bạn có thêm <span className="text-white font-bold">48 giờ</span> để kháng cáo lên Ban tổ chức.</div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/6 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {loading ? (
            <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải...</div>
          ) : violations.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((v, i) => (
                <div key={v.violationId ?? v.id ?? i} className="glass-panel rounded-xl p-5 relative overflow-hidden flex items-start gap-4">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0 relative z-10">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{v.raceName ?? '—'}</h3>
                      {v.penalty != null && (
                        <span className="text-[10px] bg-red-500/15 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/25 uppercase tracking-wider shrink-0">{String(v.penalty)}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted leading-relaxed">{v.note ?? v.description ?? '—'}</div>
                    <div className="text-[11px] text-muted/70 mt-1">Trọng tài: {v.refereeName ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
