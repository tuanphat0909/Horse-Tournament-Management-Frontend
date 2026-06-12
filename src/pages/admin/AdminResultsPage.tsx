import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Eye, CheckCircle, Trophy, Clock, ChevronDown, ChevronUp, DollarSign, Zap } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { createPrizes, triggerPayout } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

const PENDING_RESULTS = [
  {
    id: 3,
    race: 'Vòng 3 - Chặng Sức Bền',
    tournament: 'Giải Xuân 2026',
    date: '15/06/2026',
    referee: 'Lê Hoàng Nam',
    submittedAt: '15/06/2026 12:45',
    results: [
      { pos: 1, horse: 'Thunderstrike', owner: 'Nguyễn Văn An', jockey: 'Trần Thị Bình', time: '2:05.4', prize: '₫85.000.000' },
      { pos: 2, horse: 'Desert Wind', owner: 'Nguyễn Văn An', jockey: 'Hoàng Thị Lan', time: '2:06.1', prize: '₫42.000.000' },
      { pos: 3, horse: 'Silver Arrow', owner: 'Trần Thị Bình', jockey: 'Ngô Minh Khoa', time: '2:07.3', prize: '₫21.000.000' },
      { pos: 4, horse: 'Golden Flash', owner: 'Phạm Đức Mạnh', jockey: 'Vũ Đức Minh', time: '2:08.0', prize: '—' },
      { pos: 5, horse: 'Dark Knight', owner: 'Vũ Minh Tuấn', jockey: 'Trương Văn Hải', time: '2:09.2', prize: '—' },
    ],
  },
];

const PUBLISHED_RESULTS = [
  { id: 1, race: 'Vòng 1 - Chặng Mở Đầu', tournament: 'Giải Xuân 2026', date: '10/06/2026', publishedAt: '10/06/2026 15:00', winner: 'Thunderstrike' },
  { id: 2, race: 'Vòng 2 - Chặng Tốc Độ', tournament: 'Giải Xuân 2026', date: '12/06/2026', publishedAt: '12/06/2026 14:30', winner: 'Desert Wind' },
];

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_PRIZES = { tournamentId: '', firstPlacePrize: '', secondPlacePrize: '', thirdPlacePrize: '' };

export function AdminResultsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

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
      await createPrizes({
        tournamentId: Number(prizes.tournamentId),
        firstPlacePrize: Number(prizes.firstPlacePrize),
        secondPlacePrize: Number(prizes.secondPlacePrize),
        thirdPlacePrize: Number(prizes.thirdPlacePrize),
      });
      setPrizesSuccess('Thiết lập giải thưởng thành công!');
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
    if (!payoutRaceId) { setPayoutError('Vui lòng nhập Race ID.'); return; }
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
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Kết quả & Công bố"
            subtitle="Xác nhận và công bố kết quả chính thức"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          {/* Management Tools */}
          <div className="grid grid-cols-2 gap-4">
            {/* Prizes Setup */}
            <div className="glass-panel rounded-xl p-6 border border-glass-border">
              <div className="flex items-center gap-3 mb-4">
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
                className="btn-gold w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
              >
                <DollarSign size={14} /> Cấu hình giải thưởng
              </button>
            </div>

            {/* Trigger Payout */}
            <div className="glass-panel rounded-xl p-6 border border-glass-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Zap size={18} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Kích hoạt chi trả</div>
                  <div className="text-xs text-muted">Trigger payout cho một cuộc đua đã kết thúc</div>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={payoutRaceId}
                  onChange={e => { setPayoutRaceId(e.target.value); setPayoutError(''); setPayoutSuccess(''); }}
                  type="number"
                  min="1"
                  placeholder="Race ID"
                  className="flex-1 bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors"
                  onKeyDown={e => e.key === 'Enter' && handleTriggerPayout()}
                />
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

          {/* Pending Publication */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <h2 className="text-base font-medium text-white">Chờ công bố</h2>
            </div>
            <div className="space-y-4">
              {PENDING_RESULTS.map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl overflow-hidden border border-yellow-500/20">
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                      <Trophy size={20} className="text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-serif text-white">{item.race}</div>
                      <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                        <span>{item.tournament}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {item.date}</span>
                        <span>Trọng tài: {item.referee}</span>
                        <span>Nộp lúc: {item.submittedAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-glass-border text-muted hover:text-white text-xs font-medium transition-colors"
                      >
                        <Eye size={13} /> Xem kết quả
                        {expanded === item.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-gold text-xs font-bold">
                        <Megaphone size={13} /> Công bố
                      </button>
                    </div>
                  </div>

                  {expanded === item.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-glass-border">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-navy-light/30 border-b border-glass-border">
                            {['Vị trí', 'Ngựa', 'Chủ ngựa', 'Jockey', 'Thời gian', 'Giải thưởng'].map(h => (
                              <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted font-bold px-5 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.results.map((r, i) => (
                            <tr key={i} className="border-b border-glass-border/30 hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-serif font-bold text-sm ${
                                  r.pos === 1 ? 'bg-gold/20 text-gold border border-gold/30' :
                                  r.pos === 2 ? 'bg-white/10 text-white border border-white/20' :
                                  r.pos === 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                  'bg-white/5 text-muted border border-glass-border'
                                }`}>
                                  {r.pos}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-sm font-semibold text-white">{r.horse}</td>
                              <td className="px-5 py-3.5 text-sm text-muted">{r.owner}</td>
                              <td className="px-5 py-3.5 text-sm text-muted">{r.jockey}</td>
                              <td className="px-5 py-3.5 text-sm font-mono text-champagne font-bold">{r.time}</td>
                              <td className="px-5 py-3.5 text-sm text-gold font-bold">{r.prize}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Published */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={14} className="text-emerald-400" />
              <h2 className="text-base font-medium text-white">Đã công bố</h2>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border bg-navy-light/30">
                    {['Cuộc đua', 'Giải đấu', 'Ngày', 'Ngựa vô địch', 'Công bố lúc'].map(h => (
                      <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted font-bold px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PUBLISHED_RESULTS.map((r, i) => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }} className="border-b border-glass-border/50 hover:bg-white/[0.02]">
                      <td className="px-5 py-4 text-sm font-semibold text-white">{r.race}</td>
                      <td className="px-5 py-4 text-sm text-muted">{r.tournament}</td>
                      <td className="px-5 py-4 text-sm text-muted">{r.date}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-sm text-gold font-medium">
                          <Trophy size={13} /> {r.winner}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted">{r.publishedAt}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* Prizes Modal */}
      {showPrizesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Thiết lập giải thưởng</h2>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Tournament ID *</label>
                <input value={prizes.tournamentId} onChange={e => setP('tournamentId', e.target.value)} type="number" min="1" placeholder="ID của giải đấu" className={INPUT} />
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
