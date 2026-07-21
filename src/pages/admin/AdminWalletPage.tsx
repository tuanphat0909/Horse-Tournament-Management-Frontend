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
  getDashboardStats,
  depositAdminWallet,
  withdrawAdminWallet
} from '../../api/adminService';
import { parseApiError } from '../../api/authService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pager, paginate } from '../../components/ui/Pager';

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
  const [txPage, setTxPage] = useState(1);

  // Modal States for Deposit / Withdraw
  const [modalType, setModalType] = useState<'deposit' | 'withdraw' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  async function handleActionSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) {
      setActionMessage({ type: 'error', text: 'Please enter a valid amount greater than 0.' });
      return;
    }

    setActionLoading(true);
    setActionMessage(null);
    try {
      if (modalType === 'deposit') {
        await depositAdminWallet(val);
        setActionMessage({ type: 'success', text: `Successfully deposited $${val.toFixed(2)} into Treasury!` });
      } else if (modalType === 'withdraw') {
        await withdrawAdminWallet(val);
        setActionMessage({ type: 'success', text: `Successfully withdrew $${val.toFixed(2)} from Treasury!` });
      }
      setAmountInput('');
      await loadAll();
      setTimeout(() => {
        setModalType(null);
        setActionMessage(null);
      }, 1200);
    } catch (err: unknown) {
      setActionMessage({ type: 'error', text: parseApiError(err as Error) });
    } finally {
      setActionLoading(false);
    }
  }

  const filteredTx = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    return normalizeType(tx.type) === txFilter;
  });

  // Sổ giao dịch có thể rất dài — cắt 10 dòng mỗi trang
  const { paged: pagedTx, page: txSafePage, totalPages: txTotalPages, total: txTotal } = paginate(filteredTx, txPage, 10);

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
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-gold/5 blur-2xl group-hover:bg-gold/10 transition-colors pointer-events-none" />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-xs font-semibold text-gold tracking-wider uppercase">Treasury Cash Balance</span>
                    <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-gold">
                      <Wallet size={18} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight tabular-nums mb-3 relative z-10">
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gold/10 relative z-10">
                    <div className="text-[10px] text-muted">Operational Liquidity</div>
                    <div className="flex items-center gap-1.5 relative z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setModalType('deposit');
                          setAmountInput('');
                          setActionMessage(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none"
                      >
                        <ArrowDownLeft size={12} />
                        Deposit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setModalType('withdraw');
                          setAmountInput('');
                          setActionMessage(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none"
                      >
                        <ArrowUpRight size={12} />
                        Withdraw
                      </button>
                    </div>
                  </div>
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
                      onClick={() => { setTxFilter(filter); setTxPage(1); }}
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
                        {pagedTx.map((tx) => {
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
                  <Pager page={txSafePage} totalPages={txTotalPages} total={txTotal} onChange={setTxPage} />
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

      {/* Deposit / Withdraw Action Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg p-6 rounded-2xl glass-panel-elevated border border-gold-border/40 space-y-5 shadow-2xl relative my-8"
          >
            <div className="flex items-center justify-between border-b border-glass-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${modalType === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                  {modalType === 'deposit' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    {modalType === 'deposit' ? 'Treasury VietQR Deposit' : 'Treasury Withdraw'}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">Official</span>
                  </h3>
                  <p className="text-[11px] text-muted">
                    {modalType === 'deposit' ? 'Scan VietQR code or transfer funds directly to Admin Treasury bank account' : 'Withdraw liquidity from administrative treasury wallet to bank account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-muted hover:text-white transition-colors cursor-pointer text-sm font-bold p-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {actionMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold ${actionMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                {actionMessage.text}
              </div>
            )}

            <form onSubmit={handleActionSubmit} className="space-y-5">
              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-champagne mb-1.5 uppercase tracking-wider flex justify-between">
                  <span>Enter Amount ($ USD)</span>
                  <span className="text-gold font-normal font-mono text-[11px]">
                    ≈ {((parseFloat(amountInput) || 0) * 25000).toLocaleString('vi-VN')} VND
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-rich-black/60 border border-glass-border focus:border-gold/60 text-white font-mono text-sm outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Amount Presets */}
              <div className="flex items-center gap-2">
                {[100, 500, 1000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountInput(preset.toString())}
                    className="flex-1 py-1.5 rounded-lg bg-white/[0.03] hover:bg-gold/15 border border-glass-border/60 hover:border-gold/40 text-xs text-champagne font-mono font-semibold transition-all cursor-pointer"
                  >
                    +${preset}
                  </button>
                ))}
                {modalType === 'withdraw' && balance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountInput(balance.toString())}
                    className="px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 border border-gold/40 text-gold text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    Max (${balance})
                  </button>
                )}
              </div>

              {/* QR Code and Admin Bank Information Block */}
              {modalType === 'deposit' && (
                <div className="space-y-4 pt-2 border-t border-glass-border/40">
                  <div className="bg-white/5 rounded-2xl p-4 border border-gold-border/30 flex flex-col md:flex-row items-center gap-4">
                    {/* VietQR Dynamic Code Image */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div className="p-2.5 bg-white rounded-xl border border-glass-border shadow-lg">
                        <img
                          src={`https://img.vietqr.io/image/vietinbank-888899996666-print.png?amount=${Math.round((parseFloat(amountInput) || 100) * 25000)}&addInfo=DEPOSIT_TREASURY_ADMIN&accountName=EQUESTRIA%20TREASURY%20ADMIN`}
                          alt="VietQR Admin Bank Deposit"
                          className="w-36 h-36 object-contain"
                        />
                      </div>
                      <span className="text-[10px] text-muted italic mt-1.5">Scan VietQR via Mobile Banking</span>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="flex-1 space-y-2 text-xs w-full">
                      <div className="flex items-center justify-between py-1 border-b border-glass-border/30">
                        <span className="text-muted">Bank Name:</span>
                        <span className="text-white font-bold">VietinBank (ICB)</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-glass-border/30">
                        <span className="text-muted">Account Number:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gold font-mono font-bold tracking-wider">888899996666</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('888899996666');
                              setActionMessage({ type: 'success', text: 'Account number copied to clipboard!' });
                            }}
                            className="px-1.5 py-0.5 rounded bg-gold/10 hover:bg-gold/20 text-gold text-[10px] font-bold transition-all cursor-pointer border border-gold/20"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-glass-border/30">
                        <span className="text-muted">Account Name:</span>
                        <span className="text-white font-semibold uppercase">EQUESTRIA TREASURY ADMIN</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-muted">Transfer Memo:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-mono font-bold">DEPOSIT_TREASURY_ADMIN</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('DEPOSIT_TREASURY_ADMIN');
                              setActionMessage({ type: 'success', text: 'Transfer memo copied to clipboard!' });
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all cursor-pointer border border-emerald-500/20"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'withdraw' && (
                <div className="bg-white/5 rounded-2xl p-4 border border-blue-500/30 text-xs space-y-3">
                  <div className="flex items-center justify-between py-1 border-b border-glass-border/30">
                    <span className="text-muted">Available Treasury Balance:</span>
                    <span className="text-gold font-mono font-bold text-sm">
                      ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {balance <= 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold flex items-center gap-1.5">
                      ⚠️ Current treasury balance is $0.00. You cannot withdraw more than the available balance.
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1 border-b border-glass-border/30">
                    <span className="text-muted">Destination Bank:</span>
                    <span className="text-white font-bold">VietinBank (Admin Settlement)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-glass-border/30">
                    <span className="text-muted">Account Number:</span>
                    <span className="text-gold font-mono font-bold">888899996666</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted">Account Holder:</span>
                    <span className="text-white font-semibold">EQUESTRIA TREASURY ADMIN</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-glass-border/40">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-rich-black transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${modalType === 'deposit' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-gold hover:bg-amber-300'} disabled:opacity-50`}
                >
                  {actionLoading ? 'Processing...' : modalType === 'deposit' ? `Confirm Deposit ($${(parseFloat(amountInput) || 0).toLocaleString()})` : `Confirm Withdraw ($${(parseFloat(amountInput) || 0).toLocaleString()})`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
