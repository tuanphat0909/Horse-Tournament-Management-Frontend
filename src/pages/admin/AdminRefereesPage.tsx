import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getAdminReferees } from '../../api/adminService';

export function AdminRefereesPage() {
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminReferees()
      .then((d: any) => setReferees(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setReferees([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Referee Management"
            subtitle="Assign referees to races"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          <div className="grid grid-cols-[1fr_320px] gap-6">
            {/* Left: Race Assignment */}
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden">
                <div className="p-5 border-b border-glass-border flex items-center gap-2">
                  <AlertCircle size={16} className="text-yellow-400" />
                  <h2 className="text-base font-serif text-white">Unassigned</h2>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[11px] font-bold border border-yellow-500/20">0</span>
                </div>
                {/* TODO: BE chưa có API danh sách cuộc đua cần trọng tài */}
                <div className="p-12 text-center relative overflow-hidden">
                  <div className="text-4xl opacity-40 mb-3">🧑‍⚖️</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl overflow-hidden">
                <div className="p-5 border-b border-glass-border flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <h2 className="text-base font-serif text-white">Assigned</h2>
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">0</span>
                </div>
                {/* TODO: BE chưa có API danh sách cuộc đua đã phân công trọng tài */}
                <div className="p-12 text-center relative overflow-hidden">
                  <div className="text-4xl opacity-40 mb-3">🧑‍⚖️</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              </motion.div>
            </div>

            {/* Right: Referee List */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="glass-panel rounded-xl p-5 h-fit">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-serif text-white">Referee List</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-champagne text-[11px] font-bold border border-glass-border">
                  {loading ? '…' : referees.length}
                </span>
              </div>
              {loading ? (
                <div className="py-8 text-center text-muted text-sm">Đang tải...</div>
              ) : referees.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🧑‍⚖️</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {referees.map((r, i) => (
                    <div key={r.userId ?? r.id ?? i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.03] transition-all group">
                      <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-serif font-bold text-champagne shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">{r.fullName ?? r.name ?? '—'}</div>
                        <div className="text-xs text-muted truncate">{r.email ?? '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
