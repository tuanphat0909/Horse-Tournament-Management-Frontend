import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getOwnerResults } from '../../api/ownerService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
interface OwnerResult {
  raceId: number;
  raceName: string;
  tournamentName: string;
  horseName: string;
  finishPosition: number;
  finishTime: string;
  point: number;
  prizeAmount: number;
  status: string;
}

export function OwnerResultsPage() {
  const [results, setResults] = useState<OwnerResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOwnerResults()
      .then(res => {
        if (res && res.result) {
          setResults(res.result);
        } else {
          setResults([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Cannot load race results');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Race Results"
            subtitle="Race results and season achievements of owned horses"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 58%"
          />

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Results Table */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden relative">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="p-5 border-b border-glass-border relative z-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-base font-serif text-white whitespace-nowrap">Race History</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="relative z-10 p-6">
              {loading ? (
                <LoadingSkeleton />
              ) : results.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">No race results for your horses yet.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Tournaments</th>
                        <th className="px-6 py-4">Race</th>
                        <th className="px-6 py-4">Name horse</th>
                        <th className="px-6 py-4">Rank</th>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4 text-right">Prize Money</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                      {results.map((res, i) => (
                        <tr key={`${res.raceId}-${i}`} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-muted">#{res.raceId}</td>
                          <td className="px-6 py-4 font-medium">{res.tournamentName}</td>
                          <td className="px-6 py-4 text-muted">{res.raceName}</td>
                          <td className="px-6 py-4 text-emerald-400 font-semibold">{res.horseName}</td>
                          <td className="px-6 py-4">
                            {res.status === 'Finished' ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                                res.finishPosition === 1 ? 'bg-gold/15 text-gold border border-gold/30' :
                                res.finishPosition === 2 ? 'bg-slate-400/15 text-slate-300 border border-slate-400/30' :
                                'bg-amber-600/15 text-amber-500 border border-amber-600/30'
                              }`}>
                                {res.finishPosition === 1 && <Award size={12} />}
                                Rank {res.finishPosition}
                              </span>
                            ) : res.status === 'Live' || res.status === 'Running' || res.status === 'InProgress' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                                Not Started
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-muted">{res.finishTime}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gold">
                            {res.status === 'Finished' ? `+${res.point}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-emerald-400 font-semibold">
                            {res.status === 'Finished' && res.prizeAmount > 0 
                              ? `${res.prizeAmount.toLocaleString('vi-VN')} đ` 
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
