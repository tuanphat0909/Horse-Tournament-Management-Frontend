import { motion } from 'framer-motion';
import {
  Trophy, Activity, Calendar, ChevronRight, TrendingUp,
  Star, Clock, ShieldCheck, LogOut, MapPin, Users,
  Target, Award, BarChart3, Zap, Home, Flag,
  Settings, Bell, Search, Compass, LayoutDashboard
} from 'lucide-react';
import type { RouteView } from '../App';

interface DashboardProps {
  navigateTo: (view: RouteView) => void;
}

const child = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } }
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const IMG = {
  hero: 'https://images.unsplash.com/photo-1529042288765-3e6f15f11e95?auto=format&fit=crop&q=80&w=800',
  horse1: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=400',
  horse2: 'https://images.unsplash.com/photo-1534773728080-33d4cabc79d7?auto=format&fit=crop&q=80&w=400',
  horse3: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400',
  horse4: 'https://images.unsplash.com/photo-1508761373-adce5aef3023?auto=format&fit=crop&q=80&w=400',
  horse5: 'https://images.unsplash.com/photo-1560206536-9cfd35e5ead5?auto=format&fit=crop&q=80&w=400',
  track: 'https://images.unsplash.com/photo-1529042288765-3e6f15f11e95?auto=format&fit=crop&q=80&w=1400',
  dubai: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&q=80&w=600',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
};

const SPARKS = [
  'M0,18 L12,14 L24,16 L36,10 L48,12 L60,6 L72,8 L84,4 L96,6 L100,3',
  'M0,16 L14,12 L28,15 L42,8 L56,11 L70,5 L84,9 L100,4',
  'M0,14 L16,18 L32,10 L48,14 L64,6 L80,10 L96,3 L100,5',
  'M0,12 L14,16 L28,10 L42,14 L56,8 L70,12 L84,5 L100,2',
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Flag, label: 'My Horses', active: false },
  { icon: Trophy, label: 'Tournaments', active: false },
  { icon: Calendar, label: 'Schedule', active: false },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: Compass, label: 'Explore', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

export function Dashboard({ navigateTo }: DashboardProps) {
  return (
    <div className="min-h-screen bg-[#0B1628] text-body font-sans flex">

      {/* ═══ LEFT SIDEBAR ═══ */}
      <aside className="w-[280px] shrink-0 h-screen sticky top-0 border-r border-glass-border bg-[#0A1220] flex flex-col z-40">
        {/* Logo */}
        <div className="px-6 h-16 flex items-center gap-2.5 border-b border-glass-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/30">
            <svg viewBox="0 0 24 24" fill="var(--color-gold)" className="w-4 h-4">
              <path d="M12 2C9 2 8 5 8 5L6 6V10L8 12V18L6 20H8V22H10V20H14V22H16V20H18L16 18V12L18 10V6L16 5C16 5 15 2 12 2Z" />
            </svg>
          </div>
          <span className="font-serif text-lg font-bold text-champagne tracking-wider">EQUESTRIA</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.15em] text-muted/50 font-bold px-3 mb-2">Main</div>
          {NAV_ITEMS.map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-200 ${
                item.active
                  ? 'bg-gold/10 text-champagne border border-gold/20'
                  : 'text-muted hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <item.icon size={18} className={item.active ? 'text-gold' : ''} />
              {item.label}
            </button>
          ))}

          <div className="text-[10px] uppercase tracking-[0.15em] text-muted/50 font-bold px-3 mt-6 mb-2">Quick Actions</div>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-white/[0.04] transition-all border border-transparent">
            <Zap size={18} /> Register Horse
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-white hover:bg-white/[0.04] transition-all border border-transparent">
            <Bell size={18} /> Notifications
            <span className="ml-auto text-[10px] bg-gold/20 text-gold font-bold px-2 py-0.5 rounded-full">3</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-glass-border shrink-0">
          <div className="flex items-center gap-3">
            <img src={IMG.avatar} alt="Profile" className="w-9 h-9 rounded-lg object-cover border border-glass-border bg-surface" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">Alexander Sterling</div>
              <div className="text-[11px] text-gold font-medium">Elite Owner</div>
            </div>
            <button onClick={() => navigateTo('home')} className="text-muted hover:text-white transition-colors p-1" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-glass-border bg-[#0B1628]/90 backdrop-blur-xl flex items-center px-8 justify-between">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-80">
            <Search size={16} className="text-muted" />
            <input type="text" placeholder="Search horses, races, tournaments..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-muted hover:text-white transition-colors p-2">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold" />
            </button>
            <div className="text-sm text-muted">
              <span className="text-white font-medium">Season 2026</span> • Q3
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          {/* ═══ ROW 1: COMPACT HERO ═══ */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-panel rounded-2xl overflow-hidden flex"
            style={{ height: '220px' }}
          >
            {/* Left Content */}
            <div className="flex-1 p-8 flex flex-col justify-center relative">
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(201,168,76,0.3) 20px, rgba(201,168,76,0.3) 21px)' }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Season Active
                </div>
                <h1 className="text-2xl font-serif text-white mb-1.5">Welcome back, <span className="italic text-champagne">Alexander</span></h1>
                <p className="text-sm text-muted mb-5">2 horses running today • Season rank #3 • 68% win rate</p>
                <div className="flex gap-3">
                  <button className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                    Register Horse <ChevronRight size={14} />
                  </button>
                  <button className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                    View Calendar
                  </button>
                </div>
              </div>
            </div>
            {/* Right Image */}
            <div className="w-[40%] relative overflow-hidden hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E35] via-[#0F1E35]/60 to-transparent z-10" />
              <img src={IMG.hero} alt="" className="w-full h-full object-cover" />
              {/* Season summary overlay */}
              <div className="absolute bottom-4 right-4 z-20 bg-navy/80 backdrop-blur-md rounded-lg px-4 py-3 border border-glass-border">
                <div className="flex gap-5">
                  {[{ l: 'Earnings', v: '$1.2M' }, { l: 'Wins', v: '21' }, { l: 'Rank', v: '#3' }].map((s, i) => (
                    <div key={i} className="text-center">
                      <div className="text-base font-serif font-bold text-white">{s.v}</div>
                      <div className="text-[10px] text-muted uppercase tracking-wider">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ ROW 2: STATISTICS GRID ═══ */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {[
              { title: 'My Horses', value: '12', trend: '+12%', icon: Star, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', spark: SPARKS[0] },
              { title: 'Active Races', value: '2', trend: '+1', icon: Activity, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', spark: SPARKS[1] },
              { title: 'Upcoming', value: '4', trend: '3 days', icon: Calendar, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20', spark: SPARKS[2] },
              { title: 'Prize Won', value: '$1.2M', trend: '+18%', icon: Trophy, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20', spark: SPARKS[3] },
            ].map((m, i) => (
              <motion.div key={i} variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden group cursor-default" style={{ height: '140px' }}>
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
                  <div className="text-[11px] text-muted/70 font-medium">{m.title}</div>
                </div>
                <svg className="absolute bottom-0 left-0 w-full h-10 opacity-10 group-hover:opacity-25 transition-opacity" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <defs><linearGradient id={`sf-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.6" /><stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" /></linearGradient></defs>
                  <path d={`${m.spark} L100,20 L0,20 Z`} fill={`url(#sf-${i})`} />
                  <path d={m.spark} fill="none" stroke="var(--color-gold)" strokeWidth="0.4" />
                </svg>
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ ROW 3: HORSES + UPCOMING RACES ═══ */}
          <div className="grid grid-cols-[1fr_380px] gap-6" style={{ minHeight: '420px' }}>

            {/* Recent Horses */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="glass-panel rounded-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-serif text-white">My Horses</h2>
                <button className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium">View All <ChevronRight size={14} /></button>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto">
                {[
                  { name: 'Thunderstrike', breed: 'Thoroughbred', age: '3y', perf: 98, health: 100, next: 'Dubai World Cup', img: IMG.horse1 },
                  { name: 'Desert Wind', breed: 'Arabian', age: '4y', perf: 94, health: 95, next: 'Melbourne Cup', img: IMG.horse2 },
                  { name: 'Midnight Run', breed: 'Thoroughbred', age: '2y', perf: 89, health: 98, next: 'Kentucky Derby', img: IMG.horse3 },
                  { name: 'Golden Hoof', breed: 'Quarter Horse', age: '5y', perf: 92, health: 88, next: 'Royal Ascot', img: IMG.horse4 },
                  { name: 'Silver Arrow', breed: 'Appaloosa', age: '3y', perf: 87, health: 96, next: 'Prix Arc', img: IMG.horse5 },
                ].map((h, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-gold/15 transition-all group cursor-pointer relative">
                    <img src={h.img} alt={h.name} className="w-11 h-11 rounded-lg object-cover bg-surface border border-glass-border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">{h.name}</div>
                      <div className="text-[11px] text-muted">{h.breed} • {h.age}</div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="text-[11px] text-muted/60">Next Race</div>
                      <div className="text-xs text-champagne font-medium">{h.next}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs font-bold text-champagne"><ShieldCheck size={11} /> {h.perf}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-12 h-1 bg-navy rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${h.health >= 95 ? 'bg-emerald-400' : h.health >= 85 ? 'bg-yellow-400' : 'bg-orange-400'}`} style={{ width: `${h.health}%` }} />
                          </div>
                          <span className="text-[10px] text-muted">{h.health}%</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-muted/30 group-hover:text-gold transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Races */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="glass-panel rounded-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-serif text-white">Upcoming Races</h2>
                <button className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium">Schedule <ChevronRight size={14} /></button>
              </div>

              <div className="flex-1 space-y-3">
                {[
                  { name: 'Dubai World Cup', date: 'Tomorrow, 14:00', loc: 'Meydan, Dubai', prize: '$12M', countdown: '2d 14h', horses: 2 },
                  { name: 'Kentucky Derby', date: 'Jun 5, 16:00', loc: 'Louisville, USA', prize: '$5M', countdown: '12d 8h', horses: 1 },
                  { name: 'Melbourne Cup', date: 'Nov 5, 15:00', loc: 'Flemington, AUS', prize: '$8M', countdown: '24d', horses: 1 },
                ].map((r, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-glass-border hover:border-gold/20 transition-all group cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white group-hover:text-champagne transition-colors">{r.name}</h3>
                      <span className="text-[10px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded">{r.countdown}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted mb-2">
                      <span className="flex items-center gap-1"><Clock size={11} className="text-gold/60" /> {r.date}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} className="text-gold/60" /> {r.loc}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-champagne font-bold">{r.prize}</span>
                        <span className="text-muted">{r.horses} horse{r.horses > 1 ? 's' : ''} entered</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ═══ ROW 4: TOURNAMENT SHOWCASE ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden relative group border border-gold/20 hover:border-gold/40 transition-colors duration-500"
            style={{ height: '280px' }}
          >
            <img src={IMG.track} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 bg-surface" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-navy/20" />

            <div className="relative z-10 h-full flex items-center px-10 gap-10">
              <div className="flex-1 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-champagne text-[10px] font-bold uppercase tracking-[0.12em] mb-4 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> Featured Event
                </div>
                <h2 className="text-3xl font-serif text-white mb-2 group-hover:text-champagne transition-colors leading-tight">Royal Ascot Invitational</h2>
                <p className="text-sm text-muted/80 mb-5 line-clamp-2">The most prestigious event of the season. Compete for the $2.5M grand prize at the world's most iconic racecourse.</p>
                <div className="flex items-center gap-5">
                  <div className="flex -space-x-2">
                    {[IMG.horse1, IMG.horse2, IMG.horse3].map((src, i) => (
                      <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-navy object-cover bg-surface" />
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-navy bg-surface-elevated flex items-center justify-center text-[9px] font-bold text-gold">+42</div>
                  </div>
                  <span className="text-xs text-muted">horses registered</span>
                </div>
              </div>

              {/* Right Panel */}
              <div className="bg-navy/70 backdrop-blur-xl rounded-xl p-6 border border-glass-border w-[300px] shrink-0 hidden md:flex flex-col items-center">
                <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1.5">Closes In</div>
                <div className="text-2xl font-serif text-white font-bold mb-4 tracking-wider">
                  48<span className="text-sm text-muted font-sans">h</span>
                  <span className="text-gold mx-1.5">:</span>
                  15<span className="text-sm text-muted font-sans">m</span>
                  <span className="text-gold mx-1.5">:</span>
                  22<span className="text-sm text-muted font-sans">s</span>
                </div>
                <div className="w-full mb-4">
                  <div className="flex justify-between text-[10px] text-muted mb-1 font-bold">
                    <span>Capacity</span><span className="text-gold">85%</span>
                  </div>
                  <div className="h-1.5 w-full bg-navy rounded-full overflow-hidden border border-glass-border">
                    <div className="h-full w-[85%] bg-gradient-to-r from-gold to-champagne rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted mb-4 w-full justify-center">
                  <span className="flex items-center gap-1"><Users size={12} className="text-gold" /> 85</span>
                  <span className="w-px h-3 bg-glass-border" />
                  <span className="flex items-center gap-1"><Trophy size={12} className="text-gold" /> $2.5M</span>
                </div>
                <button className="btn-gold w-full py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 font-bold">
                  Register Now <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* ═══ ROW 5: ANALYTICS + ACTIVITY ═══ */}
          <div className="grid grid-cols-2 gap-6">

            {/* Performance Analytics */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-serif text-white mb-5">Season Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Win Rate', value: '68%', ring: 68, icon: Target, accent: 'text-emerald-400' },
                  { label: 'Earnings', value: '$1.2M', ring: 82, icon: Award, accent: 'text-gold' },
                  { label: 'Races', value: '31', ring: 75, icon: BarChart3, accent: 'text-blue-400' },
                  { label: 'Ranking', value: '#3', ring: 92, icon: Zap, accent: 'text-purple-400' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-glass-border group hover:border-gold/15 transition-all">
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeDasharray={`${s.ring} ${100 - s.ring}`} strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(201,168,76,0.4)]" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <s.icon size={14} className={s.accent} />
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors">{s.value}</div>
                      <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.4 }} className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-serif text-white mb-5">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  { action: 'Thunderstrike won the Dubai Qualifier', time: '2 hours ago', icon: Trophy, color: 'text-gold bg-gold/10' },
                  { action: 'Desert Wind registered for Melbourne Cup', time: '5 hours ago', icon: Flag, color: 'text-blue-400 bg-blue-500/10' },
                  { action: 'Health check completed for Golden Hoof', time: '1 day ago', icon: ShieldCheck, color: 'text-emerald-400 bg-emerald-500/10' },
                  { action: 'Midnight Run training session logged', time: '1 day ago', icon: Activity, color: 'text-purple-400 bg-purple-500/10' },
                  { action: 'Prize received: Dubai Qualifier ($24,000)', time: '2 days ago', icon: Award, color: 'text-champagne bg-gold/10' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                      <a.icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/90 group-hover:text-white transition-colors">{a.action}</div>
                      <div className="text-[11px] text-muted/60 mt-0.5">{a.time}</div>
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
