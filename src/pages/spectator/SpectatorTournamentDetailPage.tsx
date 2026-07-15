import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Flag } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getTournamentDetail, getRaceSchedule } from '../../api/publicService';
import { formatDateTime } from '../../utils/format';
import { useLanguage } from '../../context/LanguageContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const RACE_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  live: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  ongoing: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  running: { label: 'Active', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  scheduled: { label: 'Upcoming', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  finished: { label: 'Completed', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
};

export function SpectatorTournamentDetailPage() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tournament, setTournament] = useState<any>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tournamentId) return;

    setLoading(true);
    Promise.all([
      getTournamentDetail(tournamentId),
      getRaceSchedule()
    ])
    .then(([tourRes, raceRes]: [any, any]) => {
      setTournament(tourRes?.result ?? null);
      const allRaces = raceRes?.result ?? (Array.isArray(raceRes) ? raceRes : []);
      // Filter races for this tournament
      const filteredRaces = allRaces.filter((r: any) => String(r.tournamentId) === String(tournamentId));
      setRaces(filteredRaces);
    })
    .catch(err => {
      console.error(err);
      setError(t('Failed to load tournament info.'));
    })
    .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        
        <main className="relative z-10 max-w-[1200px] mx-auto px-8 py-6 space-y-6">
          <Link to="/spectator/tournaments" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
            <ArrowLeft size={16} /> {t("Back to tournaments list")}
          </Link>

          {loading ? (
             <LoadingSkeleton rows={5} h="h-16" />
          ) : error ? (
             <div className="glass-panel p-8 text-center text-red-400">{error}</div>
          ) : !tournament ? (
             <div className="glass-panel p-8 text-center text-muted">{t("Tournament not found.")}</div>
          ) : (
            <>
              {/* Tournament Header */}
              <div className="glass-panel rounded-2xl p-8 border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold via-champagne to-gold opacity-50" />
                <h1 className="text-3xl font-serif font-bold text-white mb-2">{tournament.name}</h1>
                <div className="flex items-center gap-6 text-sm text-muted mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gold" />
                    {t("Start:")} {formatDateTime(tournament.startDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag size={16} className="text-gold" />
                    {t("End:")} {formatDateTime(tournament.endDate)}
                  </div>
                </div>
              </div>

              {/* Races List */}
              <h2 className="text-xl font-serif font-bold text-white">{t("Races List")} ({races.length})</h2>
              
              {races.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center">
                  <div className="text-4xl opacity-40 mb-3">🏁</div>
                  <div className="text-muted text-sm">{t("No races in this tournament yet.")}</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {races.map((r, i) => {
                    const s = r.status?.toLowerCase() ?? 'scheduled';
                    const config = RACE_STATUS_CONFIG[s] ?? RACE_STATUS_CONFIG.scheduled;
                    const canBet = s === 'scheduled' || s === 'live' || s === 'ongoing' || s === 'running';

                    return (
                      <motion.div
                        key={r.raceId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/30 transition-all flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {t(config.label)}
                          </span>
                          <span className="text-xs text-gold font-bold">{t("Round")} {r.roundNumber}</span>
                        </div>
                        <h3 className="text-lg font-serif font-bold text-white mb-3">{r.name}</h3>
                        <div className="space-y-2 text-xs text-muted mb-4 flex-1">
                          <div className="flex justify-between">
                            <span>{t("Starts at:")}</span>
                            <span className="text-white">{formatDateTime(r.raceDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("Track distance:")}</span>
                            <span className="text-white">{r.distanceMeter}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("Max lanes:")}</span>
                            <span className="text-white">{r.maxLanes}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-glass-border/50 flex gap-3">
                          <button 
                            onClick={() => navigate(`/spectator/races/${r.raceId}`)}
                            className="flex-1 text-center text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors border border-glass-border"
                          >
                            {t("View Details")}
                          </button>
                          {canBet && (
                            <button 
                              onClick={() => navigate(`/spectator/races/${r.raceId}`)}
                              className="flex-1 text-center text-xs font-bold bg-gold hover:bg-gold-light text-navy px-4 py-2 rounded-lg transition-colors"
                            >
                              {t("Bet Now")}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
