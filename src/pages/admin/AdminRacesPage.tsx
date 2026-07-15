import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flag, UserCheck, ListOrdered, Trash2, Calendar, ChevronDown, ChevronUp, Trophy, Loader, Eye, X, CheckCircle2, AlertCircle, ArrowUpDown, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { RaceTrack3D } from '../../components/ui/RaceTrack3D';
import { Pager, paginate } from '../../components/ui/Pager';
import { createRace, deleteRace, createRaceEntry, assignReferee, getRaceReferees, removeReferee, generateTournamentRaces, generateFinalRace, getRegistrations, getReferees, withdrawRaceEntry } from '../../api/adminService';
import { getRaceSchedule, getTournaments, getRaceEntries } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';


import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_RACE = { roundId: '', name: '', raceDate: '', distanceMeter: '1200', maxLanes: '12' };
const INIT_REF = { raceId: '', refereeId: '' };

// Màu theo trạng thái sẵn sàng xếp lanes của tournaments
const HINT_TONE: Record<string, string> = {
  wait: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  ready: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  info: 'text-muted bg-white/5 border-glass-border',
};

type Modal = 'none' | 'race' | 'lanes' | 'referee' | 'detail';

const fixMojibake = (str: string): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
};

// Detect race type from name for badge
function raceTypeBadge(name: string = ''): { label: string; cls: string } | null {
  const n = name.toLowerCase();
  if (n.includes('chung kết') || n.includes('chung ket') || n.includes('final')) {
    return { label: '🏆 Chung kết', cls: 'text-gold bg-gold/15 border-gold/30' };
  }
  if (n.includes('sơ loại') || n.includes('so loai') || n.includes('heat') || n.includes('vòng loại')) {
    return { label: '⚡ Qualifier', cls: 'text-orange-400 bg-orange-500/10 border-orange-500/25' };
  }
  return null;
}

// Even-split: distribute N horses into heats of ≤12, return array of sizes
function calcHeats(total: number): number[] {
  if (total <= 0) return [];
  if (total <= 12) return [total];
  const n = Math.ceil(total / 12);
  const base = Math.floor(total / n);
  const rem = total % n;
  return Array.from({ length: n }, (_, i) => (i < rem ? base + 1 : base));
}

// "2026-07-04T18:30:00" -> "04/07/2026 18:30"
function fmtDate(v: any): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function AdminRacesPage() {
  const { showToast } = useNotifications();
  const [modal, setModal] = useState<Modal>('none');

  // List Tournaments and Races
  const [tournamentsList, setTournamentsList] = useState<any[]>([]);
  const [racesList, setRacesList] = useState<any[]>([]);
  const [registrationsList, setRegistrationsList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Thu gọn/mở rộng từng tournaments (mặc định thu gọn — bấm mũi tên để đổ detail vòng/races)
  const [openTournaments, setOpenTournaments] = useState<Set<number>>(new Set());
  const [tourPage, setTourPage] = useState(1);

  // Sắp xếp danh sách tournaments
  type SortKey = 'newest' | 'oldest' | 'name' | 'status';
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // Lọc theo trạng thái tournaments + tìm kiếm theo tên
  type StatusFilter = 'all' | 'active' | 'upcoming' | 'completed';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  function toggleTournament(id: number) {
    setOpenTournaments(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Generate races loading status
  const [generatingForTournament, setGeneratingForTournament] = useState<number | null>(null);

  // Create Race
  const [raceForm, setRaceForm] = useState(INIT_RACE);
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceError, setRaceError] = useState('');

  // Ghép lanes (modal 'lanes'): race đang chọn + lựa chọn horse cho từng lanes empty
  const [laneRaceId, setLaneRaceId] = useState('');
  const [laneEntries, setLaneEntries] = useState<any[]>([]);  // entry assigned sẵn
  const [laneSel, setLaneSel] = useState<Record<number, string>>({}); // laneNo -> registrationId
  const [laneLoading, setLaneLoading] = useState(false);
  const [laneSaving, setLaneSaving] = useState(false);
  const [laneMsg, setLaneMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [swapFromEntry, setSwapFromEntry] = useState<any | null>(null);
  const [swapToLane, setSwapToLane] = useState<number>(0);
  const [withdrawingEntryId, setWithdrawingEntryId] = useState<number | null>(null);

  // Detail races (modal 'detail'): sơ đồ lanes 3D + trọng tài
  const [detailRace, setDetailRace] = useState<any | null>(null);
  const [detailEntries, setDetailEntries] = useState<any[]>([]);
  const [detailRefs, setDetailRefs] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Referee
  const [refForm, setRefForm] = useState(INIT_REF);
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState('');
  const [referees, setReferees] = useState<any[]>([]);
  const [refereeOptions, setRefereeOptions] = useState<any[]>([]);
  const [refViewLoading, setRefViewLoading] = useState(false);

  function setR(field: string, v: string) { setRaceForm(p => ({ ...p, [field]: v })); }
  function setF(field: string, v: string) { setRefForm(p => ({ ...p, [field]: v })); }

  async function loadAllData() {
    setLoadingData(true);
    setFetchError('');
    try {
      const [tRes, rRes, regRes, refRes] = await Promise.all([
        getTournaments(),
        getRaceSchedule(),
        getRegistrations(),
        getReferees()
      ]);

      const tournaments = tRes?.result ?? (Array.isArray(tRes) ? tRes : []);
      const races = rRes?.result ?? (Array.isArray(rRes) ? rRes : []);
      const registrations = regRes?.result ?? (Array.isArray(regRes) ? regRes : []);
      const fetchedReferees = refRes?.result ?? (Array.isArray(refRes) ? refRes : []);

      setTournamentsList(tournaments.map((t: any) => ({
        ...t,
        name: fixMojibake(t.name)
      })));

      setRacesList(races.map((r: any) => ({
        ...r,
        name: fixMojibake(r.name)
      })));

      setRegistrationsList(registrations.map((r: any) => ({
        ...r,
        horseName: fixMojibake(r.horseName),
        ownerName: fixMojibake(r.ownerName),
        tournamentName: fixMojibake(r.tournamentName),
        healthStatus: r.healthStatus ?? 'Healthy',
      })));

      setRefereeOptions(fetchedReferees.map((r: any) => ({
        ...r,
        fullName: fixMojibake(r.fullName ?? r.FullName ?? ''),
        email: r.email ?? r.Email,
        licenseNumber: r.licenseNumber ?? r.LicenseNumber,
        status: r.status ?? r.Status,
        refereeId: r.refereeId ?? r.RefereeId ?? r.id
      })));
    } catch (err: any) {
      setFetchError(parseApiError(err));
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  async function handleGenerateRaces(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    try {
      await generateTournamentRaces(tournamentId);
      showToast('Success', 'Đã sinh races successful!');
      await loadAllData();
    } catch (err: any) {
      showToast('Error', 'Error khi sinh races: ' + parseApiError(err), 'error');
    } finally {
      setGeneratingForTournament(null);
    }
  }

  async function handleGenerateFinal(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    try {
      await generateFinalRace(tournamentId);
      showToast('Success', 'Đã xếp bảng Chung kết (Top 12) successful!');
      await loadAllData();
    } catch (err: any) {
      showToast('Error', 'Error khi xếp bảng Chung kết: ' + parseApiError(err), 'error');
    } finally {
      setGeneratingForTournament(null);
    }
  }

  function openRaceModal(roundId?: number) {
    setRaceForm({
      roundId: roundId ? String(roundId) : '',
      name: '',
      raceDate: '',
      distanceMeter: '1200',
      maxLanes: '12'
    });
    setModal('race');
  }

  function closeModal() {
    setModal('none');
    setRaceError(''); setRaceForm(INIT_RACE);
    setLaneRaceId(''); setLaneEntries([]); setLaneSel({}); setLaneMsg(null);
    setSwapFromEntry(null); setSwapToLane(0);
    setRefError(''); setRefForm(INIT_REF);
    setReferees([]);
    setDetailRace(null); setDetailEntries([]); setDetailRefs([]);
  }

  async function handleCreateRace() {
    setRaceError('');
    if (!raceForm.roundId || !raceForm.name || !raceForm.raceDate || !raceForm.distanceMeter || !raceForm.maxLanes) {
      setRaceError('Please fill in all fields.');
      return;
    }
    setRaceLoading(true);
    try {
      const data: any = await createRace({
        roundId: Number(raceForm.roundId),
        name: raceForm.name,
        raceDate: raceForm.raceDate,
        distanceMeter: Number(raceForm.distanceMeter),
        maxLanes: Number(raceForm.maxLanes),
      });
      const newId = data?.result?.id ?? data?.result?.raceId ?? data?.raceId;
      showToast('Success', newId != null
        ? `Race created "${raceForm.name}" successful! (ID = ${newId})`
        : `Race created "${raceForm.name}" successful!`);
      closeModal();
      await loadAllData();
    } catch (err: unknown) {
      setRaceError(parseApiError(err as Error));
    } finally {
      setRaceLoading(false);
    }
  }

  /* ═══════════ Ghép lanes — form sinh dropdown theo số lanes ═══════════ */

  // Mở từ nút trên từng card race: races được KHÓA theo card đã bấm (không cho đổi)
  async function openLanes(raceId: number) {
    setModal('lanes');
    setLaneMsg(null); setLaneSel({});
    await selectLaneRace(String(raceId));
  }

  async function selectLaneRace(rid: string) {
    setLaneRaceId(rid);
    setLaneSel({}); setLaneMsg(null); setLaneEntries([]);
    if (!rid) return;
    setLaneLoading(true);
    try {
      const d: any = await getRaceEntries(Number(rid));
      const raw = d?.result ?? (Array.isArray(d) ? d : []);
      setLaneEntries(raw.map((e: any) => ({
        ...e,
        horseName: fixMojibake(e.horseName),
        jockeyName: fixMojibake(e.jockeyName)
      })));
    } catch { setLaneEntries([]); }
    finally { setLaneLoading(false); }
  }

  const laneRace = racesList.find(r => String(r.raceId ?? r.id) === laneRaceId);
  const maxLanes = Number(laneRace?.maxLanes ?? 0);

  // Đơn hợp lệ cho race này: đúng giải + Approved + chưa có entry (theo đơn & theo horse)
  const eligibleRegs = useMemo(() => {
    if (!laneRace) return [];
    const takenRegIds = new Set(laneEntries.map((e: any) => e.registrationId));
    const takenHorseIds = new Set(laneEntries.map((e: any) => e.horseId));
    return registrationsList.filter(r => {
      const regId = r.registrationId ?? r.id;
      return Number(r.tournamentId ?? r.TournamentId) === Number(laneRace.tournamentId)
        && (r.status ?? '').toLowerCase() === 'approved'
        && (r.healthStatus ?? 'Healthy').toLowerCase() === 'healthy'
        && !takenRegIds.has(regId) && !takenHorseIds.has(r.horseId);
    });
  }, [registrationsList, laneEntries, laneRace]);

  async function handleSaveLanes() {
    const picks = Object.entries(laneSel).filter(([, regId]) => regId);
    if (picks.length === 0) {
      setLaneMsg({ ok: false, text: 'No horses selected for any lane. Please select at least one lane.' });
      return;
    }
    setLaneSaving(true); setLaneMsg(null);
    const errors: string[] = [];
    let okCount = 0;
    // POST tuần tự từng lanes — BE chỉ có API ghép từng entry
    for (const [laneNo, regId] of picks) {
      try {
        await createRaceEntry(Number(laneRaceId), { registrationId: Number(regId), laneNo: Number(laneNo) });
        okCount++;
      } catch (err: unknown) {
        errors.push(`Lane ${laneNo}: ${parseApiError(err as Error)}`);
      }
    }
    setLaneSaving(false);
    if (errors.length === 0) {
      // Success trọn vẹn: đóng modal + toast, quay về danh sách
      showToast('Success', `Successfully assigned ${okCount} lanes cho races "${laneRace?.name ?? ''}"!`);
      closeModal();
      await loadAllData();
    } else {
      // Có lỗi: giữ modal để admin xử lý tiếp, hiện chi tiết lỗi
      if (okCount > 0) showToast('Success', `Assigned ${okCount} lanes.`);
      setLaneSel({});
      await selectLaneRace(laneRaceId);
      setLaneMsg({ ok: false, text: `Error: ${errors.join(' | ')}` });
    }
  }

  /* ═══════════ Detail races ═══════════ */

  async function openDetail(race: any) {
    setModal('detail');
    setDetailRace(race);
    setDetailEntries([]); setDetailRefs([]);
    setDetailLoading(true);
    const rid = Number(race.raceId ?? race.id);
    const [entries, refs] = await Promise.allSettled([getRaceEntries(rid), getRaceReferees(rid)]);
    if (entries.status === 'fulfilled') {
      const v: any = entries.value;
      const raw = v?.result ?? (Array.isArray(v) ? v : []);
      setDetailEntries(raw.map((e: any) => ({
        ...e,
        horseName: fixMojibake(e.horseName),
        jockeyName: fixMojibake(e.jockeyName)
      })));
    }
    if (refs.status === 'fulfilled') {
      // API referees trả mảng thô (không bọc trong result)
      const v: any = refs.value;
      const raw = v?.result ?? (Array.isArray(v) ? v : []);
      setDetailRefs(raw.map((r: any) => ({
        ...r,
        fullName: fixMojibake(r.fullName),
        refereeName: fixMojibake(r.refereeName)
      })));
    }
    setDetailLoading(false);
  }

  /* ═══════════ Referee ═══════════ */

  // Mở từ nút trên từng card race: races được KHÓA, tự tải danh sách trọng tài hiện tại
  async function openRefereeModal(raceId: number) {
    setRefForm({ raceId: String(raceId), refereeId: '' });
    setReferees([]);
    setModal('referee');
    await handleViewReferees(String(raceId));
  }

  async function handleAssignReferee() {
    setRefError('');
    if (!refForm.raceId || !refForm.refereeId) {
      setRefError('Please select a race and referee.');
      return;
    }
    setRefLoading(true);
    try {
      await assignReferee(Number(refForm.raceId), Number(refForm.refereeId));
      const refName = refereeOptions.find(r => String(r.refereeId) === refForm.refereeId)?.fullName;
      const raceName = racesList.find(r => String(r.raceId) === refForm.raceId)?.name;
      showToast('Success', `Successfully assigned referee ${refName ? `"${refName}" ` : ''}cho races "${raceName ?? ''}"!`);
      setRefForm(p => ({ ...p, refereeId: '' }));
      await handleViewReferees(refForm.raceId);
    } catch (err: unknown) {
      setRefError(parseApiError(err as Error));
    } finally {
      setRefLoading(false);
    }
  }

  async function handleViewReferees(raceId: string) {
    if (!raceId) { setReferees([]); return; }
    setRefViewLoading(true);
    try {
      const data: any = await getRaceReferees(Number(raceId));
      const raw = data?.result ?? (Array.isArray(data) ? data : []);
      setReferees(raw.map((r: any) => ({
        ...r,
        fullName: fixMojibake(r.fullName),
        refereeName: fixMojibake(r.refereeName)
      })));
    } catch {
      setReferees([]);
    } finally {
      setRefViewLoading(false);
    }
  }

  async function handleRemoveReferee(raceId: string, refereeId: number) {
    try {
      await removeReferee(Number(raceId), refereeId);
      setReferees(prev => prev.filter(r => (r.id ?? r.refereeId) !== refereeId));
    } catch (err: unknown) {
      showToast('Error', parseApiError(err as Error), 'error');
    }
  }

  async function handleWithdrawEntry(raceEntryId: number, horseName: string) {
    if (!window.confirm(`Remove "${horseName}" from the race? This action cannot be undone.`)) return;
    setWithdrawingEntryId(raceEntryId);
    try {
      await withdrawRaceEntry(raceEntryId, 'Health does not meet criteria to participate');
      showToast('Đã loại bỏ', `Horse "${horseName}" has been withdrawn from the race.`);
      if (modal === 'lanes') await selectLaneRace(laneRaceId);
      if (modal === 'detail' && detailRace) await openDetail(detailRace);
    } catch (err: unknown) {
      showToast('Error', parseApiError(err as Error), 'error');
    } finally {
      setWithdrawingEntryId(null);
    }
  }

  async function handleDeleteRace(raceId: number, raceName?: string) {
    const label = raceName ? `"${raceName}"` : `#${raceId}`;
    if (!window.confirm(`Delete race ${label}? Lanes, results, referees, violations, bets, and predictions related will also be deleted.`)) {
      return;
    }

    try {
      await deleteRace(raceId);
      showToast('Success', `Đã xóa races ${label}.`);
      await loadAllData();
    } catch (err: unknown) {
      showToast('Error', parseApiError(err as Error), 'error');
    }
  }

  const groupedTournaments = tournamentsList.map(t => {
    const tRaces = racesList.filter(r => r.tournamentId === t.tournamentId);

    const rounds = (t.rounds ?? []).map((r: any) => {
      const rRaces = tRaces.filter(race => race.roundId === r.roundId);
      return {
        ...r,
        races: rRaces
      };
    });

    const prefinalRound = rounds.find((r: any) => r.roundNumber === 1);
    const finalRound = rounds.find((r: any) => r.roundNumber === 2);
    const hasPrefinalRaces = Boolean(prefinalRound && prefinalRound.races.length > 0);
    const prefinalFinished = Boolean(
      prefinalRound &&
      prefinalRound.races.length > 0 &&
      prefinalRound.races.every((r: any) => r.status === 'Finished' || r.status === 'Completed')
    );

    const finalRaces = finalRound?.races ?? [];
    const finalDone = finalRaces.length > 0
      && finalRaces.every((r: any) => r.status === 'Finished' || r.status === 'Completed');

    // Chỉ cho xếp Final khi Pre xong mà CHƯA có race Chung kết nào
    // (BE đã tự sinh Final khi race Pre cuối nộp kết quả — nút này là dự phòng)
    const canGenerateFinal = prefinalFinished && hasPrefinalRaces && finalRaces.length === 0;
    const canGeneratePre = !prefinalFinished;
    const waitingLabel = hasPrefinalRaces && !prefinalFinished
      ? 'Pending completed Pre'
      : '';

    // ── Status sẵn sàng xếp lanes (để admin biết trước khi bấm nút) ──
    const now = new Date();
    const regStart = t.registrationStartDate ? new Date(t.registrationStartDate) : null;
    const regEnd = t.registrationEndDate ? new Date(t.registrationEndDate) : null;
    const regNotStarted = regStart != null && now < regStart;
    const regOpen = !regNotStarted && (regEnd ? now < regEnd : false);
    const hasAnyRaces = rounds.some((r: any) => r.races.length > 0);

    let genHint: { tone: string; label: string; detail: string };
    if (regNotStarted) {
      genHint = {
        tone: 'wait',
        label: 'Registration not open',
        detail: `Registration opens at ${fmtDate(t.registrationStartDate)} and closes at ${fmtDate(t.registrationEndDate)}. After registration closes, you can Auto Assign Lanes.`,
      };
    } else if (regOpen) {
      genHint = {
        tone: 'wait',
        label: 'Cannot assign lanes — registration still open',
        detail: `Registration closed at ${fmtDate(t.registrationEndDate)}. Must wait for registration to close to Auto Assign Lanes (Pre-round).`,
      };
    } else if (!hasAnyRaces) {
      genHint = {
        tone: 'ready',
        label: 'Ready to assign Pre-lanes',
        detail: "Registration closed. Click 'Auto Assign Lanes' to auto-generate Pre-round.",
      };
    } else if (canGenerateFinal) {
      genHint = {
        tone: 'ready',
        label: 'Ready to assign Finals',
        detail: "Pre-round is completed but Finals bracket not found. The system usually auto-generates it — if not, click 'Auto Assign Final (Top 12)'.",
      };
    } else if (waitingLabel === 'Pending completed Pre') {
      genHint = {
        tone: 'progress',
        label: 'Competing in Pre-round',
        detail: 'Pending all Pre-round races completion to assign Finals.',
      };
    } else if (finalDone) {
      genHint = {
        tone: 'info',
        label: 'Tournament completed',
        detail: 'Pre-round and Finals are completed — publish results in Results & Publish page.',
      };
    } else if (prefinalFinished && finalRaces.length > 0) {
      genHint = {
        tone: 'progress',
        label: 'Competing in Finals',
        detail: 'Pre-round is completed, Finals bracket (Top 12) is created and pending race.',
      };
    } else {
      genHint = { tone: 'info', label: 'Race scheduled', detail: '' };
    }

    return {
      ...t,
      rounds,
      canGeneratePre,
      canGenerateFinal,
      waitingLabel,
      regNotStarted,
      regOpen,
      hasAnyRaces,
      genHint,
    };
  });

  // Đếm số giải theo trạng thái (cho thanh filter)
  const statsCounts: Record<StatusFilter, number> = {
    all: groupedTournaments.length,
    active: groupedTournaments.filter(t => t.status === 'Active').length,
    upcoming: groupedTournaments.filter(t => t.status === 'Upcoming').length,
    completed: groupedTournaments.filter(t => t.status === 'Completed').length,
  };
  const FILTER_LABELS: Record<StatusFilter, string> = {
    all: 'All', active: 'Active', upcoming: 'Upcoming', completed: 'Completed',
  };

  const filteredTournaments = groupedTournaments.filter(t => {
    const matchesSearch = (t.name ?? '').toLowerCase().includes(search.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && (t.status ?? '').toLowerCase() === statusFilter;
  });

  // Sắp xếp theo lựa chọn: mới nhất / cũ nhất (theo days bắt đầu), tên A-Z, trạng thái
  const STATUS_ORDER: Record<string, number> = { Active: 0, Upcoming: 1, Completed: 2 };
  const sortedTournaments = [...filteredTournaments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime();
      case 'name':
        return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'vi');
      case 'status':
        return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      case 'newest':
      default:
        return new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime();
    }
  });

  const activeRefereeOptions = refereeOptions.filter((ref: any) =>
    String(ref.status ?? '').toLowerCase() === 'active'
  );
  const visibleRefereeOptions = (activeRefereeOptions.length > 0 ? activeRefereeOptions : refereeOptions)
    // Ẩn trọng tài đã được phân công vào races đang chọn
    .filter((ref: any) => !referees.some(a => (a.refereeId ?? a.id) === ref.refereeId));

  const refRace = racesList.find(r => String(r.raceId ?? r.id) === refForm.raceId);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Manage races"
            subtitle="Schedule, assign horses and referees"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => openRaceModal()} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Add Race
              </button>
            }
          />

          {loadingData && (
            <LoadingSkeleton rows={4} h="h-24" />
          )}

          {fetchError && (
            <div className="px-6 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Error loading data: {fetchError}
            </div>
          )}

          {!loadingData && !fetchError && groupedTournaments.length === 0 && (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">No tournaments yet</div>
              <div className="text-muted/60 text-xs mt-1">Please create tournaments in Tournament Management first.</div>
            </div>
          )}

          {!loadingData && !fetchError && groupedTournaments.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'active', 'upcoming', 'completed'] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setTourPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    statusFilter === s ? 'border-gold/40 bg-gold/10 text-champagne' : 'border-glass-border text-muted hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {FILTER_LABELS[s]}
                  <span className="ml-2 text-[11px] font-bold text-current opacity-60">{statsCounts[s]}</span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-56">
                <Search size={14} className="text-muted shrink-0" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setTourPage(1); }}
                  placeholder="Search tournaments..."
                  className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-muted" />
                <span className="text-xs text-muted font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => { setSortBy(e.target.value as SortKey); setTourPage(1); }}
                  className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 transition-colors"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name A-Z</option>
                  <option value="status">Status (Active first)</option>
                </select>
              </div>
            </div>
          )}

          {!loadingData && !fetchError && groupedTournaments.length > 0 && sortedTournaments.length === 0 && (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">No matching tournaments found</div>
            </div>
          )}

          {!loadingData && !fetchError && sortedTournaments.length > 0 && (() => {
            const { paged: pagedTournaments, totalPages: tourTotalPages, total: tourTotal, page: tourSafePage } = paginate(sortedTournaments, tourPage, 5);
            return (
            <div className="space-y-6">
              {pagedTournaments.map(t => {
                const isOpen = openTournaments.has(t.tournamentId);
                return (
                <div key={t.tournamentId} className={`glass-panel rounded-xl p-6 relative overflow-hidden animate-fade-in ${isOpen ? 'space-y-6' : ''}`}>
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />

                  {/* Tournament Header — bấm để đổ detail vòng & races */}
                  <div className={`flex flex-wrap items-center justify-between gap-4 ${isOpen ? 'border-b border-glass-border pb-4' : ''}`}>
                    <button onClick={() => toggleTournament(t.tournamentId)} className="text-left group flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronUp size={16} className="text-gold shrink-0" /> : <ChevronDown size={16} className="text-muted group-hover:text-gold shrink-0 transition-colors" />}
                        <Trophy size={18} className="text-gold" />
                        <h2 className="text-lg font-serif text-white font-bold truncate group-hover:text-champagne transition-colors">{t.name}</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                          t.status === 'Active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          t.status === 'Upcoming' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                          'text-muted bg-white/5 border-glass-border'
                        }`}>
                          {t.status === 'Active' ? 'Active' : t.status === 'Upcoming' ? 'Upcoming' : 'Completed'}
                        </span>
                        {!isOpen && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-champagne shrink-0">
                            {t.rounds.reduce((s: number, r: any) => s + r.races.length, 0)} races
                          </span>
                        )}
                      </div>
                      {t.startDate && t.endDate && (
                        <p className="text-xs text-muted/80 mt-1 pl-6">
                          Time: {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                        </p>
                      )}
                      <span className={`inline-flex items-center gap-1.5 mt-2 ml-6 text-[10px] font-bold px-2.5 py-1 rounded-full border ${HINT_TONE[t.genHint.tone]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.genHint.tone === 'wait' ? 'bg-yellow-400' : t.genHint.tone === 'ready' ? 'bg-emerald-400' : t.genHint.tone === 'progress' ? 'bg-blue-400' : 'bg-muted'}`} />
                        {t.genHint.label}
                      </span>
                    </button>

                    <div className="flex items-center gap-3">
                      {/* Prefinal generation — chỉ cho bấm khi đã đóng đăng ký */}
                      {t.canGeneratePre && !t.regOpen && !t.regNotStarted && (
                        <button
                          onClick={() => handleGenerateRaces(t.tournamentId)}
                          disabled={generatingForTournament === t.tournamentId}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          {generatingForTournament === t.tournamentId ? (
                            <>
                              <Loader size={12} className="animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Auto Assign Lanes'
                          )}
                        </button>
                      )}

                      {/* Register chưa mở / còn mở → chưa thể xếp lanes */}
                      {(t.regOpen || t.regNotStarted) && !t.hasAnyRaces && (
                        <button
                          disabled
                          title={t.regNotStarted
                            ? `Registration opens at ${fmtDate(t.registrationStartDate)}, đóng lúc ${fmtDate(t.registrationEndDate)}.`
                            : `Registration closed at ${fmtDate(t.registrationEndDate)}. Pending registration expiry to assign lanes.`}
                          className="px-4 py-2 bg-white/[0.04] text-muted border border-glass-border text-xs font-bold rounded-lg cursor-not-allowed flex items-center gap-1.5"
                        >
                          <AlertCircle size={12} /> {t.regNotStarted ? 'Registration not open' : 'Pending đóng đăng ký'}
                        </button>
                      )}

                      {/* Final generation */}
                      {t.canGenerateFinal && (
                        <button
                          onClick={() => handleGenerateFinal(t.tournamentId)}
                          disabled={generatingForTournament === t.tournamentId}
                          className="px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 animate-pulse"
                        >
                          {generatingForTournament === t.tournamentId ? (
                            <>
                              <Loader size={12} className="animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Auto Assign Final (Top 12)'
                          )}
                        </button>
                      )}
                      {t.rounds?.[0]?.races?.length > 0 && !t.canGenerateFinal && t.waitingLabel && (
                        <button
                          disabled
                          className="px-4 py-2 bg-white/[0.04] text-muted border border-glass-border text-xs font-bold rounded-lg cursor-not-allowed"
                        >
                          {t.waitingLabel}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rounds — chỉ hiển thị khi tournaments được mở rộng */}
                  {isOpen && (
                  <div className="grid grid-cols-1 gap-6">
                    {/* Banner trạng thái xếp lanes */}
                    <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${HINT_TONE[t.genHint.tone]}`}>
                      {t.genHint.tone === 'wait' ? <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        : t.genHint.tone === 'ready' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                        : t.genHint.tone === 'progress' ? <Loader size={16} className="shrink-0 mt-0.5 animate-spin" />
                        : <Flag size={16} className="shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{t.genHint.label}</div>
                        {t.genHint.detail && <div className="text-xs opacity-90 mt-0.5">{t.genHint.detail}</div>}
                        {t.genHint.tone === 'wait' && (
                          <div className="mt-2">
                            {t.regNotStarted && t.registrationStartDate ? (
                              <CountdownTimer target={t.registrationStartDate} utc={false} label="Registration opens in:" />
                            ) : t.registrationEndDate ? (
                              <CountdownTimer target={t.registrationEndDate} utc={false} />
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {t.rounds.length === 0 && (
                      <div className="text-xs text-muted/50 italic py-2 text-center">
                        No rounds. After registration closes, use 'Auto Assign Lanes' to generate Pre-round.
                      </div>
                    )}

                    {t.rounds.map((r: any) => (
                      <div key={r.roundId} className="space-y-3 bg-navy/20 p-4 rounded-xl border border-glass-border/40">
                        <div className="flex items-center justify-between border-b border-glass-border/30 pb-2">
                          <h3 className="text-sm font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
                            <span>{r.name}</span>
                            <span className="text-[10px] text-muted normal-case font-normal">
                              ({r.roundNumber === 1 ? 'Prefinal Round - Qualifier' : 'Final Round - Finals'})
                            </span>
                          </h3>
                          <button
                            onClick={() => openRaceModal(r.roundId)}
                            className="text-[11px] text-gold hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Plus size={12} /> Add Race Manually
                          </button>
                        </div>

                        {r.races.length === 0 ? (
                          <div className="text-xs text-muted/50 italic py-4">
                            No races scheduled. Use auto-assign or add manually.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {r.races.map((race: any) => {
                              return (
                                <div
                                  key={race.raceId}
                                  className="bg-navy/40 border rounded-xl overflow-hidden transition-all duration-300 border-glass-border hover:border-white/10"
                                >
                                  <div className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                                          🏁 {race.name}
                                          {raceTypeBadge(race.name) && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${raceTypeBadge(race.name)!.cls}`}>
                                              {raceTypeBadge(race.name)!.label}
                                            </span>
                                          )}
                                        </h4>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                          (race.status === 'Finished' || race.status === 'Completed') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                          race.status === 'Live' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                          {(race.status === 'Finished' || race.status === 'Completed') ? 'Completed' : race.status === 'Live' ? 'Active' : 'Scheduled'}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[11px] text-muted flex items-center gap-1 justify-end">
                                          <Calendar size={11} />
                                          {new Date(race.raceDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                        </div>
                                        <div className="text-[10px] text-muted/80 mt-0.5">
                                          Distance: {race.distanceMeter}m | Max lanes: {race.maxLanes}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-glass-border/30">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => openDetail(race)}
                                          title="Details & 3D Lane Map"
                                          className="p-1.5 rounded-lg text-champagne hover:bg-gold/15 border border-transparent hover:border-gold/20 transition-colors"
                                        >
                                          <Eye size={13} />
                                        </button>
                                        <button
                                          onClick={() => openLanes(race.raceId)}
                                          title="Assign horse to lanes"
                                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-colors"
                                        >
                                          <ListOrdered size={13} />
                                        </button>
                                        <button
                                          onClick={() => openRefereeModal(race.raceId)}
                                          title="Assign referees"
                                          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-colors"
                                        >
                                          <UserCheck size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRace(race.raceId, race.name)}
                                          title="Delete race"
                                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  )}
                </div>
                );
              })}

              {/* Phân trang danh sách tournaments */}
              {tourTotalPages > 1 && (
                <div className="glass-panel rounded-xl overflow-hidden">
                  <Pager page={tourSafePage} totalPages={tourTotalPages} total={tourTotal} onChange={setTourPage} />
                </div>
              )}
            </div>
            );
          })()}

        </main>
      </div>

      {/* ── Modal: Add Race ── */}
      {modal === 'race' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Flag size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Add New Race</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Tournament Round *</label>
                <select
                  value={raceForm.roundId}
                  onChange={e => setR('roundId', e.target.value)}
                  className={`${INPUT} bg-navy`}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">-- Select Round --</option>
                  {tournamentsList.map(t => (
                    <optgroup key={t.tournamentId} label={t.name}>
                      {(t.rounds ?? []).map((r: any) => (
                        <option key={r.roundId} value={r.roundId}>
                          {r.name} (Round {r.roundNumber})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Race Name *</label>
                <input value={raceForm.name} onChange={e => setR('name', e.target.value)} placeholder="VD: Race 1 (Prefinal)" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Race Date & Time *</label>
                <input type="datetime-local" value={raceForm.raceDate} onChange={e => setR('raceDate', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Distance (m) *</label>
                  <input value={raceForm.distanceMeter} onChange={e => setR('distanceMeter', e.target.value)} type="number" min="100" placeholder="VD: 1200" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Number of Lanes *</label>
                  <input value={raceForm.maxLanes} onChange={e => setR('maxLanes', e.target.value)} type="number" min="1" placeholder="VD: 12" className={INPUT} />
                </div>
              </div>
              {raceError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{raceError}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleCreateRace} disabled={raceLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {raceLoading ? 'Creating...' : 'Save Race'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Assign horse to lanes — sinh dropdown theo số lanes ── */}
      {modal === 'lanes' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-2xl border border-blue-500/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ListOrdered size={15} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-serif text-white">Assign Horses to Lanes</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 via-glass-border to-transparent" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Race đã được khóa theo card admin bấm — không cho đổi để tránh ghép nhầm giải */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Flag size={15} className="text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{laneRace?.name ?? '—'}</div>
                  <div className="text-[11px] text-muted truncate">
                    {laneRace?.tournamentName ?? ''}{laneRace?.roundName ? ` • ${laneRace.roundName}` : ''} • {maxLanes} lanes • {fmtDate(laneRace?.raceDate)}
                  </div>
                </div>
              </div>

              {laneRaceId && (
                <div className="text-[11px] text-champagne/80 bg-gold/5 border border-gold/15 rounded-lg px-3 py-2 leading-relaxed">
                  Select a horse for each empty lane and click <b>"Save Selected Lanes"</b>.
                  Only displays horses with <b>approved status (Approved) + Healthy status</b>, not yet assigned — horses selected in other lanes will be hidden.
                  Jockey is automatically assigned based on accepted jockey contract.
                </div>
              )}

              {/* Warning: Approved but not Healthy */}
              {laneRaceId && (() => {
                const unhealthy = registrationsList.filter(r =>
                  Number(r.tournamentId ?? r.TournamentId) === Number(laneRace?.tournamentId)
                  && (r.status ?? '').toLowerCase() === 'approved'
                  && (r.healthStatus ?? 'Healthy').toLowerCase() !== 'healthy'
                );
                if (unhealthy.length === 0) return null;
                return (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-[11px] text-red-400 space-y-1">
                    <div className="font-bold">⚠ {unhealthy.length} horses Approved but unhealthy (excluded from lane assignment)</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {unhealthy.map(r => (
                        <span key={r.registrationId ?? r.id} className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-300">
                          {r.horseName} — <span className="font-bold">{r.healthStatus}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Feature 1: Auto-split hint — sơ loại vs chung kết */}
              {laneRaceId && (() => {
                const totalApproved = eligibleRegs.length + laneEntries.length;
                if (totalApproved === 0) return null;
                if (totalApproved <= 12) {
                  return (
                    <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/25 px-3 py-2.5 text-[11px] text-emerald-400 space-y-0.5">
                      <div className="font-bold">🏆 Direct finals race</div>
                      <div><b>{totalApproved}</b> eligible horses ≤ 12 → all <b>{totalApproved}</b> horses go straight to this finals race, no qualifiers needed.</div>
                    </div>
                  );
                }
                const heats = calcHeats(totalApproved);
                return (
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 px-3 py-2.5 space-y-2 text-[11px]">
                    <div className="font-bold text-orange-400">⚡ Need qualifier races before finals</div>
                    <div className="text-orange-400"><b>{totalApproved}</b> eligible horses &gt; 12 → split evenly into <b>{heats.length}</b> qualifier races:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {heats.map((size, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/25 text-orange-400 font-bold">Qualifier {i + 1}: {size} horse</span>
                      ))}
                      <span className="px-2.5 py-1 rounded-lg bg-gold/15 border border-gold/30 text-gold font-bold">🏆 Finals: 12 horses</span>
                    </div>
                    <div className="text-orange-400/80">After qualifiers → choose <b className="text-orange-400">12 horses with best race times</b> → finals race. Please create <b>{heats.length}</b> qualifier races + <b>1</b> finals race in this round.</div>
                  </div>
                );
              })()}

              {laneLoading ? (
                <LoadingSkeleton />
              ) : laneRaceId && maxLanes > 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: maxLanes }, (_, idx) => idx + 1).map(laneNo => {
                    const existing = laneEntries.find((e: any) => e.laneNo === laneNo);
                    if (existing) {
                      // Feature 4: lane swap mock UI
                      const isSwapping = swapFromEntry?.laneNo === laneNo;
                      const isUnhealthy = existing.healthStatus && existing.healthStatus.toLowerCase() !== 'healthy';
                      return (
                        <div key={laneNo} className="space-y-1">
                          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${isUnhealthy ? 'bg-red-500/8 border-red-500/30' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                            <span className={`w-14 shrink-0 text-xs font-bold ${isUnhealthy ? 'text-red-400' : 'text-emerald-400'}`}>Lane {laneNo}</span>
                            {isUnhealthy
                              ? <AlertCircle size={14} className="text-red-400 shrink-0" />
                              : <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                            <span className="text-sm text-white truncate">{existing.horseName ?? `Horse #${existing.horseId}`}</span>
                            {existing.jockeyName && <span className="text-xs text-muted truncate">• {existing.jockeyName}</span>}
                            {isUnhealthy && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 font-bold shrink-0">{existing.healthStatus}</span>
                            )}
                            <span className={`ml-auto text-[10px] uppercase font-bold shrink-0 mr-2 ${isUnhealthy ? 'text-red-400/70' : 'text-emerald-400/70'}`}>{isUnhealthy ? 'Unhealthy' : 'Assigned'}</span>
                            {isUnhealthy ? (
                              <button
                                onClick={() => handleWithdrawEntry(existing.raceEntryId, existing.horseName ?? `Horse #${existing.horseId}`)}
                                disabled={withdrawingEntryId === existing.raceEntryId}
                                className="text-[10px] px-2 py-1 rounded border border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25 shrink-0 font-bold disabled:opacity-50"
                              >{withdrawingEntryId === existing.raceEntryId ? '...' : 'Remove'}</button>
                            ) : (
                              <button
                                onClick={() => { setSwapFromEntry(existing); setSwapToLane(0); }}
                                className="text-[10px] px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shrink-0 font-bold"
                                title="Swap Lane [MOCK]"
                              >⇄ Đổi</button>
                            )}
                          </div>
                          {isSwapping && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/5 border border-blue-500/25">
                              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-1.5 py-0.5 rounded shrink-0">MOCK</span>
                              <span className="text-[11px] text-muted shrink-0">Switch to:</span>
                              <select value={swapToLane} onChange={e => setSwapToLane(Number(e.target.value))}
                                className="flex-1 bg-navy/50 border border-glass-border rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-blue-400/40"
                                style={{ colorScheme: 'dark' }}>
                                <option value={0}>— Select Target Lane —</option>
                                {Array.from({ length: maxLanes }, (_, i) => i + 1)
                                  .filter(l => l !== laneNo)
                                  .map(l => {
                                    const occ = laneEntries.find((e: any) => e.laneNo === l);
                                    return <option key={l} value={l}>Lane {l}{occ ? ` ↔ ${occ.horseName ?? 'horse'}` : ' (empty)'}</option>;
                                  })}
                              </select>
                              <button disabled={!swapToLane} onClick={() => {
                                if (!swapToLane) return;
                                const fromLane = laneNo; const toLane = swapToLane;
                                const toEntry = laneEntries.find((e: any) => e.laneNo === toLane);
                                setLaneEntries(prev => prev.map((e: any) => {
                                  if (e.laneNo === fromLane) return { ...e, laneNo: toLane };
                                  if (e.laneNo === toLane) return { ...e, laneNo: fromLane };
                                  return e;
                                }));
                                setSwapFromEntry(null); setSwapToLane(0);
                                showToast('Lane Swapped [MOCK]', toEntry
                                  ? `Swap Lane ${fromLane} ↔ Lane ${toLane}: ${existing.horseName} ↔ ${toEntry.horseName}`
                                  : `Move ${existing.horseName} from Lane ${fromLane} → Lane ${toLane}`);
                              }} className="text-[11px] px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 disabled:opacity-40 shrink-0 font-bold">Confirm</button>
                              <button onClick={() => { setSwapFromEntry(null); setSwapToLane(0); }} className="text-[11px] px-2 py-1 rounded-lg border border-glass-border text-muted hover:text-white shrink-0">Cancel</button>
                            </div>
                          )}
                        </div>
                      );
                    }
                    // Empty lane — dropdown chọn horse; ẩn horse đã chọn ở lanes khác
                    const usedElsewhere = new Set(Object.entries(laneSel).filter(([l]) => Number(l) !== laneNo).map(([, v]) => v).filter(Boolean));
                    const opts = eligibleRegs.filter(r => !usedElsewhere.has(String(r.registrationId ?? r.id)));
                    return (
                      <div key={laneNo} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/2 border border-glass-border">
                        <span className="w-14 shrink-0 text-xs font-bold text-muted">Lane {laneNo}</span>
                        <select
                          value={laneSel[laneNo] ?? ''}
                          onChange={e => setLaneSel(p => ({ ...p, [laneNo]: e.target.value }))}
                          className="flex-1 bg-navy/50 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400/40"
                          style={{ colorScheme: 'dark' }}>
                          <option value="">— Leave empty —</option>
                          {opts.map((r, i) => {
                            const regId = r.registrationId ?? r.id;
                            return <option key={regId ?? i} value={regId}>{r.horseName ?? `Horse #${r.horseId}`}{r.ownerName ? ` (${r.ownerName})` : ''}</option>;
                          })}
                        </select>
                      </div>
                    );
                  })}

                  {/* Entry lỗi: laneNo vượt quá số lanes (dữ liệu backend sai) */}
                  {laneEntries.some((e: any) => (e.laneNo ?? 0) > maxLanes) && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[11px] text-red-400">
                      ⚠ There are {laneEntries.filter((e: any) => (e.laneNo ?? 0) > maxLanes).length} horses assigned <b>exceeding {maxLanes} lanes</b> (dữ liệu lỗi từ backend):{' '}
                      {laneEntries.filter((e: any) => (e.laneNo ?? 0) > maxLanes).map((e: any) => `Lane ${e.laneNo} • ${e.horseName ?? 'Horse #' + e.horseId}`).join(', ')}
                    </div>
                  )}

                  {eligibleRegs.length === 0 && laneEntries.length < maxLanes && (
                    <p className="text-[11px] text-yellow-400/80 leading-relaxed px-1">
                      No more eligible horses to assign: requires registration <b>approved</b> in this tournament and not yet assigned to a race.
                    </p>
                  )}
                </div>
              ) : laneRaceId ? (
                <div className="text-center py-6 text-muted text-sm">Lanes have not been declared for this race.</div>
              ) : null}

              {laneMsg && (
                <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg border ${laneMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {laneMsg.ok ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                  <span>{laneMsg.text}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Close</button>
              <button onClick={handleSaveLanes} disabled={laneSaving || !laneRaceId}
                className="flex-1 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {laneSaving ? 'Saving...' : 'Save Selected Lanes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Detail races — thông tin + sơ đồ lanes 3D + trọng tài ── */}
      {modal === 'detail' && detailRace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-2xl border border-gold/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Eye size={15} className="text-gold" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-serif text-white truncate">{detailRace.name}</h2>
                <p className="text-[11px] text-muted">{detailRace.tournamentName ?? '—'}{detailRace.roundName ? ` • ${detailRace.roundName}` : detailRace.roundNumber != null ? ` • Round ${detailRace.roundNumber}` : ''}</p>
              </div>
              <div className="flex-1" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            {/* Information chung */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { l: 'Race Date', v: fmtDate(detailRace.raceDate) },
                { l: 'Cự ly', v: detailRace.distanceMeter != null ? `${detailRace.distanceMeter}m` : '—' },
                { l: 'Number of lanes', v: String(detailRace.maxLanes ?? '—') },
                { l: 'Status', v: detailRace.status ?? '—' },
              ].map(x => (
                <div key={x.l} className="rounded-lg bg-white/3 border border-glass-border px-3 py-2.5">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider">{x.l}</div>
                  <div className="text-sm text-white font-semibold mt-0.5">{x.v}</div>
                </div>
              ))}
            </div>

            {detailLoading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* Sơ đồ lanes 3D — scheduled/live: horse trong lanes; finished: bục trao giải theo hạng */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ListOrdered size={14} className="text-blue-400" />
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Lane Layout (3D)</span>
                    {(() => {
                      const maxL = Number(detailRace.maxLanes ?? 0);
                      const valid = detailEntries.filter((e: any) => (e.laneNo ?? 0) <= maxL).length;
                      const over = detailEntries.length - valid;
                      return (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-champagne">
                            {valid}/{maxL || '?'} assigned
                          </span>
                          {over > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold">
                              +{over} exceeded lanes (data error)
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <RaceTrack3D status={detailRace.status} maxLanes={Number(detailRace.maxLanes ?? 0)} entries={detailEntries} />

                  {/* Detail từng lanes (tên horse / jockey) */}
                  {detailEntries.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {[...detailEntries].sort((a: any, b: any) => (a.laneNo ?? 0) - (b.laneNo ?? 0)).map((e: any, i: number) => {
                        const isOver = (e.laneNo ?? 0) > Number(detailRace.maxLanes ?? 0);
                        const isUnhealthy = e.healthStatus && e.healthStatus.toLowerCase() !== 'healthy';
                        return (
                          <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isOver ? 'bg-red-500/10 border border-red-500/30' : isUnhealthy ? 'bg-red-500/8 border border-red-500/25' : 'bg-white/2 border border-glass-border'}`}>
                            <span className={`font-bold shrink-0 w-11 ${isOver || isUnhealthy ? 'text-red-400' : 'text-emerald-400'}`}>Lane {e.laneNo}</span>
                            <span className="text-white truncate">🐴 {e.horseName ?? `Horse #${e.horseId}`}</span>
                            <span className="text-muted truncate">{e.jockeyName ? `• ${e.jockeyName}` : '• None jockey'}</span>
                            {isOver && <span className="ml-auto font-bold text-red-400 shrink-0 text-[10px]">EXCEEDED LANE</span>}
                            {isUnhealthy && !isOver && (
                              <>
                                <span className="ml-auto font-bold text-red-400 shrink-0 text-[10px]">{e.healthStatus}</span>
                                <button
                                  onClick={() => handleWithdrawEntry(e.raceEntryId, e.horseName ?? `Horse #${e.horseId}`)}
                                  disabled={withdrawingEntryId === e.raceEntryId}
                                  className="text-[10px] px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/15 text-red-400 hover:bg-red-500/25 shrink-0 font-bold disabled:opacity-50"
                                >{withdrawingEntryId === e.raceEntryId ? '...' : 'Remove'}</button>
                              </>
                            )}
                            {!isOver && !isUnhealthy && e.finishPosition != null && <span className="ml-auto font-bold text-gold shrink-0">#{e.finishPosition}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Referee */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Referee in Charge</span>
                  </div>
                  {detailRefs.length === 0 ? (
                    <div className="text-xs text-muted/60 italic px-1">No referee assigned — use <UserCheck size={11} className="inline" /> button in list to assign.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {detailRefs.map((r: any, i: number) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          {r.refereeName ?? r.fullName ?? r.name ?? `Referee #${r.refereeId ?? r.id}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { const r = detailRace; closeModal(); openLanes(r.raceId ?? r.id); }}
                className="flex-1 py-2.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 text-sm font-bold transition-colors">
                Assign lanes for this race
              </button>
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Assign referees ── */}
      {modal === 'referee' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-cyan-500/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <UserCheck size={15} className="text-cyan-400" />
              </div>
              <h2 className="text-xl font-serif text-white">Assign referees</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/30 via-glass-border to-transparent" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Race đã được khóa theo card admin bấm */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <Flag size={15} className="text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{refRace?.name ?? '—'}</div>
                  <div className="text-[11px] text-muted truncate">{refRace?.tournamentName ?? ''} • {fmtDate(refRace?.raceDate)}</div>
                </div>
              </div>

              <div>
                <label className={LABEL}>Select Referee *</label>
                <select
                  value={refForm.refereeId}
                  onChange={e => setF('refereeId', e.target.value)}
                  className={INPUT}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">-- Select Referee --</option>
                  {visibleRefereeOptions.map((ref: any) => (
                    <option key={ref.refereeId} value={ref.refereeId}>
                      {ref.fullName || `Referee #${ref.refereeId}`} {ref.licenseNumber ? `- ${ref.licenseNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {refError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{refError}</div>}

              <button onClick={handleAssignReferee} disabled={refLoading} className="w-full py-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {refLoading ? 'Đang phân công…' : 'Assign referees'}
              </button>

              {/* Referee hiện tại của races — tự tải khi chọn races */}
              {refForm.raceId && (
                <div className="pt-2 border-t border-glass-border">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                    Referees of the race {refViewLoading ? '(loading...)' : `(${referees.length})`}
                  </div>
                  {referees.length > 0 ? (
                    <div className="space-y-2">
                      {referees.map((r, i) => {
                        const id = r.refereeId ?? r.id;
                        return (
                          <div key={id ?? i} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-glass-border">
                            <div>
                              <div className="text-sm text-white">{r.refereeName ?? r.fullName ?? r.name ?? `Referee #${id}`}</div>
                              {r.email && <div className="text-[11px] text-muted">{r.email}</div>}
                            </div>
                            <button
                              onClick={() => handleRemoveReferee(refForm.raceId, id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Remove referee">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : !refViewLoading && (
                    <div className="text-center py-3 text-muted text-xs">No referees assigned</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button onClick={closeModal} className="w-full py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
