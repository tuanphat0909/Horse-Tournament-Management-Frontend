import { useState, useEffect } from 'react';
import { Search, ShieldAlert, Heart } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRefereeDashboard, getHorseChecks } from '../../api/refereeService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type Tab = 'all' | 'pending' | 'approved' | 'rejected';

const cleanDisplayString = (str: string) => {
  if (!str) return '';
  return str.replace(/\s*\(?ID:\s*\d+\)?/gi, '').trim();
};


interface AssignedRace {
  raceId: number;
  raceName: string;
  status: string;
}

interface HorseCheck {
  raceEntryId: number;
  horseId: number;
  horseName: string;
  ownerName: string;
  jockeyName: string;
  laneNo: number;
  medicalStatus: string;
  status: string;
}

// Nhãn + màu cho từng tình trạng sức khỏe chuẩn (đồng bộ với dropdown bên trang Owner horse)
const HEALTH_META: Record<string, { label: string; ok: boolean }> = {
  healthy:    { label: 'Healthy',       ok: true },
  good:       { label: 'Healthy',       ok: true },
  injured:    { label: 'Injured',     ok: false },
  sick:       { label: 'Sick',         ok: false },
  recovering: { label: 'Recovering',   ok: false },
  retired:    { label: 'Retired',   ok: false },
};

function healthMeta(medicalStatus?: string) {
  const key = (medicalStatus ?? '').toLowerCase();
  return HEALTH_META[key] ?? { label: medicalStatus || 'Unknown', ok: false };
}

// Status kiểm tra SUY RA từ cả entry status lẫn sức khỏe — để 2 cột không mâu thuẫn:
// horse sức khỏe không đạt thì KHÔNG thể hiển thị "Đã duyệt" dù entry đã Ready.
type CheckState = 'pending' | 'approved' | 'blocked' | 'rejected';
function checkState(hc: HorseCheck): CheckState {
  const st = (hc.status ?? '').toLowerCase();
  if (st === 'disqualified' || st === 'rejected') return 'rejected';
  if (!healthMeta(hc.medicalStatus).ok) return 'blocked';
  if (st === 'pending') return 'pending';
  return 'approved'; // Ready / Confirmed / Checked...
}

export function RefereeHorseCheckPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | ''>('');
  const [horseChecks, setHorseChecks] = useState<HorseCheck[]>([]);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingChecks, setLoadingChecks] = useState(false);
  const [error, setError] = useState('');

  // Fetch assigned races on mount
  useEffect(() => {
    getRefereeDashboard()
      .then(res => {
        if (res && res.result && res.result.assignedRaces) {
          const assigned = res.result.assignedRaces;
          setRaces(assigned);
          if (assigned.length > 0) {
            setSelectedRaceId(assigned[0].raceId);
          }
        }
        setLoadingRaces(false);
      })
      .catch(err => {
        console.error(err);
        setError('Cannot load assigned races list');
        setLoadingRaces(false);
      });
  }, []);

  // Fetch horse checks when selected race changes
  useEffect(() => {
    if (!selectedRaceId) {
      setHorseChecks([]);
      return;
    }
    setLoadingChecks(true);
    getHorseChecks(selectedRaceId)
      .then(res => {
        if (res && res.result) {
          setHorseChecks(res.result);
        } else {
          setHorseChecks([]);
        }
        setLoadingChecks(false);
      })
      .catch(err => {
        console.error(err);
        setError('Cannot load horse check list');
        setLoadingChecks(false);
      });
  }, [selectedRaceId]);

  // Filter logic — tab dùng CÙNG trạng thái suy ra với cột hiển thị, không còn lệch nhau
  const filteredChecks = horseChecks.filter(hc => {
    const state = checkState(hc);
    let tabMatch = true;
    if (tab === 'pending') tabMatch = state === 'pending';
    else if (tab === 'approved') tabMatch = state === 'approved';
    else if (tab === 'rejected') tabMatch = state === 'blocked' || state === 'rejected';

    // Search filter
    const query = search.toLowerCase();
    const searchMatch = !search ||
      hc.horseName?.toLowerCase().includes(query) ||
      hc.ownerName?.toLowerCase().includes(query) ||
      hc.jockeyName?.toLowerCase().includes(query);

    return tabMatch && searchMatch;
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Horse Inspection"
            subtitle="Review and approve competing horse profiles by race"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 28%"
          />

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Health do Horse Owner quản lý (PUT /horses chỉ mở cho role HorseOwner) — trọng tài chưa sửa
              trực tiếp được cho tới khi BE bổ sung API ghi horse-check. Horse unhealthy sẽ tự
              hiển thị "Ineligible" ở cột Status. */}
          <div className="text-[11px] text-champagne/80 bg-gold/5 border border-gold/15 rounded-lg px-3 py-2 leading-relaxed">
            ⓘ Health status is updated by the <b>Horse Owner</b> on the horse profile. Horses with failing health are automatically shown as <b>"Ineligible"</b> even if assigned to lanes — if you spot a real-world mismatch, ask the owner to update it or record a violation on the Handle Violations page.
          </div>

          {/* Select Race Dropdown + Search */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm text-muted font-bold shrink-0">Select race:</span>
              {loadingRaces ? (
                <span className="text-xs text-muted">Loading races...</span>
              ) : races.length === 0 ? (
                <span className="text-xs text-red-400">No assigned races found</span>
              ) : (
                <select
                  value={selectedRaceId}
                  onChange={e => setSelectedRaceId(Number(e.target.value))}
                  className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none min-w-[200px]"
                >
                  {races.map(r => (
                    <option key={r.raceId} value={r.raceId} className="bg-[#0b101e]">
                      {cleanDisplayString(r.raceName)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-full md:w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search horse / owner / jockey..." 
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" 
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {([['all', 'All'], ['pending', 'Awaiting Inspection'], ['approved', 'Pass Requirements'], ['rejected', 'Fail']] as [Tab, string][]).map(([t, label]) => (
              <button 
                key={t} 
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loadingChecks ? (
            <LoadingSkeleton />
          ) : filteredChecks.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🐴</div>
              <div className="text-muted text-sm">No horse inspection data for this race yet</div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                      <th className="px-6 py-4">Lane</th>
                      <th className="px-6 py-4">Name horse</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Jockey</th>
                      <th className="px-6 py-4">Health</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                    {filteredChecks.map((hc) => {
                      const hm = healthMeta(hc.medicalStatus);
                      const state = checkState(hc);
                      return (
                      <tr key={hc.raceEntryId} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-gold font-bold">Lane #{hc.laneNo}</td>
                        <td className="px-6 py-4 font-medium">{hc.horseName}</td>
                        <td className="px-6 py-4 text-muted">{hc.ownerName}</td>
                        <td className="px-6 py-4 text-muted">{hc.jockeyName}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
                            hm.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {hm.ok ? <Heart size={11} /> : <ShieldAlert size={11} />} {hm.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            state === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            state === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            state === 'blocked' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {state === 'pending' ? 'Awaiting Inspection' :
                             state === 'approved' ? 'Approved' :
                             state === 'blocked' ? '⚠ Ineligible (Health)' : 'Disqualified'}
                          </span>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
