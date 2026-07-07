import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getViolations, createViolation, getRefereeDashboard, updateViolation } from '../../api/refereeService';
import { getRaceEntries } from '../../api/publicService';
import { Pager, paginate } from '../../components/ui/Pager';
import { parseApiError } from '../../api/authService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
type Tab = 'active' | 'decided';

const INIT_FORM = { raceId: '', description: '', type: 'warning', horseOrJockey: '' };

export function RefereeViolationsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [showAdd, setShowAdd] = useState(false);
  const [editingVio, setEditingVio] = useState<any>(null);
  const [editPenalty, setEditPenalty] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [violations, setViolations] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [races, setRaces] = useState<any[]>([]);

  const [form, setForm] = useState(INIT_FORM);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Danh sách ngựa/jockey đã ghép làn của cuộc đua đang chọn — cho dropdown "Ngựa / Nài ngựa vi phạm"
  const [raceEntries, setRaceEntries] = useState<any[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  async function handleRaceChange(rid: string) {
    setForm(p => ({ ...p, raceId: rid, horseOrJockey: '' }));
    setRaceEntries([]);
    if (!rid) return;
    setEntriesLoading(true);
    try {
      const d: any = await getRaceEntries(Number(rid));
      setRaceEntries(d?.result ?? (Array.isArray(d) ? d : []));
    } catch { setRaceEntries([]); }
    finally { setEntriesLoading(false); }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setLoading(true);
    Promise.all([getViolations(), getRefereeDashboard()])
      .then(([vRes, dRes]: any[]) => {
        const vList = Array.isArray(vRes?.result) ? vRes.result : [];
        const rList = dRes?.result?.assignedRaces || [];
        setViolations(vList);
        setRaces(rList);
      })
      .catch(() => {
        setViolations([]);
        setRaces([]);
      })
      .finally(() => setLoading(false));
  }

  function setF(field: string, val: string) {
    setForm(p => ({ ...p, [field]: val }));
  }

  async function handleAdd() {
    setSubmitError('');
    if (!form.raceId || !form.description) {
      setSubmitError('Vui lòng chọn cuộc đua và nhập mô tả.');
      return;
    }
    setSubmitLoading(true);
    try {
      const payload = {
        raceId: Number(form.raceId),
        description: `${form.type} - ${form.horseOrJockey ? '['+form.horseOrJockey+'] ' : ''}${form.description}`,
        penalty: form.type === 'warning' ? 'None' : form.type === 'penalty' ? 'Time Penalty' : 'Disqualified'
      };
      await createViolation(payload);
      setShowAdd(false);
      setForm(INIT_FORM);
      fetchData();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleUpdate() {
    if (!editingVio) return;
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await updateViolation(editingVio.violationId, {
        penalty: editPenalty,
        description: editDesc
      });
      setEditingVio(null);
      fetchData();
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  const { paged: pagedViolations, totalPages: vioTotalPages, total: vioTotal, page: vioSafePage } = paginate(violations, page, 9);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Xử lý vi phạm"
            subtitle="Quản lý và kết luận đơn vi phạm"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
            actions={
              <button onClick={() => setShowAdd(true)} className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Plus size={14} /> Ghi nhận vi phạm
              </button>
            }
          />

          {/* Flow */}
          <div className="glass-panel rounded-xl p-4 border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="flex items-center gap-2 text-xs flex-wrap relative">
              <span className="text-muted font-bold shrink-0">Quy trình:</span>
              {[
                { label: 'Trọng tài ghi nhận ngay sau đua', active: false },
                { label: '→', sep: true },
                { label: 'Jockey có 30 phút khiếu nại', active: false },
                { label: '→', sep: true },
                { label: 'Trọng tài xem footage + ra quyết định', active: true },
                { label: '→', sep: true },
                { label: 'Kết quả chính thức — Admin nhận thông báo', active: false },
              ].map((s, i) =>
                s.sep ? <span key={i} className="text-muted/30">→</span>
                  : <span key={i} className={`px-2.5 py-1 rounded-lg border text-white/80 ${s.active ? 'bg-gold/10 border-gold/20 text-gold font-bold' : 'bg-white/[0.03] border-glass-border'}`}>{s.label}</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {([
              ['active',  'Tất cả vi phạm', 'text-gold border-gold'],
            ] as [Tab, string, string][]).map(([t, label, activeClass]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? activeClass : 'text-muted border-transparent hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : violations.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-muted text-sm">Chưa có vi phạm nào được ghi nhận</div>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pagedViolations.map((v: any) => (
                <div key={v.violationId} className="glass-panel p-5 rounded-xl border border-glass-border relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />
                  <div className="flex justify-between items-start mb-3">
                    <div className="font-bold text-white">Trận: {v.raceName || `#${v.raceId}`}</div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-red-500/10 text-red-400 border-red-500/20">
                      Vi phạm
                    </span>
                  </div>
                  <p className="text-sm text-muted line-clamp-3 mb-4">{v.note || v.description || 'Không có mô tả'}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="text-xs text-muted/60">Hình phạt: <span className="text-white/80">{v.penalty || 'Chưa định đoạt'}</span></div>
                    <button onClick={() => { setEditingVio(v); setEditPenalty(v.penalty || ''); setEditDesc(v.note || v.description || ''); }} className="text-[11px] px-2 py-1 bg-white/5 border border-glass-border hover:bg-gold/10 hover:border-gold/30 hover:text-gold rounded transition-colors text-muted">
                      Cập nhật
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {vioTotalPages > 1 && (
              <div className="glass-panel rounded-xl overflow-hidden">
                <Pager page={vioSafePage} totalPages={vioTotalPages} total={vioTotal} onChange={setPage} />
              </div>
            )}
            </>
          )}

          {/* Add modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-2xl p-7 w-full max-w-lg border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
                <div className="flex items-center gap-3 mb-1 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><AlertTriangle size={15} className="text-gold" /></div>
                  <h3 className="text-lg font-serif text-white">Ghi nhận vi phạm</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <p className="text-xs text-muted mb-5">Jockey sẽ nhận thông báo ngay và có <span className="text-white font-bold">30 phút</span> để gửi khiếu nại.</p>
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Cuộc đua *</label>
                    <select value={form.raceId} onChange={e => handleRaceChange(e.target.value)} className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40" style={{colorScheme: 'dark'}}>
                      <option value="">-- Chọn cuộc đua --</option>
                      {races.map(r => (
                        <option key={r.raceId} value={r.raceId}>ID {r.raceId}: {r.raceName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Ngựa / Nài ngựa vi phạm</label>
                    <select value={form.horseOrJockey} onChange={e => setF('horseOrJockey', e.target.value)}
                      disabled={!form.raceId || entriesLoading}
                      className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40 disabled:opacity-50" style={{colorScheme: 'dark'}}>
                      <option value="">
                        {!form.raceId ? '-- Chọn cuộc đua trước --' : entriesLoading ? '-- Đang tải danh sách... --' : raceEntries.length === 0 ? '-- Cuộc đua chưa ghép ngựa vào làn --' : '-- Chọn ngựa / nài ngựa --'}
                      </option>
                      {raceEntries.map((en: any, i: number) => {
                        const label = `Làn ${en.laneNo} • ${en.horseName ?? `Ngựa #${en.horseId}`}${en.jockeyName ? ` / ${en.jockeyName}` : ''}`;
                        return <option key={en.raceEntryId ?? i} value={label}>{label}</option>;
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Mức độ vi phạm</label>
                    <select value={form.type} onChange={e => setF('type', e.target.value)} className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40" style={{colorScheme: 'dark'}}>
                      <option value="warning">Cảnh cáo</option>
                      <option value="penalty">Phạt thời gian</option>
                      <option value="disqualify">Truất quyền thi đấu</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Mô tả chi tiết *</label>
                    <textarea rows={3} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Mô tả sự việc theo camera / quan sát thực tế..." className="w-full bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none resize-none focus:border-gold/40" />
                  </div>

                  {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
                  
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">Hủy</button>
                  <button onClick={handleAdd} disabled={submitLoading} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                    {submitLoading ? 'Đang gửi...' : 'Gửi vi phạm'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Edit modal */}
          {editingVio && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-2xl p-7 w-full max-w-md border border-glass-border relative overflow-hidden">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><AlertTriangle size={15} className="text-gold" /></div>
                  <h3 className="text-lg font-serif text-white">Cập nhật vi phạm</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Hình phạt</label>
                    <input value={editPenalty} onChange={e => setEditPenalty(e.target.value)} placeholder="VD: Time Penalty, Disqualified..." className="w-full bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Mô tả / Ghi chú mới</label>
                    <textarea rows={3} value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none resize-none focus:border-gold/40" />
                  </div>
                  {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setEditingVio(null)} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">Hủy</button>
                  <button onClick={handleUpdate} disabled={submitLoading} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                    {submitLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
