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
import { formatDateTime } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function SpectatorDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const statusLower = user?.status?.toLowerCase();
  const isLocked = statusLower !== 'active';
  const { t, language } = useLanguage();
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

  const liveRaces = upcoming.filter(r => ['active', 'ongoing', 'inprogress'].includes(r.status?.toLowerCase()));
  const upcomingTournaments = tournaments.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          {/* Hero */}
          <PageHero
            title={<>{t('Welcome,')} <span className="italic text-champagne">{user?.fullName ?? t('Spectator')}</span></>}
            subtitle={t('Follow tournaments, place bets and manage your wallet')}
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> {t('Season 2026')}
              </div>
            }
            actions={
              <>
                <button onClick={() => navigate('/spectator/live')} className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  {t('View live results')} <Eye size={13} />
                </button>
                <button 
                  onClick={() => { if (!isLocked) navigate('/spectator/predictions'); }}
                  disabled={isLocked}
                  className={`px-5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    isLocked 
                      ? 'border-glass-border bg-white/5 text-muted/50 cursor-not-allowed' 
                      : 'text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10'
                  }`}
                >
                  {t('My Predictions')} {isLocked && '🔒'}
                </button>
              </>
            }
          />

          {/* Stats */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-5 gap-4">
            {[
              { title: t('Balance'), value: balance.toLocaleString(), trend: `≈ $${(balance / 100).toFixed(2)}`, icon: Wallet, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20', path: '/spectator/wallet' },
              { title: t('Active'), value: liveRaces.length > 0 ? String(liveRaces.length) : '—', trend: t('Live Now'), icon: Activity, color: 'text-red-400', bg: 'from-red-500/15 to-red-900/20', path: '/spectator/live' },
              { title: t('Tournaments'), value: String(new Set(upcoming.filter(r => r.status?.toLowerCase() !== 'finished').map(r => r.tournamentId)).size), trend: t('Following'), icon: Trophy, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', path: '/spectator/tournaments' },
              { title: t('Predictions'), value: String(bets.length), trend: `${pendingBets} ${t('pending results')}`, icon: BarChart3, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/spectator/predictions' },
              { title: t('Notifications'), value: String(notifCount), trend: t('Unread'), icon: Bell, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20', path: '/spectator/notifications' },
            ].map((m, i) => {
              const isForbidden = isLocked && (m.path === '/spectator/tournaments' || m.path === '/spectator/predictions');
              return (
                <motion.div key={i} variants={child} 
                  onClick={() => { if (!isForbidden) navigate(m.path); }}
                  className={`glass-panel rounded-xl p-5 relative overflow-hidden group transition-all ${
                    isForbidden 
                      ? 'opacity-40 cursor-not-allowed border-glass-border' 
                      : 'cursor-pointer hover:border-gold/30'
                  }`} style={{ height: '130px' }}>
                  <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${m.bg} blur-[30px] opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10 flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.bg} border border-white/[0.08] flex items-center justify-center ${m.color}`}><m.icon size={18} /></div>
                    <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{m.trend}</div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-2xl font-serif text-white font-bold group-hover:text-champagne transition-colors">{m.value}</div>
                    <div className="text-[11px] text-muted/70 font-medium">{m.title} {isForbidden && '🔒'}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Live race + Upcoming */}
          <div className="grid grid-cols-[1fr_360px] gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Activity size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">{t('Active')}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                <button onClick={() => navigate('/spectator/live')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0">{t('Detail')} <ChevronRight size={14} /></button>
              </div>
              {liveRaces.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🏁</div>
                  <div className="text-muted text-sm">{t('No data available')}</div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  {liveRaces.map((u: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center font-serif font-bold text-red-400 text-sm shrink-0">{i + 1}</div>
                      <Trophy size={13} className="text-gold/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{u.name ?? u.round}</div>
                        <div className="text-[10px] text-muted">{(u.tournamentName ?? u.tournament ?? '')}{u.raceDate ? ' • ' + formatDateTime(u.raceDate) : ''}</div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 animate-pulse">LIVE</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-sm font-medium text-muted">{t('Upcoming Tournaments')}</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                  <button onClick={() => navigate('/spectator/tournaments')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0">{t('View all')} <ChevronRight size={12} /></button>
                </div>
                {upcomingTournaments.length === 0 ? (
                  <div className="text-center py-6 text-muted text-sm">{t('No tournaments yet')}</div>
                ) : (
                  <div className="space-y-2">
                    {upcomingTournaments.slice(0, 4).map((tour: any, i: number) => (
                      <button
                        key={tour.tournamentId ?? i}
                        onClick={() => navigate(`/spectator/tournaments/${tour.tournamentId}`)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/5 transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                        <Trophy size={13} className="text-gold/60 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white">{tour.name}</div>
                          <div className="text-[10px] text-muted">
                            {tour.startDate ? new Date(tour.startDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US') : ''}
                            {tour.endDate ? ` → ${new Date(tour.endDate).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}` : ''}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${tour.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                          {tour.status === 'Active' ? t('Active') : t('Upcoming')}
                        </span>
                      </button>
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
                <h2 className="text-base font-serif text-white">{t('Recent Predictions')}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              {bets.length === 0 ? (
                <div className="text-center py-8"><div className="text-3xl opacity-40 mb-2">🎯</div><div className="text-muted text-sm">{t('No predictions yet')}</div></div>
              ) : (
                <div className="space-y-3 relative z-10">
                  {bets.slice(0, 5).map((b, i) => {
                    const s = (b.status ?? '').toLowerCase();
                    const isWin = s === 'win' || s === 'won' || s === 'correct';
                    const isLose = s === 'lose' || s === 'lost' || s === 'incorrect';
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group">
                        <div>
                          <div className="text-xs font-medium text-white">🐴 {b.horseName ?? (t('Horse') + ' #' + b.horseId)}</div>
                          <div className="text-[10px] text-muted">{b.raceName ?? (b.raceId ? 'Race #' + b.raceId : '')}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[11px] font-bold ${isWin ? 'text-emerald-400' : isLose ? 'text-red-400' : 'text-yellow-400'}`}>
                            {isWin ? t('Correct') : isLose ? t('Incorrect') : t('Pending')}
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
