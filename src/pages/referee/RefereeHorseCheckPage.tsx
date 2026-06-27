import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getHorseChecks } from '../../api/refereeService';
import { getRaceSchedule } from '../../api/publicService';
import { parseApiError } from '../../api/authService';

type Tab = 'all' | 'pending' | 'approved' | 'rejected';

const raceLabel = (r: any) =>
  `${r.name ?? ('Cuộc đua #' + (r.id ?? r.raceId))}${r.raceDate ? ' — ' + r.raceDate : ''}${r.tournamentName ? ' (' + r.tournamentName + ')' : ''}`;

export function RefereeHorseCheckPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const [races, setRaces] = useState<any[]>([]);
  const [raceId, setRaceId] = useState<string>('');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRaceSchedule()
      .then((data: any) => {
        const arr = data?.result ?? (Array.isArray(data) ? data : []);
        setRaces(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setRaces([]));
  }, []);

  const loadList = (id: string) => {
    if (!id) { setList([]); return; }
    setLoading(true);
    setError('');
    getHorseChecks(Number(id))
      .then((data: any) => {
        const arr = data?.result ?? (Array.isArray(data) ? data : []);
        setList(Array.isArray(arr) ? arr : []);
      })
      .catch((err: any) => { setError(parseApiError(err)); setList([]); })
      .finally(() => setLoading(false));
  };

  const onRaceIdChange = (v: string) => {
    setRaceId(v);
    loadList(v);
  };

  // fields verified: { raceEntryId, horseId, horseName, ownerName, jockeyName, laneNo, medicalStatus, status }
  const filtered = list.filter((item: any) => {
    if (tab !== 'all' && (item.status ?? '').toLowerCase() !== tab) return false;
    if (!search.trim()) return true;
    const title = String(item.horseName ?? item.ownerName ?? item.horseId ?? '');
    return title.toLowerCase().includes(search.trim().toLowerCase());
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Kiểm tra ngựa"
            subtitle="Xem xét và phê duyệt hồ sơ ngựa"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
          />

          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-muted font-medium mb-1.5">Cuộc đua</label>
              <select value={raceId} onChange={e => onRaceIdChange(e.target.value)}
                className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors">
                <option value="">-- Chọn cuộc đua --</option>
                {races.map((r: any) => {
                  const id = r.id ?? r.raceId;
                  return <option key={String(id)} value={String(id)}>{raceLabel(r)}</option>;
                })}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white/4 border border-glass-border rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm ngựa / chủ ngựa..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-glass-border">
            {([['all', 'Tất cả'], ['pending', 'Chờ kiểm tra'], ['approved', 'Đạt yêu cầu'], ['rejected', 'Không đạt']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {error && <div className="glass-panel rounded-xl p-4 text-sm text-red-400 border border-red-500/30">{error}</div>}

          {loading ? (
            <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🐴</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item: any, i: number) => {
                const title = item.horseName ?? ('#' + item.horseId);
                return (
                  <div key={item.raceEntryId ?? item.horseId ?? i} className="glass-panel rounded-xl p-5 border border-glass-border relative overflow-hidden">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="text-white font-serif text-base">{title}</div>
                      {item.status != null && (
                        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-gold/10 border border-gold/25 text-gold text-xs font-bold">{String(item.status)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
                      {item.laneNo != null && <span>Làn: <span className="text-white/80">{String(item.laneNo)}</span></span>}
                      {item.medicalStatus != null && <span>Y tế: <span className="text-white/80">{String(item.medicalStatus)}</span></span>}
                      {item.status != null && <span>Trạng thái: <span className="text-white/80">{String(item.status)}</span></span>}
                      {item.jockeyName != null && <span>Nài: <span className="text-white/80">{String(item.jockeyName)}</span></span>}
                      {item.ownerName != null && <span>Chủ ngựa: <span className="text-white/80">{String(item.ownerName)}</span></span>}
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
