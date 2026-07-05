import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flag, UserCheck, ListOrdered, Trash2, Eye, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { Pager, paginate } from '../../components/ui/Pager';
import { RaceTrack3D } from '../../components/ui/RaceTrack3D';
import { toast } from '../../components/ui/Toast';
import { createRace, createRaceEntry, assignReferee, getRaceReferees, removeReferee, getAdminReferees, getRegistrations, deleteRace } from '../../api/adminService';
import { getRaceSchedule, getTournaments, getTournamentDetail, getRaceEntries } from '../../api/publicService';
import { parseApiError } from '../../api/authService';

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';
const PAGE_SIZE = 8;

const INIT_RACE = { roundId: '', name: '', raceDate: '', distanceMeter: '', maxLanes: '' };

type Modal = 'none' | 'race' | 'lanes' | 'referee' | 'detail';

// "2026-07-04T18:30:00" -> "04/07/2026 18:30"
function fmtDate(v: any): string {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function statusBadge(status?: string) {
  const s = (status ?? '').toLowerCase();
  if (s === 'finished' || s === 'completed') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (s === 'live' || s === 'running' || s === 'inprogress') return 'text-red-400 bg-red-500/10 border-red-500/20';
  return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
}

export function AdminRacesPage() {
  const [modal, setModal] = useState<Modal>('none');

  // ── Danh sách cuộc đua + filter/phân trang ──
  const [raceList, setRaceList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTournament, setFilterTournament] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  // ── Dropdown data ──
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [allReferees, setAllReferees] = useState<any[]>([]);

  // ── Modal: tạo cuộc đua ──
  const [raceForm, setRaceForm] = useState(INIT_RACE);
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceError, setRaceError] = useState('');
  const [raceSuccess, setRaceSuccess] = useState('');
  const [raceTournamentId, setRaceTournamentId] = useState('');
  const [rounds, setRounds] = useState<any[]>([]);
  const [roundsLoading, setRoundsLoading] = useState(false);

  // ── Modal: ghép làn (race đang chọn + lựa chọn từng làn) ──
  const [laneRaceId, setLaneRaceId] = useState('');
  const [laneEntries, setLaneEntries] = useState<any[]>([]);       // entry đã ghép sẵn
  const [laneSel, setLaneSel] = useState<Record<number, string>>({}); // laneNo -> registrationId
  const [laneLoading, setLaneLoading] = useState(false);
  const [laneSaving, setLaneSaving] = useState(false);
  const [laneMsg, setLaneMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // ── Modal: chi tiết cuộc đua ──
  const [detailRace, setDetailRace] = useState<any | null>(null);
  const [detailEntries, setDetailEntries] = useState<any[]>([]);
  const [detailRefs, setDetailRefs] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Modal: trọng tài ──
  const [refForm, setRefForm] = useState({ raceId: '', refereeId: '' });
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState('');
  const [refSuccess, setRefSuccess] = useState('');
  const [referees, setReferees] = useState<any[]>([]);
  const [refViewLoading, setRefViewLoading] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  function loadRaceList() {
    setListLoading(true); setListError('');
    getRaceSchedule()
      .then((d: any) => setRaceList(d?.result ?? (Array.isArray(d) ? d : [])))
      .catch((err: unknown) => setListError(parseApiError(err as Error)))
      .finally(() => setListLoading(false));
  }

  useEffect(() => { loadRaceList(); }, []);
  useEffect(() => {
    getTournaments().then((d: any) => setTournaments(d?.result ?? [])).catch(() => setTournaments([]));
  }, []);

  // Danh sách sau filter — phân trang phía dưới
  const filtered = useMemo(() => raceList.filter(r => {
    const okSearch = (r.name ?? '').toLowerCase().includes(search.toLowerCase());
    const okTour = !filterTournament || String(r.tournamentId) === filterTournament;
    const okStatus = !filterStatus || (r.status ?? '').toLowerCase() === filterStatus;
    return okSearch && okTour && okStatus;
  }), [raceList, search, filterTournament, filterStatus]);

  const { paged, totalPages, total, page: safePage } = paginate(filtered, page, PAGE_SIZE);

  function closeModal() {
    setModal('none');
    setRaceError(''); setRaceSuccess(''); setRaceForm(INIT_RACE);
    setRaceTournamentId(''); setRounds([]);
    setLaneRaceId(''); setLaneEntries([]); setLaneSel({}); setLaneMsg(null);
    setRefError(''); setRefSuccess(''); setRefForm({ raceId: '', refereeId: '' });
    setReferees([]);
    setDetailRace(null); setDetailEntries([]); setDetailRefs([]);
  }

  /* ═══════════ Tạo cuộc đua ═══════════ */

  async function handleTournamentChange(tid: string) {
    setRaceTournamentId(tid);
    setRaceForm(p => ({ ...p, roundId: '' }));
    setRounds([]);
    if (!tid) return;
    setRoundsLoading(true);
    try {
      const d: any = await getTournamentDetail(Number(tid));
      setRounds((d?.result ?? d)?.rounds ?? []);
    } catch { setRounds([]); }
    finally { setRoundsLoading(false); }
  }

  async function handleCreateRace() {
    setRaceError(''); setRaceSuccess('');
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
      const newId = data?.result?.id ?? data?.result?.raceId;
      // Submit xong: đóng modal + toast
      toast.success(newId != null ? `Đã tạo cuộc đua "${raceForm.name}" thành công! (ID = ${newId})` : `Đã tạo cuộc đua "${raceForm.name}" thành công!`);
      closeModal();
      loadRaceList();
    } catch (err: unknown) {
      setRaceError(parseApiError(err as Error));
    } finally {
      setRaceLoading(false);
    }
  }

  /* ═══════════ Ghép làn — form sinh dropdown theo số làn ═══════════ */

  // Mở từ nút trên từng hàng — cuộc đua được KHÓA theo hàng đã bấm (không cho đổi)
  async function openLanes(raceId: number) {
    setModal('lanes');
    setLaneMsg(null); setLaneSel({});
    getRegistrations().then((d: any) => setRegistrations(d?.result ?? [])).catch(() => setRegistrations([]));
    await selectLaneRace(String(raceId));
  }

  async function selectLaneRace(rid: string) {
    setLaneRaceId(rid);
    setLaneSel({}); setLaneMsg(null); setLaneEntries([]);
    if (!rid) return;
    setLaneLoading(true);
    try {
      const d: any = await getRaceEntries(Number(rid));
      setLaneEntries(d?.result ?? (Array.isArray(d) ? d : []));
    } catch { setLaneEntries([]); }
    finally { setLaneLoading(false); }
  }

  const laneRace = raceList.find(r => String(r.raceId ?? r.id) === laneRaceId);
  const maxLanes = Number(laneRace?.maxLanes ?? 0);

  // Đơn hợp lệ cho race này: đúng giải + Approved + chưa có entry (theo đơn & theo ngựa)
  const eligibleRegs = useMemo(() => {
    if (!laneRace) return [];
    const takenRegIds = new Set(laneEntries.map((e: any) => e.registrationId));
    const takenHorseIds = new Set(laneEntries.map((e: any) => e.horseId));
    return registrations.filter(r => {
      const regId = r.registrationId ?? r.id;
      return r.tournamentId === laneRace.tournamentId
        && (r.status ?? '').toLowerCase() === 'approved'
        && !takenRegIds.has(regId) && !takenHorseIds.has(r.horseId);
    });
  }, [registrations, laneEntries, laneRace]);

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
      toast.success(`Đã ghép thành công ${okCount} làn cho cuộc đua "${laneRace?.name ?? ''}"!`);
      closeModal();
      loadRaceList();
    } else {
      // Có lỗi: giữ modal để admin xử lý tiếp, hiện chi tiết lỗi
      if (okCount > 0) toast.success(`Đã ghép được ${okCount} làn.`);
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
    if (entries.status === 'fulfilled') setDetailEntries((entries.value as any)?.result ?? []);
    if (refs.status === 'fulfilled') setDetailRefs((refs.value as any)?.result ?? []);
    setDetailLoading(false);
  }

  /* ═══════════ Trọng tài ═══════════ */

  // Mở từ nút trên từng hàng — cuộc đua được KHÓA theo hàng đã bấm
  async function openReferee(raceId: number) {
    setModal('referee');
    getAdminReferees().then((d: any) => setAllReferees(d?.result ?? [])).catch(() => setAllReferees([]));
    setRefForm({ raceId: String(raceId), refereeId: '' });
    await handleViewReferees(String(raceId));
  }

  async function handleAssignReferee() {
    setRefError(''); setRefSuccess('');
    if (!refForm.raceId || !refForm.refereeId) {
      setRefError('Vui lòng chọn trọng tài.');
      return;
    }
    setRefLoading(true);
    try {
      await assignReferee(Number(refForm.raceId), Number(refForm.refereeId));
      const refName = allReferees.find(r => String(r.refereeId ?? r.id ?? r.userId) === refForm.refereeId)?.fullName;
      const raceName = raceList.find(r => String(r.raceId ?? r.id) === refForm.raceId)?.name;
      // Submit xong: đóng modal + toast
      toast.success(`Đã phân công trọng tài ${refName ? `"${refName}" ` : ''}cho cuộc đua "${raceName ?? ''}"!`);
      closeModal();
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
      setReferees(data?.result ?? (Array.isArray(data) ? data : []));
    } catch { setReferees([]); }
    finally { setRefViewLoading(false); }
  }

  async function handleRemoveReferee(raceId: string, refereeId: number) {
    try {
      await removeReferee(Number(raceId), refereeId);
      setReferees(prev => prev.filter(r => (r.id ?? r.refereeId) !== refereeId));
    } catch (err: unknown) {
      alert(parseApiError(err as Error));
    }
  }

  async function handleDeleteRace(raceId: number) {
    if (!window.confirm(`Xóa cuộc đua #${raceId}? Thao tác này không thể hoàn tác.`)) return;
    setDeleteLoading(raceId);
    try {
      await deleteRace(raceId);
      setRaceList(prev => prev.filter(r => (r.raceId ?? r.id) !== raceId));
    } catch (err: unknown) {
      alert(parseApiError(err as Error));
    } finally {
      setDeleteLoading(null);
    }
  }

  /* ═══════════ RENDER ═══════════ */

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: 'var(--page-bg)' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Quản lý cuộc đua"
            subtitle="Lập lịch, ghép ngựa vào làn và phân công trọng tài"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => setModal('race')} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                <Plus size={16} /> Thêm cuộc đua
              </button>
            }
          />

          {/* Toolbar: tìm kiếm + lọc */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/4 border border-glass-border focus-within:border-gold/40 rounded-lg px-3 py-2 w-64 transition-colors">
              <Search size={15} className="text-gold/60 shrink-0" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên cuộc đua..."
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
            <select value={filterTournament} onChange={e => { setFilterTournament(e.target.value); setPage(1); }}
              className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40" style={{ colorScheme: 'dark' }}>
              <option value="">Tất cả giải đấu</option>
              {tournaments.map((t, i) => {
                const id = t.tournamentId ?? t.id;
                return <option key={id ?? i} value={id}>{t.name}</option>;
              })}
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-navy/50 border border-glass-border rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40" style={{ colorScheme: 'dark' }}>
              <option value="">Tất cả trạng thái</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>
          </div>

          {/* Danh sách cuộc đua */}
          {listLoading ? (
            <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải danh sách cuộc đua...</div>
          ) : listError ? (
            <div className="glass-panel rounded-xl p-5 text-red-400 text-sm border border-red-500/20">{listError}</div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden relative">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="p-5 border-b border-glass-border flex items-center gap-3">
                <Flag size={15} className="text-gold shrink-0" />
                <h2 className="text-base font-serif text-white">Danh sách cuộc đua</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/4 border border-glass-border text-champagne">{total}</span>
              </div>
              {paged.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl opacity-40 mb-3">🏁</div>
                  <div className="text-muted text-sm">{raceList.length === 0 ? 'Chưa có cuộc đua' : 'Không tìm thấy cuộc đua phù hợp bộ lọc'}</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-glass-border text-xs text-muted uppercase font-bold tracking-wider">
                        <th className="py-3 px-5">Cuộc đua</th>
                        <th className="py-3 px-5">Giải / Vòng</th>
                        <th className="py-3 px-5">Ngày đua</th>
                        <th className="py-3 px-5">Cự ly</th>
                        <th className="py-3 px-5">Làn</th>
                        <th className="py-3 px-5">Trạng thái</th>
                        <th className="py-3 px-5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/30 text-sm">
                      {paged.map((r, i) => {
                        const rid = r.raceId ?? r.id;
                        return (
                          <tr key={rid ?? i} className="hover:bg-white/2 transition-colors">
                            <td className="py-3 px-5">
                              <div className="font-semibold text-white">{r.name ?? '—'}</div>
                              <div className="text-[10px] text-muted/60 font-mono">#{rid}</div>
                            </td>
                            <td className="py-3 px-5 text-muted">
                              {r.tournamentName ?? '—'}
                              {(r.roundName || r.roundNumber != null) && <div className="text-[11px] text-muted/60">{r.roundName ?? `Vòng ${r.roundNumber}`}</div>}
                            </td>
                            <td className="py-3 px-5 text-muted whitespace-nowrap">{fmtDate(r.raceDate)}</td>
                            <td className="py-3 px-5 text-champagne">{r.distanceMeter != null ? `${r.distanceMeter}m` : '—'}</td>
                            <td className="py-3 px-5 text-muted">{r.maxLanes ?? '—'}</td>
                            <td className="py-3 px-5">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(r.status)}`}>{r.status ?? '—'}</span>
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-1.5 justify-end">
                                <button onClick={() => openDetail(r)} title="Chi tiết & sơ đồ làn"
                                  className="p-1.5 rounded-lg bg-white/4 text-champagne hover:bg-gold/15 border border-glass-border transition-colors">
                                  <Eye size={13} />
                                </button>
                                <button onClick={() => openLanes(rid)} title="Ghép ngựa vào làn"
                                  className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors">
                                  <ListOrdered size={13} />
                                </button>
                                <button onClick={() => openReferee(rid)} title="Phân công trọng tài"
                                  className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors">
                                  <UserCheck size={13} />
                                </button>
                                <button onClick={() => handleDeleteRace(rid)} disabled={deleteLoading === rid} title="Xóa cuộc đua"
                                  className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 border border-transparent transition-colors disabled:opacity-40">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <Pager page={safePage} totalPages={totalPages} total={total} onChange={setPage} />
            </div>
          )}

        </main>
      </div>

      {/* ── Modal: Thêm cuộc đua ── */}
      {modal === 'race' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Flag size={15} className="text-gold" />
              </div>
              <h2 className="text-xl font-serif text-white">Thêm cuộc đua mới</h2>
              <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>Giải đấu *</label>
                <select value={raceTournamentId} onChange={e => handleTournamentChange(e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }}>
                  <option value="">-- Chọn giải đấu --</option>
                  {tournaments.map((t, i) => {
                    const id = t.tournamentId ?? t.id;
                    return <option key={id ?? i} value={id}>{t.name}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className={LABEL}>Vòng đấu *</label>
                <select value={raceForm.roundId} onChange={e => setRaceForm(p => ({ ...p, roundId: e.target.value }))} disabled={!raceTournamentId || roundsLoading} className={INPUT} style={{ colorScheme: 'dark' }}>
                  <option value="">{roundsLoading ? '-- Đang tải… --' : '-- Chọn vòng đấu --'}</option>
                  {rounds.map((round, i) => (
                    <option key={round.roundId ?? i} value={round.roundId}>{round.name ?? `Vòng ${round.roundNumber}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Tên cuộc đua *</label>
                <input value={raceForm.name} onChange={e => setRaceForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Vòng 4 - Bán Kết" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Ngày & giờ đua *</label>
                <input type="datetime-local" value={raceForm.raceDate} onChange={e => setRaceForm(p => ({ ...p, raceDate: e.target.value }))} className={INPUT} style={{ colorScheme: 'dark' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Cự ly (m) *</label>
                  <input value={raceForm.distanceMeter} onChange={e => setRaceForm(p => ({ ...p, distanceMeter: e.target.value }))} type="number" min="100" placeholder="VD: 1600" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Số làn đua *</label>
                  <input value={raceForm.maxLanes} onChange={e => setRaceForm(p => ({ ...p, maxLanes: e.target.value }))} type="number" min="1" max="12" placeholder="VD: 8" className={INPUT} />
                </div>
              </div>
              {raceError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{raceError}</div>}
              {raceSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{raceSuccess}</div>}
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
              <div className="flex-1 h-px bg-linear-to-r from-blue-400/30 via-glass-border to-transparent" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Cuộc đua đã được khóa theo hàng admin bấm — không cho đổi để tránh ghép nhầm giải */}
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
                </div>
              )}

              {laneLoading ? (
                <div className="text-center py-10 text-muted text-sm">Đang tải sơ đồ làn…</div>
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

      {/* ── Modal: Chi tiết cuộc đua — thông tin + sơ đồ làn + trọng tài ── */}
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
              <div className="text-center py-10 text-muted text-sm">Đang tải chi tiết…</div>
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
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <UserCheck size={15} className="text-cyan-400" />
              </div>
              <h2 className="text-xl font-serif text-white">Phân công trọng tài</h2>
              <div className="flex-1 h-px bg-linear-to-r from-cyan-400/30 via-glass-border to-transparent" />
              <button onClick={closeModal} className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              {/* Cuộc đua đã được khóa theo hàng admin bấm */}
              {(() => {
                const r = raceList.find(x => String(x.raceId ?? x.id) === refForm.raceId);
                return (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <Flag size={15} className="text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{r?.name ?? '—'}</div>
                      <div className="text-[11px] text-muted truncate">{r?.tournamentName ?? ''} • {fmtDate(r?.raceDate)}</div>
                    </div>
                  </div>
                );
              })()}
              <div>
                <label className={LABEL}>Trọng tài *</label>
                <select value={refForm.refereeId} onChange={e => setRefForm(p => ({ ...p, refereeId: e.target.value }))} className={INPUT} style={{ colorScheme: 'dark' }}>
                  <option value="">-- Chọn trọng tài --</option>
                  {allReferees
                    // Ẩn trọng tài đã được phân công vào cuộc đua này
                    .filter(r => !referees.some(a => (a.refereeId ?? a.id) === (r.refereeId ?? r.id ?? r.userId)))
                    .map((r, i) => {
                      const id = r.refereeId ?? r.id ?? r.userId;
                      return <option key={id ?? i} value={id}>{r.fullName ?? r.name ?? `Trọng tài #${id}`}</option>;
                    })}
                </select>
              </div>
              {refError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{refError}</div>}
              {refSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{refSuccess}</div>}

              <button onClick={handleAssignReferee} disabled={refLoading} className="w-full py-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {refLoading ? 'Đang phân công…' : 'Phân công trọng tài'}
              </button>

              {/* Trọng tài hiện tại của cuộc đua */}
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
                          <div key={id ?? i} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-white/2 border border-glass-border">
                            <div>
                              <div className="text-sm text-white">{r.refereeName ?? r.fullName ?? r.name ?? `Trọng tài #${id}`}</div>
                              {r.email && <div className="text-[11px] text-muted">{r.email}</div>}
                            </div>
                            <button onClick={() => handleRemoveReferee(refForm.raceId, id)}
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
