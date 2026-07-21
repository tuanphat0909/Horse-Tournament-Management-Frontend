import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, AlertTriangle, User, Trophy } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pager, paginate } from '../../components/ui/Pager';
import { getRefereeReports } from '../../api/adminService';
import { parseApiError } from '../../api/authService';
import { formatDateTime } from '../../utils/format';

interface RefereeReport {
  reportId: number;
  assignmentId: number;
  raceId: number;
  raceName: string;
  tournamentId: number;
  tournamentName: string;
  refereeId: number;
  refereeName: string;
  content: string;
  violationNote?: string | null;
  reportedUserId?: number | null;
  reportedUserName?: string | null;
  reportedHorseId?: number | null;
  reportedHorseName?: string | null;
  createdAt: string;
}

export function AdminReportsPage() {
  const [reports, setReports] = useState<RefereeReport[]>([]);
  const [search, setSearch] = useState('');
  const [tournamentId, setTournamentId] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const response = await getRefereeReports();
        setReports(Array.isArray(response?.result) ? response.result : []);
        setError('');
      } catch (err: unknown) {
        setError(parseApiError(err as Error));
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const tournaments = useMemo(() => {
    const unique = new Map<number, string>();
    reports.forEach(report => {
      if (report.tournamentId > 0) unique.set(report.tournamentId, report.tournamentName || `Tournament #${report.tournamentId}`);
    });
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [reports]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter(report => {
      if (tournamentId !== 'all' && report.tournamentId !== Number(tournamentId)) return false;
      if (!query) return true;
      return [report.raceName, report.tournamentName, report.refereeName, report.content,
        report.violationNote, report.reportedHorseName, report.reportedUserName]
        .some(value => String(value ?? '').toLowerCase().includes(query));
    });
  }, [reports, search, tournamentId]);

  const { paged, totalPages, total, page: safePage } = paginate(filtered, page, 8);

  useEffect(() => setPage(1), [search, tournamentId]);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <PageHero
            title="Referee Reports"
            subtitle="Review reports submitted by assigned referees"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          <div className="glass-panel rounded-xl border border-glass-border p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search referee, race, horse or report content..."
                className="w-full bg-navy/50 border border-glass-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-gold/40"
              />
            </div>
            <select
              value={tournamentId}
              onChange={event => setTournamentId(event.target.value)}
              className="bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all">All tournaments</option>
              {tournaments.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>

          {loading ? (
            <LoadingSkeleton rows={5} />
          ) : error ? (
            <div className="glass-panel rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">{error}</div>
          ) : paged.length === 0 ? (
            <div className="glass-panel rounded-xl border border-glass-border p-14 text-center">
              <FileText size={36} className="mx-auto mb-3 text-muted/50" />
              <p className="text-muted">No referee reports found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {paged.map(report => (
                <article key={report.reportId} className="glass-panel rounded-xl border border-glass-border p-5 space-y-4 hover:border-gold/25 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-gold font-mono font-bold">Report #{report.reportId}</div>
                      <h2 className="text-lg text-white font-serif font-bold mt-1">{report.raceName || `Race #${report.raceId}`}</h2>
                      <div className="text-xs text-muted flex items-center gap-1.5 mt-1"><Trophy size={12} />{report.tournamentName || `Tournament #${report.tournamentId}`}</div>
                    </div>
                    <time className="text-xs text-muted whitespace-nowrap">{formatDateTime(report.createdAt)}</time>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-champagne">
                    <User size={14} className="text-gold" />
                    <span>Submitted by <b>{report.refereeName}</b></span>
                  </div>

                  <div className="rounded-lg bg-white/[0.025] border border-glass-border/70 p-4 text-sm text-body whitespace-pre-wrap leading-relaxed">
                    {report.content}
                  </div>

                  {(report.violationNote || report.reportedHorseName || report.reportedUserName) && (
                    <div className="rounded-lg bg-red-500/[0.06] border border-red-500/20 p-3 text-xs space-y-1.5">
                      <div className="text-red-400 font-bold flex items-center gap-1.5"><AlertTriangle size={13} />Related incident</div>
                      {report.reportedHorseName && <div className="text-muted">Horse: <span className="text-white">{report.reportedHorseName}</span></div>}
                      {report.reportedUserName && <div className="text-muted">User: <span className="text-white">{report.reportedUserName}</span></div>}
                      {report.violationNote && <div className="text-muted whitespace-pre-wrap">Note: <span className="text-white">{report.violationNote}</span></div>}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}

          {!loading && !error && total > 0 && (
            <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
          )}
        </main>
      </div>
    </div>
  );
}
