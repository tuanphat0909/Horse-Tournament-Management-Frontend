import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Trophy, ClipboardList, Calendar,
  TrendingUp, ChevronRight,
  Activity, UserCheck, Megaphone,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { PageHero } from '../../components/layout/PageHero';
import { getCurrentUser } from '../../api/authService';
import { getRaceSchedule } from '../../api/publicService';
import { useNavigate } from 'react-router-dom';

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    getRaceSchedule()
      .then((d: any) => setSchedule(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setSchedule([]));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayRaces = schedule.filter(r => (r.raceDate ?? '').startsWith(today)).length;
  const upcomingRaces = schedule.length;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          {/* TODO: BE chưa có API thống kê cho dashboard */}

          <PageHero
            title={<>Chào mừng, <span className="italic text-champagne">{user?.fullName ?? 'Admin'}</span></>}
            subtitle="Tổng quan hệ thống • Mùa giải 2026"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Hệ thống đang hoạt động
              </div>
            }
            actions={
              <>
                <button onClick={() => navigate('/admin/registrations')} className="btn-gold px-5 py-2 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  Xem đăng ký <ChevronRight size={13} />
                </button>
                <button onClick={() => navigate('/admin/races')} className="px-5 py-2 rounded-lg text-xs text-champagne border border-gold/25 bg-gold/5 hover:bg-gold/10 transition-colors font-medium">
                  Quản lý cuộc đua
                </button>
              </>
            }
          />

          {/* STATS */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: 'Người dùng', value: '—', trend: '—', icon: Users, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20', path: '/admin/users' },
              { title: 'Giải đấu', value: '—', trend: '—', icon: Trophy, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20', path: '/admin/tournaments' },
              { title: 'Chờ duyệt', value: '—', trend: '—', icon: ClipboardList, color: 'text-orange-400', bg: 'from-orange-500/15 to-orange-900/20', path: '/admin/registrations' },
              { title: 'Cuộc đua hôm nay', value: todayRaces > 0 ? String(todayRaces) : '—', trend: upcomingRaces > 0 ? `${upcomingRaces} sắp tới` : '—', icon: Calendar, color: 'text-purple-400', bg: 'from-purple-500/15 to-purple-900/20', path: '/admin/races' },
            ].map((m, i) => (
              <motion.div
                key={i}
                variants={child}
                onClick={() => navigate(m.path)}
                className="glass-panel rounded-xl p-5 relative overflow-hidden group cursor-pointer"
                style={{ height: '130px' }}
              >
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
              </motion.div>
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
                    <h2 className="text-lg font-serif text-white">Đăng ký chờ duyệt</h2>
                    <p className="text-xs text-muted mt-0.5">Cần xử lý trong 24h</p>
                  </div>
                </div>
                <button onClick={() => navigate('/admin/registrations')} className="text-xs text-gold hover:text-champagne flex items-center gap-1 transition-colors font-medium">
                  Xem tất cả <ChevronRight size={14} />
                </button>
              </div>
              {/* TODO: BE chưa có API danh sách đăng ký chờ duyệt */}
              <div className="relative z-10 flex-1 flex items-center justify-center">
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden w-full">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📊</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              </div>
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
                  <h2 className="text-lg font-serif text-white">Hoạt động gần đây</h2>
                </div>
                <Activity size={16} className="text-muted" />
              </div>
              {/* TODO: BE chưa có API hoạt động gần đây */}
              <div className="relative z-10 flex-1 flex items-center justify-center overflow-y-auto">
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden w-full">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📊</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* QUICK LINKS */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tạo giải đấu mới', desc: 'Thêm tournament mới vào hệ thống', icon: Trophy, path: '/admin/tournaments', color: 'text-gold' },
              { label: 'Phân công trọng tài', desc: 'Gán referee cho các cuộc đua', icon: UserCheck, path: '/admin/referees', color: 'text-cyan-400' },
              { label: 'Lập lịch đua', desc: 'Tạo và sắp xếp các vòng đua', icon: Calendar, path: '/admin/races', color: 'text-purple-400' },
              { label: 'Công bố kết quả', desc: 'Publish kết quả đã xác nhận', icon: Megaphone, path: '/admin/results', color: 'text-emerald-400' },
            ].map((q, i) => (
              <motion.button
                key={i}
                onClick={() => navigate(q.path)}
                whileHover={{ scale: 1.02 }}
                className="glass-panel rounded-xl p-5 text-left group hover:border-gold/30 hover:bg-gold/[0.03] border border-glass-border transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 w-10 h-10 rounded-lg bg-white/[0.04] border border-glass-border group-hover:border-gold/25 flex items-center justify-center mb-3 transition-colors">
                  <q.icon size={20} className={q.color} />
                </div>
                <div className="relative z-10 text-sm font-semibold text-white group-hover:text-champagne transition-colors">{q.label}</div>
                <div className="relative z-10 text-xs text-muted mt-1 leading-relaxed">{q.desc}</div>
              </motion.button>
            ))}
          </motion.div>

        </main>
      </div>
    </div>
  );
}
