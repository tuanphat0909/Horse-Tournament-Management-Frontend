import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getMyBets, placeBet, createPrediction, getMyPredictions } from '../../api/spectatorService';
import { getRaceSchedule, getRaceEntries, getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { toast } from '../../components/ui/Toast';
import { Pager, paginate } from '../../components/ui/Pager';

function entryHorseId(e: any) { return e.horseId; }
function entryRaceEntryId(e: any) { return e.raceEntryId ?? e.id; }
function entryHorseName(e: any) { return e.horseName ?? e.name ?? ('Ngựa #' + (e.horseId ?? e.raceEntryId ?? e.id)); }

type BetStatus = 'correct' | 'incorrect' | 'pending';
type Tab = BetStatus | 'all';

function normalizeStatus(s: string): BetStatus {
  const key = (s ?? '').toLowerCase();
  if (key === 'win' || key === 'won' || key === 'correct') return 'correct';
  if (key === 'lose' || key === 'lost' || key === 'incorrect') return 'incorrect';
  return 'pending';
}

const RESULT_CONFIG: Record<BetStatus, { label: string; color: string; icon: typeof Clock }> = {
  correct:   { label: 'Thắng',       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  incorrect: { label: 'Thua',        color: 'text-red-400 bg-red-500/10 border-red-500/20',            icon: XCircle },
  pending:   { label: 'Chờ kết quả', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  icon: Clock },
};

const TABS: [Tab, string][] = [['all', 'Tất cả'], ['pending', 'Chờ kết quả'], ['correct', 'Thắng'], ['incorrect', 'Thua']];

const INPUT = 'w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';

type MainTab = 'bets' | 'predictions';

export function SpectatorPredictionsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('bets');
  const [bets, setBets] = useState<any[]>([]);

  // ── Loại cược: 'win' = ngựa về NHẤT (BE hỗ trợ) • 'last' = ngựa về CHÓT •
  //    'acc' = cược XUYÊN GIẢI (đúng hết mọi vòng ăn lớn, sai 1 trận mất sạch)
  //    'last' và 'acc' BE CHƯA có API — form dựng sẵn, khóa nút xác nhận.
  const [betType, setBetType] = useState<'win' | 'last' | 'acc'>('win');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [accTournamentId, setAccTournamentId] = useState('');
  const [accPicks, setAccPicks] = useState<Record<string, string>>({}); // raceId -> horseId
  const [accEntries, setAccEntries] = useState<Record<string, any[]>>({}); // raceId -> entries
  const [accAmount, setAccAmount] = useState('');
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ raceId: '', horseId: '', amount: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Entries for bet modal (dropdown with manual fallback)
  const [betEntries, setBetEntries] = useState<any[]>([]);
  const [betEntriesError, setBetEntriesError] = useState('');

  // Predictions
  const [predictions, setPredictions] = useState<any[]>([]);
  const [predLoading, setPredLoading] = useState(true);
  const [predError, setPredError] = useState('');
  const [showAddPred, setShowAddPred] = useState(false);
  const [predForm, setPredForm] = useState({ raceId: '', raceEntryId: '' });
  const [predEntries, setPredEntries] = useState<any[]>([]);
  const [predEntriesError, setPredEntriesError] = useState('');
  const [predSubmitLoading, setPredSubmitLoading] = useState(false);
  const [predSubmitError, setPredSubmitError] = useState('');
  const [predSubmitSuccess, setPredSubmitSuccess] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const data = await getMyBets();
      setBets(data?.result ?? (Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  async function loadPredictions() {
    setPredLoading(true); setPredError('');
    try {
      const data = await getMyPredictions();
      setPredictions(data?.result ?? (Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      setPredError(parseApiError(err as Error));
    } finally {
      setPredLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadPredictions();
    getRaceSchedule()
      .then(d => setRaces(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch(() => setRaces([]));
  }, []);

  // Load entries for bet modal when race changes
  useEffect(() => {
    if (!form.raceId) { setBetEntries([]); setBetEntriesError(''); return; }
    let cancelled = false;
    getRaceEntries(Number(form.raceId))
      .then((d: any) => {
        if (cancelled) return;
        const list = d?.result ?? (Array.isArray(d) ? d : []);
        setBetEntries(list);
        setBetEntriesError(list.length === 0 ? 'no-entries' : '');
      })
      .catch(() => { if (!cancelled) { setBetEntries([]); setBetEntriesError('error'); } });
    return () => { cancelled = true; };
  }, [form.raceId]);

  // Load entries for prediction modal when race changes
  useEffect(() => {
    if (!predForm.raceId) { setPredEntries([]); setPredEntriesError(''); return; }
    let cancelled = false;
    getRaceEntries(Number(predForm.raceId))
      .then((d: any) => {
        if (cancelled) return;
        const list = d?.result ?? (Array.isArray(d) ? d : []);
        setPredEntries(list);
        setPredEntriesError(list.length === 0 ? 'no-entries' : '');
      })
      .catch(() => { if (!cancelled) { setPredEntries([]); setPredEntriesError('error'); } });
    return () => { cancelled = true; };
  }, [predForm.raceId]);

  useEffect(() => {
    getTournaments().then((d: any) => setTournaments(d?.result ?? [])).catch(() => setTournaments([]));
  }, []);

  // Các cuộc đua thuộc giải đã chọn (cho cược xuyên giải), sắp theo vòng
  const accRaces = accTournamentId
    ? races.filter((r: any) => String(r.tournamentId) === accTournamentId)
        .sort((a: any, b: any) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0))
    : [];

  useEffect(() => {
    if (!accTournamentId) { setAccEntries({}); setAccPicks({}); return; }
    let cancelled = false;
    (async () => {
      const map: Record<string, any[]> = {};
      for (const r of accRaces) {
        const rid = String(r.id ?? r.raceId);
        try {
          const d: any = await getRaceEntries(Number(rid));
          map[rid] = d?.result ?? [];
        } catch { map[rid] = []; }
      }
      if (!cancelled) setAccEntries(map);
    })();
    return () => { cancelled = true; };
  }, [accTournamentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePlaceBet() {
    setSubmitError(''); setSubmitSuccess('');
    if (!form.raceId || !form.horseId || !form.amount) {
      setSubmitError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSubmitLoading(true);
    try {
      await placeBet({ raceId: Number(form.raceId), horseId: Number(form.horseId), amount: Number(form.amount) });
      toast.success('Đặt cược thành công!');
      setShowAdd(false);
      setForm({ raceId: '', horseId: '', amount: '' });
      load();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  function closeModal() {
    setShowAdd(false);
    setSubmitError(''); setSubmitSuccess('');
    setForm({ raceId: '', horseId: '', amount: '' });
    setBetEntries([]); setBetEntriesError('');
  }

  async function handleCreatePrediction() {
    setPredSubmitError(''); setPredSubmitSuccess('');
    if (!predForm.raceId || !predForm.raceEntryId) {
      setPredSubmitError('Vui lòng chọn cuộc đua và ngựa dự đoán.');
      return;
    }
    setPredSubmitLoading(true);
    try {
      await createPrediction({ raceId: Number(predForm.raceId), raceEntryId: Number(predForm.raceEntryId) });
      toast.success('Tạo dự đoán thành công!');
      setShowAddPred(false);
      setPredForm({ raceId: '', raceEntryId: '' });
      loadPredictions();
    } catch (err: unknown) {
      setPredSubmitError(parseApiError(err as Error));
    } finally {
      setPredSubmitLoading(false);
    }
  }

  function closePredModal() {
    setShowAddPred(false);
    setPredSubmitError(''); setPredSubmitSuccess('');
    setPredForm({ raceId: '', raceEntryId: '' });
    setPredEntries([]); setPredEntriesError('');
  }

  const filtered = tab === 'all' ? bets : bets.filter(b => normalizeStatus(b.status) === tab);

  const [betPage, setBetPage] = useState(1);
  const betPg = paginate(filtered, betPage, 8);
  const [predPage, setPredPage] = useState(1);
  const predPg = paginate(predictions, predPage, 8);
  const counts: Record<Tab, number> = {
    all: bets.length,
    pending: bets.filter(b => normalizeStatus(b.status) === 'pending').length,
    correct: bets.filter(b => normalizeStatus(b.status) === 'correct').length,
    incorrect: bets.filter(b => normalizeStatus(b.status) === 'incorrect').length,
  };

  // No prize/reward field exists on bets — summarize total amount staked instead.
  const totalStaked = bets.reduce((s, b) => s + Number(b.amount ?? 0), 0);
  const totalBets = counts.correct + counts.incorrect;
  const accuracy = totalBets > 0 ? `${Math.round((counts.correct / totalBets) * 100)}%` : '—';

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Dự đoán & Cược"
            subtitle="Đặt cược và theo dõi kết quả"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            actions={
              mainTab === 'bets' ? (
                <button onClick={() => setShowAdd(true)} className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Plus size={14} /> Đặt cược
                </button>
              ) : (
                <button onClick={() => setShowAddPred(true)} className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Plus size={14} /> Tạo dự đoán
                </button>
              )
            }
          />

          {/* Main tabs: Bets / Predictions */}
          <div className="flex items-center gap-2">
            {([['bets', 'Cược'], ['predictions', 'Dự đoán']] as [MainTab, string][]).map(([mt, label]) => (
              <button key={mt} onClick={() => setMainTab(mt)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all border ${mainTab === mt ? 'btn-gold border-transparent' : 'text-muted border-glass-border hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {mainTab === 'bets' && (
          <>
          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tổng tiền cược', value: totalStaked > 0 ? `${totalStaked.toLocaleString()} coins` : '—', icon: Sparkles, color: 'text-gold', bg: 'from-gold/15 to-amber-900/20' },
              { label: 'Tỉ lệ thắng', value: accuracy, icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
              { label: 'Tổng cược', value: bets.length, icon: CheckCircle, color: 'text-blue-400', bg: 'from-blue-500/15 to-blue-900/20' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-panel rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-linear-to-br ${s.bg} blur-[30px] opacity-60 pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.bg} border border-white/8 flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className="relative z-10 text-2xl font-serif font-bold text-white">{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {TABS.map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setBetPage(1); }}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {label} <span className="ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 text-muted">{counts[t]}</span>
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
          ) : (
            <div className="space-y-3">
              {betPg.paged.map((b, i) => {
                const statusKey = normalizeStatus(b.status);
                const cfg = RESULT_CONFIG[statusKey];
                const Icon = cfg.icon;
                return (
                  <motion.div key={b.id ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/30 hover:bg-gold/4 transition-all relative overflow-hidden group">
                    <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center text-2xl shrink-0">🐴</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base font-serif font-bold text-white">{b.horseName ?? `Ngựa #${b.horseId}`}</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            <Icon size={10} /> {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted">
                          {b.raceName && <span>{b.raceName}</span>}
                          {b.raceId && !b.raceName && <span>Race #{b.raceId}</span>}
                          {b.createdAt && <span className="text-muted/60">{b.createdAt}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted">Cược: <span className="text-white font-medium">{Number(b.amount ?? 0).toLocaleString()} coins</span></div>
                        {b.odds != null && (
                          <div className="text-sm font-bold text-gold">x{b.odds}</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🎯</div>
                  <div className="text-muted text-sm">Không có cược nào</div>
                  <div className="mx-auto mt-4 w-24 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
                </div>
              )}
              <Pager page={betPg.page} totalPages={betPg.totalPages} total={betPg.total} onChange={setBetPage} />
            </div>
          )}
          </>
          )}

          {/* Predictions section */}
          {mainTab === 'predictions' && (
            <>
              {predError && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{predError}</div>}
              {predLoading ? (
                <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
              ) : predictions.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">🔮</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {predPg.paged.map((p, i) => {
                    const statusKey = normalizeStatus(p.status);
                    const cfg = RESULT_CONFIG[statusKey];
                    const Icon = cfg.icon;
                    return (
                      <motion.div key={p.predictionId ?? i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass-panel rounded-xl p-5 border border-glass-border hover:border-gold/30 transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-2xl shrink-0">🔮</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-base font-serif font-bold text-white">Race #{p.raceId} · Entry #{p.raceEntryId}</span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                <Icon size={10} /> {cfg.label}
                              </span>
                              {p.isCorrect != null && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${p.isCorrect ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                                  {p.isCorrect ? 'Đúng' : 'Sai'}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-muted">
                              {p.predictedAt && <span className="text-muted/60">{p.predictedAt}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-muted">Điểm: <span className="text-gold font-bold">{p.point ?? 0}</span></div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <Pager page={predPg.page} totalPages={predPg.totalPages} total={predPg.total} onChange={setPredPage} />
                </div>
              )}
            </>
          )}

          {/* Place bet modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-md border border-glass-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Sparkles size={15} className="text-gold" /></div>
                  <h3 className="text-lg font-serif text-white">Đặt cược mới</h3>
                  <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <div className="space-y-4">
                  {/* ── Chọn LOẠI CƯỢC ── */}
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Loại cược *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['win', '🥇 Về NHẤT', 'Ngựa bạn chọn phải về nhất'],
                        ['last', '🐢 Về CHÓT', 'Ngựa bạn chọn phải về cuối cùng'],
                        ['acc', '🏆 Xuyên giải', 'Đoán đúng mọi vòng của giải — ăn lớn'],
                      ] as ['win' | 'last' | 'acc', string, string][]).map(([k, label, desc]) => (
                        <button key={k} onClick={() => setBetType(k)} title={desc}
                          className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition-all ${betType === k ? 'border-gold/50 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/5'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {betType !== 'acc' ? (
                    <>
                      {betType === 'last' && (
                        <div className="text-[11px] text-yellow-400/90 bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-3 py-2">
                          🐢 <b>Cược về chót:</b> ngựa bạn chọn phải về <b>CUỐI CÙNG</b> mới thắng. Backend chưa hỗ trợ loại cược này — form dựng sẵn chờ API.
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-muted font-medium mb-1.5">Cuộc đua *</label>
                        <select value={form.raceId} onChange={e => setForm(p => ({...p, raceId: e.target.value}))} className={INPUT}>
                          <option value="">-- Chọn cuộc đua --</option>
                          {races.map(r => (
                            <option key={r.id} value={r.id}>{(r.name ?? `Cuộc đua #${r.id}`)}{r.raceDate ? ` — ${r.raceDate}` : ''}</option>
                          ))}
                        </select>
                        {races.length === 0 && <p className="text-[10px] text-muted/60 mt-1">Chưa có cuộc đua nào trong lịch.</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-muted font-medium mb-1.5">{betType === 'last' ? 'Ngựa cược về chót *' : 'Ngựa cược về nhất *'}</label>
                        <select value={form.horseId} onChange={e => setForm(p => ({...p, horseId: e.target.value}))} className={INPUT} disabled={!form.raceId}>
                          <option value="">{!form.raceId ? '-- Chọn cuộc đua trước --' : '-- Chọn ngựa --'}</option>
                          {betEntries.map((e, ei) => (
                            <option key={entryRaceEntryId(e) ?? ei} value={entryHorseId(e)}>{entryHorseName(e)}</option>
                          ))}
                        </select>
                        {form.raceId && betEntries.length === 0 && (
                          <p className="text-[10px] text-muted/60 mt-1">
                            {betEntriesError ? 'Không tải được danh sách ngựa của cuộc đua này.' : 'Cuộc đua này chưa có ngựa đăng ký.'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-muted font-medium mb-1.5">Số coins cược *</label>
                        <input type="number" min="1" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} placeholder="VD: 100" className={INPUT} />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ── CƯỢC XUYÊN GIẢI: đoán ngựa thắng ở TỪNG vòng của giải ── */}
                      <div className="text-[11px] text-champagne/90 bg-gold/8 border border-gold/20 rounded-lg px-3 py-2 leading-relaxed">
                        🏆 <b>Cược xuyên giải:</b> chọn ngựa thắng cho <b>từng vòng</b> của giải. Đoán đúng <b>TẤT CẢ</b> → tiền thưởng nhân lũy tiến theo số vòng. Sai <b>dù chỉ 1 trận</b> ở bất kỳ thời điểm nào → <b>mất toàn bộ</b> tiền đã đặt. Backend chưa hỗ trợ — form dựng sẵn chờ API.
                      </div>
                      <div>
                        <label className="block text-xs text-muted font-medium mb-1.5">Giải đấu *</label>
                        <select value={accTournamentId} onChange={e => { setAccTournamentId(e.target.value); setAccPicks({}); }} className={INPUT}>
                          <option value="">-- Chọn giải đấu --</option>
                          {tournaments.map((t: any, i: number) => {
                            const id = t.tournamentId ?? t.id;
                            return <option key={id ?? i} value={id}>{t.name}</option>;
                          })}
                        </select>
                      </div>
                      {accTournamentId && (
                        accRaces.length === 0 ? (
                          <p className="text-[10px] text-muted/60">Giải này chưa có cuộc đua nào trong lịch.</p>
                        ) : (
                          <div className="space-y-2">
                            {accRaces.map((r: any) => {
                              const rid = String(r.id ?? r.raceId);
                              const entries = accEntries[rid] ?? [];
                              return (
                                <div key={rid} className="flex items-center gap-2">
                                  <span className="w-28 shrink-0 text-[11px] text-muted truncate" title={r.name}>
                                    {r.roundName ?? (r.roundNumber != null ? `Vòng ${r.roundNumber}` : r.name)}
                                  </span>
                                  <select value={accPicks[rid] ?? ''} onChange={e => setAccPicks(p => ({ ...p, [rid]: e.target.value }))}
                                    className="flex-1 bg-[#0B1628] border border-glass-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-gold/40">
                                    <option value="">{entries.length === 0 ? '-- Chưa có ngựa --' : '-- Chọn ngựa thắng --'}</option>
                                    {entries.map((e: any, ei: number) => (
                                      <option key={entryRaceEntryId(e) ?? ei} value={entryHorseId(e)}>{entryHorseName(e)}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        )
                      )}
                      <div>
                        <label className="block text-xs text-muted font-medium mb-1.5">Số coins cược *</label>
                        <input type="number" min="1" value={accAmount} onChange={e => setAccAmount(e.target.value)} placeholder="VD: 100" className={INPUT} />
                        {accAmount && accRaces.length > 0 && (
                          <p className="text-[10px] text-gold mt-1">
                            Thưởng dự kiến nếu đúng hết {accRaces.length} vòng: ≈ {(Number(accAmount) * Math.pow(2, accRaces.length)).toLocaleString()} coins (x{Math.pow(2, accRaces.length)}) — sai 1 trận mất {Number(accAmount).toLocaleString()} coins.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {submitError && <div className="text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{submitError}</div>}
                  {submitSuccess && <div className="text-xs text-emerald-400 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{submitSuccess}</div>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeModal} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">Hủy</button>
                  {betType === 'win' ? (
                    <button onClick={handlePlaceBet} disabled={submitLoading} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-60">
                      {submitLoading ? 'Đang đặt…' : 'Xác nhận cược'}
                    </button>
                  ) : (
                    <button disabled title="Backend chưa có API cho loại cược này"
                      className="px-6 py-2 rounded-lg text-sm font-bold border border-glass-border text-muted/50 cursor-not-allowed">
                      Chờ backend hỗ trợ
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Create prediction modal */}
          {showAddPred && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-md border border-glass-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0"><Sparkles size={15} className="text-purple-300" /></div>
                  <h3 className="text-lg font-serif text-white">Tạo dự đoán</h3>
                  <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Cuộc đua *</label>
                    <select value={predForm.raceId} onChange={e => setPredForm(p => ({...p, raceId: e.target.value, raceEntryId: ''}))} className={INPUT}>
                      <option value="">-- Chọn cuộc đua --</option>
                      {races.map(r => (
                        <option key={r.id} value={r.id}>{(r.name ?? `Cuộc đua #${r.id}`)}{r.raceDate ? ` — ${r.raceDate}` : ''}</option>
                      ))}
                    </select>
                    {races.length === 0 && <p className="text-[10px] text-muted/60 mt-1">Chưa có cuộc đua nào trong lịch.</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Ngựa dự đoán *</label>
                    <select value={predForm.raceEntryId} onChange={e => setPredForm(p => ({...p, raceEntryId: e.target.value}))} className={INPUT} disabled={!predForm.raceId}>
                      <option value="">-- Chọn ngựa --</option>
                      {predEntries.map((e, ei) => (
                        <option key={entryRaceEntryId(e) ?? ei} value={entryRaceEntryId(e)}>{entryHorseName(e)}</option>
                      ))}
                    </select>
                    {predForm.raceId && predEntriesError && (
                      <p className="text-[10px] text-muted/60 mt-1">Không tải được danh sách ngựa của cuộc đua này.</p>
                    )}
                  </div>
                  {predSubmitError && <div className="text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{predSubmitError}</div>}
                  {predSubmitSuccess && <div className="text-xs text-emerald-400 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{predSubmitSuccess}</div>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closePredModal} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">Hủy</button>
                  <button onClick={handleCreatePrediction} disabled={predSubmitLoading} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-60">
                    {predSubmitLoading ? 'Đang tạo…' : 'Xác nhận dự đoán'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
