import { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { populateTournament, resolveRace } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

export function AdminDemoToolsPage() {
  const [tournamentId, setTournamentId] = useState('');
  const [loading, setLoading] = useState({ populate: false, resolve: false });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handlePopulate() {
    if (!tournamentId.trim()) return;
    setLoading((p) => ({ ...p, populate: true }));
    setResult(null);
    setError('');
    try {
      const res = await populateTournament(tournamentId.trim());
      setResult(res);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading((p) => ({ ...p, populate: false }));
    }
  }

  async function handleResolve() {
    if (!tournamentId.trim()) return;
    setLoading((p) => ({ ...p, resolve: true }));
    setResult(null);
    setError('');
    try {
      const res = await resolveRace(tournamentId.trim());
      setResult(res);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading((p) => ({ ...p, resolve: false }));
    }
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-2xl mx-auto px-8 py-10 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 space-y-2">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider">Trang nội bộ</p>
            <p className="text-muted text-sm">Trang nội bộ dùng để demo — không chia sẻ đường dẫn này cho người ngoài.</p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-glass-border space-y-5">
            <h1 className="text-xl font-bold text-white">Demo Tools</h1>

            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                Tournament ID
              </label>
              <input
                type="text"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                placeholder="Nhập Tournament ID..."
                className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePopulate}
                disabled={loading.populate || !tournamentId.trim()}
                className="px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-blue-400 border border-blue-500/30 text-sm font-bold rounded-lg transition-colors"
              >
                {loading.populate ? 'Đang gọi...' : 'Populate Tournament'}
              </button>
              <button
                onClick={handleResolve}
                disabled={loading.resolve || !tournamentId.trim()}
                className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-400 border border-emerald-500/30 text-sm font-bold rounded-lg transition-colors"
              >
                {loading.resolve ? 'Đang gọi...' : 'Resolve Race'}
              </button>
            </div>
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
