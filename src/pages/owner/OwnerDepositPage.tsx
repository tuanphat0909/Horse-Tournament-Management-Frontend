import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Coins } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getOwnerWalletBalance } from '../../api/ownerService';
import { parseApiError, getCurrentUser } from '../../api/authService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { api } from '../../services/api';

const COINS_PER_USD = 100;
const QUICK_AMTS = [5, 10, 20, 50];

export function OwnerDepositPage() {
  const [balance, setBalance]         = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [usdInput, setUsdInput]       = useState('');
  const [quickAmt, setQuickAmt]       = useState<number | null>(null);
  const [depositLoading, setDepLoading] = useState(false);
  const [depositMsg, setDepMsg]       = useState('');
  const [depositErr, setDepErr]       = useState('');


  const user      = getCurrentUser();
  const isLocked  = (user?.status?.toLowerCase() ?? '') !== 'active';
  const effectiveUsd   = quickAmt ?? (parseFloat(usdInput) || 0);
  const coinsPreview   = effectiveUsd * COINS_PER_USD;

  async function loadBalance() {
    setPageLoading(true);
    try {
      const balData = await getOwnerWalletBalance();
      const bal = balData?.result?.balance ?? balData?.result ?? (typeof balData === 'number' ? balData : 0);
      setBalance(Number(bal) || 0);
    } catch { /* silently fail */ }
    finally { setPageLoading(false); }
  }

  useEffect(() => { loadBalance(); }, []);

  async function handleDeposit() {
    if (effectiveUsd <= 0) return;
    setDepLoading(true); setDepErr(''); setDepMsg('');
    try {
      const vndAmount = effectiveUsd * 25000;
      const res = await api.post('/payments/vnpay/create-deposit', {
        amount: vndAmount,
        orderInfo: `Nap tien vao vi tai khoan owner: $${effectiveUsd}`
      });
      if (res && res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        throw new Error('Không thể khởi tạo liên kết thanh toán VNPay.');
      }
    } catch (err: unknown) {
      setDepErr(parseApiError(err as Error));
      setDepLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="relative flex-1 min-w-0 overflow-y-auto">
        <PageAmbience accent="purple" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Deposit"
            subtitle="Add funds to your wallet to pay for jockey hires and other services"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 5%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold text-[10px] font-bold uppercase tracking-widest">
                <Coins size={10} /> $1 = {COINS_PER_USD} coins
              </div>
            }
          />

          {/* Balance summary */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl p-5 border border-gold/15 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Current Balance</div>
              {pageLoading ? <LoadingSkeleton /> : (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-serif font-bold text-white">{balance.toLocaleString()}</span>
                  <span className="text-base text-gold font-bold mb-0.5">coins</span>
                  <span className="text-sm text-muted ml-1">(${(balance / COINS_PER_USD).toFixed(2)} USD)</span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Coins size={22} className="text-gold" />
            </div>
          </motion.div>

          {/* ── Deposit Form — centred 1-column ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-panel rounded-xl p-8 relative overflow-hidden max-w-2xl mx-auto">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Plus size={16} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-serif text-white">Deposit Funds</h2>
            </div>

            {/* Quick select */}
            <div className="mb-5">
              <div className="text-[11px] text-muted font-bold mb-2.5 uppercase tracking-wider">Quick Select (USD)</div>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_AMTS.map(amt => (
                  <button key={amt}
                    onClick={() => { setQuickAmt(quickAmt === amt ? null : amt); setUsdInput(''); }}
                    disabled={isLocked}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                      isLocked
                        ? 'opacity-40 cursor-not-allowed bg-white/5 border-glass-border text-muted/30'
                        : quickAmt === amt
                        ? 'bg-gold/15 border-gold/40 text-gold shadow-lg shadow-gold/10'
                        : 'bg-white/[0.03] border-glass-border text-muted hover:text-white hover:border-white/20'
                    }`}>
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual input */}
            <div className="mb-5">
              <div className="text-[11px] text-muted font-bold mb-2.5 uppercase tracking-wider">Or Enter Amount</div>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="number" min="1" value={usdInput}
                  disabled={isLocked}
                  onChange={e => { setUsdInput(e.target.value); setQuickAmt(null); }}
                  placeholder="0.00"
                  className={`w-full bg-white/[0.04] border border-glass-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted/50 outline-none focus:border-gold/40 transition-colors ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            {/* Preview */}
            {coinsPreview > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 rounded-xl bg-gold/5 border border-gold/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">You will receive</span>
                  <span className="text-sm font-bold text-gold">{coinsPreview.toLocaleString()} coins</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted">Exchange rate</span>
                  <span className="text-xs text-muted">$1 USD = {COINS_PER_USD} coins</span>
                </div>
              </motion.div>
            )}

            {/* Messages */}
            {depositErr && <div className="mb-4 text-xs text-red-400 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">{depositErr}</div>}
            {depositMsg && <div className="mb-4 text-xs text-emerald-400 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">{depositMsg}</div>}

            {/* Action button */}
            <button
              onClick={handleDeposit}
              disabled={coinsPreview <= 0 || depositLoading || isLocked}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                isLocked
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 cursor-not-allowed'
                  : coinsPreview > 0
                  ? 'btn-gold'
                  : 'bg-white/5 text-muted cursor-not-allowed border border-glass-border'
              }`}
            >
              {isLocked
                ? '🔒 Deposits Disabled'
                : depositLoading
                ? 'Redirecting to VNPay...'
                : coinsPreview > 0
                ? `Deposit $${effectiveUsd} via VNPay`
                : 'Select Amount'}
            </button>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
