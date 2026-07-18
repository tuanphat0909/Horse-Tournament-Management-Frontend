import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, Trophy, History, CheckCircle,
  ArrowUpRight, Coins, Users, TrendingUp,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import {
  getOwnerWalletBalance,
  getOwnerWalletHistory,
} from '../../api/ownerService';
import { parseApiError } from '../../api/authService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';

const COINS_PER_USD = 100;

type TxType = 'deposit' | 'withdraw' | 'prize' | 'jockey' | 'other';

const TX_CONFIG: Record<TxType, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  deposit:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Deposit',           icon: ArrowUpRight },
  withdraw: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       label: 'Withdraw',          icon: ArrowUpRight },
  prize:    { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     label: 'Tournament Prize 🏆', icon: Trophy },
  jockey:   { color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20',   label: 'Jockey Hire',       icon: Users },
  other:    { color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20',     label: 'Other',             icon: Coins },
};

function normalizeType(t: string): TxType {
  const key = (t ?? '').toLowerCase().replace('_', '');
  if (key.includes('deposit')) return 'deposit';
  if (key.includes('withdraw')) return 'withdraw';
  if (key.includes('prize') || key.includes('reward') || key.includes('payout')) return 'prize';
  if (key.includes('jockey') || key.includes('hire') || key.includes('contract')) return 'jockey';
  return 'other';
}

const child  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// 24h limits per role
const OWNER_DAILY_LIMIT = 50_000; // USDT

export function OwnerWalletOverviewPage() {
  const navigate = useNavigate();
  const [balance, setBalance]       = useState(0);
  const [transactions, setTxs]      = useState<any[]>([]);
  const [pageLoading, setLoading]   = useState(true);
  const [pageError, setError]       = useState('');
  const [txFilter, setTxFilter]     = useState<TxType | 'all'>('all');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [balData, histData] = await Promise.all([
        getOwnerWalletBalance(),
        getOwnerWalletHistory(),
      ]);
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

  const prizeTotal  = transactions.filter(t => normalizeType(t.type ?? t.transactionType ?? '') === 'prize').reduce((s, t) => s + (t.amount ?? 0), 0);
  const jockeyTotal = transactions.filter(t => normalizeType(t.type ?? t.transactionType ?? '') === 'jockey').reduce((s, t) => s + Math.abs(t.amount ?? 0), 0);
  const withdrawUsed24h = transactions
    .filter(t => {
      if (normalizeType(t.type ?? t.transactionType ?? '') !== 'withdraw') return false;
      const created = new Date(t.createdAt ?? 0);
      return Date.now() - created.getTime() < 86_400_000;
    })
    .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0);

  const dailyUsedUsd = withdrawUsed24h / COINS_PER_USD;
  const dailyPct     = Math.min((dailyUsedUsd / OWNER_DAILY_LIMIT) * 100, 100);

  const FILTER_TABS: [TxType | 'all', string][] = [
    ['all', 'All'], ['prize', '🏆 Prizes'], ['jockey', '🏇 Jockey Hires'],
    ['deposit', 'Deposit'], ['withdraw', 'Withdraw'],
  ];
  const filtered = txFilter === 'all'
    ? transactions
    : transactions.filter(t => normalizeType(t.type ?? t.transactionType ?? '') === txFilter);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Asset Overview"
            subtitle="Track your balance, tournament prizes, and jockey hire costs"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 5%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                <Coins size={10} /> $1 = {COINS_PER_USD} coins
              </div>
            }
          />

          {pageError && (
            <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{pageError}</div>
          )}

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

            {/* Prize Total */}
            <motion.div variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden border border-amber-500/20">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/15 to-amber-900/20 blur-[30px] opacity-60 pointer-events-none" />
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 relative z-10"><Trophy size={16} /></div>
              <div className="relative z-10 text-xl font-serif font-bold text-amber-400">{pageLoading ? '…' : `+${prizeTotal.toLocaleString()}`}</div>
              <div className="relative z-10 text-[11px] text-muted font-medium mt-1">Total Prize Earned</div>
            </motion.div>

            {/* Jockey Hired */}
            <motion.div variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden border border-purple-500/20">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent pointer-events-none" />
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/15 to-purple-900/20 blur-[30px] opacity-60 pointer-events-none" />
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 relative z-10"><Users size={16} /></div>
              <div className="relative z-10 text-xl font-serif font-bold text-purple-400">{pageLoading ? '…' : `-${jockeyTotal.toLocaleString()}`}</div>
              <div className="relative z-10 text-[11px] text-muted font-medium mt-1">Jockey Hire Costs</div>
            </motion.div>

            {/* Total Txs */}
            <motion.div variants={child} className="glass-panel rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/15 to-emerald-900/20 blur-[30px] opacity-60 pointer-events-none" />
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 relative z-10"><CheckCircle size={16} /></div>
              <div className="relative z-10 text-xl font-serif font-bold text-emerald-400">{pageLoading ? '…' : transactions.length}</div>
              <div className="relative z-10 text-[11px] text-muted font-medium mt-1">Total Transactions</div>
            </motion.div>
          </motion.div>

          {/* ── 24h Withdrawal Limit ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-panel rounded-xl p-5 border border-blue-500/15">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">24-Hour Withdrawal Limit</span>
              </div>
              <button
                onClick={() => navigate('/owner/wallet/withdraw')}
                className="text-[11px] font-bold text-gold hover:text-white transition-colors flex items-center gap-1"
              >
                Withdraw <ArrowUpRight size={11} />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>Used: <span className="text-white font-semibold">${dailyUsedUsd.toLocaleString()}</span></span>
              <span>Limit: <span className="text-white font-semibold">${OWNER_DAILY_LIMIT.toLocaleString()}</span> USDT</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700"
                style={{ width: `${dailyPct}%` }}
              />
            </div>
            <div className="text-[10px] text-muted/60 mt-1.5 text-right">
              Remaining: <span className="text-emerald-400 font-semibold">${(OWNER_DAILY_LIMIT - dailyUsedUsd).toLocaleString()}</span> USDT
            </div>
          </motion.div>

          {/* ── Transaction History ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-[40px] pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3 mb-5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <History size={15} className="text-gold" />
              </div>
              <h2 className="text-base font-serif text-white">Transaction History</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              <div className="flex items-center gap-1 shrink-0 flex-wrap">
                {FILTER_TABS.map(([f, label]) => (
                  <button key={f} onClick={() => setTxFilter(f)}
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
                  const isPrize  = txType === 'prize';
                  const isJockey = txType === 'jockey';

                  return (
                    <motion.div
                      key={tx.id ?? i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all group ${
                        isPrize
                          ? 'bg-amber-500/[0.06] border-amber-500/25 hover:border-amber-400/40 hover:bg-amber-500/10'
                          : isJockey
                          ? 'bg-purple-500/[0.06] border-purple-500/25 hover:border-purple-400/40'
                          : 'bg-white/[0.02] border-glass-border hover:border-gold/30 hover:bg-gold/[0.04]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color}`}>
                        <TxIcon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-sm text-white/90 font-medium truncate">
                            {tx.description ?? cfg.label}
                          </div>
                          {isPrize && (
                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">Prize</span>
                          )}
                          {isJockey && (
                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase tracking-wider">Jockey</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </div>
                      </div>
                      <div className={`text-sm font-bold shrink-0 tabular-nums ${
                        isPrize ? 'text-amber-400' : isPos ? 'text-emerald-400' : 'text-red-400'
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
