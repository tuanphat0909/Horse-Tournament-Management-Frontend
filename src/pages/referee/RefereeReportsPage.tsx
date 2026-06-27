import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Award } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRaceReports, submitReport, getRefereeDashboard } from '../../api/refereeService';
import { getRaceSchedule, getRaceEntries } from '../../api/publicService';
import { getCurrentUser, parseApiError } from '../../api/authService';

const raceLabel = (r: any) =>
  `${r.name ?? ('Cuộc đua #' + (r.id ?? r.raceId))}${r.raceDate ? ' — ' + r.raceDate : ''}${r.tournamentName ? ' (' + r.tournamentName + ')' : ''}`;

export function RefereeReportsPage() {
  const [showAdd, setShowAdd] = useState(false);

  const user = getCurrentUser();
  const myRefId = user?.id ?? user?.userId;

  const [dashStats, setDashStats] = useState<any>({});
  const [races, setRaces] = useState<any[]>([]);
  const [raceId, setRaceId] = useState<string>('');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRefereeDashboard()
      .then((d: any) => setDashStats(d?.result ?? d ?? {}))
      .catch(() => setDashStats({}));
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
  const [fContent, setFContent] = useState('');
  const [fViolationNote, setFViolationNote] = useState('');
  const [fReportedUserId, setFReportedUserId] = useState<string>('');
  const [fReportedHorseId, setFReportedHorseId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Danh sách ngựa trong cuộc đua đang chọn ở form → dropdown "Ngựa bị báo cáo"
  const [formEntries, setFormEntries] = useState<any[]>([]);

  useEffect(() => {
    if (!fRaceId) { setFormEntries([]); return; }
    let cancelled = false;
    getRaceEntries(Number(fRaceId))
      .then((d: any) => { if (!cancelled) setFormEntries(d?.result ?? (Array.isArray(d) ? d : [])); })
      .catch(() => { if (!cancelled) setFormEntries([]); });
    return () => { cancelled = true; };
  }, [fRaceId]);

  const loadList = (id: string) => {
    if (!id) { setList([]); return; }
    setLoading(true);
    setError('');
    getRaceReports(Number(id))
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
    if (!fContent.trim()) { setFormError('Vui lòng nhập nội dung báo cáo.'); return; }
    const body: any = {
      raceId: fRaceId ? Number(fRaceId) : undefined,
      refereeId: myRefId ?? (fRefId ? Number(fRefId) : undefined),
      content: fContent.trim(),
    };
    if (fViolationNote.trim()) body.violationNote = fViolationNote.trim();
    if (fReportedUserId) body.reportedUserId = Number(fReportedUserId);
    if (fReportedHorseId) body.reportedHorseId = Number(fReportedHorseId);
    setSubmitting(true);
    submitReport(body)
      .then(() => {
        setShowAdd(false);
        setFContent('');
        setFViolationNote('');
        setFReportedUserId('');
        setFReportedHorseId('');
        const refreshId = raceId || fRaceId;
        if (refreshId) { setRaceId(refreshId); loadList(refreshId); }
      })
      .catch((err: any) => setFormError(parseApiError(err)))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-400 mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Báo cáo"
            subtitle="Lịch sử báo cáo và tài liệu trọng tài"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
            actions={
              <button onClick={() => { setFRaceId(raceId); setShowAdd(true); }} className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <Plus size={14} /> Tạo báo cáo
              </button>
            }
          />

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

          <div className="grid grid-cols-[1fr_380px] gap-6">
            <div className="space-y-3">
              {error && <div className="glass-panel rounded-xl p-4 text-sm text-red-400 border border-red-500/30">{error}</div>}
              {loading ? (
                <div className="glass-panel rounded-xl p-12 text-center text-muted text-sm">Đang tải...</div>
              ) : list.length === 0 ? (
                <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                  <div className="text-4xl opacity-40 mb-3">📋</div>
                  <div className="text-muted text-sm">Chưa có dữ liệu</div>
                </div>
              ) : (
                list.map((r: any, i: number) => (
                  <div key={r.reportId ?? i} className="glass-panel rounded-xl p-5 border border-glass-border relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-white font-serif text-base">{r.raceName ?? ('Cuộc đua #' + (r.raceId ?? '—'))}</div>
                      {r.createdAt && <span className="text-xs text-muted/70">{String(r.createdAt)}</span>}
                    </div>
                    <div className="text-sm text-muted whitespace-pre-wrap">{r.content ?? '—'}</div>
                    {r.violationNote && <div className="text-xs text-red-400 mt-2">Ghi chú vi phạm: {r.violationNote}</div>}
                    <div className="text-xs text-muted/70 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Trọng tài: {r.refereeName ?? r.refereeId ?? '—'}</span>
                      {r.reportedUserId != null && <span>Người bị báo cáo: {r.reportedUserId}</span>}
                      {r.reportedHorseId != null && <span>Ngựa bị báo cáo: {r.reportedHorseId}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 h-fit relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-red-500/10 to-transparent blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Award size={15} className="text-gold" /></div>
                <h3 className="text-base font-serif text-white">Tóm tắt mùa giải</h3>
                <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Tổng báo cáo', value: dashStats.pendingReportCount != null && dashStats.completedReportCount != null ? String((dashStats.pendingReportCount ?? 0) + (dashStats.completedReportCount ?? 0)) : '—', color: 'text-white' },
                  { label: 'Đã gửi', value: dashStats.completedReportCount != null ? String(dashStats.completedReportCount) : '—', color: 'text-emerald-400' },
                  { label: 'Chờ xử lý', value: dashStats.pendingReportCount != null ? String(dashStats.pendingReportCount) : '—', color: 'text-yellow-400' },
                  { label: 'Tổng vi phạm ghi nhận', value: dashStats.violationsCreatedCount != null ? String(dashStats.violationsCreatedCount) : '—', color: 'text-red-400' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/2 border border-glass-border hover:border-gold/30 hover:bg-gold/4 transition-all group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center font-serif font-bold text-champagne text-sm shrink-0">{i + 1}</div>
                      <span className="text-xs text-muted group-hover:text-champagne transition-colors">{s.label}</span>
                    </div>
                    <span className={`text-sm font-serif font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {showAdd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-lg border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-linear-to-br from-red-500/10 to-transparent blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><FileText size={15} className="text-gold" /></div>
                  <h3 className="text-lg font-serif text-white">Tạo báo cáo mới</h3>
                  <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-glass-border to-transparent" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Cuộc đua</label>
                    <select value={fRaceId} onChange={e => { setFRaceId(e.target.value); setFReportedHorseId(''); }}
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
                    <label className="block text-xs text-muted font-medium mb-1.5">Nội dung báo cáo</label>
                    <textarea rows={4} value={fContent} onChange={e => setFContent(e.target.value)} placeholder="Mô tả diễn biến cuộc đua, vi phạm (nếu có), nhận xét..." className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none resize-none focus:border-gold/40 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted font-medium mb-1.5">Ghi chú vi phạm (tùy chọn)</label>
                    <input value={fViolationNote} onChange={e => setFViolationNote(e.target.value)} placeholder="Ghi chú vi phạm..."
                      className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted font-medium mb-1.5">Ngựa bị báo cáo (tùy chọn)</label>
                      <select value={fReportedHorseId} onChange={e => setFReportedHorseId(e.target.value)} disabled={!fRaceId}
                        className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-gold/40 transition-colors" style={{ colorScheme: 'dark' }}>
                        <option value="">{!fRaceId ? '-- Chọn cuộc đua trước --' : '-- Không chọn --'}</option>
                        {formEntries.map((e: any, ei: number) => (
                          <option key={e.raceEntryId ?? e.horseId ?? ei} value={e.horseId}>{e.horseName ?? ('Ngựa #' + e.horseId)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted font-medium mb-1.5">ID người bị báo cáo (tùy chọn)</label>
                      <input type="number" value={fReportedUserId} onChange={e => setFReportedUserId(e.target.value)} placeholder="reportedUserId"
                        className="w-full bg-navy/50 border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors" />
                    </div>
                  </div>
                </div>
                {formError && <div className="mt-4 text-sm text-red-400">{formError}</div>}
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors">Hủy</button>
                  <button onClick={submit} disabled={submitting} className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-60">{submitting ? 'Đang gửi...' : 'Gửi ngay'}</button>
                </div>
              </motion.div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
