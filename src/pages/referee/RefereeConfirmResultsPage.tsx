import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceResults, submitResult } from '../../api/refereeService';
import { getRaceSchedule } from '../../api/publicService';
import { getCurrentUser, parseApiError } from '../../api/authService';
import { toast } from '../../components/ui/Toast';

const raceLabel = (r: any) =>
  `${r.name ?? ('Cuộc đua #' + (r.id ?? r.raceId))}${r.raceDate ? ' — ' + r.raceDate : ''}${r.tournamentName ? ' (' + r.tournamentName + ')' : ''}`;

export function RefereeConfirmResultsPage() {
  const user = getCurrentUser();
  const myRefId = user?.id ?? user?.userId;

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

  const [winner, setWinner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadList = (id: string) => {
    if (!id) { setList([]); return; }
    setLoading(true);
    setError('');
    getRaceResults(Number(id))
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

  const submit = () => {
    setFormError('');
    if (!raceId) { setFormError('Vui lòng nhập mã cuộc đua.'); return; }
    if (!winner.trim()) { setFormError('Vui lòng nhập người/ngựa thắng.'); return; }
    setSubmitting(true);
    submitResult({ raceId: Number(raceId), winner: winner.trim(), refereeId: myRefId })
      .then(() => {
        toast.success('Đã xác nhận kết quả cuộc đua thành công!');
        setWinner('');
        loadList(raceId);
      })
      .catch((err: any) => setFormError(parseApiError(err)))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Xác nhận kết quả"
            subtitle="Xác nhận và công bố kết quả chính thức"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
          />

          {/* Race selector + confirm form */}
          <div className="glass-panel rounded-xl p-6 border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="grid grid-cols-[200px_1fr_auto] gap-4 items-end relative z-10">
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
              <div>
                <label className="block text-xs text-muted font-medium mb-1.5">Người/Ngựa thắng (winner)</label>
                <input value={winner} onChange={e => setWinner(e.target.value)} placeholder="Nhập người/ngựa thắng..."
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors" />
              </div>
              <button onClick={submit} disabled={submitting} className="btn-gold px-6 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Xác nhận kết quả'}</button>
            </div>
            {formError && <div className="mt-4 text-sm text-red-400 relative z-10">{formError}</div>}
          </div>

          {error && <div className="glass-panel rounded-xl p-4 text-sm text-red-400 border border-red-500/30">{error}</div>}

          {loading ? (
            <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải...</div>
          ) : list.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏁</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((r: any, i: number) => (
                <div key={r.id ?? i} className="glass-panel rounded-xl p-5 border border-glass-border relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-serif text-base">{r.raceName ?? ('Cuộc đua #' + (r.raceId ?? '—'))}</div>
                      <div className="text-sm text-muted mt-1">Ngựa: {r.horseName ?? r.horseId ?? '—'} • Nài: {r.jockeyName ?? r.jockeyId ?? '—'}</div>
                      {r.winner != null && <div className="text-sm text-emerald-400 mt-1">Thắng: {String(r.winner)}</div>}
                    </div>
                    {r.status != null && (
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-gold/10 border border-gold/25 text-gold text-xs font-bold">{String(r.status)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
