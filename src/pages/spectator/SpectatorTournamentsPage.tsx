import { useState, useEffect } from 'react';
import { Search, Trophy, ChevronRight } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getTournaments } from '../../api/publicService';

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang diễn ra',
  ongoing: 'Đang diễn ra',
  upcoming: 'Sắp tới',
  pending: 'Sắp tới',
  completed: 'Đã kết thúc',
  ended: 'Đã kết thúc',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  ongoing: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  upcoming: 'text-gold bg-gold/10 border-gold/25',
  pending: 'text-gold bg-gold/10 border-gold/25',
  completed: 'text-muted bg-white/[0.04] border-glass-border',
  ended: 'text-muted bg-white/[0.04] border-glass-border',
};

export function SpectatorTournamentsPage() {
  const [search, setSearch] = useState('');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTournaments()
      .then((d: any) => setTournaments(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setTournaments([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tournaments.filter(t =>
    !search || (t.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Giải đấu"
            subtitle="Tất cả các giải đấu đang diễn ra"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />

          <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border focus-within:border-gold/40 transition-colors rounded-lg px-3 py-2 w-64">
            <Search size={14} className="text-muted shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm giải đấu..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
          </div>

          {loading ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-muted text-sm">Đang tải...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">{search ? 'Không tìm thấy giải đấu' : 'Chưa có dữ liệu'}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((t, i) => {
                const sk = (t.status ?? '').toLowerCase();
                const label = STATUS_LABELS[sk] ?? t.status ?? '—';
                const colorCls = STATUS_COLORS[sk] ?? 'text-muted bg-white/[0.04] border-glass-border';
                const rounds = Array.isArray(t.rounds) ? t.rounds.length : 0;
                return (
                  <div key={t.tournamentId ?? i} className="glass-panel rounded-xl p-5 relative overflow-hidden group hover:border-gold/30 hover:bg-gold/[0.03] border border-glass-border transition-all cursor-pointer">
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[30px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                        <Trophy size={16} className="text-gold" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colorCls}`}>{label}</span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-sm font-semibold text-white group-hover:text-champagne transition-colors mb-1">{t.name ?? `Giải đấu #${t.tournamentId}`}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <ChevronRight size={11} className="text-gold/40" />
                        {rounds > 0 ? `${rounds} vòng đấu` : 'Chưa có vòng đấu'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
