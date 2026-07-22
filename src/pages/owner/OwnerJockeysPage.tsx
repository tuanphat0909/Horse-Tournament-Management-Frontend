import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Clock, Users, Calendar, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getMyProposals, createJockeyContract, getMyHorses, cancelJockeyContract, getMyRegistrations, checkJockeyBusy, checkHorseBusy, getBusyJockeysForTournament } from '../../api/ownerService';
import { getJockeyRankings, getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { inviteJockeySchema } from '../../constants/validationSchemas';
import { getFirstYupMessage } from '../../utils/formValidation';
import { formatUtcDateTime } from '../../utils/format';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { useNotifications } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const STATUS_CFG: Record<string, { label: string; color: string; Icon: typeof Clock }> = {
  Active:   { label: 'Confirmed',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle },
  active:   { label: 'Confirmed',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle },
  Accepted: { label: 'Confirmed',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle },
  accepted: { label: 'Confirmed',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Icon: CheckCircle },
  Pending:  { label: 'Awaiting Response', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  Icon: Clock },
  pending:  { label: 'Awaiting Response', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',  Icon: Clock },
  Rejected: { label: 'Decline',      color: 'text-red-400 bg-red-500/10 border-red-500/20',            Icon: XCircle },
  rejected: { label: 'Decline',      color: 'text-red-400 bg-red-500/10 border-red-500/20',            Icon: XCircle },
  Cancelled: { label: 'Cancelled',      color: 'text-muted bg-white/5 border-glass-border',               Icon: XCircle },
  cancelled: { label: 'Cancelled',      color: 'text-muted bg-white/5 border-glass-border',               Icon: XCircle },
  Expired:  { label: 'Expired',      color: 'text-red-400 bg-red-500/10 border-red-500/20',            Icon: XCircle },
  expired:  { label: 'Expired',      color: 'text-red-400 bg-red-500/10 border-red-500/20',            Icon: XCircle },
};
const DEFAULT_CFG = { label: 'Unknown', color: 'text-muted bg-white/5 border-glass-border', Icon: Clock };

const INIT_FORM = { horseId: '', tournamentId: '', jockeyId: '', startDate: '', endDate: '', expirationHours: '24' };
const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

type ContractFilter = 'all' | 'pending' | 'accepted' | 'rejected' | 'expired';
const CONTRACT_FILTER_LABELS: Record<ContractFilter, string> = {
  all: 'All', pending: 'Awaiting Response', accepted: 'Confirmed', rejected: 'Decline', expired: 'Expired',
};
// Gom status thô của BE về nhóm filter
function contractBucket(status: string): ContractFilter {
  const s = (status ?? '').toLowerCase();
  if (s === 'active' || s === 'accepted') return 'accepted';
  if (s === 'rejected' || s === 'declined') return 'rejected';
  if (s === 'expired' || s === 'cancelled') return 'expired';
  return 'pending';
}

export function OwnerJockeysPage() {
  const confirm = useConfirm();
  const { notifications, showToast } = useNotifications();
  const searchParams = new URLSearchParams(window.location.search);
  const prefillApplied = useRef(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [jockeys, setJockeys] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractFilter, setContractFilter] = useState<ContractFilter>('all');
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [busyJockeyIds, setBusyJockeyIds] = useState<number[]>([]);
  const [loadingBusyJockeys, setLoadingBusyJockeys] = useState(false);

  function handleTournamentSelect(tId: string) {
    const selected = tournaments.find((t: any) => String(t.tournamentId) === String(tId));

    let defaultExp = '24';
    if (selected && selected.registrationEndDate) {
      const regEnd = new Date(selected.registrationEndDate);
      const remainingMs = regEnd.getTime() - Date.now();
      const remainingHours = Math.max(0.1, remainingMs / (1000 * 60 * 60));
      if (remainingHours < 24) {
        defaultExp = String(remainingHours);
      }
    }

    setForm(p => ({
      ...p,
      tournamentId: tId,
      horseId: p.tournamentId === tId ? p.horseId : '',
      jockeyId: p.tournamentId === tId ? p.jockeyId : '',
      startDate: selected ? toDateInputValue(selected.startDate) : '',
      endDate: selected ? toDateInputValue(selected.endDate) : '',
      expirationHours: defaultExp
    }));

    if (tId) {
      setLoadingBusyJockeys(true);
      getBusyJockeysForTournament(Number(tId))
        .then((res: any) => {
          const ids = res?.busyJockeyIds ?? res?.result?.busyJockeyIds ?? [];
          setBusyJockeyIds(ids.map((id: any) => Number(id)));
        })
        .catch(() => setBusyJockeyIds([]))
        .finally(() => setLoadingBusyJockeys(false));
    } else {
      setBusyJockeyIds([]);
    }
  }

  async function load(silent = false) {
    if (!silent) setLoading(true); 
    setError('');
    try {
      const [propData, horseData, jockeyData, tournamentData, regData] = await Promise.all([
        getMyProposals(),
        getMyHorses(),
        getJockeyRankings(),
        getTournaments(),
        getMyRegistrations().catch(() => ({ result: [] })),
      ]);
      setProposals(propData?.result ?? (Array.isArray(propData) ? propData : []));
      setHorses(horseData?.result ?? (Array.isArray(horseData) ? horseData : []));
      const fetchedJockeys = jockeyData?.result ?? (Array.isArray(jockeyData) ? jockeyData : []);
      setJockeys(fetchedJockeys.map((j: any) => ({
        ...j,
        jockeyProfileId: j.jockeyId ?? j.JockeyId ?? j.id,
        userId: j.userId ?? j.UserId,
        fullName: j.fullName ?? j.FullName ?? j.name,
        email: j.email ?? j.Email,
      })));
      setTournaments(tournamentData?.result ?? (Array.isArray(tournamentData) ? tournamentData : []));
      setRegistrations(regData?.result ?? (Array.isArray(regData) ? regData : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Auto-open invite modal when navigated from OwnerRegistrationsPage with query params
  useEffect(() => {
    if (prefillApplied.current || loading) return;
    const horseId = searchParams.get('horseId');
    const tournamentId = searchParams.get('tournamentId');
    if (horseId && tournamentId) {
      prefillApplied.current = true;
      setIsPrefilled(true);
      // Find the tournament to auto-fill dates
      const t = tournaments.find((t: any) => String(t.tournamentId) === String(tournamentId));
      setForm(prev => ({
        ...prev,
        horseId,
        tournamentId,
        startDate: t ? toDateInputValue(t.startDate) : '',
        endDate: t ? toDateInputValue(t.endDate) : '',
      }));
      if (tournamentId) {
        setLoadingBusyJockeys(true);
        getBusyJockeysForTournament(Number(tournamentId))
          .then((res: any) => {
            const ids = res?.busyJockeyIds ?? res?.result?.busyJockeyIds ?? [];
            setBusyJockeyIds(ids.map((id: any) => Number(id)));
          })
          .catch(() => setBusyJockeyIds([]))
          .finally(() => setLoadingBusyJockeys(false));
      }
      setShowInvite(true);
      // Clear query params from URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [loading, tournaments]);


  // Auto-refresh list silently in the background when a new notification arrives (e.g. Jockey accepted/cancelled)
  useEffect(() => {
    if (notifications.length > 0) {
      load(true);
    }
  }, [notifications]);

  async function handleInvite() {
    setSubmitError(''); setSubmitSuccess('');
    // Yup lo phần bắt buộc nhập; các luật phụ thuộc dữ liệu giải (khoảng ngày,
    // hạn phản hồi so với thời điểm đóng đăng ký) vẫn kiểm tra bên dưới.
    try {
      await inviteJockeySchema.validate(
        { horseId: form.horseId, jockeyId: form.jockeyId, tournamentId: form.tournamentId, expiryHours: form.expirationHours },
        { abortEarly: false },
      );
      if (!form.startDate || !form.endDate) throw new Error('missing-dates');
    } catch (validationError) {
      setSubmitError(getFirstYupMessage(validationError, 'Please fill in all information.'));
      return;
    }
    const selectedTournament = tournaments.find((t: any) => String(t.tournamentId) === String(form.tournamentId));
    if (selectedTournament?.startDate && selectedTournament?.endDate) {
      const start = new Date(`${form.startDate}T00:00:00`);
      const end = new Date(`${form.endDate}T00:00:00`);
      const tournamentStart = new Date(selectedTournament.startDate);
      const tournamentEnd = new Date(selectedTournament.endDate);
      tournamentStart.setHours(0, 0, 0, 0);
      tournamentEnd.setHours(0, 0, 0, 0);

      if (start < tournamentStart || end > tournamentEnd) {
        setSubmitError(
          `Rental dates must be within tournament period: ${tournamentStart.toLocaleDateString('vi-VN')} - ${tournamentEnd.toLocaleDateString('vi-VN')}.`
        );
        return;
      }
    }

    if (selectedTournament?.registrationEndDate) {
      const regEnd = new Date(selectedTournament.registrationEndDate);
      const remainingMs = regEnd.getTime() - Date.now();
      const remainingHours = remainingMs / (1000 * 60 * 60);

      const inputHours = Number(form.expirationHours);
      if (Number.isNaN(inputHours) || inputHours <= 0) {
        setSubmitError('Response deadline must be a number greater than 0.');
        return;
      }

      if (inputHours > remainingHours) {
        if (remainingHours <= 0) {
          setSubmitError('Registration for this tournament has already closed.');
        } else {
          const wholeHours = Math.floor(remainingHours);
          if (wholeHours >= 1) {
            setSubmitError(`Response deadline cannot exceed registration close time (max ${wholeHours} hours remaining).`);
          } else {
            const remainingMinutes = Math.max(1, Math.floor(remainingMs / (1000 * 60)));
            setSubmitError(`Response deadline cannot exceed registration close time (max ${remainingMinutes} minutes remaining).`);
          }
        }
        return;
      }
    }

    setSubmitLoading(true);
    try {
      const expirationDate = new Date(Date.now() + Number(form.expirationHours) * 60 * 60 * 1000).toISOString();
      await createJockeyContract({
        horseId: Number(form.horseId),
        tournamentId: Number(form.tournamentId),
        jockeyId: Number(form.jockeyId),
        startDate: form.startDate,
        endDate: form.endDate,
        invitationExpiredAt: expirationDate,
      });
      closeInvite();
      showToast('Success', 'Jockey invitation sent successfully!', 'success');
      load();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleCancelInvite(contractId: number) {
    const ok = await confirm({
      title: 'Cancel invitation',
      message: 'Cancel this Jockey invitation?',
      confirmText: 'Cancel invitation',
      cancelText: 'Keep',
      danger: true,
    });
    if (!ok) return;

    try {
      await cancelJockeyContract(contractId);
      await load();
    } catch (err: unknown) {
      showToast('Error', parseApiError(err as Error), 'error');
    }
  }

  const [jockeyBusyError, setJockeyBusyError] = useState('');
  const [horseBusyError, setHorseBusyError] = useState('');

  useEffect(() => {
    if (form.jockeyId && form.tournamentId) {
      setJockeyBusyError('');
      checkJockeyBusy(Number(form.jockeyId), Number(form.tournamentId))
        .then((res: any) => {
          if (res?.result?.isBusy || res?.isBusy) {
            setJockeyBusyError('This jockey is already contracted to another horse in this tournament.');
          }
        })
        .catch(() => {
          setJockeyBusyError('');
        });
    } else {
      setJockeyBusyError('');
    }
  }, [form.jockeyId, form.tournamentId]);

  useEffect(() => {
    if (form.horseId && form.tournamentId) {
      setHorseBusyError('');
      checkHorseBusy(Number(form.horseId), Number(form.tournamentId))
        .then((res: any) => {
          if (res?.result?.isBusy || res?.isBusy) {
            setHorseBusyError('This horse already has a pending or active contract in this tournament.');
          }
        })
        .catch(() => {
          setHorseBusyError('');
        });
    } else {
      setHorseBusyError('');
    }
  }, [form.horseId, form.tournamentId]);

  function closeInvite() {
    setShowInvite(false);
    setSubmitError(''); setSubmitSuccess('');
    setJockeyBusyError('');
    setHorseBusyError('');
    setIsPrefilled(false);
    setBusyJockeyIds([]);
    setForm(INIT_FORM);
  }

  const filterCounts: Record<ContractFilter, number> = {
    all: proposals.length,
    pending: proposals.filter(p => contractBucket(p.status) === 'pending').length,
    accepted: proposals.filter(p => contractBucket(p.status) === 'accepted').length,
    rejected: proposals.filter(p => contractBucket(p.status) === 'rejected').length,
    expired: proposals.filter(p => contractBucket(p.status) === 'expired').length,
  };

  const visibleProposals = proposals.filter(p => {
    if (contractFilter !== 'all' && contractBucket(p.status) !== contractFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.jockeyName ?? '').toLowerCase().includes(q)
      || (p.horseName ?? '').toLowerCase().includes(q);
  });

  const selectedInviteTournament = tournaments.find((t: any) => String(t.tournamentId) === String(form.tournamentId));

  const filteredHorsesForSelect = form.tournamentId
    ? horses.filter((h: any) => {
        const reg = registrations.find((r: any) => 
          String(r.horseId) === String(h.id) && 
          String(r.tournamentId) === String(form.tournamentId)
        );

        if (!reg) return false;

        const regStatus = (reg.status ?? '').toLowerCase();
        // Must be strictly 'pending' (passed vet check, awaiting jockey/admin)
        if (regStatus !== 'pending') return false;

        // Must not already have a jockey assigned in registration
        if (reg.jockeyId || reg.jockeyName) return false;

        // Must not have an active, accepted, or pending contract in proposals
        const hasContract = proposals.some((p: any) => 
          String(p.horseId) === String(h.id) && 
          String(p.tournamentId) === String(form.tournamentId) &&
          ['pending', 'accepted', 'active'].includes((p.status ?? '').toLowerCase())
        );

        if (hasContract) return false;

        return true;
      })
    : [];


  const filteredJockeysForSelect = form.tournamentId
    ? jockeys.filter((j: any) => {
        const jId = Number(j.userId ?? j.jockeyProfileId ?? j.id);
        return !busyJockeyIds.includes(jId);
      })
    : jockeys;


  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Jockey"
            subtitle="Manage jockey contracts"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 5%"
            actions={
              <button onClick={() => setShowInvite(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Invite Jockey
              </button>
            }
          />

          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'pending', 'accepted', 'rejected', 'expired'] as ContractFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setContractFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  contractFilter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {CONTRACT_FILTER_LABELS[s]}
                <span className="ml-2 text-[11px] font-bold text-current opacity-60">{filterCounts[s]}</span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-56">
              <Search size={14} className="text-muted shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search jockey, horse..."
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Users size={15} className="text-gold" />
              </div>
              <h2 className="text-base font-medium font-serif text-white whitespace-nowrap">Contract List</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <div className="space-y-3">
                {visibleProposals.map((p, i) => {
                  const cfg = STATUS_CFG[p.status] ?? DEFAULT_CFG;
                  const { Icon } = cfg;
                  return (
                    <motion.div key={p.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="glass-panel rounded-xl p-5 flex items-center gap-5 border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                      <div className="relative z-10 w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                      <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/20 ring-1 ring-gold/30 flex items-center justify-center font-serif font-bold text-blue-300 text-lg shrink-0">
                        {(p.jockeyName ?? 'J')[0]}
                      </div>
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="text-base font-serif text-white mb-1 group-hover:text-champagne transition-colors">{p.jockeyName ?? `Jockey #${p.jockeyId}`}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-champagne">🐴 {p.horseName ?? `Horse #${p.horseId}`}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-emerald-400">🏆 {p.tournamentName ?? `Tournament #${p.tournamentId}`}</span>
                          {p.startDate && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted inline-flex items-center gap-1"><Calendar size={9} className="text-gold/60" /> From: {formatDate(p.startDate)}</span>}
                          {p.endDate && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted inline-flex items-center gap-1"><Calendar size={9} className="text-gold/60" /> Until: {formatDate(p.endDate)}</span>}
                          {p.invitationExpiredAt && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-red-400 inline-flex items-center gap-1"><Clock size={9} className="text-red-400" /> Expires: {formatUtcDateTime(p.invitationExpiredAt)}</span>}
                          {p.invitationExpiredAt && String(p.status ?? '').toLowerCase() === 'pending' && <CountdownTimer target={p.invitationExpiredAt} />}
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${cfg.color}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                        {String(p.status ?? '').toLowerCase() === 'pending' && (
                          <button
                            onClick={() => handleCancelInvite(p.id)}
                            className="px-3 py-1 rounded-full text-[11px] font-bold text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            Cancel invitation
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {visibleProposals.length === 0 && (
                  <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <div className="relative z-10">
                      <div className="text-4xl opacity-40 mb-3">🏇</div>
                      No contracts yet
                      <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-md border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Invite Jockey</h2>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Select Tournament *</label>
                <select 
                  value={form.tournamentId} 
                  disabled={isPrefilled}
                  onChange={e => handleTournamentSelect(e.target.value)} 
                  className={`${INPUT} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">-- Select Tournament --</option>
                  {tournaments.map(t => (
                    <option key={t.tournamentId} value={t.tournamentId}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selectedInviteTournament?.startDate && selectedInviteTournament?.endDate && (
                  <p className="text-[10px] text-muted/70 mt-1">
                    Tournament time: {formatDate(selectedInviteTournament.startDate)} - {formatDate(selectedInviteTournament.endDate)}
                  </p>
                )}
              </div>

              <div>
                <label className={LABEL}>Select Horse (Vet Check Passed) *</label>
                <select 
                  value={form.horseId} 
                  disabled={isPrefilled || !form.tournamentId}
                  onChange={e => setForm(p => ({...p, horseId: e.target.value}))} 
                  className={`${INPUT} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {!form.tournamentId ? '-- Select Tournament First --' : '-- Select Horse --'}
                  </option>
                  {filteredHorsesForSelect.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                {form.tournamentId && filteredHorsesForSelect.length === 0 && (
                  <p className="text-[10px] text-yellow-400 mt-1">No horses have passed vet inspection for this tournament.</p>
                )}
                {horseBusyError && (
                  <p className="text-[11px] text-red-400 mt-1.5 font-medium">
                    {horseBusyError}
                  </p>
                )}
              </div>

              <div>
                <label className={LABEL}>Select Jockey *</label>
                <select 
                  value={form.jockeyId} 
                  disabled={!form.tournamentId || loadingBusyJockeys}
                  onChange={e => setForm(p => ({...p, jockeyId: e.target.value}))} 
                  className={`${INPUT} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {!form.tournamentId ? '-- Select Tournament First --' : (loadingBusyJockeys ? '-- Loading available jockeys... --' : '-- Select Jockey --')}
                  </option>
                  {filteredJockeysForSelect.map(j => (
                    <option key={j.jockeyProfileId ?? j.userId} value={j.userId}>
                      {j.fullName ?? `Jockey #${j.userId}`}
                      {j.totalWins != null ? ` (${j.totalWins} wins)` : ''}
                    </option>
                  ))}
                </select>
                {form.tournamentId && !loadingBusyJockeys && filteredJockeysForSelect.length === 0 && (
                  <p className="text-[10px] text-yellow-400 mt-1">All jockeys are already contracted or registered for this tournament.</p>
                )}
                {jockeyBusyError && (
                  <p className="text-[11px] text-red-400 mt-1.5 font-medium">
                    {jockeyBusyError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Start Date</label>
                  <input type="date" value={form.startDate} disabled className={`${INPUT} opacity-60 cursor-not-allowed`} style={{colorScheme:'dark'}} />
                </div>
                <div>
                  <label className={LABEL}>End Date</label>
                  <input type="date" value={form.endDate} disabled className={`${INPUT} opacity-60 cursor-not-allowed`} style={{colorScheme:'dark'}} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Response Deadline (hours) *</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={form.expirationHours}
                  onChange={e => setForm(p => ({...p, expirationHours: e.target.value}))}
                  placeholder="Enter deadline in hours (e.g. 24)"
                  className={INPUT}
                />
                {selectedInviteTournament?.registrationEndDate && (() => {
                  const regEnd = new Date(selectedInviteTournament.registrationEndDate);
                  const remainingMs = regEnd.getTime() - Date.now();
                  const remainingHours = remainingMs / (1000 * 60 * 60);
                  if (remainingHours > 0) {
                    const wholeHours = Math.floor(remainingHours);
                    if (wholeHours >= 1) {
                      return <p className="text-[10px] text-muted/70 mt-1">Maximum allowed: {wholeHours} hours (until registration close)</p>;
                    } else {
                      const remainingMinutes = Math.max(1, Math.floor(remainingMs / (1000 * 60)));
                      return <p className="text-[10px] text-muted/70 mt-1">Maximum allowed: {remainingMinutes} minutes (until registration close)</p>;
                    }
                  }
                  return <p className="text-[10px] text-red-400 mt-1">Registration for this tournament has closed.</p>;
                })()}
              </div>
              {submitError &&<div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
              {submitSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{submitSuccess}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeInvite} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleInvite} disabled={submitLoading || !!jockeyBusyError || !!horseBusyError} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">
                {submitLoading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
