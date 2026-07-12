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
    title: 'Tạo giải đấu',
    desc: 'Admin tạo giải đấu mới: đặt tên, mở/đóng đăng ký, ngày bắt đầu/kết thúc, số vòng đấu.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/tournaments',
    actionLabel: 'Quản lý giải đấu',
    tip: 'Đảm bảo thứ tự ngày: Mở ĐK < Đóng ĐK < Bắt đầu < Kết thúc',
  },
  {
    num: 2,
    icon: Flag,
    title: 'Tạo cuộc đua & vòng đấu',
    desc: 'Admin tạo các cuộc đua theo vòng, chỉ định ngày đua, cự ly và số làn (mặc định 12 làn). Nếu số ngựa đăng ký > 12 → tạo thêm nhiều cuộc đua cho cùng vòng.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/races',
    actionLabel: 'Quản lý cuộc đua',
    tip: 'Tối đa 12 làn/race. 25 ngựa → cần 3 races (12+12+1)',
  },
  {
    num: 3,
    icon: ClipboardList,
    title: 'Chủ ngựa đăng ký tham gia',
    desc: 'Owner chọn ngựa và giải đấu muốn tham gia, nộp đơn đăng ký. Đơn vào trạng thái Pending, chờ Admin duyệt.',
    role: 'Owner',
    roleColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    path: '/owner/registrations',
    actionLabel: 'Trang đăng ký (Owner)',
  },
  {
    num: 4,
    icon: Users,
    title: 'Owner mời Jockey ký hợp đồng',
    desc: 'Owner chọn Jockey cho ngựa của mình trong từng giải, gửi lời mời hợp đồng. Jockey nhận và chấp nhận/từ chối.',
    role: 'Owner',
    roleColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    path: '/owner/jockeys',
    actionLabel: 'Mời Jockey (Owner)',
    tip: 'Ngựa phải có jockey hợp lệ mới được Admin duyệt',
  },
  {
    num: 5,
    icon: UserCheck,
    title: 'Jockey chấp nhận hợp đồng',
    desc: 'Jockey xem lời mời và bấm Chấp nhận. Hợp đồng chuyển sang trạng thái Accepted — ngựa đủ điều kiện thi đấu.',
    role: 'Jockey',
    roleColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    path: '/jockey/invitations',
    actionLabel: 'Lời mời (Jockey)',
  },
  {
    num: 6,
    icon: CheckCircle2,
    title: 'Admin duyệt đơn đăng ký',
    desc: 'Admin xem xét các đơn Pending, xác nhận ngựa đã có jockey hợp lệ rồi bấm Duyệt. Đơn chuyển sang Approved.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/registrations',
    actionLabel: 'Duyệt đăng ký',
  },
  {
    num: 7,
    icon: Flag,
    title: 'Phân ngựa vào làn đua',
    desc: 'Admin mở cuộc đua, ghép từng ngựa Approved vào một làn cụ thể. Admin có thể đổi làn cho ngựa (chức năng Đổi làn). Mỗi làn chỉ có một ngựa.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/races',
    actionLabel: 'Ghép làn đua',
    tip: 'Dùng nút ⇄ Đổi để hoán đổi làn giữa hai ngựa',
  },
  {
    num: 8,
    icon: Play,
    title: 'Trọng tài giám sát & ghi kết quả',
    desc: 'Trọng tài kiểm tra ngựa trước xuất phát, giám sát cuộc đua, ghi vi phạm (nếu có) và xác nhận thứ tự về đích sau khi đua kết thúc.',
    role: 'Referee',
    roleColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    path: '/referee/confirm-results',
    actionLabel: 'Xác nhận kết quả (Referee)',
  },
  {
    num: 9,
    icon: Megaphone,
    title: 'Admin công bố kết quả',
    desc: 'Admin xem kết quả trọng tài đã xác nhận, bấm Publish để công bố chính thức. Hệ thống tính điểm dự đoán, kích hoạt chi trả giải thưởng.',
    role: 'Admin',
    roleColor: 'text-gold bg-gold/10 border-gold/25',
    path: '/admin/results',
    actionLabel: 'Công bố kết quả',
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
            subtitle="Theo dõi tiến độ từng bước của quy trình: tạo giải → cấu hình → đăng ký → jockey → duyệt → phân làn → kết quả"
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
                <span className="text-base font-serif font-bold text-white">Tiến độ demo</span>
                <span className="ml-3 text-sm text-muted">{completedCount}/{totalCount} bước hoàn thành</span>
              </div>
              <div className="flex items-center gap-3">
                {completedCount === totalCount && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                    ✓ Hoàn thành toàn bộ!
                  </span>
                )}
                <button
                  onClick={() => setShowReset(true)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors px-2.5 py-1.5 rounded-lg border border-glass-border hover:bg-white/5"
                  title="Reset tiến độ"
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
                  title={`Bước ${s.num}: ${s.title}`}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    done.has(s.num) ? 'bg-emerald-500' : s.num === currentStep?.num ? 'bg-gold animate-pulse' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="text-[11px] text-muted mt-2">
              {currentStep
                ? <>Bước tiếp theo: <span className="text-champagne font-semibold">Bước {currentStep.num} — {currentStep.title}</span></>
                : <span className="text-emerald-400 font-semibold">Tất cả bước đã hoàn thành 🎉</span>}
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
                <div className="flex-1 text-sm text-white">Xác nhận reset toàn bộ tiến độ demo về 0?</div>
                <button onClick={resetAll} className="px-4 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-colors">Xác nhận</button>
                <button onClick={() => setShowReset(false)} className="px-3 py-1.5 rounded-lg border border-glass-border text-muted hover:text-white text-sm transition-colors">Hủy</button>
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
            <span className="ml-auto text-xs text-muted">Bấm ✓ để đánh dấu hoàn thành · Bấm tên bước để điều hướng</span>
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
                              <span className="text-[10px] font-bold text-muted/60 font-mono">Bước {step.num}</span>
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
                <div className="text-white font-semibold">Lưu ý khi demo</div>
                <div>Mỗi cuộc đua tối đa <b className="text-white">12 làn</b>. Nếu có 25 ngựa Approved → tạo <b className="text-white">3 cuộc đua</b> (12 + 12 + 1) trong cùng vòng đấu.</div>
                <div>Badge giải đấu: <span className="text-red-400 font-bold">🔒 Đã đóng ĐK</span> · <span className="text-yellow-400 font-bold">⚡ Final</span> (≤12 ngày) · <span className="text-emerald-400 font-bold">✓ Đang mở</span></div>
                <div>Validate ngày: Mở ĐK &lt; Đóng ĐK &lt; Bắt đầu &lt; Kết thúc — hệ thống cảnh báo real-time khi nhập sai thứ tự.</div>
                <div className="mt-1 text-[11px]">Tiến độ bước được lưu vào <code className="text-champagne">localStorage</code> — reset bằng nút Reset ở đầu trang.</div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
