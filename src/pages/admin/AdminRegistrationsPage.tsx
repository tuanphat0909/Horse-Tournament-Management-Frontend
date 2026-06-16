import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRegistrations } from '../../api/adminService';

type TabType = 'pending' | 'approved' | 'rejected';

const TAB_CONFIG = {
  pending:  { label: 'Chờ duyệt',  color: 'text-yellow-400', bg: 'border-yellow-400/40 bg-yellow-400/5' },
  approved: { label: 'Đã duyệt',   color: 'text-emerald-400', bg: 'border-emerald-400/40 bg-emerald-400/5' },
  rejected: { label: 'Từ chối',    color: 'text-red-400',     bg: 'border-red-400/40 bg-red-400/5' },
};

function fmtDate(s?: string) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
}

export function AdminRegistrationsPage() {
  const [tab, setTab] = useState<TabType>('pending');
  const [search, setSearch] = useState('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegistrations()
      .then((d: any) => setRegistrations(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, []);

  const byStatus = (s: TabType) => registrations.filter(r => (r.status ?? '').toLowerCase() === s);

  const filtered = byStatus(tab).filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.horseName ?? r.horse?.name ?? '').toLowerCase().includes(q) ||
           (r.ownerName ?? r.owner?.fullName ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Duyệt đăng ký"
            subtitle="Xét duyệt đăng ký tham gia thi đấu"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-glass-border pb-0">
            {(['pending', 'approved', 'rejected'] as TabType[]).map(t => {
              const cfg = TAB_CONFIG[t];
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${
                    tab === t ? `${cfg.color} border-current` : 'text-muted border-transparent hover:text-white'
                  }`}
                >
                  {cfg.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? cfg.bg + ' ' + cfg.color : 'bg-white/5 text-muted'}`}>
                    {loading ? '…' : byStatus(t).length}
                  </span>
                </button>
              );
            })}
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ngựa, chủ ngựa..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            {loading ? (
              <div className="p-12 text-center text-muted text-sm">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl opacity-40 mb-3">📝</div>
                <div className="text-muted text-sm">{search ? 'Không tìm thấy kết quả' : `Không có đăng ký ${TAB_CONFIG[tab].label.toLowerCase()}`}</div>
              </div>
            ) : (
              <div className="divide-y divide-glass-border relative z-10">
                {filtered.map((r, i) => {
                  const sk = (r.status ?? '').toLowerCase();
                  const statusCls = sk === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : sk === 'rejected' ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                  return (
                    <div key={r.registrationId ?? r.id ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                      <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-serif font-bold text-champagne shrink-0">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">
                          {r.horseName ?? r.horse?.name ?? `Ngựa #${r.horseId ?? '—'}`}
                        </div>
                        <div className="text-xs text-muted truncate">
                          Chủ: {r.ownerName ?? r.owner?.fullName ?? '—'}
                          {(r.tournamentName ?? r.tournament?.name) ? ` • ${r.tournamentName ?? r.tournament?.name}` : ''}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCls}`}>{r.status ?? '—'}</span>
                      <span className="text-xs text-muted shrink-0 hidden md:block">{fmtDate(r.createdAt ?? r.registeredAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </main>
      </div>
    </div>
  );
}
