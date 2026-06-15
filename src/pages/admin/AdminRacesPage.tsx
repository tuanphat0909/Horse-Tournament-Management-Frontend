import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Flag, UserCheck, ListOrdered, Trash2 } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { createRace, createRaceEntry, assignReferee, getRaceReferees, removeReferee } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

const INPUT = 'w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

const INIT_RACE = { roundId: '', name: '', raceDate: '', distanceMeter: '', maxLanes: '' };
const INIT_ENTRY = { raceId: '', horseId: '', laneNumber: '' };
const INIT_REF = { raceId: '', refereeId: '' };

type Modal = 'none' | 'race' | 'entry' | 'referee';

export function AdminRacesPage() {
  const [modal, setModal] = useState<Modal>('none');

  // Create Race
  const [raceForm, setRaceForm] = useState(INIT_RACE);
  const [raceLoading, setRaceLoading] = useState(false);
  const [raceError, setRaceError] = useState('');
  const [raceSuccess, setRaceSuccess] = useState('');

  // Race Entry
  const [entryForm, setEntryForm] = useState(INIT_ENTRY);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [entrySuccess, setEntrySuccess] = useState('');

  // Referee
  const [refForm, setRefForm] = useState(INIT_REF);
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState('');
  const [refSuccess, setRefSuccess] = useState('');
  const [referees, setReferees] = useState<any[]>([]);
  const [refViewId, setRefViewId] = useState('');
  const [refViewLoading, setRefViewLoading] = useState(false);

  function setR(field: string, v: string) { setRaceForm(p => ({ ...p, [field]: v })); }
  function setE(field: string, v: string) { setEntryForm(p => ({ ...p, [field]: v })); }
  function setF(field: string, v: string) { setRefForm(p => ({ ...p, [field]: v })); }

  function closeModal() {
    setModal('none');
    setRaceError(''); setRaceSuccess(''); setRaceForm(INIT_RACE);
    setEntryError(''); setEntrySuccess(''); setEntryForm(INIT_ENTRY);
    setRefError(''); setRefSuccess(''); setRefForm(INIT_REF);
    setReferees([]); setRefViewId('');
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
      setRaceSuccess(newId != null
        ? `Đã tạo cuộc đua thành công! ID = ${newId}`
        : 'Tạo cuộc đua thành công!');
      setRaceForm(INIT_RACE);
    } catch (err: unknown) {
      setRaceError(parseApiError(err as Error));
    } finally {
      setRaceLoading(false);
    }
  }

  async function handleCreateEntry() {
    setEntryError(''); setEntrySuccess('');
    if (!entryForm.raceId || !entryForm.horseId || !entryForm.laneNumber) {
      setEntryError('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }
    setEntryLoading(true);
    try {
      await createRaceEntry(Number(entryForm.raceId), {
        horseId: Number(entryForm.horseId),
        laneNumber: Number(entryForm.laneNumber),
      });
      setEntrySuccess('Đã ghép ngựa vào làn thành công!');
      setEntryForm(INIT_ENTRY);
    } catch (err: unknown) {
      setEntryError(parseApiError(err as Error));
    } finally {
      setEntryLoading(false);
    }
  }

  async function handleAssignReferee() {
    setRefError(''); setRefSuccess('');
    if (!refForm.raceId || !refForm.refereeId) {
      setRefError('Vui lòng nhập ID cuộc đua và ID trọng tài.');
      return;
    }
    setRefLoading(true);
    try {
      await assignReferee(Number(refForm.raceId), Number(refForm.refereeId));
      setRefSuccess('Đã phân công trọng tài thành công!');
      setRefForm(p => ({ ...p, refereeId: '' }));
      if (refViewId === refForm.raceId) await handleViewReferees(refForm.raceId);
    } catch (err: unknown) {
      setRefError(parseApiError(err as Error));
    } finally {
      setRefLoading(false);
    }
  }

  async function handleViewReferees(raceId: string) {
    if (!raceId) return;
    setRefViewId(raceId);
    setRefViewLoading(true);
    try {
      const data: any = await getRaceReferees(Number(raceId));
      setReferees(data?.result ?? (Array.isArray(data) ? data : []));
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
      alert(parseApiError(err as Error));
    }
  }

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
              <div className="flex items-center gap-3">
                <button onClick={() => setModal('race')} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                  <Plus size={16} /> Thêm cuộc đua
                </button>
                <button onClick={() => setModal('entry')} className="px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                  <ListOrdered size={16} /> Ghép ngựa vào làn
                </button>
                <button onClick={() => setModal('referee')} className="px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors">
                  <UserCheck size={16} /> Phân công trọng tài
                </button>
              </div>
            }
          />

          {/* Race List placeholder */}
          <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="text-4xl opacity-40 mb-3">🏁</div>
            <div className="text-muted text-sm">Chưa có cuộc đua</div>
            <div className="text-muted/60 text-xs mt-1">BE chưa có API danh sách — dùng các nút trên để tạo và quản lý</div>
          </div>

        </main>
      </div>

      {/* ── Modal: Thêm cuộc đua ── */}
      {modal === 'race' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-gold/20 relative overflow-hidden">
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
                <label className={LABEL}>Round ID * <span className="text-muted/50 normal-case font-normal">— chờ BE bổ sung API danh sách vòng đấu</span></label>
                <input value={raceForm.roundId} onChange={e => setR('roundId', e.target.value)} type="number" min="1" placeholder="ID vòng đấu" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Tên cuộc đua *</label>
                <input value={raceForm.name} onChange={e => setR('name', e.target.value)} placeholder="VD: Vòng 4 - Bán Kết" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Ngày & giờ đua *</label>
                <input type="datetime-local" value={raceForm.raceDate} onChange={e => setR('raceDate', e.target.value)} className={INPUT} style={{ colorScheme: 'dark' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Cự ly (m) *</label>
                  <input value={raceForm.distanceMeter} onChange={e => setR('distanceMeter', e.target.value)} type="number" min="100" placeholder="VD: 1600" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Số làn đua *</label>
                  <input value={raceForm.maxLanes} onChange={e => setR('maxLanes', e.target.value)} type="number" min="1" placeholder="VD: 12" className={INPUT} />
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

      {/* ── Modal: Ghép ngựa vào làn ── */}
      {modal === 'entry' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-md border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <ListOrdered size={15} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-serif text-white">Ghép ngựa vào làn đua</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div>
                <label className={LABEL}>ID Cuộc đua *</label>
                <input value={entryForm.raceId} onChange={e => setE('raceId', e.target.value)} type="number" min="1" placeholder="ID cuộc đua" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>ID Ngựa *</label>
                <input value={entryForm.horseId} onChange={e => setE('horseId', e.target.value)} type="number" min="1" placeholder="ID ngựa" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Số làn *</label>
                <input value={entryForm.laneNumber} onChange={e => setE('laneNumber', e.target.value)} type="number" min="1" placeholder="VD: 3" className={INPUT} />
              </div>
              {entryError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{entryError}</div>}
              {entrySuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{entrySuccess}</div>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-glass-border text-muted hover:text-white hover:bg-white/5 text-sm font-medium transition-colors">Đóng</button>
              <button onClick={handleCreateEntry} disabled={entryLoading} className="flex-1 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {entryLoading ? 'Đang ghép…' : 'Xác nhận'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Phân công trọng tài ── */}
      {modal === 'referee' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-8 w-full max-w-lg border border-cyan-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <UserCheck size={15} className="text-cyan-400" />
              </div>
              <h2 className="text-xl font-serif text-white">Phân công trọng tài</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/30 via-glass-border to-transparent" />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>ID Cuộc đua *</label>
                  <input value={refForm.raceId} onChange={e => setF('raceId', e.target.value)} type="number" min="1" placeholder="ID cuộc đua" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>ID Trọng tài *</label>
                  <input value={refForm.refereeId} onChange={e => setF('refereeId', e.target.value)} type="number" min="1" placeholder="ID trọng tài" className={INPUT} />
                </div>
              </div>
              {refError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{refError}</div>}
              {refSuccess && <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{refSuccess}</div>}

              <button onClick={handleAssignReferee} disabled={refLoading} className="w-full py-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                {refLoading ? 'Đang phân công…' : 'Phân công trọng tài'}
              </button>

              {/* Xem danh sách trọng tài */}
              <div className="pt-2 border-t border-glass-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider">Xem trọng tài của cuộc đua</span>
                  <button
                    onClick={() => handleViewReferees(refForm.raceId)}
                    disabled={!refForm.raceId || refViewLoading}
                    className="px-3 py-1 rounded-lg bg-white/5 text-xs text-champagne border border-glass-border hover:bg-white/10 disabled:opacity-40 transition-colors">
                    {refViewLoading ? 'Đang tải…' : 'Tải danh sách'}
                  </button>
                </div>
                {referees.length > 0 && (
                  <div className="space-y-2">
                    {referees.map((r, i) => (
                      <div key={r.id ?? r.refereeId ?? i} className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-glass-border">
                        <div>
                          <div className="text-sm text-white">{r.fullName ?? r.name ?? `Trọng tài #${r.id ?? r.refereeId}`}</div>
                          {r.email && <div className="text-[11px] text-muted">{r.email}</div>}
                        </div>
                        <button
                          onClick={() => handleRemoveReferee(refViewId, r.id ?? r.refereeId)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {referees.length === 0 && refViewId && !refViewLoading && (
                  <div className="text-center py-4 text-muted text-xs">Chưa có trọng tài nào được phân công</div>
                )}
              </div>
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
