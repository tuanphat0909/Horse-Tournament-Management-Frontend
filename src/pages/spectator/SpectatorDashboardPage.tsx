import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Bell, BarChart3, Eye, ChevronRight, Activity, Sparkles, Wallet } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../api/authService';
import { getBalance, getMyBets } from '../../api/spectatorService';
import { getNotifications, getRaceSchedule, getTournaments } from '../../api/publicService';

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function SpectatorDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [balance, setBalance] = useState(0);
  const [bets, setBets] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    getBalance().then(d => {
      const b = d?.result?.balance ?? d?.result ?? (typeof d === 'number' ? d : 0);
      setBalance(Number(b) || 0);
    }).catch(() => setBalance(0));
    getMyBets().then(d => setBets(d?.result ?? (Array.isArray(d) ? d : []))).catch(() => setBets([]));
    getNotifications().then(d => {
      const list = d?.result ?? (Array.isArray(d) ? d : []);
      setNotifCount(list.filter((n: any) => !(n.isRead ?? n.read)).length);
    }).catch(() => setNotifCount(0));
    getRaceSchedule().then(d => setUpcoming(d?.result ?? (Array.isArray(d) ? d : []))).catch(() => setUpcoming([]));
    getTournaments().then(d => setTournaments(d?.result ?? (Array.isArray(d) ? d : []))).catch(() => setTournaments([]));
  }, []);

  const pendingBets = bets.filter(b => { const s = (b.status ?? '').toLowerCase(); return s !== 'win' && s !== 'won' && s !== 'lose' && s !== 'lost' && s !== 'correct' && s !== 'incorrect'; }).length;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          {/* Hero */}
          <PageHero
            title={<>Chào mừng, <span className="italic text-champagne">{user?.fullName ?? 'Khán giả'}</span></>}
            subtitle="Theo dõi giải đấu, đặt cược và quản lý ví của bạn"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Mùa giải 2026
              </div>
            }
            actions={
              <>
                <button onClick={() => navigate('/spectator/live')} className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  Xem kết quả trực tiếp <Eye size={13} />
                </button>
                <button onClick={() => navigate('/spectator/predictions')} className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                  Dự đoán của tôi
                </button>
              </>
            }
          />

          {/* Stats */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-5 gap-4">
            {[
              { title: 'Số dư', value: balance.toLocaleString(), trend: `≈ $${(balance / 100).toFixed(2)}`, icon: Wallet, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20', path: '/spectator/wallet' },
              { title: 'Đang diễn ra', value: '—', trend: 'Live ngay', icon: Activity, color: 'text-red-400', bg: 'from-red-500/15 to-red-900/20', path: '/spectator/live' },
              { title: 'Giải đấu', value: String(tournaments.length), trend: 'Đang theo dõi', icon: Trophy, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', path: '/spectator/tournaments' },
              { title: 'Dự đoán', value: String(bets.length), trend: `${pendingBets} chờ kết quả`, icon: BarChart3, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/spectator/predictions' },
              { title: 'Thông báo', value: String(notifCount), trend: 'Chưa đọc', icon: Bell, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20', path: '/spectator/notifications' },
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

          {/* Live race + Upcoming */}
          <div className="grid grid-cols-[1fr_360px] gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Activity size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">Đang diễn ra</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                <button onClick={() => navigate('/spectator/live')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0">Chi tiết <ChevronRight size={14} /></button>
              </div>
              {/* TODO: BE chưa có API live race */}
              <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">🏁</div>
                <div className="text-muted text-sm">Chưa có dữ liệu</div>
              </div>
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-medium text-muted">Sắp diễn ra</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                {upcoming.length === 0 ? (
                  <div className="text-center py-6 text-muted text-sm">Chưa có lịch thi đấu</div>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map((u, i) => (
                      <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group">
                        <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                        <Trophy size={13} className="text-gold/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white">{u.name ?? u.round}</div>
                          <div className="text-[10px] text-muted">{(u.tournamentName ?? u.tournament ?? '')}{u.raceDate ? ' • ' + u.raceDate : ''}</div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-champagne shrink-0">{u.distanceMeter ? `${u.distanceMeter}m` : 'Sắp tới'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Sparkles size={15} className="text-gold" /></div>
                <h2 className="text-base font-serif text-white">Dự đoán gần đây</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              {bets.length === 0 ? (
                <div className="text-center py-8"><div className="text-3xl opacity-40 mb-2">🎯</div><div className="text-muted text-sm">Chưa có dự đoán nào</div></div>
              ) : (
                <div className="space-y-3 relative z-10">
                  {bets.slice(0, 5).map((b, i) => {
                    const s = (b.status ?? '').toLowerCase();
                    const isWin = s === 'win' || s === 'won' || s === 'correct';
                    const isLose = s === 'lose' || s === 'lost' || s === 'incorrect';
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group">
                        <div>
                          <div className="text-xs font-medium text-white">🐴 {b.horseName ?? 'Ngựa #' + b.horseId}</div>
                          <div className="text-[10px] text-muted">{b.raceName ?? (b.raceId ? 'Race #' + b.raceId : '')}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[11px] font-bold ${isWin ? 'text-emerald-400' : isLose ? 'text-red-400' : 'text-yellow-400'}`}>
                            {isWin ? 'Đúng' : isLose ? 'Sai' : 'Chờ'}
                          </div>
                          <div className="text-xs text-gold font-bold">{b.prize != null ? '+' + Number(b.prize).toLocaleString() + ' coins' : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
