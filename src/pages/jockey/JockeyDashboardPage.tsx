import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Flag, Calendar, Trophy, ChevronRight, Star, Activity, Award } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { useNavigate } from 'react-router-dom';
import { getContracts, respondContract } from '../../api/jockeyService';
import { getCurrentUser, parseApiError } from '../../api/authService';

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function JockeyDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);

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

  useEffect(() => { loadContracts(); }, []);

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
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden relative border border-white/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            style={{
              minHeight: '220px',
              background: `linear-gradient(to right, rgba(11,22,40,0.97) 0%, rgba(11,22,40,0.7) 40%, rgba(11,22,40,0.15) 100%), url('/images/hero-jockey.jpg') center 25% / cover no-repeat`,
            }}
          >
            <div className="relative z-10 p-8 flex flex-col items-start justify-center" style={{ minHeight: '220px' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {pending.length} lời mời đang chờ
              </div>
              <h1 className="text-2xl font-serif text-white mb-1.5">
                Chào mừng, <span className="italic text-champagne">{user?.fullName ?? 'Jockey'}</span>
              </h1>
              <p className="text-sm text-muted mb-5">Quản lý lời mời hợp đồng và lịch thi đấu của bạn</p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/jockey/invitations')} className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  Xem lời mời <Bell size={13} />
                </button>
                <button onClick={() => navigate('/jockey/schedule')} className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                  Lịch thi đấu
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats — TODO: backend chưa có API cho win count và upcoming races */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {[
              { title: 'Lời mời mới',    value: String(pending.length),    trend: 'Chờ phản hồi', icon: Bell,     color: 'text-yellow-400', bg: 'from-yellow-500/15 to-yellow-900/20', path: '/jockey/invitations' },
              { title: 'Cuộc đua sắp tới', value: '—',                   trend: '7 ngày tới',   icon: Calendar, color: 'text-blue-400',   bg: 'from-blue-500/15 to-blue-900/20',   path: '/jockey/schedule' },
              { title: 'Số lần thắng',   value: '—',                      trend: 'Mùa 2026',     icon: Trophy,   color: 'text-gold',       bg: 'from-gold/15 to-amber-900/20',      path: '/jockey/stats' },
              { title: 'Tổng hợp đồng',  value: String(contracts.length), trend: 'Mùa giải 2026',icon: Flag,     color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20',path: '/jockey/races' },
            ].map((m, i) => (
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

          {/* Pending contracts + placeholder activity */}
          <div className="grid grid-cols-[1fr_380px] gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-serif text-white">Lời mời đang chờ</h2>
                <button onClick={() => navigate('/jockey/invitations')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium">
                  Xem tất cả <ChevronRight size={14} />
                </button>
              </div>
              {loading ? (
                <div className="text-center py-8 text-muted text-sm">Đang tải...</div>
              ) : pending.length === 0 ? (
                <div className="text-center py-8 text-muted text-sm">Không có lời mời nào đang chờ</div>
              ) : (
                <div className="space-y-3">
                  {pending.slice(0, 5).map((c, i) => (
                    <div key={c.id ?? i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-yellow-500/15 hover:border-yellow-500/30 transition-all">
                      <div className="text-2xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{c.horseName ?? `Ngựa #${c.horseId}`}</div>
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
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-serif text-white mb-5">Thành tích gần đây</h2>
              <div className="space-y-3">
                {[
                  { icon: Trophy,   color: 'text-gold bg-gold/10',              text: 'Dữ liệu đang được cập nhật từ backend' },
                  { icon: Star,     color: 'text-blue-400 bg-blue-500/10',      text: 'Kết quả thi đấu sẽ xuất hiện ở đây' },
                  { icon: Activity, color: 'text-purple-400 bg-purple-500/10',  text: 'Lịch sử cuộc đua sẽ được hiển thị' },
                  { icon: Award,    color: 'text-emerald-400 bg-emerald-500/10',text: 'Tiền thưởng và xếp hạng cá nhân' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}><a.icon size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/90 leading-relaxed">{a.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
