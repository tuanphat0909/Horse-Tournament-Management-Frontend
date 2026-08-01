import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, ClipboardList, Calendar, TrendingUp, ChevronRight, Activity, UserCheck, Megaphone } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { getCurrentUser } from '../../api/authService';
import { getRaceSchedule } from '../../api/publicService';
import { getDashboardStats, getRegistrations, getActivityLog } from '../../api/adminService';
import { Link } from 'react-router-dom';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
// Link co animation cua framer-motion: van la the <a href> that (mo tab moi duoc)
const MotionLink = motion.create(Link);

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const fixMojibake = (str) => {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
};

export function AdminDashboardPage() {
  const user = getCurrentUser();
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    getRaceSchedule()
      .then((d) => {
        const raw = d?.result ?? (Array.isArray(d) ? d : []);
        setSchedule(
          raw.map((item) => ({
            ...item,
            name: fixMojibake(item.name),
          }))
        );
      })
      .catch(() => setSchedule([]));
    getDashboardStats()
      .then((res) => setStats(res?.result))
      .catch(() => setStats(null));

    setRegLoading(true);
    getRegistrations()
      .then((res) => {
        let dataList = [];
        if (res?.result) {
          dataList = res.result;
        } else if (res?.data?.result) {
          dataList = res.data.result;
        } else if (Array.isArray(res)) {
          dataList = res;
        }

        // Clean UTF-8 Mojibake from API strings
        dataList = dataList.map((item) => ({
          ...item,
          horseName: fixMojibake(item.horseName),
          ownerName: fixMojibake(item.ownerName),
          tournamentName: fixMojibake(item.tournamentName),
        }));

        setRegistrations(dataList);
      })
      .catch(() => setRegistrations([]))
      .finally(() => setRegLoading(false));

    // Active gần đây: dùng API thật GET /admin/activity-log (user mới, đăng ký, cược, thông báo, giao dịch ví)
    setActivitiesLoading(true);
    getActivityLog()
      .then((d) => {
        const raw = d?.result ?? (Array.isArray(d) ? d : []);
        const typeMap = {
          user: 'user',
          registration: 'registration',
          bet: 'bet',
          notification: 'notification',
          transaction: 'transaction',
        };
        setActivities(
          raw.map((a, i) => {
            const beType = String(a.type ?? '').toLowerCase();
            return {
              id: `act-${i}`,
              title: fixMojibake(a.title ?? ''),
              desc: fixMojibake(a.description ?? ''),
              date: a.createdAt ? new Date(a.createdAt) : new Date(),
              type: typeMap[beType] ?? 'other',
              status: /pending/i.test(a.title ?? '') ? 'pending' : undefined,
            };
          })
        );
      })
      .catch(() => setActivities([]))
      .finally(() => setActivitiesLoading(false));
  }, []);

  const upcomingRaces = schedule.length;
  const pendingRegs = registrations.filter((r) => r.status === 'Pending');

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${'minutes ago'}`;
    if (diffHours < 24) return `${diffHours} ${'hours ago'}`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} ${'days ago'}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <PageHero
            title={
              <>
                {'Welcome,'} <span className="italic text-champagne">{user?.fullName ?? 'Admin'}</span>
              </>
            }
            subtitle={`${'System Overview'} • ${'Season 2026'}`}
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {'System is active'}
              </div>
            }
            actions={
              <>
                <Link to="/admin/registrations" className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold font-sans">
                  {'View registrations'} <ChevronRight size={13} />
                </Link>
                <Link to="/admin/races" className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                  {'Manage races'}
                </Link>
              </>
            }
          />

          {/* STATS */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Users', value: stats ? stats.totalUsers : '—', trend: 'Active', icon: Users, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/admin/users' },
              { title: 'Tournaments', value: stats ? stats.totalTournaments : '—', trend: 'Season 2026', icon: Trophy, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20', path: '/admin/tournaments' },
              { title: 'Profit (VND)', value: stats ? new Intl.NumberFormat('en-US').format(stats.profit) : '—', trend: 'Betting Revenue', icon: ClipboardList, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', path: '/admin/wallet' },
              { title: 'Races', value: stats ? stats.activeRaces : '—', trend: upcomingRaces > 0 ? `${upcomingRaces} ${'total'}` : '—', icon: Calendar, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20', path: '/admin/races' },
            ].map((m, i) => (
              <MotionLink key={i} to={m.path} variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden group cursor-pointer block" style={{ height: '130px' }}>
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
                  <div className="text-2xl text-white group-hover:text-champagne transition-colors font-extrabold tracking-tight tabular-nums">{m.value}</div>
                  <div className="text-[11px] text-muted/70 font-medium">{m.title}</div>
                </div>
              </MotionLink>
            ))}
          </motion.div>

          {/* PENDING + ACTIVITY */}
          <div className="grid grid-cols-[1fr_380px] gap-6">
            {/* Pending Registrations */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <ClipboardList size={16} className="text-gold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif text-white">{'Pending registrations'}</h2>
                    <p className="text-xs text-muted mt-0.5">{'Needs processing within 24h'}</p>
                  </div>
                </div>
                <Link to="/admin/registrations" className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium">
                  {'View all'} <ChevronRight size={14} />
                </Link>
              </div>

              {regLoading ? (
                <div className="relative z-10 flex-1">
                  <LoadingSkeleton rows={3} h="h-12" />
                </div>
              ) : pendingRegs.length === 0 ? (
                <div className="relative z-10 flex-1 flex items-center justify-center">
                  <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden w-full">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="text-4xl opacity-40 mb-3">📊</div>
                    <div className="text-muted text-sm">{'No data available'}</div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex-1 overflow-x-auto overflow-y-auto min-h-[300px] max-h-[300px] scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="sticky top-0 z-10 border-b border-glass-border bg-navy text-[11px] font-bold text-muted uppercase tracking-wider">
                        <th className="px-4 py-3">{'ID'}</th>
                        <th className="px-4 py-3">{'Horse'}</th>
                        <th className="px-4 py-3">{'Owner'}</th>
                        <th className="px-4 py-3">{'Tournaments'}</th>
                        <th className="px-4 py-3 text-right">{'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/40 text-xs text-white">
                      {pendingRegs.map((reg) => (
                        <tr key={reg.registrationId} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-4 py-3.5 font-mono text-[11px] text-muted">#{reg.registrationId}</td>
                          <td className="px-4 py-3.5 font-medium">{reg.horseName}</td>
                          <td className="px-4 py-3.5 text-muted">{reg.ownerName}</td>
                          <td className="px-4 py-3.5 text-muted max-w-[150px] truncate" title={reg.tournamentName}>
                            {reg.tournamentName}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link to="/admin/registrations" className="inline-block px-2.5 py-1 rounded bg-gold/10 border border-gold/30 text-[10px] text-gold hover:bg-gold/20 transition-all font-semibold uppercase tracking-wider">
                              {'Approve'}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <Activity size={15} className="text-gold" />
                  </div>
                  <h2 className="text-lg font-serif text-white">{'Recent activity'}</h2>
                </div>
                <Activity size={16} className="text-muted" />
              </div>

              {activitiesLoading ? (
                <div className="relative z-10 flex-1">
                  <LoadingSkeleton rows={3} h="h-12" />
                </div>
              ) : activities.length === 0 ? (
                <div className="relative z-10 flex-1 flex items-center justify-center">
                  <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden w-full">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="text-4xl opacity-40 mb-3">📊</div>
                    <div className="text-muted text-sm">{'No data available'}</div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex-1 overflow-y-auto pr-1 max-h-[300px] space-y-4 scrollbar-thin">
                  {activities.slice(0, 10).map((act, index) => {
                    let Icon = Activity;
                    let colorClass = 'text-gold bg-gold/10 border-gold/25';
                    if (act.type === 'registration') {
                      Icon = ClipboardList;
                      colorClass = act.status === 'pending' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    } else if (act.type === 'tournament') {
                      Icon = Trophy;
                      colorClass = 'text-gold bg-gold/10 border-gold/25';
                    } else if (act.type === 'race') {
                      Icon = Calendar;
                      colorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
                    } else if (act.type === 'user') {
                      Icon = Users;
                      colorClass = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                    } else if (act.type === 'bet' || act.type === 'transaction') {
                      Icon = TrendingUp;
                      colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                    } else if (act.type === 'notification') {
                      Icon = Megaphone;
                      colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                    }

                    const timeStr = act.date ? formatRelativeTime(act.date) : '';

                    return (
                      <div key={act.id} className="relative flex gap-3 group">
                        {index < Math.min(activities.length, 10) - 1 && <div className="absolute left-[15px] top-8 bottom-[-16px] w-px bg-glass-border pointer-events-none group-hover:bg-gold/20 transition-colors" />}

                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 relative z-10 ${colorClass}`}>
                          <Icon size={14} />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-white group-hover:text-champagne transition-colors truncate">{act.title}</h4>
                            <span className="text-[10px] text-muted shrink-0 whitespace-nowrap font-medium">{timeStr}</span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5 leading-normal line-clamp-2">{act.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* QUICK LINKS */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Create new tournament', desc: 'Add new tournament to system', icon: Trophy, path: '/admin/tournaments', color: 'text-gold' },
              { label: 'Assign referees', desc: 'Assign referees to races', icon: UserCheck, path: '/admin/referees', color: 'text-cyan-400' },
              { label: 'Schedule races', desc: 'Create and schedule races', icon: Calendar, path: '/admin/races', color: 'text-purple-400' },
              { label: 'Publish results', desc: 'Publish confirmed results', icon: Megaphone, path: '/admin/results', color: 'text-emerald-400' },
            ].map((q, i) => (
              <MotionLink key={i} to={q.path} whileHover={{ scale: 1.02 }} className="glass-panel rounded-xl p-5 text-left group hover:border-gold/30 hover:bg-gold/[0.03] border border-glass-border transition-all relative overflow-hidden block">
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 w-10 h-10 rounded-lg bg-white/[0.04] border border-glass-border group-hover:border-gold/25 flex items-center justify-center mb-3 transition-colors">
                  <q.icon size={20} className={q.color} />
                </div>
                <div className="relative z-10 text-sm font-semibold text-white group-hover:text-champagne transition-colors">{q.label}</div>
                <div className="relative z-10 text-xs text-muted mt-1 leading-relaxed">{q.desc}</div>
              </MotionLink>
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
