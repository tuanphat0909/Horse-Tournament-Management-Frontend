import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Flag, FileText, ClipboardList, ChevronRight, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { getCurrentUser } from '../../api/authService';
import { useNavigate } from 'react-router-dom';
import { getRefereeDashboard } from '../../api/refereeService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

interface AssignedRace {
  raceId: number;
  raceName: string;
  raceDate: string;
  status: string;
}

interface DashboardData {
  assignedRaceCount: number;
  pendingReportCount: number;
  completedReportCount: number;
  violationsCreatedCount: number;
  assignedRaces: AssignedRace[];
}

export function RefereeDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRefereeDashboard()
      .then(res => {
        if (res && res.result) {
          setData(res.result);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Không thể tải thông tin dashboard trọng tài');
        setLoading(false);
      });
  }, []);

  const statsDisplay = [
    { title: 'Tổng cuộc đua giám sát', value: loading ? '...' : (data?.assignedRaceCount ?? 0), trend: 'Mùa giải 2026', icon: Flag, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/referee/confirm-results' },
    { title: 'Báo cáo chờ lập', value: loading ? '...' : (data?.pendingReportCount ?? 0), trend: 'Chờ thực hiện', icon: ShieldCheck, color: 'text-yellow-400', bg: 'from-yellow-500/15 to-yellow-900/20', path: '/referee/horse-check' },
    { title: 'Vi phạm ghi nhận', value: loading ? '...' : (data?.violationsCreatedCount ?? 0), trend: 'Cần xem xét', icon: AlertTriangle, color: 'text-red-400', bg: 'from-red-500/15 to-red-900/20', path: '/referee/violations' },
    { title: 'Báo cáo đã gửi', value: loading ? '...' : (data?.completedReportCount ?? 0), trend: 'Đã hoàn thành', icon: FileText, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', path: '/referee/reports' },
  ];

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

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

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Stats */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {statsDisplay.map((m, i) => (
              <motion.div key={i} variants={child} onClick={() => navigate(m.path)}
                className="glass-panel rounded-xl p-5 relative overflow-hidden group cursor-pointer" style={{ height: '130px' }}>
                <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${m.bg} blur-[30px] opacity-60 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10 flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.bg} border border-white/[0.08] flex items-center justify-center ${m.color}`}><m.icon size={18} /></div>
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
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Flag size={15} className="text-gold" /></div>
                  <h2 className="text-lg font-serif text-white">Lịch thi đấu cuộc đua</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <button onClick={() => navigate('/referee/confirm-results')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0 ml-3 font-bold">Xem tất cả <ChevronRight size={14} /></button>
              </div>

              {loading ? (
                <LoadingSkeleton />
              ) : !data || data.assignedRaces.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🏁</div>
                  <div className="text-muted text-sm">Chưa được phân công cuộc đua nào</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                        <th className="px-4 py-3">Mã đua</th>
                        <th className="px-4 py-3">Tên cuộc đua</th>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                      {data.assignedRaces.map((race) => (
                        <tr key={race.raceId} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs text-muted">#{race.raceId}</td>
                          <td className="px-4 py-3.5 font-medium">{race.raceName}</td>
                          <td className="px-4 py-3.5 text-xs text-muted">
                            {race.raceDate ? new Date(race.raceDate).toLocaleString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              race.status === 'Finished' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              race.status === 'InProgress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' :
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {race.status === 'Finished' ? 'Đã kết thúc' : race.status === 'InProgress' ? 'Đang chạy' : 'Lịch trình'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button 
                              onClick={() => navigate(`/referee/horse-check`)} 
                              className="text-xs text-gold hover:underline font-semibold"
                            >
                              Kiểm tra ngựa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><ClipboardList size={15} className="text-gold" /></div>
                <h2 className="text-base font-serif text-white">Hoạt động gần đây</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              
              {loading ? (
                <LoadingSkeleton />
              ) : !data || data.assignedRaces.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📊</div>
                  <div className="text-muted text-sm">Chưa có hoạt động</div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {data.assignedRaces.map((race, i) => (
                    <div key={i} className="flex gap-3 items-start border-l border-glass-border pl-4 relative ml-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gold absolute -left-[5.5px] top-1 border border-[#0b101e]" />
                      <div className="space-y-1">
                        <div className="text-white font-medium">Phân công giám sát cuộc đua:</div>
                        <div className="text-gold font-semibold">{race.raceName}</div>
                        <div className="text-muted/60">{race.raceDate ? new Date(race.raceDate).toLocaleDateString('vi-VN') : ''}</div>
                      </div>
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
