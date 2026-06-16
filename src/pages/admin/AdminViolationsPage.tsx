import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getViolations } from '../../api/adminService';

type Tab = 'notifications' | 'escalations';

function fmtDate(s?: string) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
}

export function AdminViolationsPage() {
  const [tab, setTab] = useState<Tab>('escalations');
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getViolations()
      .then((d: any) => setViolations(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setViolations([]))
      .finally(() => setLoading(false));
  }, []);

  const confirmed = violations.filter(v => ['confirmed', 'upheld'].includes((v.status ?? '').toLowerCase())).length;
  const dismissed = violations.filter(v => ['dismissed', 'rejected', 'overturned'].includes((v.status ?? '').toLowerCase())).length;
  const pending   = violations.filter(v => ['escalated', 'appealing', 'pending'].includes((v.status ?? '').toLowerCase())).length;

  const escalations   = violations.filter(v => ['escalated', 'appealing', 'pending'].includes((v.status ?? '').toLowerCase()));
  const notifications = violations.filter(v => ['confirmed', 'dismissed', 'rejected', 'upheld', 'overturned'].includes((v.status ?? '').toLowerCase()));

  const tabList = tab === 'escalations' ? escalations : notifications;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Xử lý vi phạm"
            subtitle="Kháng cáo và quyết định chính thức"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Flow */}
          <div className="glass-panel rounded-xl p-4 border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted font-bold shrink-0">Quy trình:</span>
              {[
                { label: 'Trọng tài ghi nhận',            active: false },
                { label: '→', sep: true },
                { label: 'Jockey khiếu nại (30 phút)',    active: false },
                { label: '→', sep: true },
                { label: 'Trọng tài ra quyết định',        active: false },
                { label: '→', sep: true },
                { label: 'Admin nhận thông báo',           active: false, note: true },
                { label: '→', sep: true },
                { label: 'Kháng cáo án nặng (48h)',        active: true },
              ].map((s, i) =>
                s.sep ? <span key={i} className="text-muted/30">→</span>
                  : <span key={i} className={`px-2.5 py-1 rounded-lg border text-white/80 ${s.active ? 'bg-gold/10 border-gold/20 text-gold font-bold' : s.note ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/[0.03] border-glass-border'}`}>{s.label}</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Vi phạm được xác nhận', value: loading ? '…' : String(confirmed), color: 'text-red-400',     bg: 'from-red-500/15 to-red-900/20',         icon: AlertTriangle },
              { label: 'Vi phạm bị bác bỏ',     value: loading ? '…' : String(dismissed), color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20', icon: CheckCircle },
              { label: 'Kháng cáo chờ xử lý',  value: loading ? '…' : String(pending),   color: 'text-orange-400',  bg: 'from-orange-500/15 to-orange-900/20',  icon: ArrowUpCircle },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden border border-glass-border hover:border-gold/30 transition-all">
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.bg} blur-[30px] opacity-60 pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bg} border border-white/[0.08] flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className="relative z-10 text-2xl font-serif font-bold text-white">{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {([
              ['escalations',   `Kháng cáo chờ xử lý (${loading ? '…' : escalations.length})`,   'text-orange-400 border-orange-400'],
              ['notifications', `Thông báo chính thức (${loading ? '…' : notifications.length})`, 'text-muted border-muted'],
            ] as [Tab, string, string][]).map(([t, label, ac]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? ac : 'text-muted border-transparent hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            {loading ? (
              <div className="p-12 text-center text-muted text-sm">Đang tải...</div>
            ) : tabList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl opacity-40 mb-3">⚠️</div>
                <div className="text-muted text-sm">Chưa có dữ liệu</div>
              </div>
            ) : (
              <div className="divide-y divide-glass-border relative z-10">
                {tabList.map((v, i) => {
                  const sk = (v.status ?? '').toLowerCase();
                  const statusCls = ['confirmed', 'upheld'].includes(sk) ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : ['dismissed', 'rejected', 'overturned'].includes(sk) ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-orange-400 bg-orange-500/10 border-orange-500/20';
                  return (
                    <div key={v.id ?? v.violationId ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                      <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-serif font-bold text-champagne shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">
                          {v.jockeyName ?? v.jockey?.fullName ?? '—'}
                        </div>
                        <div className="text-xs text-muted truncate">
                          {v.type ?? v.violationType ?? '—'}
                          {(v.raceName ?? v.race?.name) ? ` • ${v.raceName ?? v.race?.name}` : ''}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCls}`}>{v.status ?? '—'}</span>
                      <span className="text-xs text-muted shrink-0 hidden md:block">{fmtDate(v.createdAt ?? v.reportedAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
