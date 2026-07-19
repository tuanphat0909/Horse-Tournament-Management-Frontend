import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, Trophy, 
  Coins, History, ClipboardList, TrendingUp, DollarSign
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { 
  getAdminWalletBalance, 
  getAdminWalletHistory, 
  getDashboardStats 
} from '../../api/adminService';
import { parseApiError } from '../../api/authService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

type TxType = 'deposit' | 'withdraw' | 'reward' | 'other';

const TX_CONFIG: Record<TxType, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  deposit:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Treasury Deposit',  icon: ArrowDownLeft },
  withdraw: { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       label: 'Treasury Withdraw', icon: ArrowUpRight },
  reward:   { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     label: 'House Profit Payout', icon: Trophy },
  other:    { color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20',   label: 'System Transfer',   icon: Coins },
};

function normalizeType(t: string): TxType {
  const key = (t ?? '').toLowerCase().replace('_', '');
  if (key.includes('deposit')) return 'deposit';
  if (key.includes('withdraw')) return 'withdraw';
  if (key.includes('prize') || key.includes('reward') || key.includes('payout') || key.includes('won') || key.includes('bet')) return 'reward';
  return 'other';
}

const child = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export function AdminWalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [txFilter, setTxFilter] = useState<TxType | 'all'>('all');

  async function loadAll() {
    setPageLoading(true);
    setPageError('');
    try {
      const [balData, histData, statsData] = await Promise.all([
        getAdminWalletBalance(),
        getAdminWalletHistory(),
        getDashboardStats()
      ]);
      
      const bal = balData?.result?.balance ?? balData?.result ?? (typeof balData === 'number' ? balData : 0);
      setBalance(Number(bal) || 0);
      setTransactions(histData?.result ?? (Array.isArray(histData) ? histData : []));
      setStats(statsData?.result || null);
    } catch (err: unknown) {
      setPageError(parseApiError(err as Error));
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredTx = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    return normalizeType(tx.type) === txFilter;
  });

  return (
    <div className="flex min-h-screen bg-[#070b13] text-white">
      <PageAmbience />
      <Sidebar />

      <div className="flex-grow flex flex-col min-w-0">
        <Topbar />

        <main className="flex-grow p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-8">
            <PageHero 
              title="Equestria Treasury & Wallet" 
              subtitle="Monitor system revenues, house profits, betting payouts, and administrative wallet balances." 
              imageUrl="/images/hero-admin.jpg"
            />

            {pageError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {pageError}
              </div>
            )}

            {pageLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <LoadingSkeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : (
              <motion.div 
                variants={stagger} 
                initial="hidden" 
                animate="show" 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Admin Wallet Balance Card */}
                <motion.div variants={child} className="glass-panel-elevated rounded-2xl p-6 border border-gold-border/30 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-gold/5 blur-2xl group-hover:bg-gold/10 transition-colors" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-gold tracking-wider uppercase">Treasury Cash Balance</span>
                    <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-gold">
                      <Wallet size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mb-1">
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-muted">Administrative operational liquidity</div>
                </motion.div>

                {/* House Profit Card */}
                <motion.div variants={child} className="glass-panel-elevated rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Total Betting Profits</span>
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mb-1">
                    ${(stats?.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-muted">Betting Volume minus Spectator Payouts</div>
                </motion.div>

                {/* Total betting revenue Card */}
                <motion.div variants={child} className="glass-panel-elevated rounded-2xl p-6 border border-purple-500/20 relative overflow-hidden group">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-purple-500/5 blur-2xl group-hover:bg-purple-500/10 transition-colors" />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-purple-400 tracking-wider uppercase">Total Betting Volume</span>
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mb-1">
                    ${(stats?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-muted">Total sum of placed spectator predictions</div>
                </motion.div>
              </motion.div>
            )}

            {/* Treasury Transactions Ledger */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-gold" />
                  <h3 className="text-sm font-bold text-champagne uppercase tracking-wider">Treasury Ledgers & Logs</h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-white/[0.02] border border-glass-border rounded-xl">
                  {(['all', 'deposit', 'withdraw', 'reward', 'other'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTxFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        txFilter === filter
                          ? 'bg-gold text-rich-black'
                          : 'text-muted hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {pageLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <LoadingSkeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : filteredTx.length > 0 ? (
                <div className="glass-panel border border-glass-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-border/40 bg-white/[0.01] text-[10px] uppercase font-bold text-muted tracking-wider">
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Description / Event</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Settled At</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border/40 text-xs text-white/90">
                        {filteredTx.map((tx) => {
                          const config = TX_CONFIG[normalizeType(tx.type)] || TX_CONFIG.other;
                          const Icon = config.icon;
                          const isNegative = tx.amount < 0 || tx.type?.toLowerCase()?.includes('withdraw');
                          return (
                            <tr key={tx.id || tx.transactionId} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 font-mono text-muted text-[11px]">#{tx.id || tx.transactionId}</td>
                              <td className="px-6 py-4 font-medium max-w-xs truncate">{tx.description || 'System Treasury Operation'}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${config.bg} ${config.color}`}>
                                  <Icon size={10} />
                                  {config.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-muted">
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-US') : '—'}
                              </td>
                              <td className={`px-6 py-4 text-right font-bold font-mono text-sm ${isNegative ? 'text-blue-400' : 'text-emerald-400'}`}>
                                {isNegative ? '-' : '+'}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="glass-panel border border-glass-border rounded-2xl py-12 text-center text-muted">
                  <ClipboardList size={32} className="mx-auto mb-3 opacity-30 text-gold" />
                  <p className="text-sm font-medium">No treasury transaction records found.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
