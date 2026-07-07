import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flag, UserCheck, ListOrdered, Trash2, Calendar, ChevronDown, ChevronUp, Trophy, Loader, Eye, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { RaceTrack3D } from '../../components/ui/RaceTrack3D';
import { Pager, paginate } from '../../components/ui/Pager';
import { createRace, deleteRace, createRaceEntry, assignReferee, getRaceReferees, removeReferee, generateTournamentRaces, generateFinalRace, getRegistrations, getReferees } from '../../api/adminService';
import { getRaceSchedule, getTournaments, getRaceEntries } from '../../api/publicService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';


import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_RACE = { roundId: '', name: '', raceDate: '', distanceMeter: '1200', maxLanes: '12' };
const INIT_REF = { raceId: '', refereeId: '' };

type Modal = 'none' | 'race' | 'lanes' | 'referee' | 'detail';

const fixMojibake = (str: string): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
};

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

  // Thu gọn/mở rộng từng giải đấu (mặc định thu gọn — bấm mũi tên để đổ detail vòng/cuộc đua)
  const [openTournaments, setOpenTournaments] = useState<Set<number>>(new Set());
  const [tourPage, setTourPage] = useState(1);

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

  // Ghép làn (modal 'lanes'): race đang chọn + lựa chọn ngựa cho từng làn trống
  const [laneRaceId, setLaneRaceId] = useState('');
  const [laneEntries, setLaneEntries] = useState<any[]>([]);  // entry đã ghép sẵn
  const [laneSel, setLaneSel] = useState<Record<number, string>>({}); // laneNo -> registrationId
  const [laneLoading, setLaneLoading] = useState(false);
  const [laneSaving, setLaneSaving] = useState(false);
  const [laneMsg, setLaneMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Chi tiết cuộc đua (modal 'detail'): sơ đồ làn 3D + trọng tài
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
        tournamentName: fixMojibake(r.tournamentName)
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
      showToast('Thành công', 'Đã sinh cuộc đua thành công!');
      await loadAllData();
    } catch (err: any) {
      showToast('Lỗi', 'Lỗi khi sinh cuộc đua: ' + parseApiError(err), 'error');
    } finally {
      setGeneratingForTournament(null);
    }
  }

  async function handleGenerateFinal(tournamentId: number) {
    setGeneratingForTournament(tournamentId);
    try {
      await generateFinalRace(tournamentId);
      showToast('Thành công', 'Đã xếp bảng Chung kết (Top 12) thành công!');
      await loadAllData();
    } catch (err: any) {
      showToast('Lỗi', 'Lỗi khi xếp bảng Chung kết: ' + parseApiError(err), 'error');
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
    setRefError(''); setRefForm(INIT_REF);
    setReferees([]);
    setDetailRace(null); setDetailEntries([]); setDetailRefs([]);
  }

  async function handleCreateRace() {
    setRaceError('');
    if (!raceForm.roundId || !raceForm.name || !raceForm.raceDate || !raceForm.distanceMeter || !raceForm.maxLanes) {
      setRaceError('Vui lòng điền đầy đủ tất cả các trường.');
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
      showToast('Thành công', newId != null
        ? `Đã tạo cuộc đua "${raceForm.name}" thành công! (ID = ${newId})`
        : `Đã tạo cuộc đua "${raceForm.name}" thành công!`);
      closeModal();
      await loadAllData();
    } catch (err: unknown) {
      setRaceError(parseApiError(err as Error));
    } finally {
      setRaceLoading(false);
    }
  }

  /* ═══════════ Ghép làn — form sinh dropdown theo số làn ═══════════ */

  // Mở từ nút trên từng card race: cuộc đua được KHÓA theo card đã bấm (không cho đổi)
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

  // Đơn hợp lệ cho race này: đúng giải + Approved + chưa có entry (theo đơn & theo ngựa)
  const eligibleRegs = useMemo(() => {
    if (!laneRace) return [];
    const takenRegIds = new Set(laneEntries.map((e: any) => e.registrationId));
    const takenHorseIds = new Set(laneEntries.map((e: any) => e.horseId));
    return registrationsList.filter(r => {
      const regId = r.registrationId ?? r.id;
      return Number(r.tournamentId ?? r.TournamentId) === Number(laneRace.tournamentId)
        && (r.status ?? '').toLowerCase() === 'approved'
        && !takenRegIds.has(regId) && !takenHorseIds.has(r.horseId);
    });
  }, [registrationsList, laneEntries, laneRace]);

  async function handleSaveLanes() {
    const picks = Object.entries(laneSel).filter(([, regId]) => regId);
    if (picks.length === 0) {
      setLaneMsg({ ok: false, text: 'Chưa chọn ngựa cho làn nào. Hãy chọn ít nhất một làn.' });
      return;
    }
    setLaneSaving(true); setLaneMsg(null);
    const errors: string[] = [];
    let okCount = 0;
    // POST tuần tự từng làn — BE chỉ có API ghép từng entry
    for (const [laneNo, regId] of picks) {
      try {
        await createRaceEntry(Number(laneRaceId), { registrationId: Number(regId), laneNo: Number(laneNo) });
        okCount++;
      } catch (err: unknown) {
        errors.push(`Làn ${laneNo}: ${parseApiError(err as Error)}`);
      }
    }
    setLaneSaving(false);
    if (errors.length === 0) {
      // Thành công trọn vẹn: đóng modal + toast, quay về danh sách
      showToast('Thành công', `Đã ghép thành công ${okCount} làn cho cuộc đua "${laneRace?.name ?? ''}"!`);
      closeModal();
      await loadAllData();
    } else {
      // Có lỗi: giữ modal để admin xử lý tiếp, hiện chi tiết lỗi
      if (okCount > 0) showToast('Thành công', `Đã ghép được ${okCount} làn.`);
      setLaneSel({});
      await selectLaneRace(laneRaceId);
      setLaneMsg({ ok: false, text: `Lỗi: ${errors.join(' | ')}` });
    }
  }

  /* ═══════════ Chi tiết cuộc đua ═══════════ */

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

  /* ═══════════ Trọng tài ═══════════ */

  // Mở từ nút trên từng card race: cuộc đua được KHÓA, tự tải danh sách trọng tài hiện tại
  async function openRefereeModal(raceId: number) {
    setRefForm({ raceId: String(raceId), refereeId: '' });
    setReferees([]);
    setModal('referee');
    await handleViewReferees(String(raceId));
  }

  async function handleAssignReferee() {
    setRefError('');
    if (!refForm.raceId || !refForm.refereeId) {
      setRefError('Vui lòng chọn cuộc đua và trọng tài.');
      return;
    }
    setRefLoading(true);
    try {
      await assignReferee(Number(refForm.raceId), Number(refForm.refereeId));
      const refName = refereeOptions.find(r => String(r.refereeId) === refForm.refereeId)?.fullName;
      const raceName = racesList.find(r => String(r.raceId) === refForm.raceId)?.name;
      showToast('Thành công', `Đã phân công trọng tài ${refName ? `"${refName}" ` : ''}cho cuộc đua "${raceName ?? ''}"!`);
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
      showToast('Lỗi', parseApiError(err as Error), 'error');
    }
  }

  async function handleDeleteRace(raceId: number, raceName?: string) {
    const label = raceName ? `"${raceName}"` : `#${raceId}`;
    if (!window.confirm(`Xóa cuộc đua ${label}? Dữ liệu làn, kết quả, trọng tài, vi phạm, cược và dự đoán liên quan cũng sẽ bị xóa.`)) {
      return;
    }

    try {
      await deleteRace(raceId);
      showToast('Thành công', `Đã xóa cuộc đua ${label}.`);
      await loadAllData();
    } catch (err: unknown) {
      showToast('Lỗi', parseApiError(err as Error), 'error');
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
      prefinalRound.races.every((r: any) => r.status === 'Finished')
    );

    const canGenerateFinal =
      prefinalFinished &&
      finalRound &&
      finalRound.races.every((race: any) => race.status === 'Scheduled');
    const canGeneratePre = !prefinalFinished;
    const waitingLabel = hasPrefinalRaces && !prefinalFinished
      ? 'Chờ hoàn thành Pre'
      : hasPrefinalRaces && prefinalFinished && (!finalRound || finalRound.races.length === 0)
        ? 'Thiếu Final Race'
        : '';

    return {
      ...t,
      rounds,
      canGeneratePre,
      canGenerateFinal,
      waitingLabel
    };
  });

  const activeRefereeOptions = refereeOptions.filter((ref: any) =>
    String(ref.status ?? '').toLowerCase() === 'active'
  );
  const visibleRefereeOptions = (activeRefereeOptions.length > 0 ? activeRefereeOptions : refereeOptions)
    // Ẩn trọng tài đã được phân công vào cuộc đua đang chọn
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
            title="Quản lý cuộc đua"
            subtitle="Lập lịch, ghép ngựa và phân công trọng tài"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => openRaceModal()} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Thêm cuộc đua
              </button>
            }
          />

          {loadingData && (
            <LoadingSkeleton rows={4} h="h-24" />
          )}

          {fetchError && (
            <div className="px-6 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Lỗi tải dữ liệu: {fetchError}
            </div>
          )}

          {!loadingData && !fetchError && groupedTournaments.length === 0 && (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">🏆</div>
              <div className="text-muted text-sm">Chưa có giải đấu nào</div>
              <div className="text-muted/60 text-xs mt-1">Vui lòng tạo giải đấu tại trang Quản lý giải đấu trước.</div>
            </div>
          )}

          {!loadingData && !fetchError && groupedTournaments.length > 0 && (() => {
            const { paged: pagedTournaments, totalPages: tourTotalPages, total: tourTotal, page: tourSafePage } = paginate(groupedTournaments, tourPage, 5);
            return (
            <div className="space-y-6">
              {pagedTournaments.map(t => {
                const isOpen = openTournaments.has(t.tournamentId);
                return (
                <div key={t.tournamentId} className={`glass-panel rounded-xl p-6 relative overflow-hidden animate-fade-in ${isOpen ? 'space-y-6' : ''}`}>
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none" />

                  {/* Tournament Header — bấm để đổ detail vòng & cuộc đua */}
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
                          {t.status === 'Active' ? 'Đang diễn ra' : t.status === 'Upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                        </span>
                        {!isOpen && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-champagne shrink-0">
                            {t.rounds.reduce((s: number, r: any) => s + r.races.length, 0)} cuộc đua
                          </span>
                        )}
                      </div>
                      {t.startDate && t.endDate && (
                        <p className="text-xs text-muted/80 mt-1 pl-6">
                          Thời gian: {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </button>

                    <div className="flex items-center gap-3">
                      {/* Prefinal generation */}
                      {t.canGeneratePre && (
                        <button
                          onClick={() => handleGenerateRaces(t.tournamentId)}
                          disabled={generatingForTournament === t.tournamentId}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          {generatingForTournament === t.tournamentId ? (
                            <>
                              <Loader size={12} className="animate-spin" />
                              Đang tạo...
                            </>
                          ) : (
                            'Auto xếp làn đua'
                          )}
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
                              Đang tạo...
                            </>
                          ) : (
                            'Auto xếp Final (Top 12)'
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

                  {/* Rounds — chỉ hiển thị khi giải đấu được mở rộng */}
                  {isOpen && (
                  <div className="grid grid-cols-1 gap-6">
                    {t.rounds.map((r: any) => (
                      <div key={r.roundId} className="space-y-3 bg-navy/20 p-4 rounded-xl border border-glass-border/40">
                        <div className="flex items-center justify-between border-b border-glass-border/30 pb-2">
                          <h3 className="text-sm font-bold text-champagne uppercase tracking-wider flex items-center gap-2">
                            <span>{r.name}</span>
                            <span className="text-[10px] text-muted normal-case font-normal">
                              ({r.roundNumber === 1 ? 'Prefinal Round - Vòng loại' : 'Final Round - Chung kết'})
                            </span>
                          </h3>
                          <button
                            onClick={() => openRaceModal(r.roundId)}
                            className="text-[11px] text-gold hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Plus size={12} /> Thêm cuộc đua thủ công
                          </button>
                        </div>

                        {r.races.length === 0 ? (
                          <div className="text-xs text-muted/50 italic py-4">
                            Chưa có cuộc đua nào được lập lịch. Dùng nút chia bảng tự động hoặc thêm thủ công.
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
                                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                          🏁 {race.name}
                                        </h4>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                          race.status === 'Finished' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                          race.status === 'Live' ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                          {race.status === 'Finished' ? 'Đã hoàn thành' : race.status === 'Live' ? 'Đang diễn ra' : 'Đã lên lịch'}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-[11px] text-muted flex items-center gap-1 justify-end">
                                          <Calendar size={11} />
                                          {new Date(race.raceDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                        </div>
                                        <div className="text-[10px] text-muted/80 mt-0.5">
                                          Cự ly: {race.distanceMeter}m | Làn tối đa: {race.maxLanes}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-glass-border/30">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => openDetail(race)}
                                          title="Chi tiết & sơ đồ làn 3D"
                                          className="p-1.5 rounded-lg text-champagne hover:bg-gold/15 border border-transparent hover:border-gold/20 transition-colors"
                                        >
                                          <Eye size={13} />
                                        </button>
                                        <button
                                          onClick={() => openLanes(race.raceId)}
                                          title="Ghép ngựa vào làn"
                                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-colors"
                                        >
                                          <ListOrdered size={13} />
                                        </button>
                                        <button
                                          onClick={() => openRefereeModal(race.raceId)}
                                          title="Phân công trọng tài"
                                          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-colors"
                                        >
                                          <UserCheck size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteRace(race.raceId, race.name)}
                                          title="Xóa cuộc đua"
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

              {/* Phân trang danh sách giải đấu */}
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

      {/* ── Modal: Thêm cuộc đua ── */}
      {modal === 'race' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-gold/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Flag size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Thêm cuộc đua mới</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Vòng đấu của giải đấu *</label>
                <select
                  value={raceForm.roundId}
                  onChange={e => setR('roundId', e.target.value)}
                  className={`${INPUT} bg-navy`}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">-- Chọn vòng đấu --</option>
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
                <label className={LABEL}>Tên cuộc đua *</label>
                <input value={raceForm.name} onChange={e => setR('name', e.target.value)} placeholder="VD: Race 1 (Prefinal)" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Ngày & giờ đua *</label>
                <input type="datetime-local" value={raceForm.raceDate} onChange={e => setR('raceDate', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Cự ly (m) *</label>
                  <input value={raceForm.distanceMeter} onChange={e => setR('distanceMeter', e.target.value)} type="number" min="100" placeholder="VD: 1200" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Số làn đua *</label>
                  <input value={raceForm.maxLanes} onChange={e => setR('maxLanes', e.target.value)} type="number" min="1" placeholder="VD: 12" className={INPUT} />
                </div>
              </div>
              {raceError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{raceError}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Hủy</button>
              <button onClick={handleCreateRace} disabled={raceLoading} className="flex-1 btn-gold py-2.5 rounded-lg text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed">
                {raceLoading ? 'Đang tạo…' : 'Lưu cuộc đua'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Ghép ngựa vào làn — sinh dropdown theo số làn ── */}
      {modal === 'lanes' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-2xl border border-blue-500/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ListOrdered size={15} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-serif text-white">Ghép ngựa vào làn đua</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 via-glass-border to-transparent" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Cuộc đua đã được khóa theo card admin bấm — không cho đổi để tránh ghép nhầm giải */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <Flag size={15} className="text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{laneRace?.name ?? '—'}</div>
                  <div className="text-[11px] text-muted truncate">
                    {laneRace?.tournamentName ?? ''}{laneRace?.roundName ? ` • ${laneRace.roundName}` : ''} • {maxLanes} làn • {fmtDate(laneRace?.raceDate)}
                  </div>
                </div>
              </div>

              {laneRaceId && (
                <div className="text-[11px] text-champagne/80 bg-gold/5 border border-gold/15 rounded-lg px-3 py-2 leading-relaxed">
                  Chọn ngựa cho từng làn trống rồi bấm <b>"Lưu các làn đã chọn"</b>.
                  Chỉ hiển thị ngựa có đơn <b>đã duyệt (Approved)</b>, chưa được ghép — ngựa đã chọn ở làn khác sẽ tự ẩn.
                  Nài ngựa được hệ thống tự gán theo hợp đồng jockey đã chấp nhận.
                  <br />⚠ Theo quy trình, chỉ ghép ngựa có sức khỏe <b>Khỏe mạnh (Healthy)</b> — kiểm tra với trọng tài/chủ ngựa trước khi ghép (hệ thống chưa tự chặn được vì API đăng ký chưa trả tình trạng sức khỏe).
                </div>
              )}

              {laneLoading ? (
                <LoadingSkeleton />
              ) : laneRaceId && maxLanes > 0 ? (
                <div className="space-y-2">
                  {Array.from({ length: maxLanes }, (_, idx) => idx + 1).map(laneNo => {
                    const existing = laneEntries.find((e: any) => e.laneNo === laneNo);
                    if (existing) {
                      // Làn đã ghép — khoá lại, hiển thị thông tin
                      return (
                        <div key={laneNo} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                          <span className="w-14 shrink-0 text-xs font-bold text-emerald-400">Làn {laneNo}</span>
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          <span className="text-sm text-white truncate">{existing.horseName ?? `Ngựa #${existing.horseId}`}</span>
                          {existing.jockeyName && <span className="text-xs text-muted truncate">• {existing.jockeyName}</span>}
                          <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400/70 shrink-0">Đã ghép</span>
                        </div>
                      );
                    }
                    // Làn trống — dropdown chọn ngựa; ẩn ngựa đã chọn ở làn khác
                    const usedElsewhere = new Set(Object.entries(laneSel).filter(([l]) => Number(l) !== laneNo).map(([, v]) => v).filter(Boolean));
                    const opts = eligibleRegs.filter(r => !usedElsewhere.has(String(r.registrationId ?? r.id)));
                    return (
                      <div key={laneNo} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/2 border border-glass-border">
                        <span className="w-14 shrink-0 text-xs font-bold text-muted">Làn {laneNo}</span>
                        <select
                          value={laneSel[laneNo] ?? ''}
                          onChange={e => setLaneSel(p => ({ ...p, [laneNo]: e.target.value }))}
                          className="flex-1 bg-navy/50 border border-glass-border rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-400/40"
                          style={{ colorScheme: 'dark' }}>
                          <option value="">— Để trống —</option>
                          {opts.map((r, i) => {
                            const regId = r.registrationId ?? r.id;
                            return <option key={regId ?? i} value={regId}>{r.horseName ?? `Ngựa #${r.horseId}`}{r.ownerName ? ` (${r.ownerName})` : ''}</option>;
                          })}
                        </select>
                      </div>
                    );
                  })}

                  {/* Entry lỗi: laneNo vượt quá số làn (dữ liệu backend sai) */}
                  {laneEntries.some((e: any) => (e.laneNo ?? 0) > maxLanes) && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-[11px] text-red-400">
                      ⚠ Có {laneEntries.filter((e: any) => (e.laneNo ?? 0) > maxLanes).length} ngựa đã bị ghép <b>vượt quá {maxLanes} làn</b> (dữ liệu lỗi từ backend):{' '}
                      {laneEntries.filter((e: any) => (e.laneNo ?? 0) > maxLanes).map((e: any) => `Làn ${e.laneNo} • ${e.horseName ?? 'Ngựa #' + e.horseId}`).join(', ')}
                    </div>
                  )}

                  {eligibleRegs.length === 0 && laneEntries.length < maxLanes && (
                    <p className="text-[11px] text-yellow-400/80 leading-relaxed px-1">
                      Không còn ngựa hợp lệ để ghép: cần đơn đăng ký <b>đã duyệt</b> thuộc giải này và chưa được ghép vào cuộc đua.
                    </p>
                  )}
                </div>
              ) : laneRaceId ? (
                <div className="text-center py-6 text-muted text-sm">Cuộc đua này chưa khai báo số làn.</div>
              ) : null}

              {laneMsg && (
                <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-lg border ${laneMsg.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  {laneMsg.ok ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertCircle size={15} className="shrink-0 mt-0.5" />}
                  <span>{laneMsg.text}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Đóng</button>
              <button onClick={handleSaveLanes} disabled={laneSaving || !laneRaceId}
                className="flex-1 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {laneSaving ? 'Đang lưu…' : 'Lưu các làn đã chọn'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Chi tiết cuộc đua — thông tin + sơ đồ làn 3D + trọng tài ── */}
      {modal === 'detail' && detailRace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-2xl border border-gold/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Eye size={15} className="text-gold" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-serif text-white truncate">{detailRace.name}</h2>
                <p className="text-[11px] text-muted">{detailRace.tournamentName ?? '—'}{detailRace.roundName ? ` • ${detailRace.roundName}` : detailRace.roundNumber != null ? ` • Vòng ${detailRace.roundNumber}` : ''}</p>
              </div>
              <div className="flex-1" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            {/* Thông tin chung */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { l: 'Ngày đua', v: fmtDate(detailRace.raceDate) },
                { l: 'Cự ly', v: detailRace.distanceMeter != null ? `${detailRace.distanceMeter}m` : '—' },
                { l: 'Số làn', v: String(detailRace.maxLanes ?? '—') },
                { l: 'Trạng thái', v: detailRace.status ?? '—' },
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
                {/* Sơ đồ làn 3D — scheduled/live: ngựa trong làn; finished: bục trao giải theo hạng */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ListOrdered size={14} className="text-blue-400" />
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Sơ đồ làn (3D)</span>
                    {(() => {
                      const maxL = Number(detailRace.maxLanes ?? 0);
                      const valid = detailEntries.filter((e: any) => (e.laneNo ?? 0) <= maxL).length;
                      const over = detailEntries.length - valid;
                      return (
                        <>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/4 border border-glass-border text-champagne">
                            {valid}/{maxL || '?'} đã ghép
                          </span>
                          {over > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold">
                              +{over} vượt làn (lỗi dữ liệu)
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <RaceTrack3D status={detailRace.status} maxLanes={Number(detailRace.maxLanes ?? 0)} entries={detailEntries} />

                  {/* Chi tiết từng làn (tên ngựa / jockey) */}
                  {detailEntries.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {[...detailEntries].sort((a: any, b: any) => (a.laneNo ?? 0) - (b.laneNo ?? 0)).map((e: any, i: number) => {
                        const isOver = (e.laneNo ?? 0) > Number(detailRace.maxLanes ?? 0);
                        return (
                          <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isOver ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/2 border border-glass-border'}`}>
                            <span className={`font-bold shrink-0 w-11 ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>Làn {e.laneNo}</span>
                            <span className="text-white truncate">🐴 {e.horseName ?? `Ngựa #${e.horseId}`}</span>
                            <span className="text-muted truncate">{e.jockeyName ? `• ${e.jockeyName}` : '• Chưa có jockey'}</span>
                            {isOver && <span className="ml-auto font-bold text-red-400 shrink-0 text-[10px]">VƯỢT LÀN</span>}
                            {!isOver && e.finishPosition != null && <span className="ml-auto font-bold text-gold shrink-0">#{e.finishPosition}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Trọng tài */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck size={14} className="text-cyan-400" />
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Trọng tài phụ trách</span>
                  </div>
                  {detailRefs.length === 0 ? (
                    <div className="text-xs text-muted/60 italic px-1">Chưa phân công trọng tài — dùng nút <UserCheck size={11} className="inline" /> ở danh sách để phân công.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {detailRefs.map((r: any, i: number) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                          {r.refereeName ?? r.fullName ?? r.name ?? `Trọng tài #${r.refereeId ?? r.id}`}
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
                Ghép làn cho cuộc đua này
              </button>
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Đóng</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Phân công trọng tài ── */}
      {modal === 'referee' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-cyan-500/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <UserCheck size={15} className="text-cyan-400" />
              </div>
              <h2 className="text-xl font-serif text-white">Phân công trọng tài</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/30 via-glass-border to-transparent" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Cuộc đua đã được khóa theo card admin bấm */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                <Flag size={15} className="text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{refRace?.name ?? '—'}</div>
                  <div className="text-[11px] text-muted truncate">{refRace?.tournamentName ?? ''} • {fmtDate(refRace?.raceDate)}</div>
                </div>
              </div>

              <div>
                <label className={LABEL}>Chọn trọng tài *</label>
                <select
                  value={refForm.refereeId}
                  onChange={e => setF('refereeId', e.target.value)}
                  className={INPUT}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">-- Chọn trọng tài --</option>
                  {visibleRefereeOptions.map((ref: any) => (
                    <option key={ref.refereeId} value={ref.refereeId}>
                      {ref.fullName || `Trọng tài #${ref.refereeId}`} {ref.licenseNumber ? `- ${ref.licenseNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {refError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{refError}</div>}

              <button onClick={handleAssignReferee} disabled={refLoading} className="w-full py-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {refLoading ? 'Đang phân công…' : 'Phân công trọng tài'}
              </button>

              {/* Trọng tài hiện tại của cuộc đua — tự tải khi chọn cuộc đua */}
              {refForm.raceId && (
                <div className="pt-2 border-t border-glass-border">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
                    Trọng tài của cuộc đua {refViewLoading ? '(đang tải…)' : `(${referees.length})`}
                  </div>
                  {referees.length > 0 ? (
                    <div className="space-y-2">
                      {referees.map((r, i) => {
                        const id = r.refereeId ?? r.id;
                        return (
                          <div key={id ?? i} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-glass-border">
                            <div>
                              <div className="text-sm text-white">{r.refereeName ?? r.fullName ?? r.name ?? `Trọng tài #${id}`}</div>
                              {r.email && <div className="text-[11px] text-muted">{r.email}</div>}
                            </div>
                            <button
                              onClick={() => handleRemoveReferee(refForm.raceId, id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Gỡ trọng tài">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : !refViewLoading && (
                    <div className="text-center py-3 text-muted text-xs">Chưa có trọng tài nào được phân công</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button onClick={closeModal} className="w-full py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Đóng</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
