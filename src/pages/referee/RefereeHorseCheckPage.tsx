import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRefereeDashboard, getRaceHorseChecks } from '../../api/refereeService';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

export function RefereeHorseCheckPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [checks, setChecks] = useState<any[]>([]);
  const [racesLoading, setRacesLoading] = useState(true);
  const [checksLoading, setChecksLoading] = useState(false);

  useEffect(() => {
    getRefereeDashboard()
      .then((d: any) => {
        const db = d?.result ?? d ?? {};
        const list: any[] = db.todayRaces ?? db.races ?? db.assignedRaces ?? [];
        setRaces(list);
      })
      .catch(() => setRaces([]))
      .finally(() => setRacesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRaceId) { setChecks([]); return; }
    setChecksLoading(true);
    getRaceHorseChecks(selectedRaceId)
      .then((d: any) => setChecks(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setChecks([]))
      .finally(() => setChecksLoading(false));
  }, [selectedRaceId]);

  const byTab = (t: Tab): any[] => t === 'all' ? checks : checks.filter(c => (c.status ?? '').toLowerCase() === t);

  const filtered = byTab(tab).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.horseName ?? c.horse?.name ?? '').toLowerCase().includes(q) ||
           (c.ownerName ?? c.owner?.fullName ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Kiểm tra ngựa"
            subtitle="Xem xét và phê duyệt hồ sơ ngựa"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
          />

          {/* Race selector + Search */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <select
                value={selectedRaceId}
                onChange={e => setSelectedRaceId(e.target.value)}
                className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 pr-8 text-sm text-white focus:border-gold/40 outline-none appearance-none cursor-pointer"
              >
                <option value="">{racesLoading ? 'Đang tải...' : races.length === 0 ? 'Không có cuộc đua' : '— Chọn cuộc đua —'}</option>
                {races.map((r, i) => (
                  <option key={r.raceId ?? r.id ?? i} value={String(r.raceId ?? r.id ?? i)}>
                    {r.name ?? r.raceName ?? `Cuộc đua #${r.raceId ?? r.id ?? i}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ngựa / chủ ngựa..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-glass-border">
            {([['all', 'Tất cả'], ['pending', 'Chờ kiểm tra'], ['approved', 'Đạt yêu cầu'], ['rejected', 'Không đạt']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {label}
                {selectedRaceId && !checksLoading && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? 'bg-gold/10 text-gold' : 'bg-white/5 text-muted'}`}>
                    {byTab(t).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            {!selectedRaceId ? (
              <div className="p-12 text-center">
                <div className="text-4xl opacity-40 mb-3">🐴</div>
                <div className="text-muted text-sm">Chọn cuộc đua để xem danh sách ngựa cần kiểm tra</div>
              </div>
            ) : checksLoading ? (
              <div className="p-12 text-center text-muted text-sm">Đang tải...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl opacity-40 mb-3">🐴</div>
                <div className="text-muted text-sm">{search ? 'Không tìm thấy kết quả' : 'Chưa có hồ sơ ngựa nào'}</div>
              </div>
            ) : (
              <div className="divide-y divide-glass-border relative z-10">
                {filtered.map((c, i) => {
                  const sk = (c.status ?? '').toLowerCase();
                  const statusCls = sk === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : sk === 'rejected' ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                  return (
                    <div key={c.horseId ?? c.id ?? i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group">
                      <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-xs font-serif font-bold text-champagne shrink-0">{i + 1}</div>
                      <div className="text-xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white group-hover:text-champagne transition-colors truncate">
                          {c.horseName ?? c.horse?.name ?? `Ngựa #${c.horseId ?? i}`}
                        </div>
                        <div className="text-xs text-muted truncate">Chủ: {c.ownerName ?? c.owner?.fullName ?? '—'}</div>
                      </div>
                      {c.checkNotes && <div className="text-xs text-muted max-w-[200px] truncate hidden lg:block">{c.checkNotes}</div>}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusCls}`}>{c.status ?? 'pending'}</span>
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
