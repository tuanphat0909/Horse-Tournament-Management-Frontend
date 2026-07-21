import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, ChevronRight, TrendingUp,
  Star, Clock, ShieldCheck, Flag, Wallet,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { getCurrentUser, parseApiError } from '../../api/authService';
import { getMyHorses, getOwnerWalletBalance, getOwnerResults } from '../../api/ownerService';
import { getRaceSchedule } from '../../api/publicService';
import { calculateAge, formatDateTime } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const SPARKS = [
  'M0,18 L12,14 L24,16 L36,10 L48,12 L60,6 L72,8 L84,4 L96,6 L100,3',
  'M0,16 L14,12 L28,15 L42,8 L56,11 L70,5 L84,9 L100,4',
  'M0,14 L16,18 L32,10 L48,14 L64,6 L80,10 L96,3 L100,5',
  'M0,12 L14,16 L28,10 L42,14 L56,8 L70,12 L84,5 L100,2',
];

export function OwnerDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const statusLower = user?.status?.toLowerCase();
  const isLocked = statusLower !== 'active';
  const { t } = useLanguage();
  const [horses, setHorses] = useState<any[]>([]);
  const [horsesLoading, setHorsesLoading] = useState(true);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [prizeTotal, setPrizeTotal] = useState<number | null>(null);

  useEffect(() => {
    getMyHorses()
      .then((d: any) => setHorses(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch((err: Error) => { console.error(parseApiError(err)); setHorses([]); })
      .finally(() => setHorsesLoading(false));
  }, []);

  useEffect(() => {
    getOwnerResults()
      .then((d: any) => {
        const list = d?.result ?? (Array.isArray(d) ? d : []);
        // Filter out completed or finished races to show only upcoming/active ones
        const upcoming = list.filter((r: any) => 
          r.status !== 'Finished' && r.status !== 'Completed'
        );
        // Sort by raceDate ascending (closest first)
        upcoming.sort((a: any, b: any) => {
          const da = a.raceDate ? new Date(a.raceDate).getTime() : 0;
          const db = b.raceDate ? new Date(b.raceDate).getTime() : 0;
          return da - db;
        });
        setSchedule(upcoming);
      })
      .catch((err: Error) => { console.error(parseApiError(err)); setSchedule([]); })
      .finally(() => setScheduleLoading(false));
  }, []);

  // Tổng tiền thưởng đã nhận — cộng dồn prizeAmount của các kết quả đã hoàn tất
  useEffect(() => {
    getOwnerResults()
      .then((d: any) => {
        const list = d?.result ?? (Array.isArray(d) ? d : []);
        const sum = (Array.isArray(list) ? list : [])
          .reduce((acc: number, r: any) => acc + (Number(r?.prizeAmount) || 0), 0);
        setPrizeTotal(sum);
      })
      .catch(() => setPrizeTotal(0));
  }, []);

  useEffect(() => {
    getOwnerWalletBalance()
      .then((d: any) => {
        const bal = d?.result?.balance ?? d?.result ?? (typeof d === 'number' ? d : 0);
        setWalletBalance(Number(bal) || 0);
      })
      .catch(() => setWalletBalance(0));
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />

      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />

        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          {/* ROW 1: HERO */}
          <PageHero
            title={<>{t('Welcome,')} <span className="italic text-champagne">{user?.fullName ?? t('Horse Owner')}</span></>}
            subtitle={t('Your stable overview')}
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 5%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {t('Season in progress')}
              </div>
            }
            actions={
              <div className="flex gap-2">
                <button
                  onClick={() => { if (!isLocked) navigate('/owner/horses'); }}
                  disabled={isLocked}
                  className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${isLocked
                      ? 'bg-white/5 border-glass-border text-muted/50 cursor-not-allowed'
                      : 'btn-gold'
                    }`}
                >
                  {t('Manage Horses')} {isLocked ? '🔒' : <ChevronRight size={14} />}
                </button>
                <button
                  onClick={() => navigate('/owner/wallet')}
                  className="px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-gold/25 text-champagne bg-gold/5 hover:bg-gold/10 transition-all"
                >
                  <Wallet size={13} /> {t('My Wallet')}
                </button>
                <button
                  onClick={() => { if (!isLocked) navigate('/owner/registrations'); }}
                  disabled={isLocked}
                  className={`px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${isLocked
                      ? 'border-glass-border text-muted/50 cursor-not-allowed bg-white/5'
                      : 'text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10'
                    }`}
                >
                  {t('Race Registration')} {isLocked && '🔒'}
                </button>
              </div>
            }
          />

          {/* ROW 2: STATS */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {[
              { title: t('My Horses'), value: String(horses.length), trend: '+12%', icon: Star, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', spark: SPARKS[0], to: '/owner/horses' },
              { title: t('Wallet Balance'), value: walletBalance === null ? '…' : `${walletBalance.toLocaleString()} ¢`, trend: '', icon: Wallet, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20', spark: SPARKS[1], to: '/owner/wallet' },
              { title: t('Upcoming'), value: scheduleLoading ? '…' : String(schedule.length), trend: t('3 days left'), icon: Calendar, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20', spark: SPARKS[2], to: '/owner/tournaments' },
              { title: t('Prize Money'), value: prizeTotal === null ? '…' : `${prizeTotal.toLocaleString()} ¢`, trend: '', icon: Trophy, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20', spark: SPARKS[3], to: '/owner/results' },
            ].map((m, i) => {
              const isForbidden = isLocked && (m.to === '/owner/horses' || m.to === '/owner/registrations' || m.to === '/owner/tournaments');
              return (
                <motion.div key={i} variants={child}
                  onClick={() => { if (!isForbidden) navigate(m.to); }}
                  className={`glass-panel rounded-xl p-5 relative overflow-hidden group transition-colors ${isForbidden
                      ? 'opacity-40 cursor-not-allowed border-glass-border'
                      : 'cursor-pointer hover:border-gold/30'
                    }`} style={{ height: '140px' }}>
                  <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${m.bg} blur-[30px] opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10 flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.bg} border border-white/[0.08] flex items-center justify-center ${m.color}`}>
                      <m.icon size={18} />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      <TrendingUp size={10} /> {m.trend}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-2xl font-serif text-white font-bold group-hover:text-champagne transition-colors">{m.value}</div>
                    <div className="text-[11px] text-muted/70 font-medium">{m.title} {isForbidden && '🔒'}</div>
                  </div>
                  <svg className="absolute bottom-0 left-0 w-full h-10 opacity-10 group-hover:opacity-25 transition-opacity" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`sf-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={`${m.spark} L100,20 L0,20 Z`} fill={`url(#sf-${i})`} />
                    <path d={m.spark} fill="none" stroke="var(--color-gold)" strokeWidth="0.4" />
                  </svg>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ROW 3: HORSES + RACES */}
          <div className="grid grid-cols-[1fr_380px] gap-6" style={{ minHeight: '420px' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="glass-panel rounded-xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <Star size={15} className="text-gold" />
                  </div>
                  <h2 className="text-lg font-serif text-white whitespace-nowrap">{t('My Horses')}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <button onClick={() => navigate('/owner/horses')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0">
                  {t('View all')} <ChevronRight size={14} />
                </button>
              </div>
              {/* Cuộn trong khối thay vì kéo dài trang khi có nhiều ngựa */}
              <div className="relative z-10 flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
                {horsesLoading ? (
                  <LoadingSkeleton />
                ) : horses.length === 0 ? (
                  <div className="text-center py-10"><div className="text-4xl opacity-40 mb-3">🐴</div><div className="text-muted text-sm">{t('No horses in your stable yet')}</div></div>
                ) : horses.map((h, i) => (
                  <div key={h.id ?? i} onClick={() => navigate('/owner/horses')} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                    <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-gold/15 to-navy/60 border border-glass-border ring-1 ring-gold/30 flex items-center justify-center shrink-0 text-xl">🐴</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">{h.name}</div>
                      <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted">{h.breed}</span>
                        <span>{calculateAge(h.age)} {t('years old')}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted/60 flex items-center gap-1 justify-end"><Flag size={9} className="text-gold/50" /> {t('Gender')}</div>
                      <div className="text-xs text-champagne font-semibold">{h.gender === 'Male' ? t('Male') : h.gender === 'Female' ? t('Female') : '—'}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs font-bold text-champagne"><ShieldCheck size={11} /> {h.healthStatus ?? t('Healthy')}</div>
                      </div>
                      <ChevronRight size={14} className="text-muted/30 group-hover:text-gold transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="glass-panel rounded-xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <Calendar size={15} className="text-gold" />
                  </div>
                  <h2 className="text-lg font-serif text-white whitespace-nowrap">{t('Upcoming Schedule')}</h2>
                </div>
                <button onClick={() => navigate('/owner/tournaments')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0">
                  {t('View Schedule')} <ChevronRight size={14} />
                </button>
              </div>
              {/* Cuộn trong khối thay vì kéo dài trang khi lịch nhiều mục */}
              <div className="relative z-10 flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1 scrollbar-thin">
                {scheduleLoading ? (
                  <LoadingSkeleton />
                ) : schedule.length === 0 ? (
                  <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="text-4xl opacity-40 mb-3">📅</div>
                    <div className="text-muted text-sm">{t('No upcoming races for your horses')}</div>
                  </div>
                ) : schedule.map((r, i) => (
                  <div key={r.raceId ?? i} onClick={() => navigate('/owner/tournaments')} className="relative overflow-hidden p-4 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group cursor-pointer">
                    <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-gradient-to-b from-gold/60 to-transparent" />
                    <div className="mb-2 space-y-1.5">
                      <h3 className="text-sm font-semibold text-white group-hover:text-champagne transition-colors">{r.raceName || r.name}</h3>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {r.tournamentName && (
                          <span className="block max-w-full text-[9px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded-full border border-gold/25 uppercase tracking-wider truncate" title={r.tournamentName}>
                            {r.tournamentName}
                          </span>
                        )}
                        {r.status && (
                          <span className="text-[9px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
                            {r.status}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Display Horse & Lane Info */}
                    <div className="mb-2 p-2 rounded bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs">
                      <span className="text-white flex items-center gap-1">🐴 {r.horseName}</span>
                      <span className="text-champagne font-bold">Lane {r.laneNo ?? '—'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      {r.raceDate && <span className="flex items-center gap-1"><Clock size={11} className="text-gold/60" /> {formatDateTime(r.raceDate)}</span>}
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
