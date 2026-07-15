import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, ClipboardList, Users, ShieldCheck, Flag,
  Play, CheckCircle2, Megaphone, UserCheck,
  RotateCcw, ExternalLink, Circle,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';

const LS_KEY = 'equestria_demoflow_done';

interface Step {
  num: number;
  icon: React.ElementType;
  title: string;
  desc: string;
  role: string;
  roleColor: string;
  path: string;
  actionLabel: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    num: 1,
    icon: Trophy,
    title: 'Create Tournament',
    desc: 'Admin creates a new tournament: names it, opens/closes registration, sets start/end dates, and specifies the number of rounds.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/tournaments',
    actionLabel: 'Tournament Management',
    tip: 'Ensure correct date order: Open Reg < Close Reg < Start < End',
  },
  {
    num: 2,
    icon: Flag,
    title: 'Create Races & Rounds',
    desc: 'Admin creates races for each round, specifying the race date, distance, and lanes (default 12). If registrations exceed 12 horses, multiple races are created for the same round.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/races',
    actionLabel: 'Manage races',
    tip: 'Max 12 lanes per race. 25 horses → 3 races needed (12+12+1)',
  },
  {
    num: 3,
    icon: ClipboardList,
    title: 'Owner Registers Entry',
    desc: 'Horse Owner selects a horse and tournament to join, then submits the registration request. The status becomes Pending, waiting for Admin approval.',
    role: 'Owner',
    roleColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    path: '/owner/registrations',
    actionLabel: 'Registration (Owner)',
  },
  {
    num: 4,
    icon: Users,
    title: 'Owner Invites Jockey',
    desc: 'Owner selects a Jockey for their horse in a tournament and sends a contract proposal. The Jockey receives and accepts/declines it.',
    role: 'Owner',
    roleColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    path: '/owner/jockeys',
    actionLabel: 'Invite Jockey (Owner)',
    tip: 'Horse must have a valid jockey assignment to be approved by the Admin',
  },
  {
    num: 5,
    icon: UserCheck,
    title: 'Jockey Accepts Contract',
    desc: 'Jockey views contract invitations and clicks Accept. The contract status changes to Accepted — making the horse eligible to compete.',
    role: 'Jockey',
    roleColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    path: '/jockey/invitations',
    actionLabel: 'Invitations (Jockey)',
  },
  {
    num: 6,
    icon: CheckCircle2,
    title: 'Admin Approves Registration',
    desc: 'Admin reviews Pending requests, verifies the horse has a valid jockey assignment, and clicks Approve. Status changes to Approved.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/registrations',
    actionLabel: 'Approve Registration',
  },
  {
    num: 7,
    icon: Flag,
    title: 'Assign Lanes',
    desc: 'Admin opens a race and assigns each Approved horse to a specific lane. The Admin can change lanes using the swap feature. Only one horse is allowed per lane.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/races',
    actionLabel: 'Assign Lanes',
    tip: 'Use the ⇄ Swap button to switch lanes between two horses',
  },
  {
    num: 8,
    icon: Play,
    title: 'Referee Monitors & Records',
    desc: 'Referee checks horses before start, monitors the race, records violations (if any), and confirms finishing positions when the race ends.',
    role: 'Referee',
    roleColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    path: '/referee/confirm-results',
    actionLabel: 'Confirm Results (Referee)',
  },
  {
    num: 9,
    icon: Megaphone,
    title: 'Admin Publishes Results',
    desc: 'Admin reviews the referee-confirmed results and clicks Publish. The system calculates prediction points and triggers prize payouts.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/results',
    actionLabel: 'Publish Results',
  },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-gold/10 border-gold/20 text-champagne',
  Owner: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  Jockey: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  Referee: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
};

function loadDone(): Set<number> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveDone(done: Set<number>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...done]));
}

export function AdminDemoFlowPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState<Set<number>>(loadDone);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => { saveDone(done); }, [done]);

  function toggleDone(num: number) {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }

  function resetAll() {
    setDone(new Set());
    setShowReset(false);
  }

  const completedCount = done.size;
  const totalCount = STEPS.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  // Determine current step (first not done)
  const currentStep = STEPS.find(s => !done.has(s.num));

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: 'var(--page-bg)' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-4xl mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Demo Flow — End-to-End"
            subtitle="Track the step-by-step process of the demo flow: create tournament → configure → register → jockey contract → approval → lane assignment → publish results"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Progress tracker */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl p-5 border border-glass-border relative overflow-hidden"
          >
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-base font-serif font-bold text-white">Demo Progress</span>
                <span className="ml-3 text-sm text-muted">{completedCount}/{totalCount} steps completed</span>
              </div>
              <div className="flex items-center gap-3">
                {completedCount === totalCount && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                    ✓ All completed!
                  </span>
                )}
                <button
                  onClick={() => setShowReset(true)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors px-2.5 py-1.5 rounded-lg border border-glass-border hover:bg-white/5"
                  title="Reset progress"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 rounded-full bg-white/5 border border-glass-border overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-gold/80 to-gold"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Step dots */}
            <div className="flex gap-1 mt-2.5">
              {STEPS.map(s => (
                <button
                  key={s.num}
                  onClick={() => toggleDone(s.num)}
                  title={`Step ${s.num}: ${s.title}`}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    done.has(s.num) ? 'bg-emerald-500' : s.num === currentStep?.num ? 'bg-gold animate-pulse' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="text-[11px] text-muted mt-2">
              {currentStep
                ? <>Next Step: <span className="text-champagne font-semibold">Step {currentStep.num} — {currentStep.title}</span></>
                : <span className="text-emerald-400 font-semibold">All steps completed 🎉</span>}
            </div>
          </motion.div>

          {/* Reset confirm */}
          <AnimatePresence>
            {showReset && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel rounded-xl p-4 border border-red-500/25 bg-red-500/5 flex items-center gap-4"
              >
                <div className="flex-1 text-sm text-white">Are you sure you want to reset all demo progress to 0?</div>
                <button onClick={resetAll} className="px-4 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors">Confirm</button>
                <button onClick={() => setShowReset(false)} className="px-3 py-1.5 rounded-lg border border-glass-border text-muted hover:text-white text-sm transition-colors">Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role legend */}
          <div className="flex flex-wrap gap-2 items-center">
            {Object.entries(ROLE_COLORS).map(([role, cls]) => (
              <span key={role} className={`text-[11px] font-bold px-3 py-1 rounded-full border ${cls}`}>
                {role}
              </span>
            ))}
            <span className="ml-auto text-xs text-muted">Click ✓ to mark completed · Click step name to navigate</span>
          </div>

          {/* Steps timeline */}
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-linear-to-b from-gold/40 via-glass-border to-transparent pointer-events-none" />

            <div className="space-y-3">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = done.has(step.num);
                const isCurrent = currentStep?.num === step.num;

                return (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative pl-16"
                  >
                    {/* Circle marker */}
                    <div className="absolute left-0 top-4 w-[55px] flex items-center justify-center">
                      <motion.div
                        animate={isCurrent ? { boxShadow: ['0 0 0 0 rgba(212,175,55,0.4)', '0 0 0 8px rgba(212,175,55,0)', '0 0 0 0 rgba(212,175,55,0.4)'] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 relative z-10 transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500/15 border-emerald-500/40'
                            : isCurrent
                            ? 'bg-gold/15 border-gold/50'
                            : 'bg-white/3 border-glass-border'
                        }`}
                      >
                        {isDone
                          ? <CheckCircle2 size={17} className="text-emerald-400" />
                          : <Icon size={17} className={isCurrent ? 'text-gold' : 'text-muted'} />}
                      </motion.div>
                    </div>

                    {/* Card */}
                    <div className={`glass-panel rounded-xl border transition-all duration-300 ${
                      isDone
                        ? 'border-emerald-500/20 bg-emerald-500/3 opacity-80'
                        : isCurrent
                        ? 'border-gold/35 bg-gold/3'
                        : 'border-glass-border'
                    }`}>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold text-muted/60 font-mono">Step {step.num}</span>
                              <h3 className={`text-sm font-semibold transition-colors ${isDone ? 'text-muted line-through' : 'text-white'}`}>
                                {step.title}
                              </h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${step.roleColor}`}>
                                {step.role}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold animate-pulse">
                                  ← Hiện tại
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                            {step.tip && !isDone && (
                              <div className="mt-1.5 text-[11px] text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-2.5 py-1">
                                💡 {step.tip}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 flex flex-col gap-2 items-end">
                            {/* Mark done toggle */}
                            <button
                              onClick={() => toggleDone(step.num)}
                              className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                isDone
                                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                                  : 'border-glass-border bg-white/3 text-muted hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/8'
                              }`}
                            >
                              {isDone
                                ? <><CheckCircle2 size={12} /> Hoàn thành</>
                                : <><Circle size={12} /> Đánh dấu</>}
                            </button>

                            {/* Navigate button */}
                            <button
                              onClick={() => navigate(step.path)}
                              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-white/4 border border-glass-border hover:border-gold/30 hover:bg-gold/5 transition-all text-champagne font-bold whitespace-nowrap"
                            >
                              {step.actionLabel} <ExternalLink size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Info box */}
          <div className="glass-panel rounded-xl p-4 border border-yellow-500/15 bg-yellow-500/3 relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="flex items-start gap-3">
              <ShieldCheck size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <div className="text-xs text-muted leading-relaxed space-y-1">
                <div className="text-white font-semibold">Save ý khi demo</div>
                <div>Mỗi races tối đa <b className="text-white">12 lanes</b>. Nếu có 25 horse Approved → tạo <b className="text-white">3 races</b> (12 + 12 + 1) trong cùng rounds.</div>
                <div>Badge tournaments: <span className="text-red-400 font-bold">🔒 Đã đóng ĐK</span> · <span className="text-yellow-400 font-bold">⚡ Final</span> (≤12 days) · <span className="text-emerald-400 font-bold">✓ Đang mở</span></div>
                <div>Validate days: Mở ĐK &lt; Close ĐK &lt; Start &lt; Kết thúc — hệ thống cảnh báo real-time khi nhập sai thứ tự.</div>
                <div className="mt-1 text-[11px]">Tiến độ bước được lưu vào <code className="text-champagne">localStorage</code> — reset bằng nút Reset ở đầu trang.</div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
