import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Award, Calendar, Loader, CheckCircle } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getRefereeDashboard, getRaceReports, createReport, getHorseChecks } from '../../api/refereeService';
import { parseApiError } from '../../api/authService';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const INPUT = 'w-full bg-[#0B1628] border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none focus:border-gold/40 transition-colors';
const LABEL = 'block text-xs font-bold text-muted uppercase tracking-wider mb-1.5';

interface AssignedRace {
  raceId: number;
  raceName: string;
  status: string;
}

interface Report {
  reportId: number;
  content: string;
  violationNote: string;
  createdAt: string;
  reportedHorseName: string;
  reportedHorseId: number;
}

export function RefereeReportsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | ''>('');
  const [reports, setReports] = useState<Report[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  
  const [form, setForm] = useState({ content: '', violationNote: '', reportedHorseId: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Fetch races & stats
  async function loadDashboard() {
    setLoadingRaces(true);
    try {
      const res = await getRefereeDashboard();
      if (res && res.result) {
        setStats(res.result);
        const assigned = res.result.assignedRaces || [];
        const now = new Date();
        const activeOrFinishedRaces = assigned.filter((r: any) => {
          const st = (r.status || '').toLowerCase();
          const isStartedOrDone = st === 'inprogress' || st === 'running' || st === 'finished' || st === 'completed' || (r.raceDate && new Date(r.raceDate) <= now);
          return isStartedOrDone;
        });

        setRaces(activeOrFinishedRaces);
        if (activeOrFinishedRaces.length > 0 && !selectedRaceId) {
          setSelectedRaceId(activeOrFinishedRaces[0].raceId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRaces(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch reports & horses when selected race changes
  async function loadRaceData() {
    if (!selectedRaceId) return;
    setLoadingReports(true);
    try {
      const [repRes, horseRes] = await Promise.all([
        getRaceReports(selectedRaceId),
        getHorseChecks(selectedRaceId)
      ]);
      const fetchedReports = Array.isArray(repRes) ? repRes : repRes?.result ?? [];
      const fetchedHorses = Array.isArray(horseRes) ? horseRes : horseRes?.result ?? [];
      setReports(fetchedReports);
      setHorses(fetchedHorses);
    } catch (err) {
      console.error(err);
      setReports([]);
      setHorses([]);
    } finally {
      setLoadingReports(false);
    }
  }

  useEffect(() => {
    loadRaceData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRaceId]);

  function setF(field: string, val: string) {
    setForm(p => ({ ...p, [field]: val }));
  }

  async function handleSubmit() {
    setSubmitError('');
    setSubmitSuccess('');
    if (!selectedRaceId) {
      setSubmitError('Please select a race.');
      return;
    }
    if (!form.content.trim()) {
      setSubmitError('Report content cannot be empty.');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        raceId: Number(selectedRaceId),
        content: form.content,
        violationNote: form.violationNote || null,
        reportedHorseId: form.reportedHorseId ? Number(form.reportedHorseId) : null
      };

      await createReport(payload);
      setSubmitSuccess('Report sent successfully!');
      setForm({ content: '', violationNote: '', reportedHorseId: '' });
      await loadRaceData();
      await loadDashboard();
      setTimeout(() => {
        setShowAdd(false);
        setSubmitSuccess('');
      }, 1500);
    } catch (err: unknown) {
      setSubmitError(parseApiError(err as Error));
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Report"
            subtitle="Report history and referee documents"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 28%"
            actions={
              <button 
                onClick={() => {
                  setSubmitError('');
                  setSubmitSuccess('');
                  setShowAdd(true);
                }} 
                className="btn-gold px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                disabled={!selectedRaceId}
              >
                <Plus size={14} /> Create Report
              </button>
            }
          />

          {/* Select Race Dropdown */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm text-muted font-bold shrink-0">Select race:</span>
              {loadingRaces ? (
                <span className="text-xs text-muted">Loading races...</span>
              ) : races.length === 0 ? (
                <span className="text-xs text-red-400">No assigned races found</span>
              ) : (
                <select
                  value={selectedRaceId}
                  onChange={e => setSelectedRaceId(Number(e.target.value))}
                  className="bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none min-w-[200px]"
                >
                  {races.map(r => (
                    <option key={r.raceId} value={r.raceId} className="bg-[#0b101e]">
                      {r.raceName} (ID: {r.raceId})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            
            {/* Left Pane: Reports list */}
            <div className="space-y-4">
              <div className="glass-panel p-5 rounded-xl border border-glass-border">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-gold" />
                  <span>Race Reports List</span>
                </h3>

                {loadingReports ? (
                  <LoadingSkeleton rows={4} />
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 relative overflow-hidden">
                    <div className="text-4xl opacity-40 mb-3">📋</div>
                    <div className="text-muted text-sm">No report data submitted for this race yet</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((rep) => (
                      <div key={rep.reportId} className="bg-white/[0.02] border border-glass-border/60 hover:border-gold/20 p-4 rounded-xl space-y-3 transition-all">
                        <div className="flex justify-between items-center border-b border-glass-border/30 pb-2">
                          <span className="text-xs text-gold font-mono font-bold">Report ID: #{rep.reportId}</span>
                          <span className="text-xs text-muted/65 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(rep.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                          {rep.content}
                        </div>
                        {(rep.reportedHorseName || rep.violationNote) && (
                          <div className="bg-red-500/[0.04] border border-red-500/10 p-3 rounded-lg text-xs space-y-1">
                            {rep.reportedHorseName && (
                              <div className="text-muted">
                                Reported Horse: <span className="text-red-400 font-semibold">{rep.reportedHorseName}</span>
                              </div>
                            )}
                            {rep.violationNote && (
                              <div className="text-muted">
                                Violation Notes: <span className="text-red-400/90">{rep.violationNote}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Summary stats */}
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 h-fit relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><Award size={15} className="text-gold" /></div>
                <h3 className="text-base font-serif text-white">Season Summary</h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Total Reports to Submit', value: stats ? stats.assignedRaceCount : '—', color: 'text-white' },
                  { label: 'Submitted', value: stats ? stats.completedReportCount : '—', color: 'text-emerald-400' },
                  { label: 'Pending Submission', value: stats ? stats.pendingReportCount : '—', color: 'text-yellow-400' },
                  { label: 'Total Violations Recorded', value: stats ? stats.violationsCreatedCount : '—', color: 'text-red-400' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/30 hover:bg-gold/[0.04] transition-all group">
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

          {/* Create Report Modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel rounded-2xl p-7 w-full max-w-lg border border-glass-border relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-transparent blur-[40px] pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0"><FileText size={15} className="text-gold" /></div>
                  <h3 className="text-lg font-serif text-white">Create New Report</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
                </div>

                <div className="space-y-4 relative z-10">
                  
                  <div>
                    <label className={LABEL}>Select Race *</label>
                    <select 
                      value={selectedRaceId} 
                      onChange={e => setSelectedRaceId(Number(e.target.value))} 
                      className={INPUT} 
                      style={{colorScheme: 'dark'}}
                    >
                      <option value="">-- Select Assigned Race --</option>
                      {races.map(r => (
                        <option key={r.raceId} value={r.raceId}>
                          ID {r.raceId}: {r.raceName} ({r.status || 'Active'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL}>Select Horse / Jockey to Report</label>
                    <select 
                      value={form.reportedHorseId} 
                      onChange={e => setF('reportedHorseId', e.target.value)} 
                      disabled={!selectedRaceId}
                      className={INPUT + " disabled:opacity-50"}
                      style={{colorScheme: 'dark'}}
                    >
                      <option value="">-- General Race Report --</option>
                      {horses.map((h: any) => (
                        <option key={h.horseId} value={h.horseId}>
                          Lane {h.laneNo}: {h.horseName} ({h.jockeyName || 'Jockey'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.reportedHorseId && (
                    <div>
                      <label className={LABEL}>Horse Violation Notes *</label>
                      <input 
                        value={form.violationNote} 
                        onChange={e => setF('violationNote', e.target.value)} 
                        placeholder="Describe violating behavior..." 
                        className={INPUT} 
                      />
                    </div>
                  )}

                  <div>
                    <label className={LABEL}>Detailed Report Content *</label>
                    <textarea 
                      rows={5} 
                      value={form.content} 
                      onChange={e => setF('content', e.target.value)} 
                      placeholder="Describe details of the race progress, incidents, and referee assessment..." 
                      className="w-full bg-[#0B1628] border border-glass-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none resize-none focus:border-gold/40 transition-colors" 
                    />
                  </div>

                  {submitError && (
                    <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="text-sm px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>{submitSuccess}</span>
                    </div>
                  )}

                </div>

                <div className="flex justify-end gap-3 mt-6 relative z-10">
                  <button 
                    onClick={() => setShowAdd(false)} 
                    disabled={submitLoading} 
                    className="px-5 py-2 rounded-lg text-sm text-muted border border-glass-border hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitLoading} 
                    className="btn-gold px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitLoading && <Loader size={12} className="animate-spin" />}
                    Submit Report
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
