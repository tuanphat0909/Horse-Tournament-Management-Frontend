import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Flag, FileText, ClipboardList, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { getCurrentUser } from '../../api/authService';
import { getRefereeDashboard, getAllViolations } from '../../api/refereeService';
import { useNavigate } from 'react-router-dom';

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// Field thật từ GET /referee/dashboard (đã xác minh bằng API):
// { assignedRaceCount, pendingReportCount, completedReportCount, violationsCreatedCount, assignedRaces: [] }
const show = (n: any) => (n == null ? '—' : String(n));

export function RefereeDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [d, setD] = useState<any>({});
  const [violations, setViolations] = useState<any[]>([]);
  const [violationsLoading, setViolationsLoading] = useState(true);

  useEffect(() => {
    getRefereeDashboard()
      .then((res: any) => setD(res?.result ?? res ?? {}))
      .catch(() => setD({}));

    getAllViolations()
      .then((res: any) => setViolations(res?.result ?? (Array.isArray(res) ? res : [])))
      .catch(() => setViolations([]))
      .finally(() => setViolationsLoading(false));
  }, []);

  const assignedRaces: any[] = Array.isArray(d.assignedRaces) ? d.assignedRaces : [];

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title={<>Chào mừng, <span className="italic text-champagne">{user?.fullName ?? 'Trọng tài'}</span></>}
            subtitle="Trọng tài — Mùa giải 2026"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Nhiệm vụ giám sát
              </div>
            }
            actions={
              <>
                <button onClick={() => navigate('/referee/horse-check')} className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  Kiểm tra ngựa <ShieldCheck size={13} />
                </button>
                <button onClick={() => navigate('/referee/violations')} className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                  Xử lý vi phạm
                </button>
              </>
            }
          />

          {/* Stats */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {[
              { title: 'Cuộc đua hôm nay', value: show(d.assignedRaceCount), trend: 'Được phân công', icon: Flag, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/referee/confirm-results' },
              { title: 'Báo cáo chờ', value: show(d.pendingReportCount), trend: 'Chưa xử lý', icon: ShieldCheck, color: 'text-yellow-400', bg: 'from-yellow-500/15 to-yellow-900/20', path: '/referee/horse-check' },
              { title: 'Vi phạm chờ xử lý', value: show(d.violationsCreatedCount), trend: 'Cần xem xét', icon: AlertTriangle, color: 'text-red-400', bg: 'from-red-500/15 to-red-900/20', path: '/referee/violations' },
              { title: 'Báo cáo đã gửi', value: show(d.completedReportCount), trend: 'Đã hoàn thành', icon: FileText, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', path: '/referee/reports' },
            ].map((m, i) => (
              <motion.div key={i} variants={child} onClick={() => navigate(m.path)}
                className="glass-panel rounded-xl p-5 relative overflow-hidden group cursor-pointer" style={{ height: '130px' }}>
                <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-linear-to-br ${m.bg} blur-[30px] opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${m.bg} border border-white/8 flex items-center justify-center ${m.color}`}><m.icon size={18} /></div>
                  <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{m.trend}</div>
                </div>
                <div className="relative z-10">
                  <div className="text-2xl font-serif text-white font-bold group-hover:text-champagne transition-colors">{m.value}</div>
                  <div className="text-[11px] text-muted/70 font-medium">{m.title}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Today races + Recent activity */}
          <div className="grid grid-cols-[1fr_360px] gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-red-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Flag size={15} className="text-gold" /></div>
                  <h2 className="text-lg font-serif text-white">Cuộc đua hôm nay</h2>
                  <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <button onClick={() => navigate('/referee/confirm-results')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0 ml-3">Xem tất cả <ChevronRight size={14} /></button>
              </div>
              {assignedRaces.length === 0 ? (
                <div className="glass-panel rounded-xl p-10 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🏁</div>
                  <div className="text-muted text-sm">Chưa có cuộc đua nào được phân công</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedRaces.map((r: any, i: number) => {
                    const rid = r.raceId ?? r.id;
                    return (
                      <div key={rid ?? i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/2 border border-glass-border hover:border-gold/25 hover:bg-gold/3 transition-all group">
                        <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white group-hover:text-champagne transition-colors truncate">{r.name ?? `Cuộc đua #${rid}`}</div>
                          <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                            {r.raceDate && <span className="flex items-center gap-1"><Clock size={9} /> {r.raceDate}</span>}
                            {r.tournamentName && <span>{r.tournamentName}</span>}
                          </div>
                        </div>
                        {r.status && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">{r.status}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-red-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><ClipboardList size={15} className="text-gold" /></div>
                <h2 className="text-base font-serif text-white">Hoạt động gần đây</h2>
                <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              {violationsLoading ? (
                <div className="text-center py-10 text-muted text-sm">Đang tải...</div>
              ) : violations.length === 0 ? (
                <div className="rounded-xl p-10 text-center bg-white/2 border border-glass-border">
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">Chưa có vi phạm nào</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {violations.slice(0, 6).map((v: any, i: number) => (
                    <div key={v.id ?? i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/2 border border-glass-border hover:border-red-500/20 transition-all">
                      <Clock size={12} className="text-gold/60 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{v.description ?? v.violationType ?? `Vi phạm #${v.id}`}</div>
                        <div className="text-[10px] text-muted mt-0.5 flex items-center gap-2">
                          {v.horseName && <span>{v.horseName}</span>}
                          {v.createdAt && <span>{new Date(v.createdAt).toLocaleDateString('vi-VN')}</span>}
                        </div>
                      </div>
                      {v.status && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">{v.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
