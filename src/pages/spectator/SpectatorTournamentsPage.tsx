import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getTournaments } from '../../api/publicService';
import { formatDateTime } from '../../utils/format';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { useLanguage } from '../../context/LanguageContext';
import { getTournamentStatusStyle, getStatusOrder } from '../../constants/tournamentStatus';
import type { Tournament } from '../../types/domain';
import { getCurrentUser } from '../../api/authService';
import { getRefereeDashboard } from '../../api/refereeService';


type StatusFilter = 'assigned' | 'all' | 'active' | 'upcoming' | 'completed';
type SortKey = 'newest' | 'oldest' | 'name' | 'status';
const FILTER_LABELS: Record<StatusFilter, string> = {
  assigned: 'My Assignments', all: 'All', active: 'Active', upcoming: 'Upcoming', completed: 'Completed',
};

export function SpectatorTournamentsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentUser = getCurrentUser();
  const isReferee = currentUser?.role?.toLowerCase() === 'referee';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>(isReferee ? 'assigned' : 'all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [assignedTournamentIds, setAssignedTournamentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTournaments()
      .then((d: any) => setTournaments(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch((err) => {
        console.error(err);
        setTournaments([]);
      })
      .finally(() => setLoading(false));

    if (isReferee) {
      getRefereeDashboard()
        .then((res: any) => {
          const races = res?.result?.assignedRaces || [];
          const ids = races
            .map((r: any) => r.tournamentId)
            .filter((id: any) => id != null);
          setAssignedTournamentIds(Array.from(new Set(ids)) as number[]);
        })
        .catch((err) => {
          console.error('Failed to load referee dashboard for assignments filter:', err);
        });
    }
  }, [isReferee]);

  const statsCounts: Record<StatusFilter, number> = {
    all: tournaments.length,
    active: tournaments.filter(t => {
      const s = (t.status ?? '').toLowerCase();
      return s === 'active' || s === 'registration open' || s === 'registration closed' || s === 'medical checking' || s === 'ready to arrange' || s === 'pre round' || s === 'final round' || s === 'prize distribution' || s === 'pendingscheduling';
    }).length,
    upcoming: tournaments.filter(t => {
      const s = (t.status ?? '').toLowerCase();
      return s === 'upcoming' || s === 'pendingregistration';
    }).length,
    completed: tournaments.filter(t => {
      const s = (t.status ?? '').toLowerCase();
      return s === 'completed' || s === 'cancelled';
    }).length,
    assigned: tournaments.filter(t => assignedTournamentIds.includes(t.tournamentId)).length,
  };

  const filtered = tournaments
    .filter(t => (t.name ?? '').toLowerCase().includes(search.toLowerCase()))
    .filter(t => {
      if (filter === 'all') return true;
      if (filter === 'assigned') return assignedTournamentIds.includes(t.tournamentId);
      const s = (t.status ?? '').toLowerCase();
      if (filter === 'active') {
        return s === 'active' || s === 'registration open' || s === 'registration closed' || s === 'medical checking' || s === 'ready to arrange' || s === 'pre round' || s === 'final round' || s === 'prize distribution' || s === 'pendingscheduling';
      }
      if (filter === 'upcoming') return s === 'upcoming' || s === 'pendingregistration';
      if (filter === 'completed') return s === 'completed' || s === 'cancelled';
      return false;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime();
        case 'name': return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'vi');
        case 'status': return getStatusOrder(a.status) - getStatusOrder(b.status);
        case 'newest':
        default: return new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime();
      }
    });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title={t("Tournaments")}
            subtitle={t("All active tournaments")}
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
          />

          <div className="flex items-center gap-2 flex-wrap">
            {((isReferee 
              ? ['assigned', 'all', 'active', 'upcoming', 'completed'] 
              : ['all', 'active', 'upcoming', 'completed']
            ) as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  filter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {t(FILTER_LABELS[s])}
                <span className="ml-2 text-[11px] font-bold text-current opacity-60">{statsCounts[s]}</span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border focus-within:border-gold/40 transition-colors rounded-lg px-3 py-2 w-56">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search tournaments...")} className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 transition-colors"
                style={{ colorScheme: 'dark' }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted text-sm">{t("Loading tournaments list...")}</div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">{t("No data available")}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((tour, i) => {
                const s = tour.status?.toLowerCase() ?? 'upcoming';
                const config = getTournamentStatusStyle(s);
                const regNotStarted = tour.registrationStartDate && new Date() < new Date(tour.registrationStartDate);
                return (
                  <motion.div
                    key={tour.tournamentId ?? i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-gold/25 transition-all group relative overflow-hidden text-left h-full flex flex-col"
                  >
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-center gap-2 mb-3 min-h-[26px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} flex items-center gap-1.5 whitespace-nowrap shrink-0`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {t(config.label)}
                        </span>
                        {isReferee && assignedTournamentIds.includes(tour.tournamentId) && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border border-gold/45 bg-gold/12 text-champagne shrink-0">
                            ★ {t('My Assignment')}
                          </span>
                        )}
                      </div>
                      {s !== 'cancelled' && s !== 'completed' && s !== 'finished' && (
                        regNotStarted ? (
                          <CountdownTimer target={tour.registrationStartDate} utc={false} label="Reg. opens in:" />
                        ) : tour.registrationEndDate ? (
                          <CountdownTimer target={tour.registrationEndDate} utc={false} hideWhenExpired />
                        ) : null
                      )}
                    </div>
                    <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-3 line-clamp-1">{tour.name}</h3>
                    <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-glass-border/40">
                      <div className="flex justify-between">
                        <span>{t("Reg. opens:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.registrationStartDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Reg. closes:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.registrationEndDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("Start Date:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("End Date:")}</span>
                        <span className="text-white font-medium">{formatDateTime(tour.endDate)}</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-3 border-t border-glass-border/40 flex justify-end">
                      <button 
                        onClick={() => navigate(`/spectator/tournaments/${tour.tournamentId}`)}
                        className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors border border-glass-border hover:border-gold/30"
                      >
                        {t("View details")}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
