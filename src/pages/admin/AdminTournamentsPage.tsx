import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader, Plus, Search, Trophy, Clock, ArrowUpDown, Calendar, AlertCircle, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createTournament, generateFinalRace, closeTournamentRegistration, extendTournamentRegistration, cancelTournament, getAdminWalletBalance, updateTournament } from '../../api/adminService';
import { getRaceSchedule, getTournaments } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { formatDateTime } from '../../utils/format';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useConfirm } from '../../context/ConfirmContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type StatusFilter = 'all' | 'upcoming_registration' | 'registration_open' | 'registration_closed' | 'scheduled' | 'racing' | 'completed' | 'cancelled';

// "2026-07-04T18:30:00" -> "2026-07-04T18:30" (giá trị cho input datetime-local)
function formatToDatetimeLocal(v: any): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const CUSTOM_STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  'Upcoming Registration': { label: 'Upcoming Registration', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  'Registration Open': { label: 'Registration Open', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  'Registration Closed': { label: 'Registration Closed', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', dot: 'bg-zinc-400' },
  'Scheduled': { label: 'Scheduled', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', dot: 'bg-indigo-400' },
  'Pending Admin Attention': { label: 'Referee assignment needed', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 border-dashed animate-pulse', dot: 'bg-rose-400' },
  'Racing': { label: 'Racing', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  'Completed': { label: 'Completed', color: 'text-muted bg-white/5 border-glass-border', dot: 'bg-muted' },
  'Cancelled': { label: 'Cancelled', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' }
};

function getTournamentCustomStatus(tour: any) {
  const status = (tour.status ?? '').toLowerCase();
  if (status === 'cancelled') {
    return 'Cancelled';
  }
  if (status === 'completed' || status === 'finished') {
    return 'Completed';
  }
  if (status === 'pendingadminattention') {
    return 'Pending Admin Attention';
  }

  const now = new Date();
  const regStart = tour.registrationStartDate ? new Date(tour.registrationStartDate) : null;
  const regEnd = tour.registrationEndDate ? new Date(tour.registrationEndDate) : null;
  const start = tour.startDate ? new Date(tour.startDate) : null;

  // 1. Upcoming Registration: Chưa đến thời gian mở đăng ký
  if (regStart && now < regStart) {
    return 'Upcoming Registration';
  }

  // 2. Registration Open: Đang trong thời gian đăng ký
  if (regStart && regEnd && now >= regStart && now < regEnd && (status === 'pendingregistration' || status === 'registration open')) {
    return 'Registration Open';
  }

  // 3. Registration Closed: Đã đóng đăng ký và chưa xếp lịch
  const rounds = tour.rounds ?? tour.Rounds ?? [];
  if (status === 'pendingscheduling' || (regEnd && now >= regEnd && rounds.length === 0)) {
    return 'Registration Closed';
  }

  // 4. Scheduled: Đã xếp lịch nhưng chưa thi đấu
  if (status === 'upcoming' || (rounds.length > 0 && start && now < start)) {
    return 'Scheduled';
  }

  // 5. Racing: Đang thi đấu
  if (status === 'active' || (start && now >= start)) {
    return 'Racing';
  }

  // Fallbacks
  if (status === 'upcoming') return 'Scheduled';
  if (status === 'active') return 'Racing';
  if (status === 'completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'pendingregistration') return 'Registration Open';
  if (status === 'pendingscheduling') return 'Registration Closed';

  return 'Scheduled';
}

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_FORM = {
  name: '',
  description: '',
  registrationStartDate: '',
  registrationEndDate: '',
  startDate: '',
  endDate: '',
  firstPrize: '',
  secondPrize: '',
  thirdPrize: ''
};

export function AdminTournamentsPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useNotifications();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Sắp xếp danh sách tournaments
  type SortKey = 'newest' | 'oldest' | 'name' | 'status';
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  const [form, setForm] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminWalletBalance, setAdminWalletBalance] = useState<number>(0);

  const [tournaments, setTournaments] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  const [generatingForTournament, setGeneratingForTournament] = useState<number | null>(null);

  const [extendingTournament, setExtendingTournament] = useState<any>(null);
  const [extendLoading, setExtendLoading] = useState(false);

  const [cancelWarningTournament, setCancelWarningTournament] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [editingTournament, setEditingTournament] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    registrationStartDate: '',
    registrationEndDate: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  function handleEditClick(tour: any) {
    setEditingTournament(tour);
    setEditForm({
      name: tour.name || '',
      description: tour.description || '',
      registrationStartDate: formatToDatetimeLocal(tour.registrationStartDate),
      registrationEndDate: formatToDatetimeLocal(tour.registrationEndDate),
      startDate: formatToDatetimeLocal(tour.startDate),
      endDate: formatToDatetimeLocal(tour.endDate),
      status: tour.status || ''
    });
    setEditError('');
  }

  async function handleUpdate() {
    if (!editForm.name.trim() || !editForm.registrationStartDate || !editForm.registrationEndDate || !editForm.startDate || !editForm.endDate) {
      setEditError(t('Please fill in all required fields.'));
      return;
    }

    if (editForm.name.trim().length > 150) {
      setEditError('Tournament name cannot exceed 150 characters.');
      return;
    }
    if (editForm.description.trim().length > 2000) {
      setEditError('Tournament description cannot exceed 2000 characters.');
      return;
    }

    const regStartVal = new Date(editForm.registrationStartDate);
    const regEndVal = new Date(editForm.registrationEndDate);
    const startVal = new Date(editForm.startDate);
    const endVal = new Date(editForm.endDate);

    if (regEndVal <= regStartVal) {
      setEditError(t('Registration end date must be after registration start date.'));
      return;
    }
    if (startVal.getTime() < regEndVal.getTime() + 120 * 60 * 60 * 1000) {
      const earliestStartDate = new Date(regEndVal.getTime() + 5 * 24 * 60 * 60 * 1000);
      setEditError(`The tournament must start at least 5 days after registration closes. Earliest allowed start: ${formatDateTime(earliestStartDate.toISOString())}.`);
      return;
    }
    if (endVal <= startVal) {
      setEditError(t('Tournament end date must be after tournament start date.'));
      return;
    }

    setEditLoading(true);
    try {
      await updateTournament(editingTournament.tournamentId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        registrationStartDate: editForm.registrationStartDate,
        registrationEndDate: editForm.registrationEndDate,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        numberOfRounds: 2,
        status: editForm.status
      });
      showToast(t('Success'), t('Tournament updated successfully!'));
      setEditingTournament(null);
      await loadTournaments();
    } catch (err: unknown) {
      setEditError(t(parseApiError(err as Error)));
    } finally {
      setEditLoading(false);
    }
  }

  async function handleExtendRegistration() {
    if (!extendingTournament) return;

    setExtendLoading(true);
    try {
      await extendTournamentRegistration(extendingTournament.tournamentId);
      showToast(t('Success'), 'Registration extended successfully!');
      setExtendingTournament(null);
      await loadTournaments();
    } catch (err: unknown) {
      showToast(t('Error'), t(parseApiError(err as Error)));
    } finally {
      setExtendLoading(false);
    }
  }

  function handleCloseRegistrationClick(tour: any) {
    // Luôn đóng đăng ký ngay lập tức khi Admin chủ động bấm nút ở trạng thái Registration Open
    handleCloseRegistration(tour.tournamentId);
  }

  async function handleCancelTournament() {
    if (!cancelWarningTournament) return;

    const cancelCount = cancelWarningTournament.cancelCount ?? cancelWarningTournament.CancelCount ?? 0;
    const isSecondClose = cancelCount >= 1;
    const confirmMessage = isSecondClose
      ? "Are you sure you want to cancel this tournament because there are not enough registered horses after 2 registration cycles?"
      : "Are you sure you want to cancel this tournament?";

    if (!(await confirm({ title: 'Confirmation', message: confirmMessage, danger: true }))) {
      return;
    }

    setCancelLoading(true);
    try {
      const reason = isSecondClose
        ? "Not enough registered horses after 2 registration cycles."
        : "Tournament starts in less than 24 hours.";
      await cancelTournament(cancelWarningTournament.tournamentId, reason);
      showToast(t('Success'), t('Tournament cancelled successfully!'));
      setCancelWarningTournament(null);
      await loadTournaments();
    } catch (err: unknown) {
      showToast(t('Error'), t(parseApiError(err as Error)));
    } finally {
      setCancelLoading(false);
    }
  }

  async function loadTournaments() {
    setLoadingTournaments(true);
    try {
      const [data, raceData]: any[] = await Promise.all([
        getTournaments(),
        getRaceSchedule().catch(() => ({ result: [] })),
      ]);
      setTournaments(data?.result ?? (Array.isArray(data) ? data : []));
      setRaces(raceData?.result ?? (Array.isArray(raceData) ? raceData : []));
    } catch (err) {
      console.error(err);
      setTournaments([]);
      setRaces([]);
    } finally {
      setLoadingTournaments(false);
    }
  }

  useEffect(() => {
    loadTournaments();
    getAdminWalletBalance().then((data: any) => {
      const balance = data?.result?.balance ?? data?.result ?? 0;
      setAdminWalletBalance(Number(balance) || 0);
    }).catch(() => setAdminWalletBalance(0));
  }, []);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.registrationStartDate || !form.registrationEndDate || !form.startDate || !form.endDate ||
        !form.firstPrize || !form.secondPrize || !form.thirdPrize) {
      setError(t('Please fill in all required fields.'));
      return;
    }

    if (form.name.trim().length > 150) {
      setError('Tournament name cannot exceed 150 characters.');
      return;
    }
    if (form.description.trim().length > 2000) {
      setError('Tournament description cannot exceed 2000 characters.');
      return;
    }

    const firstPrize = Number(form.firstPrize);
    const secondPrize = Number(form.secondPrize);
    const thirdPrize = Number(form.thirdPrize);
    if (![firstPrize, secondPrize, thirdPrize].every(Number.isFinite) || firstPrize <= 0 || secondPrize <= 0 || thirdPrize <= 0) {
      setError('All three prize amounts must be greater than zero.');
      return;
    }
    if (!(firstPrize > secondPrize && secondPrize > thirdPrize)) {
      setError('Prize amounts must follow: first place > second place > third place.');
      return;
    }
    const totalPrizePool = firstPrize + secondPrize + thirdPrize;
    if (totalPrizePool > adminWalletBalance) {
      setError(`Insufficient Admin wallet balance. Available: ${adminWalletBalance.toLocaleString('vi-VN')} VND; required: ${totalPrizePool.toLocaleString('vi-VN')} VND. Please enter lower prizes or deposit more funds.`);
      return;
    }

    // Guard if there is an active date error
    const regStartVal = new Date(form.registrationStartDate);
    const regEndVal = new Date(form.registrationEndDate);
    const startVal = new Date(form.startDate);
    const endVal = new Date(form.endDate);
    const now = new Date();
    if (regStartVal.getTime() < now.getTime() - 5 * 60 * 1000) {
      setError(t('Registration start date cannot be in the past.'));
      return;
    }
    if (regEndVal.getTime() < now.getTime() - 5 * 60 * 1000) {
      setError(t('Registration end date cannot be in the past.'));
      return;
    }
    if (startVal.getTime() < now.getTime() - 5 * 60 * 1000) {
      setError(t('Tournament start date cannot be in the past.'));
      return;
    }
    if (endVal.getTime() < now.getTime() - 5 * 60 * 1000) {
      setError(t('Tournament end date cannot be in the past.'));
      return;
    }

    if (regEndVal <= regStartVal) {
      setError(t('Registration end date must be after registration start date.'));
      return;
    }
    if (startVal.getTime() < regEndVal.getTime() + 120 * 60 * 60 * 1000) {
      const earliestStartDate = new Date(regEndVal.getTime() + 5 * 24 * 60 * 60 * 1000);
      setError(`The tournament must start at least 5 days after registration closes. Earliest allowed start: ${formatDateTime(earliestStartDate.toISOString())}.`);
      return;
    }
    if (endVal <= startVal) {
      setError(t('Tournament end date must be after tournament start date.'));
      return;
    }

    const prizes = [
      { rankPosition: 1, amount: firstPrize, ownerPercentage: 100, jockeyPercentage: 0 },
      { rankPosition: 2, amount: secondPrize, ownerPercentage: 100, jockeyPercentage: 0 },
      { rankPosition: 3, amount: thirdPrize, ownerPercentage: 100, jockeyPercentage: 0 }
    ];

    setLoading(true);
    try {
      const data: any = await createTournament({
        name: form.name.trim(),
        description: form.description.trim(),
        registrationStartDate: form.registrationStartDate,
        registrationEndDate: form.registrationEndDate,
        startDate: form.startDate,
        endDate: form.endDate,
        prizes: prizes
      });
      const newId = data?.result?.id ?? data?.result?.tournamentId;
      showToast(t('Success'), newId != null
        ? `${t('Tournament created successfully!')} ID = ${newId}. ${t('Tournament is now in Pending Registration status.')}`
        : t('Tournament created successfully!'));
      setForm(INIT_FORM);
      setShowModal(false);
      loadTournaments();
    } catch (err: unknown) {
      setError(t(parseApiError(err as Error)));
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setError('');
    setForm(INIT_FORM);
  }

  async function handleCloseRegistration(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    try {
      await closeTournamentRegistration(tournamentId);
      showToast(t('Success'), t('Registration deadline closed successfully!'));
      await loadTournaments();
    } catch (err: unknown) {
      const errorMsg = parseApiError(err as Error);
      showToast(t('Failed'), t(errorMsg), 'error');
    } finally {
      setGeneratingForTournament(null);
    }
  }

  async function handleGenerateFinal(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    try {
      await generateFinalRace(tournamentId);
      showToast(t('Success'), t('Final bracket (Top 12) auto-assigned successfully.'));
      await loadTournaments();
    } catch (err: unknown) {
      const errorMsg = parseApiError(err as Error);
      showToast(t('Failed'), t(errorMsg), 'error');
    } finally {
      setGeneratingForTournament(null);
    }
  }

  const statsCounts: Record<StatusFilter, number> = {
    all: tournaments.length,
    upcoming_registration: tournaments.filter(t => getTournamentCustomStatus(t) === 'Upcoming Registration').length,
    registration_open: tournaments.filter(t => getTournamentCustomStatus(t) === 'Registration Open').length,
    registration_closed: tournaments.filter(t => getTournamentCustomStatus(t) === 'Registration Closed').length,
    scheduled: tournaments.filter(t => {
      const cs = getTournamentCustomStatus(t);
      return cs === 'Scheduled' || cs === 'Pending Admin Attention';
    }).length,
    racing: tournaments.filter(t => getTournamentCustomStatus(t) === 'Racing').length,
    completed: tournaments.filter(t => getTournamentCustomStatus(t) === 'Completed').length,
    cancelled: tournaments.filter(t => getTournamentCustomStatus(t) === 'Cancelled').length,
  };

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = (t.name ?? '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'all') return true;

    const customStatus = getTournamentCustomStatus(t);
    if (filter === 'upcoming_registration') return customStatus === 'Upcoming Registration';
    if (filter === 'registration_open') return customStatus === 'Registration Open';
    if (filter === 'registration_closed') return customStatus === 'Registration Closed';
    if (filter === 'scheduled') return customStatus === 'Scheduled' || customStatus === 'Pending Admin Attention';
    if (filter === 'racing') return customStatus === 'Racing';
    if (filter === 'completed') return customStatus === 'Completed';
    if (filter === 'cancelled') return customStatus === 'Cancelled';

    return true;
  });

  // Sắp xếp theo lựa chọn
  const STATUS_ORDER: Record<string, number> = {
    'upcoming registration': 0,
    'registration open': 1,
    'registration closed': 2,
    'scheduled': 3,
    'pending admin attention': 3.5,
    'racing': 4,
    'completed': 5,
    'cancelled': 6
  };
  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime();
      case 'name':
        return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'vi');
      case 'status':
        const statusA = getTournamentCustomStatus(a).toLowerCase();
        const statusB = getTournamentCustomStatus(b).toLowerCase();
        return (STATUS_ORDER[statusA] ?? 6) - (STATUS_ORDER[statusB] ?? 6);
      case 'newest':
      default:
        return new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime();
    }
  });

  function getTournamentRaceState(tour: any) {
    const tournamentRaces = races.filter(r => r.tournamentId === tour.tournamentId);
    const rounds = tour.rounds ?? [];

    // Check registration date: phân biệt CHƯA MỞ / ĐANG MỞ / ĐÃ ĐÓNG
    const now = new Date();
    const regStart = tour.registrationStartDate ? new Date(tour.registrationStartDate) : null;
    const regEnd = new Date(tour.registrationEndDate);
    const regNotStarted = regStart != null && now < regStart;
    const regOpen = !regNotStarted && now < regEnd;
    const regEnded = now >= regEnd;

    const preRound = rounds.find((r: any) => r.roundNumber === 1);
    const finalRound = rounds.find((r: any) => r.roundNumber === 2);

    const preRaces = preRound ? tournamentRaces.filter(r => r.roundId === preRound.roundId) : [];
    const finalRaces = finalRound ? tournamentRaces.filter(r => r.roundId === finalRound.roundId) : [];

    const hasPre = preRound != null;
    const hasFinal = finalRound != null;

    // Auto arrange is available if registration has closed and no rounds have been generated yet
    const canAutoArrange = regEnded && rounds.length === 0;

    // Generate Final is available if we have Pre Round, all Pre races are Finished/Completed, and no Final race yet
    const preFinished = hasPre && preRaces.length > 0 && preRaces.every(r => r.status === 'Finished' || r.status === 'Completed');
    const canGenerateFinal = preFinished && finalRaces.length === 0;

    let statusLabel = '';
    const cancelCount = tour.cancelCount ?? tour.CancelCount ?? 0;
    const isSuspended = tour.status?.toLowerCase() === 'registration suspended' ||
      (tour.status?.toLowerCase() === 'registration open' && regEnded && cancelCount === 0);

    if (isSuspended) {
      statusLabel = 'Registration Suspended';
    } else if (regNotStarted) {
      statusLabel = 'Registration not open';
    } else if (regOpen) {
      statusLabel = 'Registration open';
    } else if (rounds.length === 0) {
      statusLabel = 'Pending Auto Arrange';
    } else if (hasPre && !preFinished) {
      const isPreStarted = Boolean(
        preRound?.races?.some((r: any) =>
          r.status === 'Live' || r.status === 'InProgress' || r.status === 'Finished' || r.status === 'Completed'
        ) || (tour.startDate && now >= new Date(tour.startDate))
      );
      statusLabel = isPreStarted ? 'Competing in Pre-round' : 'Pending Pre-round';
    } else if (canGenerateFinal) {
      statusLabel = 'Pending Final assignment';
    } else if (hasFinal) {
      statusLabel = 'Competing in Finals';
    }

    return {
      totalRaces: tournamentRaces.length,
      regNotStarted,
      regOpen,
      canAutoArrange,
      canGenerateFinal,
      statusLabel
    };
  }

  return (

    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title={t("Tournament Management")}
            subtitle={t("Create and manage tournaments")}
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setShowModal(true)} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold font-sans">
                <Plus size={16} /> {t("Create Tournament")}
              </button>
            }
          />

          {/* Status Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'upcoming_registration', 'registration_open', 'registration_closed', 'scheduled', 'racing', 'completed', 'cancelled'] as StatusFilter[]).map(s => {
              const labelMap: Record<StatusFilter, string> = {
                all: 'All',
                upcoming_registration: 'Upcoming Registration',
                registration_open: 'Registration Open',
                registration_closed: 'Registration Closed',
                scheduled: 'Scheduled',
                racing: 'Racing',
                completed: 'Completed',
                cancelled: 'Cancelled'
              };
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${filter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
                    }`}
                >
                  {t(labelMap[s])}
                  <span className="ml-2 text-[11px] font-bold text-current opacity-60">
                    {statsCounts[s] ?? 0}
                  </span>
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Search tournaments...")} className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none focus:outline-none focus:ring-0 border-0 w-full" style={{ boxShadow: 'none' }} />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 transition-colors"
                style={{ colorScheme: 'dark' }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Tournament Cards */}
          {loadingTournaments ? (
            <LoadingSkeleton rows={4} h="h-24" />
          ) : filteredTournaments.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">{t("No data available")}</div>
            </div>
          ) : (
            <div className="overflow-y-auto pr-1.5 -mr-1.5 scrollbar-thin" style={{ maxHeight: 'calc(100vh - 330px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedTournaments.map((tour, i) => {
                  const customStatus = getTournamentCustomStatus(tour);
                  const config = CUSTOM_STATUS_CONFIG[customStatus] ?? CUSTOM_STATUS_CONFIG.Scheduled;
                  const raceState = getTournamentRaceState(tour);
                  const isGenerating = generatingForTournament === tour.tournamentId;

                  const now = new Date();
                  const isScheduled = customStatus === 'Scheduled';
                  const startsInLessThan24h = tour.startDate && (new Date(tour.startDate).getTime() - now.getTime() < 24 * 60 * 60 * 1000);
                  const show24hWarning = isScheduled && tour.hasMissingReferees && startsInLessThan24h;

                  return (
                    <motion.div
                      key={tour.tournamentId ?? i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-panel rounded-2xl p-5 border border-glass-border hover:border-gold/25 transition-all group relative overflow-hidden text-left h-full flex flex-col"
                    >
                      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                      <div className="mb-3 space-y-1.5">
                        {/* Hàng 1: badge trạng thái tổng quát */}
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${config.color} inline-flex items-center gap-1.5 w-fit`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} /> {t(config.label)}
                          </span>
                        </div>
                        {/* Hàng 2: badge loại rounds + đếm ngược thời gian — min-h giữ chỗ để card không bị lệch khi thiếu badge */}
                        <div className="flex items-center gap-2 flex-wrap min-h-[26px]">
                          {customStatus === 'Upcoming Registration' && (
                            <>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/8 text-blue-400 shrink-0">Reg. Upcoming</span>
                              {tour.registrationStartDate && (
                                <CountdownTimer target={tour.registrationStartDate} utc={false} label="Opens in:" />
                              )}
                            </>
                          )}
                          {customStatus === 'Registration Open' && (
                            <>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/8 text-emerald-400 shrink-0">Reg. Open</span>
                              {tour.registrationEndDate && (
                                <CountdownTimer target={tour.registrationEndDate} utc={false} label="Remaining:" />
                              )}
                            </>
                          )}
                          {customStatus === 'Registration Closed' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 shrink-0">🔒 Reg. Closed</span>
                          )}
                          {customStatus === 'Scheduled' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-400 shrink-0">📅 Scheduled</span>
                              {show24hWarning && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/15 text-red-400 shrink-0 flex items-center gap-1 animate-pulse">
                                  <AlertTriangle size={10} className="text-red-400 shrink-0" />
                                  {t("Missing referees!")}
                                </span>
                              )}
                            </div>
                          )}
                          {customStatus === 'Pending Admin Attention' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400 shrink-0 animate-pulse">⚠️ {t("Referee assignment needed")}</span>
                          )}
                          {customStatus === 'Racing' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 shrink-0">🏃 Racing</span>
                          )}
                          {customStatus === 'Completed' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-500/40 bg-zinc-500/10 text-zinc-400 shrink-0">🏆 Completed</span>
                          )}
                          {customStatus === 'Cancelled' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 bg-red-500/10 text-red-400 shrink-0">❌ Cancelled</span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-serif text-white font-bold group-hover:text-champagne transition-colors mb-1 line-clamp-1">{tour.name}</h3>
                      <p className="text-xs text-muted/80 line-clamp-2 min-h-[32px] mb-3">{tour.description || t("No detailed description available.")}</p>
                      <div className="space-y-1.5 text-xs text-muted pt-3 border-t border-glass-border/40">
                        <div className="flex justify-between">
                          <span>{t("Reg. opens:")}</span>
                          <span className="text-white font-medium">{formatDateTime(tour.registrationStartDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("Reg. closes:")}</span>
                          <span className="text-white font-medium">{formatDateTime(tour.registrationEndDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("Start Date:")}</span>
                          <span className="text-white font-medium">{formatDateTime(tour.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("End Date:")}</span>
                          <span className="text-white font-medium">{formatDateTime(tour.endDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("Race status:")}</span>
                          <span className="text-gold font-bold">{t(raceState.statusLabel)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("Races created:")}</span>
                          <span className="text-white font-medium">{raceState.totalRaces}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("Registered Horses:")}</span>
                          <span className="text-white font-medium">{tour.approvedRegistration ?? 0}</span>
                        </div>
                        {(customStatus === 'Registration Closed' || customStatus === 'Scheduled' || customStatus === 'Racing' || customStatus === 'Completed') && (
                          <div className="flex justify-between">
                            <span>{t("Qualified Horses:")}</span>
                            <span className={`font-bold ${((tour.qualifiedRegistration ?? 0) >= 12) ? 'text-emerald-400' : 'text-red-400'}`}>
                              {tour.qualifiedRegistration ?? 0} / 12
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 pt-2.5 mt-2 border-t border-glass-border/30">
                          <span className="font-bold text-white text-[11px] uppercase tracking-wider">{t("Prizes:")}</span>
                          {/* min-h giữ chỗ bằng chiều cao lưới prize để card không có prize vẫn cao bằng card có prize */}
                          <div className="min-h-[46px] flex flex-col justify-center">
                            {tour.prizes && tour.prizes.length > 0 ? (
                              <div className="grid grid-cols-3 gap-1.5 text-center mt-1">
                                {tour.prizes
                                  .slice()
                                  .sort((a: any, b: any) => a.rankPosition - b.rankPosition)
                                  .map((p: any) => (
                                    <div key={p.id} className="bg-white/[0.03] border border-glass-border/40 rounded px-1 py-1">
                                      <div className="text-[9px] text-muted font-semibold">Rank {p.rankPosition}</div>
                                      <div className="text-gold font-bold text-[10px] whitespace-nowrap">{Number(p.amount).toLocaleString('en-US')} VND</div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <span className="text-red-400 font-semibold italic text-[11px]">{t("Prizes not configured yet")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* mt-auto đẩy hàng nút xuống đáy card — các card trong cùng hàng luôn thẳng nhau */}
                      <div className="mt-auto pt-4 flex flex-wrap gap-2 w-full">
                        {customStatus === 'Registration Open' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleCloseRegistrationClick(tour)}
                              disabled={isGenerating}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                            >
                              {isGenerating ? <Loader size={13} className="animate-spin" /> : <Clock size={13} />}
                              {isGenerating ? t('Closing...') : t('Close Registration')}
                            </button>
                            <button
                              onClick={() => setCancelWarningTournament(tour)}
                              disabled={isGenerating}
                              className="px-3 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                            >
                              {t('Cancel')}
                            </button>
                          </div>
                        )}

                        {customStatus === 'Registration Closed' && (
                          <div className="flex flex-col gap-2.5 w-full">
                            {(tour.qualifiedRegistration ?? 0) >= 12 ? (
                              <div className="flex gap-2 w-full">
                                <button
                                  onClick={() => navigate('/admin/races', { state: { openTournamentId: tour.tournamentId } })}
                                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Calendar size={13} />
                                  {t('Schedule Races')}
                                </button>
                                <button
                                  onClick={() => setCancelWarningTournament(tour)}
                                  className="px-3 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  {t('Cancel')}
                                </button>
                              </div>
                            ) : (() => {
                              const now = new Date();
                              const startDate = new Date(tour.startDate);
                              const diffMs = startDate.getTime() - now.getTime();
                              const diffDays = diffMs / (1000 * 60 * 60 * 24);
                              const cancelCount = tour.cancelCount ?? tour.CancelCount ?? 0;
                              const canExtend = diffDays >= 2 && cancelCount < 1;

                              return (
                                <div className="space-y-2 w-full">
                                  <div className="text-red-400 font-bold text-[11px] flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 animate-pulse">
                                    <AlertCircle size={13} className="shrink-0" />
                                    <span>{t('Not enough qualified horses')} ({tour.qualifiedRegistration ?? 0}/12)</span>
                                  </div>
                                  <div className="flex gap-2 w-full">
                                    <button
                                      onClick={() => {
                                        setExtendingTournament(tour);
                                      }}
                                      disabled={!canExtend}
                                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                                      title={!canExtend ? (cancelCount >= 1 ? t('Already extended once, cannot extend again') : t('Tournament starts in less than 2 days, cannot extend')) : ''}
                                    >
                                      <Clock size={13} />
                                      {t('Extend')}
                                    </button>
                                    <button
                                      onClick={() => setCancelWarningTournament(tour)}
                                      className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      {t('Cancel Tournament')}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {customStatus === 'Scheduled' && (
                          <div className="flex flex-col gap-2 w-full">
                            {show24hWarning && (
                              <div className="text-red-400 font-bold text-[11px] flex items-start gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 animate-pulse mb-1">
                                <AlertTriangle size={13} className="shrink-0 mt-0.5 text-red-400" />
                                <span>{t("Urgent: referees must be assigned (less than 24h before the tournament starts!)")}</span>
                              </div>
                            )}
                            <div className="flex gap-2 w-full">
                              {show24hWarning ? (
                                <>
                                  <button
                                    onClick={() => navigate('/admin/races', { state: { openTournamentId: tour.tournamentId } })}
                                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-red-400 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5 animate-pulse"
                                  >
                                    <Calendar size={13} />
                                    {t('Assign referees')}
                                  </button>
                                  <button
                                    onClick={() => setCancelWarningTournament(tour)}
                                    className="px-3 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    {t('Cancel')}
                                  </button>
                                </>
                              ) : raceState.canGenerateFinal ? (
                                <button
                                  onClick={() => handleGenerateFinal(tour.tournamentId)}
                                  disabled={isGenerating}
                                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  {isGenerating ? <Loader size={13} className="animate-spin" /> : <Trophy size={13} />}
                                  {isGenerating ? t('Assigning...') : t('Auto Assign Final')}
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-muted border border-glass-border bg-white/[0.04] cursor-not-allowed text-center"
                                >
                                  {t('Scheduled & Ready')}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {customStatus === 'Pending Admin Attention' && (
                          <div className="flex flex-col gap-2.5 w-full">
                            <div className="text-red-400 font-bold text-[11px] flex items-start gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 animate-pulse">
                              <AlertCircle size={13} className="shrink-0 mt-0.5 text-red-400" />
                              <span>{t("Some races have no referee assigned. Please assign referees so the tournament can start!")}</span>
                            </div>
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => navigate('/admin/races', { state: { openTournamentId: tour.tournamentId } })}
                                className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-red-400 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 animate-pulse transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Calendar size={13} />
                                {t('Assign referees')}
                              </button>
                              <button
                                onClick={() => setCancelWarningTournament(tour)}
                                className="px-3 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
                              >
                                {t('Cancel Tournament')}
                              </button>
                            </div>
                          </div>
                        )}

                        {customStatus === 'Upcoming Registration' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => setCancelWarningTournament(tour)}
                              disabled={isGenerating}
                              className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                            >
                              {t('Cancel')}
                            </button>
                          </div>
                        )}

                        {customStatus !== 'Registration Open' && customStatus !== 'Registration Closed' && customStatus !== 'Scheduled' && customStatus !== 'Upcoming Registration' && (
                          <button
                            disabled
                            className="w-full px-3 py-2 rounded-lg text-xs font-bold text-muted border border-glass-border bg-white/[0.04] cursor-not-allowed text-center"
                          >
                            {t(customStatus)}
                          </button>
                        )}

                        {customStatus !== 'Completed' && customStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleEditClick(tour)}
                            className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-bold text-champagne border border-gold/30 bg-gold/5 hover:bg-gold/15 transition-colors flex items-center justify-center gap-1.5"
                          >
                            {t('Edit Tournament')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}


        </main>
      </div>

      {/* Create Tournament Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">{t("Create new tournament")}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>{t("Tournament Name *")}</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={t("E.g.: Autumn Race 2026")} className={INPUT} />
              </div>

              <div>
                <label className={LABEL}>{t("Tournament Description")}</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder={t("Enter detailed tournament description...")} className={`${INPUT} h-20 resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>{t("Open Registration *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={form.registrationStartDate}
                      onChange={e => set('registrationStartDate', e.target.value)}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>{t("Close Registration *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={form.registrationEndDate}
                      onChange={e => set('registrationEndDate', e.target.value)}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>{t("Tournament Start *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={e => set('startDate', e.target.value)}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>{t("Tournament End *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={e => set('endDate', e.target.value)}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {form.registrationEndDate && (() => {
                const registrationClose = new Date(form.registrationEndDate);
                const earliestStart = new Date(registrationClose.getTime() + 5 * 24 * 60 * 60 * 1000);
                return !Number.isNaN(earliestStart.getTime()) ? (
                  <div className="text-xs px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700">
                    The tournament must start at least <b>5 days</b> after registration closes. Earliest allowed start: <b>{formatDateTime(earliestStart.toISOString())}</b>.
                  </div>
                ) : null;
              })()}

              <div className="border-t border-glass-border/30 pt-3">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider mb-2 block">{t("Prize Structure (VND)")}</span>
                <div className="mb-2 text-[11px] text-muted flex flex-wrap justify-between gap-2">
                  <span>Admin wallet: <b className="text-emerald-400">{adminWalletBalance.toLocaleString('vi-VN')} VND</b></span>
                  <span>Total prizes: <b className="text-gold">{([form.firstPrize, form.secondPrize, form.thirdPrize].reduce((sum, value) => sum + (Number(value) || 0), 0)).toLocaleString('vi-VN')} VND</b></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted mb-1">Champion *</label>
                    <input type="number" min="1" value={form.firstPrize} onChange={e => set('firstPrize', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-1">2nd Place *</label>
                    <input type="number" min="1" value={form.secondPrize} onChange={e => set('secondPrize', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-1">3rd Place *</label>
                    <input type="number" min="1" value={form.thirdPrize} onChange={e => set('thirdPrize', e.target.value)} className={INPUT} />
                  </div>
                </div>
              </div>

              {error && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">{t("Cancel")}</button>
              <button onClick={handleCreate} disabled={loading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? t('Creating...') : t('Create Tournament')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Extend Registration Modal */}
      {extendingTournament && (() => {
        const now = new Date();
        const startDate = new Date(extendingTournament.startDate);
        const newRegistrationEndDate = new Date(startDate.getTime() - 48 * 60 * 60 * 1000);
        const isValid = newRegistrationEndDate > now;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />

              <div className="relative flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Clock size={15} className="text-gold" />
                </div>
                <h2 className="text-xl font-serif text-white">{t("Extend Registration")}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>

              <div className="space-y-4">
                <div className="bg-white/[0.02] border border-glass-border/30 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted">Tournament:</span>
                    <span className="text-white font-bold">{extendingTournament.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Current reg. close date:</span>
                    <span className="text-white font-medium">{formatDateTime(extendingTournament.registrationEndDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Tournament start date:</span>
                    <span className="text-white font-medium">{formatDateTime(extendingTournament.startDate)}</span>
                  </div>
                </div>

                <div className="text-xs px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  Registration can be extended once. The new deadline is fixed at 48 hours before the tournament starts.
                </div>

                <div className="bg-white/[0.02] border border-glass-border/30 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-white uppercase tracking-wider text-[10px] mb-1">Expected change</div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">Old reg. close date:</span>
                    <span className="text-zinc-400 line-through">{formatDateTime(extendingTournament.registrationEndDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted">New reg. close date:</span>
                    <span className="text-gold font-bold text-sm">{formatDateTime(newRegistrationEndDate.toISOString())}</span>
                  </div>
                </div>

                {!isValid && (
                  <div className="text-xs px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                    The final 48-hour preparation window has started. The tournament can no longer be extended and must be cancelled.
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setExtendingTournament(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={handleExtendRegistration}
                  disabled={!isValid || extendLoading}
                  className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {extendLoading ? t('Extending...') : t('Confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Cancel Tournament Warning Modal */}
      {cancelWarningTournament && (() => {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-red-500/20 relative overflow-hidden text-left"
            >
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />

              <div className="relative flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trophy size={15} className="text-red-400" />
                </div>
                <h2 className="text-xl font-serif text-white">{t("Cancel Tournament")}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 via-glass-border to-transparent" />
              </div>

              <div className="space-y-4">
                <div className="bg-white/[0.02] border border-glass-border/30 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted">Tournament:</span>
                    <span className="text-white font-bold">{cancelWarningTournament.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Tournament start date:</span>
                    <span className="text-white font-medium">{formatDateTime(cancelWarningTournament.startDate)}</span>
                  </div>
                </div>

                <div className="text-xs px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
                  {(cancelWarningTournament.cancelCount ?? cancelWarningTournament.CancelCount ?? 0) >= 1 ? (
                    <span>The tournament registration has closed for the second time, but it failed to reach the minimum number of registered horses. Please click Cancel Tournament to complete the cancellation process.</span>
                  ) : (
                    <span>Registration cannot be extended because the tournament starts in less than 48 hours (2 days). The tournament must be cancelled.</span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCancelWarningTournament(null)}
                  className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
                >
                  {t("Cancel")}
                </button>
                <button
                  onClick={handleCancelTournament}
                  disabled={cancelLoading}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelLoading ? t('Cancelling...') : t('Cancel Tournament')}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Edit Tournament Modal */}
      {editingTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden text-left"
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Trophy size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">{t("Edit Tournament")}</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>{t("Tournament Name *")}</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className={INPUT}
                />
              </div>

              <div>
                <label className={LABEL}>{t("Tournament Description")}</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className={`${INPUT} h-20 resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>{t("Open Registration *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={editForm.registrationStartDate}
                      onChange={e => setEditForm(prev => ({ ...prev, registrationStartDate: e.target.value }))}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>{t("Close Registration *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={editForm.registrationEndDate}
                      onChange={e => setEditForm(prev => ({ ...prev, registrationEndDate: e.target.value }))}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>{t("Tournament Start *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={editForm.startDate}
                      onChange={e => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>{t("Tournament End *")}</label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={editForm.endDate}
                      onChange={e => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className={`${INPUT} pr-10`}
                      style={{ colorScheme: 'dark' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        input?.showPicker?.();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      <Calendar size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {editForm.registrationEndDate && (() => {
                const registrationClose = new Date(editForm.registrationEndDate);
                const earliestStart = new Date(registrationClose.getTime() + 5 * 24 * 60 * 60 * 1000);
                return !Number.isNaN(earliestStart.getTime()) ? (
                  <div className="text-xs px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    The tournament must start at least <b>5 days</b> after registration closes. Earliest allowed start: <b>{formatDateTime(earliestStart.toISOString())}</b>.
                  </div>
                ) : null;
              })()}

              {editError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{editError}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingTournament(null)}
                className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editLoading ? t('Saving...') : t('Save Changes')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
