import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, DollarSign, Zap, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createPrizes, triggerPayout, getAdminRaceResults, publishResult } from '../../api/adminService';
import { getRaceSchedule, getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_PRIZES = { tournamentId: '', firstPlacePrize: '', secondPlacePrize: '', thirdPlacePrize: '' };

export function AdminResultsPage() {
  // Prizes modal
  const [showPrizesModal, setShowPrizesModal] = useState(false);
  const [prizes, setPrizes] = useState(INIT_PRIZES);
  const [prizesLoading, setPrizesLoading] = useState(false);
  const [prizesError, setPrizesError] = useState('');
  const [prizesSuccess, setPrizesSuccess] = useState('');

  // Payout trigger
  const [payoutRaceId, setPayoutRaceId] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');

  // Race results lookup + publish
  const [resultRaceId, setResultRaceId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoaded, setResultsLoaded] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');

  // Dropdown data
  const [races, setRaces] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    getRaceSchedule()
      .then((d: any) => setRaces(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setRaces([]));
    getTournaments()
      .then((d: any) => setTournaments(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setTournaments([]));
  }, []);

  async function handleLoadResults() {
    setResultsError(''); setPublishError(''); setPublishSuccess('');
    if (!resultRaceId) { setResultsError('Vui lòng chọn cuộc đua.'); return; }
    setResultsLoading(true);
    setResultsLoaded(false);
    try {
      const data: any = await getAdminRaceResults(Number(resultRaceId));
      const list = data?.result ?? (Array.isArray(data) ? data : []);
      setResults(list);
      setResultsLoaded(true);
    } catch (err: unknown) {
      setResults([]);
      setResultsError(parseApiError(err as Error));
    } finally {
      setResultsLoading(false);
    }
  }

  async function handlePublish() {
    setPublishError(''); setPublishSuccess('');
    if (!resultRaceId) { setPublishError('Vui lòng chọn cuộc đua.'); return; }
    setPublishLoading(true);
    try {
      await publishResult(Number(resultRaceId));
      setPublishSuccess(`Đã công bố kết quả cho Race #${resultRaceId}!`);
    } catch (err: unknown) {
      setPublishError(parseApiError(err as Error));
    } finally {
      setPublishLoading(false);
    }
  }

  function setP(field: string, value: string) {
    setPrizes(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreatePrizes() {
    setPrizesError(''); setPrizesSuccess('');
    if (!prizes.tournamentId || !prizes.firstPlacePrize || !prizes.secondPlacePrize || !prizes.thirdPlacePrize) {
      setPrizesError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    setPrizesLoading(true);
    try {
      const data: any = await createPrizes({
        tournamentId: Number(prizes.tournamentId),
        firstPlacePrize: Number(prizes.firstPlacePrize),
        secondPlacePrize: Number(prizes.secondPlacePrize),
        thirdPlacePrize: Number(prizes.thirdPlacePrize),
      });
      const newId = data?.result?.id;
      setPrizesSuccess(`Thiết lập giải thưởng thành công cho giải đấu #${prizes.tournamentId}!${newId != null ? ` (Prize ID = ${newId})` : ''}`);
      setPrizes(INIT_PRIZES);
    } catch (err: unknown) {
      setPrizesError(parseApiError(err as Error));
    } finally {
      setPrizesLoading(false);
    }
  }

  function closePrizesModal() {
    setShowPrizesModal(false);
    setPrizesError(''); setPrizesSuccess('');
    setPrizes(INIT_PRIZES);
  }

  async function handleTriggerPayout() {
    setPayoutError(''); setPayoutSuccess('');
    if (!payoutRaceId) { setPayoutError('Vui lòng chọn cuộc đua.'); return; }
    setPayoutLoading(true);
    try {
      await triggerPayout(Number(payoutRaceId));
      setPayoutSuccess(`Chi trả cho Race #${payoutRaceId} đã được kích hoạt!`);
      setPayoutRaceId('');
    } catch (err: unknown) {
      setPayoutError(parseApiError(err as Error));
    } finally {
      setPayoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-400 mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Kết quả & Công bố"
            subtitle="Xác nhận và công bố kết quả chính thức"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Management Tools */}
          <div className="grid grid-cols-2 gap-4">
            {/* Prizes Setup */}
            <div className="glass-panel rounded-xl p-6 border border-glass-border hover:border-gold/30 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-gold/10 to-transparent blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <DollarSign size={18} className="text-gold" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Thiết lập giải thưởng</div>
                  <div className="text-xs text-muted">Cấu hình tiền thưởng 1–3 cho tournament</div>
                </div>
              </div>
              <button
                onClick={() => setShowPrizesModal(true)}
                className="btn-gold w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 relative z-10"
              >
                <DollarSign size={14} /> Cấu hình giải thưởng
              </button>
            </div>

            {/* Trigger Payout */}
            <div className="glass-panel rounded-xl p-6 border border-glass-border hover:border-emerald-500/30 transition-all relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-emerald-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Zap size={18} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Kích hoạt chi trả</div>
                  <div className="text-xs text-muted">Chọn cuộc đua để kích hoạt chi trả</div>
                </div>
              </div>
              <div className="relative z-10 flex gap-2">
                <select
                  value={payoutRaceId}
                  onChange={e => { setPayoutRaceId(e.target.value); setPayoutError(''); setPayoutSuccess(''); }}
                  className="flex-1 bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">-- Chọn cuộc đua --</option>
                  {races.map((r, i) => {
                    const id = r.id ?? r.raceId;
                    return <option key={id ?? i} value={id}>{`${r.name}${r.raceDate ? ' — ' + r.raceDate : ''}`}</option>;
                  })}
                </select>
                <button
                  onClick={handleTriggerPayout}
                  disabled={payoutLoading}
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Zap size={14} /> {payoutLoading ? '…' : 'Trigger'}
                </button>
              </div>
              {payoutError && <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{payoutError}</div>}
              {payoutSuccess && <div className="mt-2 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{payoutSuccess}</div>}
            </div>
          </div>

          {/* Race Results + Publish */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <Megaphone size={15} className="text-yellow-400" />
              </div>
              <h2 className="text-base font-medium font-serif text-white">Kết quả cuộc đua & Công bố</h2>
              <div className="flex-1 h-px bg-linear-to-r from-yellow-400/30 via-glass-border to-transparent" />
            </div>

            <div className="glass-panel rounded-xl p-6 border border-glass-border relative overflow-hidden space-y-4">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />

              <div className="relative z-10 flex flex-wrap items-end gap-3">
                <div className="flex items-center gap-2 bg-white/4 border border-glass-border rounded-lg px-3 py-2 w-56">
                  <Search size={14} className="text-muted shrink-0" />
                  <select
                    value={resultRaceId}
                    onChange={e => { setResultRaceId(e.target.value); }}
                    className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">-- Chọn cuộc đua --</option>
                    {races.map((r, i) => {
                      const id = r.id ?? r.raceId;
                      return <option key={id ?? i} value={id}>{`${r.name}${r.raceDate ? ' — ' + r.raceDate : ''}`}</option>;
                    })}
                  </select>
                </div>
                <button
                  onClick={handleLoadResults}
                  disabled={resultsLoading}
                  className="px-4 py-2 rounded-lg bg-white/6 text-white border border-glass-border hover:border-gold/40 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {resultsLoading ? '…' : 'Xem kết quả'}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishLoading}
                  className="px-4 py-2 rounded-lg bg-gold/15 text-gold border border-gold/25 hover:bg-gold/25 text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Megaphone size={14} /> {publishLoading ? '…' : 'Công bố kết quả'}
                </button>
              </div>

              {resultsError && <div className="relative z-10 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{resultsError}</div>}
              {publishError && <div className="relative z-10 text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{publishError}</div>}
              {publishSuccess && <div className="relative z-10 text-xs px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{publishSuccess}</div>}

              {resultsLoading ? (
                <div className="relative z-10 text-center py-10 text-muted text-sm">Đang tải...</div>
              ) : resultsLoaded && results.length === 0 ? (
                <div className="relative z-10 text-center py-10">
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              ) : results.length > 0 ? (
                <div className="relative z-10 overflow-hidden rounded-lg border border-glass-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-muted border-b border-glass-border">
                        <th className="px-4 py-2.5 font-bold">Hạng</th>
                        <th className="px-4 py-2.5 font-bold">Ngựa</th>
                        <th className="px-4 py-2.5 font-bold">Nài</th>
                        <th className="px-4 py-2.5 font-bold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={r.id ?? r.raceEntryId ?? i} className="border-b border-glass-border/40 hover:bg-white/2 transition-colors">
                          <td className="px-4 py-2.5 text-gold font-bold">{r.winner ?? '—'}</td>
                          <td className="px-4 py-2.5 text-white font-medium">{r.horseName ?? '—'}</td>
                          <td className="px-4 py-2.5 text-body">{r.jockeyName ?? '—'}</td>
                          <td className="px-4 py-2.5 text-body">{r.status ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>

        </main>
      </div>

      {/* Prizes Modal */}
      {showPrizesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-gold/10 to-transparent blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <DollarSign size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Thiết lập giải thưởng</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Giải đấu *</label>
                <select value={prizes.tournamentId} onChange={e => setP('tournamentId', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }}>
                  <option value="">-- Chọn giải đấu --</option>
                  {tournaments.map((t, i) => {
                    const id = t.tournamentId ?? t.id;
                    return <option key={id ?? i} value={id}>{t.name}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className={LABEL}>Giải nhất (VNĐ) *</label>
                <input value={prizes.firstPlacePrize} onChange={e => setP('firstPlacePrize', e.target.value)} type="number" min="0" placeholder="VD: 85000000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Giải nhì (VNĐ) *</label>
                <input value={prizes.secondPlacePrize} onChange={e => setP('secondPlacePrize', e.target.value)} type="number" min="0" placeholder="VD: 42000000" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Giải ba (VNĐ) *</label>
                <input value={prizes.thirdPlacePrize} onChange={e => setP('thirdPlacePrize', e.target.value)} type="number" min="0" placeholder="VD: 21000000" className={INPUT} />
              </div>

              {prizesError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{prizesError}</div>}
              {prizesSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{prizesSuccess}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closePrizesModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleCreatePrizes} disabled={prizesLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {prizesLoading ? 'Đang lưu…' : 'Lưu giải thưởng'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
