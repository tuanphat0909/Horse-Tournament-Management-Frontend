import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown,
  Clock, CheckCircle, Plus, Minus, DollarSign, Coins, History,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { deposit, withdraw, getBalance, getWalletHistory } from '../../api/spectatorService';
import { parseApiError } from '../../api/authService';

const COINS_PER_USD = 100;
const QUICK_AMTS = [5, 10, 20, 50];

type TxType = 'deposit' | 'withdraw' | 'win' | 'loss' | 'bet';
const TX_CONFIG: Record<TxType, { color: string; bg: string; label: string }> = {
  deposit:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Nạp tiền' },
  withdraw: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       label: 'Rút tiền' },
  win:      { color: 'text-gold',        bg: 'bg-gold/10 border-gold/20',               label: 'Thắng cược' },
  loss:     { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         label: 'Thua cược' },
  bet:      { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20',   label: 'Đặt cược' },
};

function normalizeType(t: string): TxType {
  const key = (t ?? '').toLowerCase();
  if (key.includes('withdraw')) return 'withdraw';
  if (key.includes('deposit')) return 'deposit';
  if (key.includes('win') || key.includes('won')) return 'win';
  if (key.includes('loss') || key.includes('lost')) return 'loss';
  return 'bet';
}

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export function SpectatorWalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [usdInput, setUsdInput] = useState('');
  const [quickAmt, setQuickAmt] = useState<number | null>(null);
  const [txFilter, setTxFilter] = useState<TxType | 'all'>('all');

  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState('');
  const [depositErr, setDepositErr] = useState('');

  const [withdrawInput, setWithdrawInput] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawErr, setWithdrawErr] = useState('');

  async function loadAll() {
    setPageLoading(true); setPageError('');
    try {
      const [balData, histData] = await Promise.all([getBalance(), getWalletHistory()]);
      const bal = balData?.result?.balance ?? balData?.result ?? (typeof balData === 'number' ? balData : 0);
      setBalance(Number(bal) || 0);
      setTransactions(histData?.result ?? (Array.isArray(histData) ? histData : []));
    } catch (err: unknown) {
      setPageError(parseApiError(err as Error));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const effectiveUsd = quickAmt ?? (parseFloat(usdInput) || 0);
  const coinsPreview = effectiveUsd * COINS_PER_USD;

  async function handleDeposit() {
    if (effectiveUsd <= 0) return;
    setDepositLoading(true); setDepositErr(''); setDepositMsg('');
    try {
      await deposit(effectiveUsd);
      setDepositMsg(`Nạp $${effectiveUsd} thành công!`);
      setUsdInput(''); setQuickAmt(null);
      loadAll();
    } catch (err: unknown) {
      setDepositErr(parseApiError(err as Error));
    } finally {
      setDepositLoading(false);
      setTimeout(() => { setDepositMsg(''); setDepositErr(''); }, 4000);
    }
  }

  async function handleWithdraw() {
    const amt = parseFloat(withdrawInput);
    if (!amt || amt <= 0) { setWithdrawErr('Nhập số tiền hợp lệ.'); return; }
    setWithdrawLoading(true); setWithdrawErr(''); setWithdrawMsg('');
    try {
      await withdraw(amt);
      setWithdrawMsg(`Rút $${amt} thành công!`);
      setWithdrawInput('');
      loadAll();
    } catch (err: unknown) {
      setWithdrawErr(parseApiError(err as Error));
    } finally {
      setWithdrawLoading(false);
      setTimeout(() => { setWithdrawMsg(''); setWithdrawErr(''); }, 4000);
    }
  }

  const filtered = txFilter === 'all' ? transactions : transactions.filter(t => normalizeType(t.type ?? t.transactionType) === txFilter);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Ví của tôi"
            subtitle="Nạp tiền, rút tiền và theo dõi giao dịch"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                <Coins size={10} /> $1 = {COINS_PER_USD} coins
              </div>
            }
          />

          {pageError && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{pageError}</div>}

          {/* Balance + stats */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-4">
            <motion.div variants={child} className="col-span-1 glass-panel rounded-2xl p-6 relative overflow-hidden border border-gold/15">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-linear-to-br from-gold/20 to-amber-900/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Wallet size={18} className="text-gold" />
                  </div>
                  <div className="text-[10px] text-muted uppercase tracking-widest font-bold">Số dư khả dụng</div>
                </div>
                {pageLoading ? (
                  <div className="text-muted text-sm py-4">Đang tải...</div>
                ) : (
                  <>
                    <div className="flex items-end gap-3 mb-1">
                      <span className="text-4xl font-serif font-bold text-white">{balance.toLocaleString()}</span>
                      <span className="text-lg text-gold font-bold mb-1">coins</span>
                    </div>
                    <div className="text-sm text-muted">${(balance / COINS_PER_USD).toFixed(2)} USD tương đương</div>
                  </>
                )}
              </div>
            </motion.div>

            {[
              { label: 'Tổng giao dịch', value: transactions.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-900/20' },
              { label: 'Cược đang chờ', value: transactions.filter(t => (t.status ?? '').toLowerCase() === 'pending').length, icon: Clock, color: 'text-yellow-400', bg: 'from-yellow-500/15 to-yellow-900/20' },
            ].map((s, i) => (
              <motion.div key={i} variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full bg-linear-to-br ${s.bg} blur-[30px] opacity-60 pointer-events-none`} />
                <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${s.bg} border border-white/8 flex items-center justify-center ${s.color} mb-3 relative z-10`}>
                  <s.icon size={16} />
                </div>
                <div className={`relative z-10 text-xl font-serif font-bold ${s.color}`}>{s.value}</div>
                <div className="relative z-10 text-[11px] text-muted font-medium mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Deposit + Withdraw + History */}
          <div className="grid grid-cols-[400px_1fr] gap-6">

            {/* Left: Deposit + Withdraw */}
            <div className="space-y-4">
              {/* Deposit */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Plus size={15} className="text-emerald-400" />
                  </div>
                  <h2 className="text-base font-serif text-white">Nạp tiền</h2>
                  <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                </div>

                <div className="mb-4">
                  <div className="text-[11px] text-muted font-medium mb-2 uppercase tracking-wider">Nhanh</div>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_AMTS.map(amt => (
                      <button key={amt} onClick={() => { setQuickAmt(quickAmt === amt ? null : amt); setUsdInput(''); }}
                        className={`py-2 rounded-lg text-sm font-bold border transition-all ${quickAmt === amt ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-white/3 border-glass-border text-muted hover:text-white hover:border-white/20'}`}>
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[11px] text-muted font-medium mb-2 uppercase tracking-wider">Hoặc nhập thủ công</div>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input type="number" min="1" value={usdInput}
                      onChange={e => { setUsdInput(e.target.value); setQuickAmt(null); }}
                      placeholder="0.00"
                      className="w-full bg-white/4 border border-glass-border rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-muted/50 outline-none focus:border-gold/40 transition-colors" />
                  </div>
                </div>

                {coinsPreview > 0 && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-lg bg-gold/5 border border-gold/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Bạn sẽ nhận được</span>
                      <span className="text-sm font-bold text-gold">{coinsPreview.toLocaleString()} coins</span>
                    </div>
                  </motion.div>
                )}

                {depositErr && <div className="mb-3 text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{depositErr}</div>}
                {depositMsg && <div className="mb-3 text-xs text-emerald-400 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{depositMsg}</div>}

                <button onClick={handleDeposit} disabled={coinsPreview <= 0 || depositLoading}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${coinsPreview > 0 ? 'btn-gold' : 'bg-white/5 text-muted cursor-not-allowed border border-glass-border'}`}>
                  {depositLoading ? 'Đang nạp…' : coinsPreview > 0 ? `Nạp $${effectiveUsd} → ${coinsPreview.toLocaleString()} coins` : 'Chọn số tiền'}
                </button>
              </motion.div>

              {/* Withdraw */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
                <div className="relative z-10 flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Minus size={15} className="text-blue-400" />
                  </div>
                  <h2 className="text-base font-serif text-white">Rút tiền</h2>
                  <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                </div>

                <div className="relative mb-4">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="number" min="1" value={withdrawInput} onChange={e => setWithdrawInput(e.target.value)}
                    placeholder="Số USD muốn rút"
                    className="w-full bg-white/4 border border-glass-border rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-muted/50 outline-none focus:border-blue-400/40 transition-colors" />
                </div>

                {withdrawErr && <div className="mb-3 text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{withdrawErr}</div>}
                {withdrawMsg && <div className="mb-3 text-xs text-emerald-400 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">{withdrawMsg}</div>}

                <button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawInput}
                  className="w-full py-2.5 rounded-lg text-sm font-bold bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 transition-all disabled:opacity-50">
                  {withdrawLoading ? 'Đang rút…' : 'Rút tiền'}
                </button>
              </motion.div>
            </div>

            {/* Transaction history */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><History size={15} className="text-gold" /></div>
                <h2 className="text-base font-serif text-white">Lịch sử giao dịch</h2>
                <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                <div className="flex items-center gap-1 shrink-0">
                  {([['all', 'Tất cả'], ['deposit', 'Nạp'], ['withdraw', 'Rút'], ['win', 'Thắng'], ['loss', 'Thua'], ['bet', 'Cược']] as [TxType | 'all', string][]).map(([f, label]) => (
                    <button key={f} onClick={() => setTxFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${txFilter === f ? 'bg-gold/15 text-gold border border-gold/30' : 'text-muted hover:text-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {pageLoading ? (
                <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {filtered.map((tx, i) => {
                    const txType = normalizeType(tx.type ?? tx.transactionType ?? '');
                    const cfg = TX_CONFIG[txType];
                    const TxIcon = txType === 'deposit' ? ArrowDownLeft
                      : txType === 'withdraw' ? ArrowUpRight
                      : txType === 'win' ? TrendingUp
                      : txType === 'loss' ? TrendingDown
                      : (tx.status ?? '').toLowerCase() === 'pending' ? Clock : CheckCircle;
                    const amt = tx.amount ?? tx.coins ?? 0;
                    const isPos = amt > 0;
                    return (
                      <motion.div key={tx.transactionId ?? i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 p-3.5 rounded-xl bg-white/2 border border-glass-border hover:border-gold/30 hover:bg-gold/4 transition-all group">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color}`}>
                          <TxIcon size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white/90 font-medium truncate">{tx.description ?? tx.desc ?? cfg.label}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted">{tx.createdAt ?? tx.date ?? ''}</span>
                            {(tx.status ?? '').toLowerCase() === 'pending' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Chờ KQ</span>
                            )}
                          </div>
                        </div>
                        <div className={`text-sm font-bold shrink-0 tabular-nums ${isPos ? 'text-emerald-400' : (tx.status ?? '').toLowerCase() === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{Number(amt).toLocaleString()} <span className="text-[10px] font-normal text-muted">coins</span>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-4xl opacity-40 mb-3">💰</div>
                      <div className="text-muted text-sm">Không có giao dịch</div>
                      <div className="mx-auto mt-4 w-24 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent" />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  );
}
