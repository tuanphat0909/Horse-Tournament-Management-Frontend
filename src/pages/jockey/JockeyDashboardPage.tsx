import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Flag, Calendar, Trophy, ChevronRight, Award } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { useNavigate } from 'react-router-dom';
import { getContracts, respondContract, getJockeyStats, getAssignedHorses } from '../../api/jockeyService';
import { getCurrentUser, parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { CountdownTimer } from '../../components/ui/CountdownTimer';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function JockeyDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const { showToast } = useNotifications();
  const { t } = useLanguage();

  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [myRaces, setMyRaces] = useState<any[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
    
    getJockeyStats()
      .then(res => {
        if (res && res.result) setStats(res.result);
      })
      .catch(console.error);

    getAssignedHorses()
      .then(res => {
        setMyRaces(res?.result ?? (Array.isArray(res) ? res : []));
      })
      .catch(console.error);
  }, []);

  async function handleRespond(id: number, status: 'Accepted' | 'Rejected') {
    setRespondingId(id);
    try {
      await respondContract(id, status);
      setContracts(prev => prev.map(c => c.id === id ? {...c, status} : c));
      showToast(
        t(status === 'Accepted' ? 'Contract accepted successfully' : 'Contract declined successfully'),
        `${t('Contract')} #${id} ${t('has been processed.')}`,
        'success'
      );
    } catch (err: unknown) {
      showToast(t('Failed'), parseApiError(err as Error), 'error');
    } finally {
      setRespondingId(null);
    }
  }

  const pending = contracts.filter(c => {
    const s = (c.status ?? '').toLowerCase();
    return s === 'pending' || s === 'waiting';
  });

  const upcomingRacesCount = myRaces.filter(r => {
    const s = (r.status ?? '').toLowerCase();
    return s !== 'completed' && s !== 'finished';
  }).length;

  const completedRaces = myRaces.filter(r => {
    const s = (r.status ?? '').toLowerCase();
    return s === 'completed' || s === 'finished';
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
            title={<>{t('Welcome,')} <span className="italic text-champagne">{user?.fullName ?? t('Jockey')}</span></>}
            subtitle={t('Manage your race invitations and racing schedule')}
            imageUrl="/images/hero-jockey.jpg"
            imagePosition="center 12%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> {pending.length} {t('pending invitations')}
              </div>
            }
            actions={
              <>
                <button onClick={() => navigate('/jockey/invitations')} className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  {t('View Invitations')} <Bell size={13} />
                </button>
                <button onClick={() => navigate('/jockey/schedule')} className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                  {t('Race Schedule')}
                </button>
              </>
            }
          />

          {/* Stats */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {[
              { title: t('New Invitations'),    value: String(pending.length),    trend: t('Awaiting Response'), icon: Bell,     color: 'text-yellow-400', bg: 'from-yellow-500/15 to-yellow-900/20', path: '/jockey/invitations' },
              { title: t('Upcoming Races'), value: upcomingRacesCount > 0 ? String(upcomingRacesCount) : '—', trend: t('Next 7 days'), icon: Calendar, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/jockey/schedule' },
              { title: t('Total Wins'),   value: stats?.wins !== undefined ? String(stats.wins) : '—',                      trend: t('Season 2026'),     icon: Trophy,   color: 'text-gold',       bg: 'from-gold/15 to-amber-900/20',      path: '/jockey/stats' },
              { title: t('Assigned Horses'),  value: t('View Now'), trend: t('My Races'),icon: Flag,     color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20',path: '/jockey/races' },
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
                  <h2 className="text-lg font-serif text-white">{t('Pending Invitations')}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <button onClick={() => navigate('/jockey/invitations')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium shrink-0 ml-3">
                  {t('View all')} <ChevronRight size={14} />
                </button>
              </div>
              {loading ? (
                <LoadingSkeleton rows={3} h="h-12" />
              ) : pending.length === 0 ? (
                <div className="text-center py-8 text-muted text-sm">
                  <div className="text-4xl opacity-40 mb-3">🏇</div>
                  {t('No pending invitations')}
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.slice(0, 5).map((c, i) => (
                    <div key={c.id ?? i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-yellow-500/15 hover:border-yellow-500/30 hover:bg-gold/[0.04] transition-all group">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/15 to-transparent border border-gold/20 ring-1 ring-gold/20 flex items-center justify-center text-2xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors">{c.horseName ?? `Horse #${c.horseId}`}</div>
                        <div className="text-xs text-muted">
                          {t('Owner:')} {c.ownerName ?? `Owner #${c.ownerId ?? '—'}`}
                          {c.startDate ? ` • ${c.startDate}` : ''}
                        </div>
                        {c.invitationExpiredAt && (
                          <div className="mt-1.5">
                            <CountdownTimer target={c.invitationExpiredAt} />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          disabled={respondingId === c.id}
                          onClick={() => handleRespond(c.id, 'Accepted')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                          {t('Accept')}
                        </button>
                        <button
                          disabled={respondingId === c.id}
                          onClick={() => handleRespond(c.id, 'Rejected')}
                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                          {t('Decline')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recent Achievements */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Award size={15} className="text-gold" /></div>
                <h2 className="text-lg font-serif text-white">{t('Recent Achievements')}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              {loading ? (
                <LoadingSkeleton rows={3} />
              ) : completedRaces.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📊</div>
                  <div className="text-muted text-sm">{t('No data available')}</div>
                </div>
              ) : (() => {
                const total = completedRaces.length;
                const firstCount = completedRaces.filter(r => r.finishPosition === 1).length;
                const secondCount = completedRaces.filter(r => r.finishPosition === 2).length;
                const thirdCount = completedRaces.filter(r => r.finishPosition === 3).length;
                const otherCount = completedRaces.filter(r => r.finishPosition > 3 || !r.finishPosition).length;

                let pct1 = total > 0 ? Math.round((firstCount / total) * 100) : 0;
                let pct2 = total > 0 ? Math.round((secondCount / total) * 100) : 0;
                let pct3 = total > 0 ? Math.round((thirdCount / total) * 100) : 0;
                let pctOther = total > 0 ? Math.round((otherCount / total) * 100) : 0;

                const sum = pct1 + pct2 + pct3 + pctOther;
                if (total > 0 && sum !== 100) {
                  const diff = 100 - sum;
                  if (pct1 > 0) pct1 += diff;
                  else if (pct2 > 0) pct2 += diff;
                  else if (pct3 > 0) pct3 += diff;
                  else if (pctOther > 0) pctOther += diff;
                }

                const segments = [
                  { label: t('1st Place'), count: firstCount, percentage: pct1, color: '#e2ba5e', glowColor: 'rgba(226, 186, 94, 0.4)' },
                  { label: t('2nd Place'), count: secondCount, percentage: pct2, color: '#94a3b8', glowColor: 'rgba(148, 163, 184, 0.4)' },
                  { label: t('3rd Place'), count: thirdCount, percentage: pct3, color: '#b45309', glowColor: 'rgba(180, 83, 9, 0.4)' },
                  { label: t('Other'), count: otherCount, percentage: pctOther, color: '#475569', glowColor: 'rgba(71, 85, 105, 0.4)' },
                ].filter(s => s.count > 0);

                const radius = 50;
                const circumference = 2 * Math.PI * radius;

                let accumulatedPercentage = 0;
                const segmentsWithOffsets = segments.map(s => {
                  const angle = (accumulatedPercentage / 100) * 360 - 90;
                  accumulatedPercentage += s.percentage;
                  return {
                    ...s,
                    angle,
                    strokeDasharray: `${(s.percentage / 100) * circumference} ${circumference}`
                  };
                });

                return (
                  <div className="flex items-center gap-6 py-2">
                    {/* SVG Chart */}
                    <div className="relative w-[140px] h-[140px] shrink-0 flex items-center justify-center">
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        {/* Background track circle */}
                        <circle
                          cx="70"
                          cy="70"
                          r={radius}
                          fill="transparent"
                          stroke="rgba(255, 255, 255, 0.03)"
                          strokeWidth="8"
                        />
                        {segmentsWithOffsets.map((s, idx) => (
                          <circle
                            key={s.label}
                            cx="70"
                            cy="70"
                            r={radius}
                            fill="transparent"
                            stroke={s.color}
                            strokeWidth={hoveredIndex === idx ? 12 : 8}
                            strokeDasharray={s.strokeDasharray}
                            transform={`rotate(${s.angle} 70 70)`}
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{
                              filter: hoveredIndex === idx ? `drop-shadow(0 0 6px ${s.glowColor})` : 'none',
                            }}
                          />
                        ))}
                      </svg>
                      
                      {/* Inner label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">
                        <span className="text-[9px] uppercase tracking-wider text-muted font-bold">
                          {hoveredIndex !== null ? segments[hoveredIndex].label : t("Total Races")}
                        </span>
                        <span className="text-lg font-bold text-white font-serif mt-0.5">
                          {hoveredIndex !== null ? `${segments[hoveredIndex].percentage}%` : `${total} ${t('races')}`}
                        </span>
                      </div>
                    </div>

                    {/* Legends */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      {segments.map((s, idx) => (
                        <div
                          key={s.label}
                          className={`flex items-center justify-between p-2 rounded-xl transition-all border ${
                            hoveredIndex === idx 
                              ? 'bg-white/[0.04] border-white/10 scale-[1.02]' 
                              : 'bg-transparent border-transparent'
                          }`}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                            <span className="text-xs font-semibold text-white truncate">{s.label}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-champagne">{s.count} {t('races')}</span>
                            <span className="text-[10px] text-muted block leading-none mt-0.5">{s.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
