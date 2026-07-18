import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, History, CheckCircle,
  Clock, ArrowUpRight, Coins, Target,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getBalance, getWalletHistory } from '../../api/spectatorService';
import { parseApiError } from '../../api/authService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';

const COINS_PER_USD = 100;
const SPECTATOR_DAILY_LIMIT = 1_000; // USDT — low tier

type TxType = 'deposit' | 'withdraw' | 'win' | 'loss' | 'bet' | 'event';
const TX_CONFIG: Record<TxType, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  deposit:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Deposit',       icon: Coins },
  withdraw: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       label: 'Withdraw',      icon: ArrowUpRight },
  win:      { color: 'text-gold',        bg: 'bg-gold/10 border-gold/20',               label: 'Won Bet 🎉',    icon: TrendingUp },
  loss:     { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',         label: 'Lost Bet',      icon: TrendingDown },
  bet:      { color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20',   label: 'Place Bet',     icon: Target },
  event:    { color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20',   label: 'Event Reward',  icon: TrendingUp },
};

function normalizeType(t: string): TxType {
  const key = (t ?? '').toLowerCase();
  if (key.includes('withdraw')) return 'withdraw';
  if (key.includes('deposit')) return 'deposit';
  if (key.includes('win') || key.includes('won')) return 'win';
  if (key.includes('loss') || key.includes('lost')) return 'loss';
  if (key.includes('event') || key.includes('reward') || key.includes('prize')) return 'event';
  return 'bet';
}

const child  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export function SpectatorWalletOverviewPage() {
  const navigate = useNavigate();
  const [balance, setBalance]     = useState(0);
  const [transactions, setTxs]    = useState<any[]>([]);
  const [pageLoading, setLoading] = useState(true);
  const [pageError, setError]     = useState('');
  const [txFilter, setFilter]     = useState<TxType | 'all'>('all');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [balData, histData] = await Promise.all([getBalance(), getWalletHistory()]);
      const bal = balData?.result?.balance ?? balData?.result ?? (typeof balData === 'number' ? balData : 0);
      setBalance(Number(bal) || 0);
      setTxs(histData?.result ?? (Array.isArray(histData) ? histData : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  const winTotal   = transactions.filter(t => normalizeType(t.type ?? t.transactionType ?? '') === 'win').reduce((s, t) => s + (t.amount ?? 0), 0);
  const pendingCnt = transactions.filter(t => (t.status ?? '').toLowerCase() === 'pending').length;
  const withdrawUsed24h = transactions
    .filter(t => {
      if (normalizeType(t.type ?? t.transactionType ?? '') !== 'withdraw') return false;
      const created = new Date(t.createdAt ?? 0);
      return Date.now() - created.getTime() < 86_400_000;
    })
    .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0);

  const dailyUsedUsd   = withdrawUsed24h / COINS_PER_USD;
  const dailyPct       = Math.min((dailyUsedUsd / SPECTATOR_DAILY_LIMIT) * 100, 100);

  const FILTER_TABS: [TxType | 'all', string][] = [
    ['all', 'All'], ['win', '🏆 Wins'], ['loss', 'Losses'],
    ['bet', 'Bets'], ['event', 'Events'], ['deposit', 'Deposit'], ['withdraw', 'Withdraw'],
  ];
  const filtered = txFilter === 'all' ? transactions : transactions.filter(t => normalizeType(t.type ?? t.transactionType ?? '') === txFilter);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Asset Overview"
            subtitle="Track your balance, betting results, and event rewards"
            imageUrl="/images/hero-spectator.jpg"
            imagePosition="center 50%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                <Coins size={10} /> $1 = {COINS_PER_USD} coins
              </div>
            }
          />

          {pageError && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{pageError}</div>}

          {/* ── Stats Row ── */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-4 gap-4">
            {/* Balance */}
            <motion.div variants={child} className="col-span-1 glass-panel rounded-2xl p-6 relative overflow-hidden border border-gold/15">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-gradient-to-br from-gold/20 to-amber-900/10 blur-[40px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Wallet size={18} className="text-gold" />
                  </div>
                  <div className="text-[10px] text-muted uppercase tracking-widest font-bold">Available Balance</div>
                </div>
                {pageLoading ? <LoadingSkeleton /> : (
                  <>
                    <div className="flex items-end gap-3 mb-1">
                      <span className="text-4xl font-serif font-bold text-white">{balance.toLocaleString()}</span>
                      <span className="text-lg text-gold font-bold mb-1">coins</span>
                    </div>
                    <div className="text-sm text-muted">${(balance / COINS_PER_USD).toFixed(2)} USD</div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Win total */}
            <motion.div variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden border border-gold/20">
              <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-3 relative z-10"><TrendingUp size={16} /></div>
              <div className="relative z-10 text-xl font-serif font-bold text-gold">{pageLoading ? '…' : `+${winTotal.toLocaleString()}`}</div>
              <div className="relative z-10 text-[11px] text-muted font-medium mt-1">Total Bet Winnings</div>
            </motion.div>

            {/* Pending */}
            <motion.div variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden border border-yellow-500/20">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-3 relative z-10"><Clock size={16} /></div>
              <div className="relative z-10 text-xl font-serif font-bold text-yellow-400">{pageLoading ? '…' : pendingCnt}</div>
              <div className="relative z-10 text-[11px] text-muted font-medium mt-1">Pending Bets</div>
            </motion.div>

            {/* Total Txs */}
            <motion.div variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 relative z-10"><CheckCircle size={16} /></div>
              <div className="relative z-10 text-xl font-serif font-bold text-emerald-400">{pageLoading ? '…' : transactions.length}</div>
              <div className="relative z-10 text-[11px] text-muted font-medium mt-1">Total Transactions</div>
            </motion.div>
          </motion.div>

          {/* ── 24h Withdrawal Limit (low tier) ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-panel rounded-xl p-5 border border-yellow-500/15">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-yellow-400" />
                <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">24-Hour Withdrawal Limit (Spectator)</span>
              </div>
              <button onClick={() => navigate('/spectator/wallet/withdraw')}
                className="text-[11px] font-bold text-gold hover:text-white transition-colors flex items-center gap-1">
                Withdraw <ArrowUpRight size={11} />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>Used: <span className="text-white font-semibold">${dailyUsedUsd.toLocaleString()}</span></span>
              <span>Limit: <span className="text-white font-semibold">${SPECTATOR_DAILY_LIMIT.toLocaleString()}</span> USDT</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-700"
                style={{ width: `${dailyPct}%` }} />
            </div>
            <div className="text-[10px] text-muted/60 mt-1.5 text-right">
              Remaining: <span className="text-emerald-400 font-semibold">${(SPECTATOR_DAILY_LIMIT - dailyUsedUsd).toLocaleString()}</span> USDT
            </div>
          </motion.div>

          {/* ── Transaction History ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3 mb-5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><History size={15} className="text-gold" /></div>
              <h2 className="text-base font-serif text-white">Transaction History</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              <div className="flex items-center gap-1 shrink-0 flex-wrap">
                {FILTER_TABS.map(([f, label]) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${txFilter === f ? 'bg-gold/15 text-gold border border-gold/30' : 'text-muted hover:text-white'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {pageLoading ? <LoadingSkeleton /> : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filtered.map((tx, i) => {
                  const txType = normalizeType(tx.type ?? tx.transactionType ?? '');
                  const cfg    = TX_CONFIG[txType];
                  const TxIcon = cfg.icon;
                  const amt    = tx.amount ?? tx.coins ?? 0;
                  const isPos  = amt > 0;
                  const isPending = (tx.status ?? '').toLowerCase() === 'pending';

                  return (
                    <motion.div key={tx.id ?? i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color}`}>
                        <TxIcon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/90 font-medium truncate">{tx.description ?? cfg.label}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                          </span>
                          {isPending && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Pending</span>
                          )}
                        </div>
                      </div>
                      <div className={`text-sm font-bold shrink-0 tabular-nums ${
                        isPending ? 'text-yellow-400' : isPos ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isPos ? '+' : ''}{Number(amt).toLocaleString()} <span className="text-[10px] font-normal text-muted">coins</span>
                      </div>
                    </motion.div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-center py-14">
                    <div className="text-4xl opacity-40 mb-3">💰</div>
                    <div className="text-muted text-sm">No transactions</div>
                    <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  </div>
                )}
              </div>
            )}
          </motion.div>

        </main>
      </div>
    </div>
  );
}
