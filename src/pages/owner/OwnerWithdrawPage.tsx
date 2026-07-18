import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight, ChevronDown, AlertCircle, Wallet,
  CheckCircle2, Building2, User, DollarSign, Crown,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getOwnerWalletBalance, ownerWithdrawOnChain } from '../../api/ownerService';
import { parseApiError } from '../../api/authService';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

// ── Constants ─────────────────────────────────────────────────────
const COINS_PER_USD  = 100;
const BANK_FEE_FLAT  = 1;      // $1 flat fee per transaction
const MIN_WITHDRAW   = 10;     // USD — Owner minimum
const DAILY_LIMIT    = 5_000;  // USD — Owner tier (high)
const QUICK_AMOUNTS  = [50, 100, 500, 1_000];

// ── Vietnamese banks with logo placeholder colours ─────────────────
const BANKS = [
  { id: 'vcb',   name: 'Vietcombank',         short: 'VCB',  color: '#007b3e' },
  { id: 'tcb',   name: 'Techcombank',          short: 'TCB',  color: '#cc0000' },
  { id: 'bidv',  name: 'BIDV',                 short: 'BIDV', color: '#1c4f9c' },
  { id: 'agb',   name: 'Agribank',             short: 'AGB',  color: '#008000' },
  { id: 'acb',   name: 'ACB',                  short: 'ACB',  color: '#003087' },
  { id: 'mb',    name: 'MB Bank',              short: 'MB',   color: '#7b2d8b' },
  { id: 'vpb',   name: 'VPBank',               short: 'VPB',  color: '#00813e' },
  { id: 'stb',   name: 'Sacombank',            short: 'STB',  color: '#005bac' },
  { id: 'tpb',   name: 'TPBank',               short: 'TPB',  color: '#00a0e9' },
  { id: 'ocb',   name: 'OCB',                  short: 'OCB',  color: '#f37021' },
];

// ── Remove Vietnamese diacritics and uppercase ────────────────────
function toUppercaseNoDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase();
}

// ── Account number validation: 6-20 digits ────────────────────────
function isValidAccountNumber(acc: string): boolean {
  return /^\d{6,20}$/.test(acc.trim());
}

export function OwnerWithdrawPage() {
  // ── Page state ──────────────────────────────────────────────────
  const [balance, setBalance]         = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  // ── Form state ──────────────────────────────────────────────────
  const [bank, setBank]               = useState(BANKS[0]);
  const [bankOpen, setBankOpen]       = useState(false);
  const [accountNo, setAccountNo]     = useState('');
  const [holderName, setHolderName]   = useState('');
  const [amount, setAmount]           = useState('');

  // ── Submit state ────────────────────────────────────────────────
  const [loading, setLoading]         = useState(false);
  const [successMsg, setSuccess]      = useState('');
  const [errorMsg, setError]          = useState('');

  // ── 24h used (replace with real API call) ───────────────────────
  const [dailyUsed] = useState(0);

  const bankRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) setBankOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function loadBalance() {
    setPageLoading(true);
    try {
      const balData = await getOwnerWalletBalance();
      const bal = balData?.result?.balance ?? balData?.result ?? (typeof balData === 'number' ? balData : 0);
      setBalance(Number(bal) || 0);
    } catch { /* silent */ }
    finally { setPageLoading(false); }
  }

  useEffect(() => { loadBalance(); }, []);

  // ── Derived values ───────────────────────────────────────────────
  const amtNum         = parseFloat(amount) || 0;
  const availableUsd   = balance / COINS_PER_USD;
  const dailyRemaining = DAILY_LIMIT - dailyUsed;
  const netAmount      = Math.max(0, amtNum - BANK_FEE_FLAT);

  // ── Validation ───────────────────────────────────────────────────
  const accError   = accountNo.length > 0 && !isValidAccountNumber(accountNo);
  const amtTooLow  = amtNum > 0 && amtNum < MIN_WITHDRAW;
  const amtOverBal = amtNum > availableUsd;
  const amtOverLim = amtNum > dailyRemaining;

  const isValid =
    isValidAccountNumber(accountNo) &&
    holderName.trim().length >= 2  &&
    amtNum >= MIN_WITHDRAW         &&
    amtNum <= availableUsd         &&
    amtNum <= dailyRemaining;

  const btnDisabled = !isValid || loading;

  async function handleWithdraw() {
    if (!isValid) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await ownerWithdrawOnChain({
        asset: 'USD',
        network: 'BANK',
        toAddress: `${bank.id}|${accountNo.trim()}|${holderName.trim()}`,
        amount: amtNum,
      });
      setSuccess(
        `Withdrawal request submitted! $${netAmount.toFixed(2)} USD will be credited to ${bank.name} account ending …${accountNo.slice(-4)}.`
      );
      setAmount('');
      setAccountNo('');
      setHolderName('');
      loadBalance();
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(''); setError(''); }, 8000);
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
            title="Withdraw"
            subtitle="Withdraw funds from your Horse Owner wallet to a Vietnamese bank account"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 5%"
            badge={
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[10px] font-bold uppercase tracking-widest">
                <Crown size={10} /> Owner tier — Daily limit ${DAILY_LIMIT.toLocaleString()}
              </div>
            }
          />

          {/* ── Balance pill ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl p-5 border border-gold/15 flex items-center justify-between max-w-2xl mx-auto">
            <div>
              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Available Balance</div>
              {pageLoading ? <LoadingSkeleton /> : (
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-serif font-bold text-white">{balance.toLocaleString()}</span>
                  <span className="text-base text-gold font-bold mb-0.5">coins</span>
                  <span className="text-sm text-muted ml-1">(${availableUsd.toFixed(2)} USD)</span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Wallet size={22} className="text-gold" />
            </div>
          </motion.div>

          {/* ════════════ BANK WITHDRAWAL FORM ════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-8 relative overflow-hidden max-w-2xl mx-auto"
          >
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/8 to-transparent blur-[40px] pointer-events-none" />

            {/* Form header */}
            <div className="relative z-10 flex items-center gap-3 mb-7">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Building2 size={16} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-serif text-white font-bold">Bank Withdrawal</h2>
                <p className="text-[11px] text-muted mt-0.5">Funds will be sent to your Vietnamese bank account within 1–3 business days</p>
              </div>
            </div>

            <div className="space-y-5 relative z-10">

              {/* ── 1. Bank selector ─────────────────────────────── */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Beneficiary Bank
                </label>
                <div className="relative" ref={bankRef}>
                  <button
                    onClick={() => setBankOpen(p => !p)}
                    className="w-full flex items-center justify-between bg-white/[0.04] border border-glass-border rounded-xl px-4 py-3 text-sm text-white hover:border-blue-400/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold shrink-0"
                        style={{ backgroundColor: bank.color + '33', border: `1px solid ${bank.color}55` }}
                      >
                        <span style={{ color: bank.color }}>{bank.short}</span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white text-sm">{bank.name}</div>
                        <div className="text-[10px] text-muted">{bank.short}</div>
                      </div>
                    </div>
                    <ChevronDown size={15} className={`text-muted transition-transform ${bankOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {bankOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="absolute top-full mt-1.5 left-0 right-0 z-50 glass-panel-elevated rounded-xl border border-glass-border overflow-hidden shadow-2xl max-h-64 overflow-y-auto"
                      >
                        {BANKS.map(b => (
                          <button
                            key={b.id}
                            onClick={() => { setBank(b); setBankOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors ${bank.id === b.id ? 'text-blue-300' : 'text-muted'}`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-extrabold shrink-0"
                              style={{ backgroundColor: b.color + '33', border: `1px solid ${b.color}55` }}
                            >
                              <span style={{ color: b.color }}>{b.short}</span>
                            </div>
                            <div className="text-left flex-1">
                              <div className="text-sm font-semibold text-white">{b.name}</div>
                              <div className="text-[10px] text-muted/70">{b.short}</div>
                            </div>
                            {bank.id === b.id && <CheckCircle2 size={14} className="shrink-0 text-blue-400" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* ── 2. Account number ─────────────────────────────── */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Bank Account Number
                </label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={accountNo}
                    onChange={e => setAccountNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter digits only (6–20 digits)"
                    maxLength={20}
                    className={`w-full bg-white/[0.04] border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted/40 outline-none transition-colors ${
                      accError
                        ? 'border-red-500/50 focus:border-red-400/60'
                        : accountNo && isValidAccountNumber(accountNo)
                        ? 'border-emerald-500/40 focus:border-emerald-400/60'
                        : 'border-glass-border focus:border-blue-400/40'
                    }`}
                  />
                  {accountNo && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValidAccountNumber(accountNo)
                        ? <CheckCircle2 size={14} className="text-emerald-400" />
                        : <AlertCircle size={14} className="text-red-400" />}
                    </div>
                  )}
                </div>
                {accError && (
                  <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle size={10} /> Account number must be 6–20 digits
                  </p>
                )}
              </div>

              {/* ── 3. Account holder name ────────────────────────── */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Account Holder Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={holderName}
                    onChange={e => setHolderName(toUppercaseNoDiacritics(e.target.value))}
                    placeholder="Name auto-converts to UPPERCASE (no diacritics)"
                    className="w-full bg-white/[0.04] border border-glass-border rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted/40 outline-none focus:border-blue-400/40 transition-colors tracking-wide font-mono"
                  />
                </div>
                {holderName && (
                  <p className="mt-1.5 text-[10px] text-muted/60 font-mono">Preview: {holderName}</p>
                )}
              </div>

              {/* ── 4. Amount ────────────────────────────────────── */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Withdrawal Amount (USD)
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="number"
                    value={amount}
                    min={MIN_WITHDRAW}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={`Minimum: $${MIN_WITHDRAW}`}
                    className={`w-full bg-white/[0.04] border rounded-xl pl-9 pr-20 py-3 text-sm text-white placeholder:text-muted/40 outline-none transition-colors ${
                      (amtTooLow || amtOverBal || amtOverLim)
                        ? 'border-red-500/40 focus:border-red-400/50'
                        : 'border-glass-border focus:border-blue-400/40'
                    }`}
                  />
                  <button
                    onClick={() => setAmount(Math.min(availableUsd, dailyRemaining).toFixed(2))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.06] border border-blue-500/30"
                  >
                    All
                  </button>
                </div>

                {/* Quick amount chips */}
                <div className="grid grid-cols-4 gap-2 mt-2.5">
                  {QUICK_AMOUNTS.map(q => (
                    <button
                      key={q}
                      onClick={() => setAmount(String(q))}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        parseFloat(amount) === q
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-white/[0.03] border-glass-border text-muted hover:text-white hover:border-white/20'
                      }`}
                    >
                      ${q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── 5. Dynamic metrics log ───────────────────────── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-white/[0.025] rounded-xl border border-glass-border">
                  <div className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Available Balance</div>
                  {pageLoading
                    ? <div className="h-4 bg-white/10 rounded animate-pulse w-24" />
                    : <div className="text-sm font-bold text-white">${availableUsd.toFixed(2)}</div>
                  }
                </div>
                <div className="p-3.5 bg-white/[0.025] rounded-xl border border-glass-border">
                  <div className="text-[10px] text-muted uppercase tracking-wider mb-1.5">24h Limit Remaining</div>
                  <div className="text-sm font-bold text-blue-400">
                    ${(dailyRemaining).toLocaleString()} / ${DAILY_LIMIT.toLocaleString()}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400/60 rounded-full transition-all"
                      style={{ width: `${Math.min((dailyUsed / DAILY_LIMIT) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ── 6. Summary block ─────────────────────────────── */}
              <AnimatePresence>
                {amtNum > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                    className="p-4 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Withdrawal amount</span>
                      <span className="font-semibold text-white">${amtNum.toFixed(2)} USD</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Bank transaction fee</span>
                      <span className="font-semibold text-amber-400">− ${BANK_FEE_FLAT.toFixed(2)} USD</span>
                    </div>
                    <div className="h-px bg-glass-border" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted font-bold">You will receive</span>
                      <span className="font-extrabold text-emerald-400 text-base">${netAmount.toFixed(2)} USD</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Validation hints ──────────────────────────────── */}
              <AnimatePresence>
                {amtTooLow && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[11px] text-red-400 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertCircle size={12} /> Minimum withdrawal is ${MIN_WITHDRAW}
                  </motion.div>
                )}
                {amtOverBal && !amtTooLow && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[11px] text-red-400 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertCircle size={12} /> Amount exceeds available balance (${availableUsd.toFixed(2)})
                  </motion.div>
                )}
                {amtOverLim && !amtOverBal && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-[11px] text-amber-400 px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <AlertCircle size={12} /> Exceeds 24h limit of ${DAILY_LIMIT.toLocaleString()} for Owner accounts
                  </motion.div>
                )}
              </AnimatePresence>

              {errorMsg && (
                <div className="text-xs text-red-400 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="flex items-start gap-2.5 text-xs text-emerald-400 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ── CTA button ───────────────────────────────────── */}
              <button
                onClick={handleWithdraw}
                disabled={btnDisabled}
                className={`w-full py-4 rounded-xl text-sm font-extrabold tracking-wide transition-all flex items-center justify-center gap-2 ${
                  btnDisabled
                    ? 'bg-white/[0.04] border border-glass-border text-muted/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                }`}
              >
                {loading
                  ? 'Processing withdrawal…'
                  : btnDisabled && !loading
                  ? 'Complete all fields to continue'
                  : <><ArrowUpRight size={16} /> Confirm Withdrawal{amtNum > 0 ? ` — $${amtNum.toFixed(2)}` : ''}</>}
              </button>

              <p className="text-[10px] text-center text-muted/50 leading-relaxed">
                Bank transfers are processed within 1–3 business days. A flat fee of ${BANK_FEE_FLAT} applies per transaction.
              </p>
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
