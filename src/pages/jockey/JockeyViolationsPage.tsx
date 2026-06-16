import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getJockeyViolations } from '../../api/jockeyService';

function fmtDate(s?: string) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
}

export function JockeyViolationsPage() {
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJockeyViolations()
      .then((d: any) => setViolations(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setViolations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Vi phạm của tôi"
            subtitle="Các đơn vi phạm và khiếu nại"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
          />

          {/* Info */}
          <div className="glass-panel rounded-xl p-4 border border-blue-500/15 bg-blue-500/[0.02] flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 ring-1 ring-gold/20 flex items-center justify-center shrink-0 relative z-10"><Clock size={15} className="text-blue-400" /></div>
            <div className="text-xs text-muted leading-relaxed space-y-1 relative z-10">
              <div>Khi trọng tài ghi nhận vi phạm, bạn có <span className="text-white font-bold">30 phút</span> để gửi khiếu nại — trước khi kết quả cuộc đua được công bố chính thức.</div>
              <div>Trọng tài sẽ xem lại footage và ra phán quyết cuối cùng. Với án <span className="text-red-400 font-bold">truất quyền</span>, bạn có thêm <span className="text-white font-bold">48 giờ</span> để kháng cáo lên Ban tổ chức.</div>
            </div>
          </div>

          {/* List */}
          <div className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            {loading ? (
              <div className="p-12 text-center text-muted text-sm">Đang tải...</div>
            ) : violations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl opacity-40 mb-3">⚠️</div>
                <div className="text-muted text-sm">Chưa có vi phạm nào</div>
              </div>
            ) : (
              <div className="divide-y divide-glass-border relative z-10">
                {violations.map((v, i) => {
                  const sk = (v.status ?? '').toLowerCase();
                  const statusCls = ['confirmed', 'upheld'].includes(sk) ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : ['dismissed', 'rejected', 'overturned'].includes(sk) ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                  return (
                    <div key={v.id ?? v.violationId ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                      <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-serif font-bold text-champagne shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">
                          {v.type ?? v.violationType ?? 'Vi phạm'}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {v.description ?? ''}
                          {(v.raceName ?? v.race?.name) ? ` • ${v.raceName ?? v.race?.name}` : ''}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCls}`}>{v.status ?? '—'}</span>
                      <span className="text-xs text-muted shrink-0 hidden md:block">{fmtDate(v.createdAt ?? v.reportedAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
