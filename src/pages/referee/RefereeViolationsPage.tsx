import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceViolations, logViolation } from '../../api/refereeService';
import { getRaceSchedule } from '../../api/publicService';
import { getCurrentUser, parseApiError } from '../../api/authService';
import { toast } from '../../components/ui/Toast';
import { Pager, paginate } from '../../components/ui/Pager';

type Tab = 'active' | 'decided';

const raceLabel = (r: any) =>
  `${r.name ?? ('Cuộc đua #' + (r.id ?? r.raceId))}${r.raceDate ? ' — ' + r.raceDate : ''}${r.tournamentName ? ' (' + r.tournamentName + ')' : ''}`;

export function RefereeViolationsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [showAdd, setShowAdd] = useState(false);

  const user = getCurrentUser();
  const myRefId = user?.id ?? user?.userId;

  const [races, setRaces] = useState<any[]>([]);
  const [raceId, setRaceId] = useState<string>('');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRaceSchedule()
      .then((data: any) => {
        const arr = data?.result ?? (Array.isArray(data) ? data : []);
        setRaces(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setRaces([]));
  }, []);

  // form state
  const [fRaceId, setFRaceId] = useState<string>('');
  const [fRefId, setFRefId] = useState<string>('');
  const [fDescription, setFDescription] = useState('');
  const [fPenalty, setFPenalty] = useState('warning');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadList = (id: string) => {
    if (!id) { setList([]); return; }
    setLoading(true);
    setError('');
    getRaceViolations(Number(id))
      .then((data: any) => {
        const arr = data?.result ?? (Array.isArray(data) ? data : []);
        setList(Array.isArray(arr) ? arr : []);
      })
      .catch((err: any) => { setError(parseApiError(err)); setList([]); })
      .finally(() => setLoading(false));
  };

  const onRaceIdChange = (v: string) => {
    setRaceId(v);
    loadList(v);
  };

  const submit = () => {
    setFormError('');
    const effectiveRefId = myRefId ?? (fRefId ? Number(fRefId) : undefined);
    if (!fRaceId) { setFormError('Vui lòng nhập mã cuộc đua.'); return; }
    if (!fDescription.trim()) { setFormError('Vui lòng nhập mô tả.'); return; }
    setSubmitting(true);
    logViolation({ raceId: Number(fRaceId), refereeId: effectiveRefId, description: fDescription.trim(), penalty: fPenalty })
      .then(() => {
        toast.success('Đã ghi nhận vi phạm thành công! Jockey sẽ nhận được thông báo.');
        setShowAdd(false);
        setFDescription('');
        setFPenalty('warning');
        // refresh list using the form raceId or current raceId
        const refreshId = raceId || fRaceId;
        if (refreshId) { setRaceId(refreshId); loadList(refreshId); }
      })
      .catch((err: any) => setFormError(parseApiError(err)))
      .finally(() => setSubmitting(false));
  };

  const [pageNo, setPageNo] = useState(1);
  const filteredList = list.filter((v: any) => {
    const s = (v.status ?? '').toLowerCase();
    if (tab === 'active') return s === 'pending' || s === 'active' || s === '';
    if (tab === 'decided') return s === 'confirmed' || s === 'rejected';
    return true;
  });
  const pgV = paginate(filteredList, pageNo, 8);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Xử lý vi phạm"
            subtitle="Quản lý và kết luận đơn vi phạm"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
            actions={
              <button onClick={() => { setFRaceId(raceId); setShowAdd(true); }} className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Plus size={14} /> Ghi nhận vi phạm
              </button>
            }
          />

          {/* Flow */}
          <div className="glass-panel rounded-xl p-4 border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-red-500/10 to-transparent blur-2xl pointer-events-none" />
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
                  : <span key={i} className={`px-2.5 py-1 rounded-lg border text-white/80 ${s.active ? 'bg-gold/10 border-gold/20 text-gold font-bold' : 'bg-white/3 border-glass-border'}`}>{s.label}</span>
              )}
            </div>
          </div>

          {/* Race selector */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs text-muted font-medium mb-1.5">Cuộc đua</label>
              <select value={raceId} onChange={e => onRaceIdChange(e.target.value)}
                className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors">
                <option value="">-- Chọn cuộc đua --</option>
                {races.map((r: any) => {
                  const id = r.id ?? r.raceId;
                  return <option key={String(id)} value={String(id)}>{raceLabel(r)}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-glass-border">
            {([
              ['active',  'Cần xử lý', 'text-gold border-gold'],
              ['decided', 'Đã xử lý', 'text-muted border-muted'],
            ] as [Tab, string, string][]).map(([t, label, activeClass]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${tab === t ? activeClass : 'text-muted border-transparent hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>

          {error && <div className="glass-panel rounded-xl p-4 text-sm text-red-400 border border-red-500/30">{error}</div>}

          {loading ? (
            <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải...</div>
          ) : filteredList.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="text-4xl opacity-40 mb-3">⚠️</div>
              <div className="text-muted text-sm">Chưa có dữ liệu</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pgV.paged.map((v: any, i: number) => (
                <div key={v.violationId ?? i} className="glass-panel rounded-xl p-5 border border-glass-border relative overflow-hidden">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-serif text-base">{v.raceName ?? ('Cuộc đua #' + (v.raceId ?? '—'))}</div>
                      <div className="text-sm text-muted mt-1">{v.note ?? v.description ?? '—'}</div>
                      <div className="text-xs text-muted/70 mt-2">Trọng tài: {v.refereeName ?? v.refereeId ?? '—'}</div>
                    </div>
                    {v.penalty != null && (
                      <span className="shrink-0 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold">{String(v.penalty)}</span>
                    )}
                  </div>
                </div>
              ))}
              <Pager page={pgV.page} totalPages={pgV.totalPages} total={pgV.total} onChange={setPageNo} />
            </div>
          )}

          {/* Add modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-2xl p-7 w-full max-w-lg border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-red-500/10 to-transparent blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-1 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><AlertTriangle size={15} className="text-gold" /></div>
                  <h3 className="text-lg font-serif text-white">Ghi nhận vi phạm</h3>
                  <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <p className="text-xs text-muted mb-5">Jockey sẽ nhận thông báo ngay và có <span className="text-white font-bold">30 phút</span> để gửi khiếu nại.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Cuộc đua</label>
                    <select value={fRaceId} onChange={e => setFRaceId(e.target.value)}
                      className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors">
                      <option value="">-- Chọn cuộc đua --</option>
                      {races.map((r: any) => {
                        const id = r.id ?? r.raceId;
                        return <option key={String(id)} value={String(id)}>{raceLabel(r)}</option>;
                      })}
                    </select>
                  </div>
                  {myRefId == null && (
                    <div>
                      <label className="block text-xs text-muted font-medium mb-1.5">Mã trọng tài (refereeId)</label>
                      <input type="number" value={fRefId} onChange={e => setFRefId(e.target.value)} placeholder="Nhập mã trọng tài..."
                        className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Mức độ vi phạm</label>
                    <select value={fPenalty} onChange={e => setFPenalty(e.target.value)} className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-gold/40">
                      <option value="warning">Cảnh cáo</option>
                      <option value="penalty">Phạt thời gian</option>
                      <option value="disqualify">Truất quyền thi đấu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Mô tả chi tiết</label>
                    <textarea rows={3} value={fDescription} onChange={e => setFDescription(e.target.value)} placeholder="Mô tả sự việc theo camera / quan sát thực tế..." className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none resize-none focus:border-gold/40 transition-colors" />
                  </div>
                </div>
                {formError && <div className="mt-4 text-sm text-red-400">{formError}</div>}
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">Hủy</button>
                  <button onClick={submit} disabled={submitting} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi vi phạm'}</button>
                </div>
              </motion.div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
