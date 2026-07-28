import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, CheckSquare } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRefereeDashboard } from '../../api/refereeService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

export function RefereeSchedulePage() {
  const navigate = useNavigate();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRefereeDashboard()
      .then((data) => {
        const list = data?.result?.assignedRaces || [];
        setRaces(list);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load referee dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <PageHero title={'Race Schedule'} subtitle={'Manage and monitor your assigned races'} imageUrl="/images/hero-referee.jpg" imagePosition="right 28%" />

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

          <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />

            {loading ? (
              <LoadingSkeleton />
            ) : races.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl opacity-40 mb-3">📅</div>
                <div className="text-muted text-sm">{'No races assigned yet'}</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                      <th className="px-4 py-3">{'Race ID'}</th>
                      <th className="px-4 py-3">{'Race Name'}</th>
                      <th className="px-4 py-3">{'Time'}</th>
                      <th className="px-4 py-3">{'Status'}</th>
                      <th className="px-4 py-3 text-right">{'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                    {races.map((race) => (
                      <tr key={race.raceId} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs text-muted">#{race.raceId}</td>
                        <td className="px-4 py-3.5 font-medium">{race.raceName}</td>
                        <td className="px-4 py-3.5 text-xs text-muted">{race.raceDate ? new Date(race.raceDate).toLocaleString('en-US') : '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${race.status === 'Finished' || race.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : race.status === 'InProgress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>{race.status === 'Finished' || race.status === 'Completed' ? 'Completed' : race.status === 'InProgress' ? 'In Progress' : 'Scheduled'}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(race.status === 'Scheduled' || race.status === 'InProgress') && (
                              <button onClick={() => navigate('/referee/horse-check')} className="flex items-center gap-1 text-xs text-gold border border-gold/20 bg-gold/5 hover:bg-gold/10 px-2.5 py-1.5 rounded transition-all font-semibold" title={'Horse Inspection'}>
                                <ShieldCheck size={13} />
                                <span className="hidden sm:inline">{'Inspect'}</span>
                              </button>
                            )}

                            {(race.status === 'InProgress' || race.status === 'Finished' || race.status === 'Completed') && (
                              <>
                                <button onClick={() => navigate('/referee/violations')} className="flex items-center gap-1 text-xs text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded transition-all font-semibold" title={'Record Violations'}>
                                  <AlertTriangle size={13} />
                                  <span className="hidden sm:inline">{'Violation'}</span>
                                </button>

                                <button onClick={() => navigate('/referee/confirm-results')} className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded transition-all font-semibold" title={'Confirm Results'}>
                                  <CheckSquare size={13} />
                                  <span className="hidden sm:inline">{'Confirm'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
