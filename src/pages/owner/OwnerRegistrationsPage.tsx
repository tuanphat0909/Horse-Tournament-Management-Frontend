import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, XCircle, Calendar, Trophy, Search, Clock, User, ExternalLink, X, RefreshCw } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createRegistration, getMyRegistrations, getMyHorses, getMyProposals, cancelJockeyContract } from '../../api/ownerService';
import { getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { formatUtcDateTime, formatDateOnly } from '../../utils/format';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type Tab = 'pending_jockey' | 'pending_admin' | 'approved' | 'rejected' | 'pending_vet';

function normalizeStatus(s: string): 'pending' | 'approved' | 'rejected' | 'pending_vet' {
  const key = (s ?? '').toLowerCase();
  if (key === 'approved') return 'approved';
  if (key === 'rejected' || key === 'disqualified' || key === 'cancelled') return 'rejected';
  if (key === 'pendingvet' || key === 'pending_vet') return 'pending_vet';
  return 'pending';
}

const STATUS_CONFIG = {
  pending_vet: { label: 'Pending Vet Health Check', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  pending:  { label: 'Pending Admin approval', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  approved: { label: 'Approved',        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  rejected: { label: 'Rejected',      color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

export function OwnerRegistrationsPage() {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('pending_vet');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ horseId: '', tournamentId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendingModal, setPendingModal] = useState<{ contract: any; registration: any } | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const [regData, horseData, tournamentData, propData] = await Promise.all([
        getMyRegistrations(),
        getMyHorses(),
        getTournaments(),
        getMyProposals().catch(() => ({ result: [] })),
      ]);
      setRegistrations(regData?.result ?? (Array.isArray(regData) ? regData : []));
      setHorses(horseData?.result ?? (Array.isArray(horseData) ? horseData : []));
      setTournaments(tournamentData?.result ?? (Array.isArray(tournamentData) ? tournamentData : []));
      setProposals(propData?.result ?? (Array.isArray(propData) ? propData : []));
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Gate sức khỏe theo quy trình: chỉ horse Healthy (Healthy) mới được đăng ký vào giải.
  // Horse Owner là role duy nhất đọc được healthStatus qua API nên chặn tại bước này.
  const isHealthy = (h: any) => {
    const s = String(h?.healthStatus ?? 'Healthy').toLowerCase();
    return s === 'healthy' || s === 'good';
  };

  async function handleSubmit() {
    setSubmitError('');
    if (!form.horseId || !form.tournamentId) {
      setSubmitError('Please select a horse and a tournament.');
      return;
    }
    setSubmitLoading(true);
    try {
      await createRegistration({ horseId: Number(form.horseId), tournamentId: Number(form.tournamentId) });
      setShowModal(false);
      setForm({ horseId: '', tournamentId: '' });
      showToast('Success', 'Register Horse successful!');
      load();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleRecheckRequest(horseId: number, tournamentId: number) {
    setSubmitLoading(true);
    setError('');
    try {
      await createRegistration({ horseId, tournamentId });
      showToast('Success', 'Request recheck submitted successfully!');
      load();
    } catch (err: unknown) {
      showToast('Error', parseApiError(err as Error), 'error');
    } finally {
      setSubmitLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSubmitError('');
    setForm({ horseId: '', tournamentId: '' });
  }

  const filtered = registrations.filter(r => {
    const statusKey = normalizeStatus(r.status);

    // Find all matching contracts for this horse and tournament
    const matchingContracts = proposals.filter(
      p => String(p.horseId) === String(r.horseId) && String(p.tournamentId) === String(r.tournamentId)
    );
    // Sort by ID descending so the latest proposal is first
    matchingContracts.sort((a, b) => (b.contractId ?? b.id ?? 0) - (a.contractId ?? a.id ?? 0));
    
    // Prefer finding an Accepted, Active, or Pending contract first
    const contract = matchingContracts.find(
      p => ['accepted', 'active', 'pending'].includes((p.status ?? '').toLowerCase())
    ) || matchingContracts[0];

    const contractStatus = (contract?.status ?? '').toLowerCase();
    const resolvedStatus = contractStatus || (r.jockeyName ? 'accepted' : '');
    const isJockeyAccepted = (resolvedStatus === 'accepted' || resolvedStatus === 'active');

    if (tab === 'pending_jockey') {
      if (statusKey !== 'pending' || isJockeyAccepted) return false;
    } else if (tab === 'pending_admin') {
      if (statusKey !== 'pending' || !isJockeyAccepted) return false;
    } else {
      if (statusKey !== tab) return false;
    }

    // Filter out past (completed/cancelled) tournaments for the approved tab
    if (tab === 'approved') {
      const t = tournaments.find(tour => tour.tournamentId === r.tournamentId);
      if (t) {
        const status = (t.status ?? '').toLowerCase();
        if (status === 'completed' || status === 'cancelled') {
          return false;
        }
      }
    }

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (r.horseName ?? '').toLowerCase().includes(q)
      || (r.tournamentName ?? '').toLowerCase().includes(q);
  });

  const counts = {
    pending_vet: registrations.filter(r => normalizeStatus(r.status) === 'pending_vet').length,
    pending_jockey: registrations.filter(r => {
      if (normalizeStatus(r.status) !== 'pending') return false;
      const matchingContracts = proposals.filter(
        p => String(p.horseId) === String(r.horseId) && String(p.tournamentId) === String(r.tournamentId)
      );
      matchingContracts.sort((a, b) => (b.contractId ?? b.id ?? 0) - (a.contractId ?? a.id ?? 0));
      const contract = matchingContracts.find(
        p => ['accepted', 'active', 'pending'].includes((p.status ?? '').toLowerCase())
      ) || matchingContracts[0];
      const contractStatus = (contract?.status ?? '').toLowerCase();
      const resolvedStatus = contractStatus || (r.jockeyName ? 'accepted' : '');
      return !(resolvedStatus === 'accepted' || resolvedStatus === 'active');
    }).length,
    pending_admin: registrations.filter(r => {
      if (normalizeStatus(r.status) !== 'pending') return false;
      const matchingContracts = proposals.filter(
        p => String(p.horseId) === String(r.horseId) && String(p.tournamentId) === String(r.tournamentId)
      );
      matchingContracts.sort((a, b) => (b.contractId ?? b.id ?? 0) - (a.contractId ?? a.id ?? 0));
      const contract = matchingContracts.find(
        p => ['accepted', 'active', 'pending'].includes((p.status ?? '').toLowerCase())
      ) || matchingContracts[0];
      const contractStatus = (contract?.status ?? '').toLowerCase();
      const resolvedStatus = contractStatus || (r.jockeyName ? 'accepted' : '');
      return (resolvedStatus === 'accepted' || resolvedStatus === 'active');
    }).length,
    approved: registrations.filter(r => normalizeStatus(r.status) === 'approved').length,
    rejected: registrations.filter(r => normalizeStatus(r.status) === 'rejected').length,
  };

  const filteredTournamentsForRegister = (form.horseId
    ? tournaments.filter(t => 
        !registrations.some(r => 
          String(r.horseId) === String(form.horseId) && 
          r.tournamentId === t.tournamentId && 
          normalizeStatus(r.status) !== 'rejected'
        )
      )
    : tournaments
  ).filter(t => {
    const status = (t.status ?? '').toLowerCase();
    if (status === 'completed' || status === 'cancelled' || status === 'finished' || status === 'ended') {
      return false;
    }
    const now = new Date();
    if (t.registrationStartDate) {
      const regStart = new Date(t.registrationStartDate);
      if (now < regStart) return false;
    }
    if (t.registrationEndDate) {
      const regEnd = new Date(t.registrationEndDate);
      if (now > regEnd) return false;
    }
    return true;
  }).sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    return dateA - dateB;
  });

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="emerald" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Race Registration"
            subtitle="Manage tournament registrations"
            imageUrl="/images/hero-owner.jpg"
            imagePosition="center 5%"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Register horse
              </button>
            }
          />

          {error && <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{error}</div>}

          <div className="flex items-center gap-1 border-b border-glass-border pb-0">
            {([['pending_vet', 'Vet Check'], ['pending_jockey', 'Hire Jockey'], ['pending_admin', 'Awaiting Approval'], ['approved', 'Approved'], ['rejected', 'Rejected']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}>
                {label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${tab === t ? 'bg-gold/10 text-gold' : 'bg-white/5 text-muted'}`}>
                  {counts[t]}
                </span>
              </button>
            ))}
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search horse, tournament..."
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-3">
              {filtered.map((r, i) => {
                const statusKey = normalizeStatus(r.status);
                // Find all matching contracts for this horse and tournament
                const matchingContracts = proposals.filter(
                  p => String(p.horseId) === String(r.horseId) && String(p.tournamentId) === String(r.tournamentId)
                );
                matchingContracts.sort((a, b) => (b.contractId ?? b.id ?? 0) - (a.contractId ?? a.id ?? 0));
                const contract = matchingContracts.find(
                  p => ['accepted', 'active', 'pending'].includes((p.status ?? '').toLowerCase())
                ) || matchingContracts[0];

                const contractStatus = (contract?.status ?? '').toLowerCase();
                const resolvedStatus = contractStatus || (r.jockeyName ? 'accepted' : '');

                let customStatus = {
                  label: 'Pending Admin approval',
                  color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                  clickable: false as boolean,
                  action: 'none' as 'none' | 'invite' | 'pending-modal',
                };

                 if (statusKey === 'pending') {
                  if (resolvedStatus === 'accepted' || resolvedStatus === 'active') {
                    customStatus = {
                      label: 'Pending Admin approval',
                      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
                      clickable: false,
                      action: 'none',
                    };
                  } else if (resolvedStatus === 'pending') {
                    customStatus = {
                      label: 'Awaiting Jockey Response',
                      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 cursor-pointer hover:bg-orange-500/20',
                      clickable: true,
                      action: 'pending-modal',
                    };
                  } else if (resolvedStatus === 'rejected' || resolvedStatus === 'declined') {
                    customStatus = {
                      label: 'Jockey Declined',
                      color: 'text-red-400 bg-red-500/10 border-red-500/20 cursor-pointer hover:bg-red-500/20',
                      clickable: true,
                      action: 'invite',
                    };
                  } else if (resolvedStatus === 'cancelled') {
                    customStatus = {
                      label: 'Invitation Cancelled',
                      color: 'text-red-400 bg-red-500/10 border-red-500/20 cursor-pointer hover:bg-red-500/20',
                      clickable: true,
                      action: 'invite',
                    };
                  } else if (resolvedStatus === 'expired') {
                    customStatus = {
                      label: 'Invitation Expired',
                      color: 'text-red-400 bg-red-500/10 border-red-500/20 cursor-pointer hover:bg-red-500/20',
                      clickable: true,
                      action: 'invite',
                    };
                  } else {
                    customStatus = {
                      label: 'No Jockey Yet',
                      color: 'text-red-400 bg-red-500/10 border-red-500/20 cursor-pointer hover:bg-red-500/20',
                      clickable: true,
                      action: 'invite',
                    };
                  }
                } else {
                  const cfg = STATUS_CONFIG[statusKey];
                  customStatus = { ...cfg, label: r.status, clickable: false, action: 'none' };
                }

                const handleBadgeClick = () => {
                  if (!customStatus.clickable) return;
                  if (customStatus.action === 'invite') {
                    // Navigate to Jockey page with pre-filled horse + tournament
                    navigate(`/owner/jockeys?horseId=${r.horseId}&tournamentId=${r.tournamentId}`);
                  } else if (customStatus.action === 'pending-modal' && contract) {
                    setPendingModal({ contract, registration: r });
                  }
                };

                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-panel rounded-xl p-5 flex items-center gap-5 border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                    <div className="relative z-10 w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                    <div className="relative z-10 w-11 h-11 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 ring-1 ring-gold/30 flex items-center justify-center text-xl shrink-0">🐴</div>
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="text-base font-serif text-white group-hover:text-champagne transition-colors">{r.horseName ?? `Horse #${r.horseId}`}</div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-champagne"><Trophy size={10} className="text-gold/60" /> {r.tournamentName ?? `Tournament #${r.tournamentId}`}</span>
                        {r.createdAt && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-glass-border text-muted"><Calendar size={10} className="text-gold/60" /> {r.createdAt}</span>}
                        {/* Show jockey name inline */}
                        {(r.jockeyName || contract?.jockeyName) && (
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            (resolvedStatus === 'accepted' || resolvedStatus === 'active')
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                              : (resolvedStatus === 'rejected' || resolvedStatus === 'declined')
                              ? 'bg-red-500/10 border-red-500/20 text-red-300'
                              : 'bg-white/5 border-glass-border text-muted'
                          }`}>
                            <User size={10} className="text-current opacity-60" /> 
                            {r.jockeyName || contract?.jockeyName}
                            {(resolvedStatus === 'rejected' || resolvedStatus === 'declined') && ' (Declined)'}
                            {resolvedStatus === 'cancelled' && ' (Cancelled)'}
                            {resolvedStatus === 'expired' && ' (Expired)'}
                            {resolvedStatus === 'pending' && ' (Awaiting response)'}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Status badge — clickable when action is available */}
                    <span
                      onClick={handleBadgeClick}
                      className={`relative z-10 text-[11px] font-bold px-3 py-1 rounded-full border shrink-0 transition-all flex items-center gap-1.5 ${customStatus.color}`}
                      title={customStatus.clickable ? (customStatus.action === 'invite' ? 'Click to invite a jockey' : 'Click for details') : undefined}
                    >
                      {customStatus.action === 'invite' && <ExternalLink size={10} />}
                      {customStatus.action === 'pending-modal' && <Clock size={10} />}
                      {customStatus.label}
                    </span>
                    {statusKey === 'pending' && (
                      <button className="relative z-10 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors shrink-0" title="Cancel registration">
                        <XCircle size={15} />
                      </button>
                    )}
                    {statusKey === 'rejected' && (
                      <button
                        onClick={() => handleRecheckRequest(r.horseId, r.tournamentId)}
                        disabled={submitLoading}
                        className="relative z-10 px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 transition-colors shrink-0 text-xs font-bold flex items-center gap-1.5"
                        title="Request re-check from Veterinarian"
                      >
                        <RefreshCw size={12} className={submitLoading ? 'animate-spin' : ''} /> Recheck
                      </button>
                    )}
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-[40px] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="text-4xl opacity-40 mb-3">🐴</div>
                    No registrations found
                    <div className="mx-auto mt-4 w-24 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Pending Jockey Details Modal */}
      <AnimatePresence>
        {pendingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPendingModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel rounded-2xl p-8 w-full max-w-md border border-orange-500/20 relative"
            >
              <button onClick={() => setPendingModal(null)} className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors">
                <X size={16} />
              </button>
              <h2 className="text-xl font-serif text-white mb-1">Awaiting Jockey Response</h2>
              <p className="text-xs text-muted mb-6">The jockey has not yet responded to your invitation.</p>

              <div className="space-y-4">
                {/* Horse info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-glass-border">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center text-lg">🐴</div>
                  <div>
                    <div className="text-sm font-medium text-white">{pendingModal.registration.horseName ?? `Horse #${pendingModal.registration.horseId}`}</div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">{pendingModal.registration.tournamentName ?? `Tournament #${pendingModal.registration.tournamentId}`}</div>
                  </div>
                </div>

                {/* Jockey info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-900/20 border border-blue-500/20 flex items-center justify-center font-serif font-bold text-blue-300 text-lg">
                    {(pendingModal.contract.jockeyName ?? 'J')[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{pendingModal.contract.jockeyName ?? `Jockey #${pendingModal.contract.jockeyId}`}</div>
                    <div className="text-[10px] text-muted">Invited Jockey</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border text-orange-400 bg-orange-500/10 border-orange-500/20">
                    <Clock size={10} /> Pending
                  </span>
                </div>

                {/* Countdown */}
                {pendingModal.contract.invitationExpiredAt && (
                  <div className="flex items-center justify-center py-3">
                    <CountdownTimer target={pendingModal.contract.invitationExpiredAt} label="Expires in:" />
                  </div>
                )}

                {/* Dates */}
                {(pendingModal.contract.startDate || pendingModal.contract.endDate) && (
                  <div className="grid grid-cols-2 gap-3">
                    {pendingModal.contract.startDate && (
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-glass-border">
                        <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Start Date</div>
                        <div className="text-xs text-white font-medium">{formatUtcDateTime(pendingModal.contract.startDate)}</div>
                      </div>
                    )}
                    {pendingModal.contract.endDate && (
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-glass-border">
                        <div className="text-[10px] text-muted uppercase tracking-wider mb-1">End Date</div>
                        <div className="text-xs text-white font-medium">{formatUtcDateTime(pendingModal.contract.endDate)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setPendingModal(null)} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Close</button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Cancel this jockey invitation?')) return;
                    try {
                      await cancelJockeyContract(pendingModal.contract.id);
                      setPendingModal(null);
                      showToast('Success', 'Invitation cancelled', 'success');
                      load();
                    } catch (err: unknown) {
                      showToast('Error', parseApiError(err as Error), 'error');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-sm font-bold transition-colors"
                >
                  Cancel Invitation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-md border border-gold/20">
            <h2 className="text-xl font-serif text-white mb-6">Register Horse</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Select Horse *</label>
                <select 
                  value={form.horseId} 
                  onChange={e => {
                    const nextHorseId = e.target.value;
                    setForm(p => {
                      const isInvalid = p.tournamentId && registrations.some(r => 
                        String(r.horseId) === String(nextHorseId) && 
                        String(r.tournamentId) === String(p.tournamentId) &&
                        normalizeStatus(r.status) !== 'rejected'
                      );
                      return {
                        ...p,
                        horseId: nextHorseId,
                        tournamentId: isInvalid ? '' : p.tournamentId
                      };
                    });
                  }}
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40"
                >
                  <option value="">-- Select Horse --</option>
                  {horses.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name}{!isHealthy(h) ? ` — unhealthy (${h.healthStatus})` : ''}
                    </option>
                  ))}
                </select>
                {form.horseId && !isHealthy(horses.find(h => String(h.id) === String(form.horseId))) && (
                  <div className="text-[11px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-2.5 mt-2 leading-relaxed">
                    ⚠ Ngựa này đang có trạng thái <b>{horses.find(h => String(h.id) === String(form.horseId))?.healthStatus}</b>. Bạn vẫn có thể đăng ký, nhưng ngựa bắt buộc phải vượt qua kỳ khám của bác sĩ thú y (Vet Check) trước khi tham gia thi đấu.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">Select Tournament *</label>
                <select 
                  value={form.tournamentId} 
                  onChange={e => setForm(p => ({...p, tournamentId: e.target.value}))}
                  className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40"
                  disabled={!form.horseId}
                >
                  <option value="">
                    {!form.horseId ? '-- Select Previous Horse --' : '-- Select Tournament --'}
                  </option>
                  {filteredTournamentsForRegister.map(t => (
                    <option key={t.tournamentId} value={t.tournamentId}>
                      {t.name}
                      {t.startDate && t.endDate ? ` (${formatDateOnly(t.startDate)} - ${formatDateOnly(t.endDate)})` : ''}
                    </option>
                  ))}
                </select>
                {form.horseId && filteredTournamentsForRegister.length === 0 && (
                  <div className="text-[11px] text-yellow-400 mt-1.5">
                    This horse has already registered for all current tournaments.
                  </div>
                )}
                {tournaments.length === 0 && (
                  <div className="text-[11px] text-yellow-400 mt-1.5">
                    No tournaments available. An admin must create a tournament before horses can register.
                  </div>
                )}
              </div>
              {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60">
                {submitLoading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
