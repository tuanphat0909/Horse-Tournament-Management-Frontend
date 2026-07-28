import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getViolations, createViolation, getRefereeDashboard, updateViolation } from '../../api/refereeService';
import { getRaceEntries } from '../../api/publicService';
import { Pager, paginate } from '../../components/ui/Pager';
import { parseApiError } from '../../api/authService';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const INIT_FORM = { raceId: '', description: '', type: 'warning', horseOrJockey: '' };

// Giữ đúng ràng buộc cũ: bắt buộc chọn race + nhập mô tả (cùng câu thông báo).
const violationFormSchema = Yup.object({
  raceId: Yup.string().required('Please fill in all required information.'),
  description: Yup.string().trim().required('Please fill in all required information.'),
});

const cleanNote = (note) => {
  if (!note) return '';
  return note.replace(/\[timestamp=\d+\]/, '').trim();
};

const cleanDisplayString = (str) => {
  if (!str) return '';
  return str.replace(/\s*\(?ID:\s*\d+\)?/gi, '').trim();
};

export function RefereeViolationsPage() {
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingVio, setEditingVio] = useState(null);
  const [editPenalty, setEditPenalty] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [violations, setViolations] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [races, setRaces] = useState([]);

  // Lỗi API — tách khỏi lỗi validate từng ô của Formik
  const [submitError, setSubmitError] = useState('');
  // Loading cho modal cập nhật vi phạm (form sửa vẫn giữ cách thủ công, không validate)
  const [updateLoading, setUpdateLoading] = useState(false);

  // Horse List/jockey assigned lanes của races đang chọn — cho dropdown "Horse / Jockey in Violation"
  const [raceEntries, setRaceEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  // Form ghi vi phạm — Formik giữ giá trị + validate bắt buộc (violationFormSchema)
  const addFormik = useFormik({
    initialValues: INIT_FORM,
    validationSchema: violationFormSchema,
    onSubmit: async (values) => {
      setSubmitError('');
      try {
        const payload = {
          raceId: Number(values.raceId),
          description: `${values.type} - ${values.horseOrJockey ? '[' + values.horseOrJockey + '] ' : ''}${values.description} [timestamp=${Date.now()}]`,
          penalty: values.type === 'warning' ? 'None' : values.type === 'penalty' ? 'Time Penalty' : 'Disqualified',
        };
        await createViolation(payload);
        setShowAdd(false);
        addFormik.resetForm();
        setRaceEntries([]);
        fetchData();
      } catch (err) {
        setSubmitError(parseApiError(err));
      }
    },
  });

  // Chọn race → nạp danh sách ngựa/jockey của race đó và reset ô "Horse / Jockey"
  async function handleRaceChange(rid) {
    addFormik.setFieldValue('raceId', rid);
    addFormik.setFieldValue('horseOrJockey', '');
    setRaceEntries([]);
    if (!rid) return;
    setEntriesLoading(true);
    try {
      const d = await getRaceEntries(Number(rid));
      setRaceEntries(d?.result ?? (Array.isArray(d) ? d : []));
    } catch {
      setRaceEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setLoading(true);
    Promise.all([getViolations(), getRefereeDashboard()])
      .then(([vRes, dRes]) => {
        const vList = Array.isArray(vRes?.result) ? vRes.result : [];
        const rList = dRes?.result?.assignedRaces || [];

        const now = new Date();
        const availableRaces = rList.filter((r) => {
          const st = (r.status || '').toLowerCase();
          const isOngoingOrDone = st === 'inprogress' || st === 'running' || st === 'finished' || st === 'completed';
          const isStarted = r.raceDate && new Date(r.raceDate) <= now;
          return isOngoingOrDone || isStarted;
        });

        setViolations(vList);
        setRaces(availableRaces);
      })
      .catch(() => {
        setViolations([]);
        setRaces([]);
      })
      .finally(() => setLoading(false));
  }

  async function handleUpdate() {
    if (!editingVio) return;
    setSubmitError('');
    setUpdateLoading(true);
    try {
      const match = (editingVio.note || editingVio.description || '').match(/\[timestamp=(\d+)\]/);
      const tsPart = match ? ` [timestamp=${match[1]}]` : ` [timestamp=${Date.now()}]`;
      await updateViolation(editingVio.violationId, {
        penalty: editPenalty,
        description: `${editDesc}${tsPart}`,
      });
      setEditingVio(null);
      fetchData();
    } catch (err) {
      setSubmitError(parseApiError(err));
    } finally {
      setUpdateLoading(false);
    }
  }

  const visibleViolations = violations.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (v.raceName ?? '').toLowerCase().includes(q) || (v.type ?? '').toLowerCase().includes(q) || (v.note ?? v.description ?? '').toLowerCase().includes(q);
  });
  const { paged: pagedViolations, totalPages: vioTotalPages, total: vioTotal, page: vioSafePage } = paginate(visibleViolations, page, 9);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">
          <PageHero
            title="Handle Violations"
            subtitle="Manage and resolve violations"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 28%"
            actions={
              <button onClick={() => setShowAdd(true)} className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Plus size={14} /> Record Violation
              </button>
            }
          />

          {/* Flow */}
          <div className="glass-panel rounded-xl p-4 border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
            <div className="flex items-center gap-2 text-xs flex-wrap relative">
              <span className="text-muted font-bold shrink-0">Process:</span>
              {[
                { label: 'Referee records immediately after race', active: false },
                { label: '→', sep: true },
                { label: 'Jockey has 30 minutes to appeal', active: false },
                { label: '→', sep: true },
                { label: 'Referee reviews footage + decides', active: true },
                { label: '→', sep: true },
                { label: 'Official results — Admin receives notification', active: false },
              ].map((s, i) =>
                s.sep ? (
                  <span key={i} className="text-muted/30">
                    →
                  </span>
                ) : (
                  <span key={i} className={`px-2.5 py-1 rounded-lg border text-white/80 ${s.active ? 'bg-gold/10 border-gold/20 text-gold font-bold' : 'bg-white/[0.03] border-glass-border'}`}>
                    {s.label}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {[['active', 'All Violations', 'text-gold border-gold']].map(([t, label, activeClass]) => (
              <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? activeClass : 'text-muted border-transparent hover:text-white'}`}>
                {label}
              </button>
            ))}
            <div className="ml-auto mb-1 flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-1.5 w-56">
              <Search size={13} className="text-muted shrink-0" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search race, violation type..."
                className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : visibleViolations.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-muted text-sm">No violations recorded</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedViolations.map((v) => (
                  <div key={v.violationId} className="glass-panel p-5 rounded-xl border border-glass-border relative overflow-hidden">
                    <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-white">Race: {v.raceName || `#${v.raceId}`}</div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-red-500/10 text-red-400 border-red-500/20">Violation</span>
                    </div>
                    <p className="text-sm text-muted line-clamp-3 mb-4">{cleanNote(v.note || v.description || 'No description')}</p>
                    <div className="flex justify-between items-center mt-auto">
                      <div className="text-xs text-muted/60">
                        Penalty: <span className="text-white/80">{v.penalty || 'None'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingVio(v);
                          setEditPenalty(v.penalty || 'None');
                          setEditDesc(cleanNote(v.note || v.description || ''));
                        }}
                        className="text-[11px] px-2 py-1 bg-white/5 border border-glass-border hover:bg-gold/10 hover:border-gold/30 hover:text-gold rounded transition-colors text-muted"
                      >
                        Update
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
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-lg border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
                <div className="flex items-center gap-3 mb-1 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} className="text-gold" />
                  </div>
                  <h3 className="text-lg font-serif text-white">Record Violation</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <p className="text-xs text-muted mb-5">
                  Jockey will be notified immediately and has <span className="text-white font-bold">30 minutes</span> to file an appeal.
                </p>
                <form onSubmit={addFormik.handleSubmit} noValidate>
                  <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Race *</label>
                    <select name="raceId" value={addFormik.values.raceId} onChange={(e) => handleRaceChange(e.target.value)} onBlur={addFormik.handleBlur} className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40" style={{ colorScheme: 'dark' }}>
                      <option value="">-- Select Race --</option>
                      {races.map((r) => (
                        <option key={r.raceId} value={r.raceId}>
                          {cleanDisplayString(r.raceName)}
                        </option>
                      ))}
                    </select>
                    {addFormik.touched.raceId && addFormik.errors.raceId && <p className="text-xs text-red-400 mt-1">{addFormik.errors.raceId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Horse / Jockey in Violation</label>
                    <select name="horseOrJockey" value={addFormik.values.horseOrJockey} onChange={addFormik.handleChange} disabled={!addFormik.values.raceId || entriesLoading} className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40 disabled:opacity-50" style={{ colorScheme: 'dark' }}>
                      <option value="">{!addFormik.values.raceId ? '-- Select Previous Race --' : entriesLoading ? '-- Loading list... --' : raceEntries.length === 0 ? '-- Race has no horses assigned to lanes --' : '-- Select Horse / Jockey --'}</option>
                      {raceEntries.map((en, i) => {
                        const label = `Lane ${en.laneNo} • ${en.horseName ?? `Horse #${en.horseId}`}${en.jockeyName ? ` / ${en.jockeyName}` : ''}`;
                        return (
                          <option key={en.raceEntryId ?? i} value={label}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Violation Severity</label>
                    <select name="type" value={addFormik.values.type} onChange={addFormik.handleChange} className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40" style={{ colorScheme: 'dark' }}>
                      <option value="warning">Warning</option>
                      <option value="penalty">Time Penalty</option>
                      <option value="disqualify">Disqualification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Detailed Description *</label>
                    <textarea rows={3} name="description" value={addFormik.values.description} onChange={addFormik.handleChange} onBlur={addFormik.handleBlur} placeholder="Describe the incident based on camera/observation..." className="w-full bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none resize-none focus:border-gold/40" />
                    {addFormik.touched.description && addFormik.errors.description && <p className="text-xs text-red-400 mt-1">{addFormik.errors.description}</p>}
                  </div>

                  {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={addFormik.isSubmitting} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                      {addFormik.isSubmitting ? 'Sending...' : 'Submit Violation'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Edit modal */}
          {editingVio && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-md border border-glass-border relative overflow-hidden">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={15} className="text-gold" />
                  </div>
                  <h3 className="text-lg font-serif text-white">Update Violation</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Penalty</label>
                    <select value={editPenalty} onChange={(e) => setEditPenalty(e.target.value)} className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40" style={{ colorScheme: 'dark' }}>
                      <option value="None">None</option>
                      <option value="Time Penalty">Time Penalty</option>
                      <option value="Disqualified">Disqualified</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">New Description / Notes</label>
                    <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none resize-none focus:border-gold/40" />
                  </div>
                  {submitError && <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{submitError}</div>}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setEditingVio(null)} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleUpdate} disabled={updateLoading} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50">
                    {updateLoading ? 'Updating...' : 'Update'}
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
