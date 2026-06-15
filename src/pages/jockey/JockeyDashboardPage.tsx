import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Flag, Calendar, Trophy, ChevronRight, Award } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { useNavigate } from 'react-router-dom';
import { getContracts, respondContract } from '../../api/jockeyService';
import { getCurrentUser, parseApiError } from '../../api/authService';
import { getRaceSchedule } from '../../api/publicService';

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function JockeyDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);

  async function loadContracts() {
    try {
      const data = await getContracts();
      setContracts(data?.result ?? (Array.isArray(data) ? data : []));
    } catch {
      // dashboard silently shows empty state on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContracts();
    getRaceSchedule()
      .then((d: any) => setSchedule(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setSchedule([]));
  }, []);

  async function handleRespond(id: number, status: 'Active' | 'Rejected') {
    setRespondingId(id);
    try {
      await respondContract(id, status);
      setContracts(prev => prev.map(c => c.id === id ? {...c, status} : c));
    } catch (err: unknown) {
      alert(parseApiError(err as Error));
    } finally {
      setRespondingId(null);
    }
  }

  const pending = contracts.filter(c => {
    const s = (c.status ?? '').toLowerCase();
    return s === 'pending' || s === 'waiting';
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="blue" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          {/* Hero */}
          <PageHero
            title={<>Chào mừng, <span className="italic text-champagne">{user?.fullName ?? 'Jockey'}</span></>}
            subtitle="Quản lý lời mời hợp đồng và lịch thi đấu của bạn"
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 25%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> {pending.length} lời mời đang chờ
              </div>
            }
            actions={
              <>
                <button onClick={() => navigate('/jockey/invitations')} className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  Xem lời mời <Bell size={13} />
                </button>
                <button onClick={() => navigate('/jockey/schedule')} className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                  Lịch thi đấu
                </button>
              </>
            }
          />

          {/* Stats — TODO: backend chưa có API cho win count và upcoming races */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {[
              { title: 'Lời mời mới',    value: String(pending.length),    trend: 'Chờ phản hồi', icon: Bell,     color: 'text-yellow-400', bg: 'from-yellow-500/15 to-yellow-900/20', path: '/jockey/invitations' },
              { title: 'Cuộc đua sắp tới', value: schedule.length > 0 ? String(schedule.length) : '—', trend: '7 ngày tới', icon: Calendar, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/jockey/schedule' },
              { title: 'Số lần thắng',   value: '—',                      trend: 'Mùa 2026',     icon: Trophy,   color: 'text-gold',       bg: 'from-gold/15 to-amber-900/20',      path: '/jockey/stats' },
              { title: 'Tổng hợp đồng',  value: String(contracts.length), trend: 'Mùa giải 2026',icon: Flag,     color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20',path: '/jockey/races' },
            ].map((m, i) => (
              <motion.div key={i} variants={child} onClick={() => navigate(m.path)}
                className="glass-panel rounded-xl p-5 relative overflow-hidden group cursor-pointer hover:border-gold/30 transition-all" style={{ height: '130px' }}>
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${m.bg} blur-[30px] opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none`} />
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

          {/* Pending contracts + placeholder activity */}
          <div className="grid grid-cols-[1fr_380px] gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Bell size={15} className="text-gold" /></div>
                  <h2 className="text-lg font-serif text-white">Lời mời đang chờ</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <button onClick={() => navigate('/jockey/invitations')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0 ml-3">
                  Xem tất cả <ChevronRight size={14} />
                </button>
              </div>
              {loading ? (
                <div className="text-center py-8 text-muted text-sm">
                  <div className="text-4xl opacity-40 mb-3">⏳</div>
                  Đang tải...
                </div>
              ) : pending.length === 0 ? (
                <div className="text-center py-8 text-muted text-sm">
                  <div className="text-4xl opacity-40 mb-3">🏇</div>
                  Không có lời mời nào đang chờ
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.slice(0, 5).map((c, i) => (
                    <div key={c.id ?? i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-yellow-500/15 hover:border-yellow-500/30 hover:bg-gold/[0.04] transition-all group">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/15 to-transparent border border-gold/20 ring-1 ring-gold/20 flex items-center justify-center text-2xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors">{c.horseName ?? `Ngựa #${c.horseId}`}</div>
                        <div className="text-xs text-muted">
                          Chủ: {c.ownerName ?? `Owner #${c.ownerId ?? '—'}`}
                          {c.startDate ? ` • ${c.startDate}` : ''}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={respondingId === c.id}
                          onClick={() => handleRespond(c.id, 'Active')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                          Nhận
                        </button>
                        <button
                          disabled={respondingId === c.id}
                          onClick={() => handleRespond(c.id, 'Rejected')}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* TODO: backend chưa có API cho thành tích gần đây */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Award size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">Thành tích gần đây</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              {/* TODO: BE chưa có API thành tích */}
              <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">📊</div>
                <div className="text-muted text-sm">Chưa có dữ liệu</div>
              </div>
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
