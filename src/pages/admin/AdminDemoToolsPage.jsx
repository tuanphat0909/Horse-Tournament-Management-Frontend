import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { populateTournament, resolveRace } from '../../api/adminService';
import { getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';

export function AdminDemoToolsPage() {
  const { showToast } = useNotifications();
  const [tournaments, setTournaments] = useState([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  // Số suất đua muốn thêm — backend nhận từ 1 tới 48.
  const [count, setCount] = useState('12');
  const [loading, setLoading] = useState({ populate: false, resolve: false });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function loadTournaments() {
    setLoadingTournaments(true);
    try {
      const res = await getTournaments();
      const list = Array.isArray(res?.result) ? res.result : (Array.isArray(res) ? res : []);
      setTournaments(list);
    } catch {
      setTournaments([]);
    } finally {
      setLoadingTournaments(false);
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  const soSuat = Number(count);
  const soSuatHopLe = Number.isInteger(soSuat) && soSuat >= 1 && soSuat <= 48;

  async function handlePopulate() {
    if (!selectedId || !soSuatHopLe) return;
    setLoading((p) => ({ ...p, populate: true }));
    setResult(null);
    setError('');
    try {
      const res = await populateTournament(selectedId, soSuat);
      setResult(res);
      showToast('Success', 'Tournament populated successfully.');
      await loadTournaments();
    } catch (err) {
      const msg = parseApiError(err);
      setError(msg);
      showToast('Error', msg, 'error');
    } finally {
      setLoading((p) => ({ ...p, populate: false }));
    }
  }

  async function handleResolve() {
    if (!selectedId) return;
    setLoading((p) => ({ ...p, resolve: true }));
    setResult(null);
    setError('');
    try {
      const res = await resolveRace(selectedId);
      setResult(res);
      showToast('Success', 'Race resolved successfully.');
      await loadTournaments();
    } catch (err) {
      const msg = parseApiError(err);
      setError(msg);
      showToast('Error', msg, 'error');
    } finally {
      setLoading((p) => ({ ...p, resolve: false }));
    }
  }

  const selectedTour = tournaments.find((t) => String(t.tournamentId) === selectedId);
  const anyLoading = loading.populate || loading.resolve;

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-2xl mx-auto px-8 py-10 space-y-6">

          <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 flex items-start gap-3">
            <span className="text-amber-400 text-base shrink-0">⚠️</span>
            <p className="text-amber-200 text-sm">Internal demo page — do not share this link outside the team.</p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-glass-border space-y-5">
            <h1 className="text-xl font-bold text-white">Demo Tools</h1>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                Select tournament
              </label>
              {loadingTournaments ? (
                <div className="h-10 bg-navy/50 rounded-lg animate-pulse" />
              ) : tournaments.length === 0 ? (
                <p className="text-sm text-muted">
                  No tournaments yet.{' '}
                  <Link to="/admin/tournaments" className="text-gold hover:underline">
                    Go to Tournaments to create one →
                  </Link>
                </p>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => { setSelectedId(e.target.value); setResult(null); setError(''); }}
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40 transition-colors"
                >
                  <option value="">-- Select a tournament --</option>
                  {tournaments.map((t) => (
                    <option key={t.tournamentId} value={String(t.tournamentId)}>
                      {t.name ?? `Tournament #${t.tournamentId}`} — {t.status ?? 'Unknown'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                Horses to add
              </label>
              <input
                type="number"
                min={1}
                max={48}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-32 bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40 transition-colors"
              />
              <p className="text-[11px] text-muted mt-1.5">
                {soSuatHopLe ? 'Between 1 and 48. Only applies to Populate Tournament.' : <span className="text-amber-400">Enter a whole number between 1 and 48.</span>}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handlePopulate}
                disabled={anyLoading || !selectedId || !soSuatHopLe}
                className="px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 border border-blue-500/30 text-sm font-bold rounded-lg transition-colors"
              >
                {loading.populate ? 'Working...' : 'Populate Tournament'}
              </button>
              <button
                onClick={handleResolve}
                disabled={anyLoading || !selectedId}
                className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-400 border border-emerald-500/30 text-sm font-bold rounded-lg transition-colors"
              >
                {loading.resolve ? 'Working...' : 'Resolve Race'}
              </button>
            </div>

            {selectedTour && (
              <p className="text-xs text-muted">
                Tournament ID: <span className="text-white font-mono">{selectedTour.tournamentId}</span>
                {' · '}
                Status: <span className="text-champagne">{selectedTour.status}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="glass-panel rounded-2xl p-4 border border-red-500/30">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Lỗi</p>
              <pre className="text-xs text-red-300 whitespace-pre-wrap break-words">{error}</pre>
            </div>
          )}

          {result !== null && (
            <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Response</p>
              <pre className="text-xs text-white/80 whitespace-pre-wrap break-words bg-navy/60 rounded-lg p-3 border border-glass-border overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
