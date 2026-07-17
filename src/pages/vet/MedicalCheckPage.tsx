import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import {
  getMedicalChecks,
  createMedicalCheck,
  updateMedicalCheck,
  deleteMedicalCheck,
  getPendingRegistrations,
  getAssignedEntries,
  performRecheck,
} from '../../api/vetService';
import { parseApiError } from '../../api/authService';

type Tab = 'pending' | 'assigned' | 'history';

interface PendingCheck {
  registrationId: number;
  horseName: string;
  tournamentName: string;
  ownerName: string;
  registeredAt: string;
}

interface AssignedEntry {
  raceEntryId: number;
  raceId: number;
  raceName: string | null;
  raceDate: string;
  raceStatus: string;
  laneNo: number;
  raceEntryStatus: string;
  registrationId: number;
  horseName: string | null;
  ownerName: string | null;
  jockeyName: string | null;
  tournamentName: string | null;
  lastMedicalResult: string | null;
  lastCheckType: string | null;
  lastCheckedAt: string | null;
}

interface MedicalRecord {
  id: number;
  registrationId: number;
  horseName: string;
  tournamentName: string;
  userId: number;
  checkedByName: string;
  weight: number;
  temperature: number | null;
  heartRate: number | null;
  dopingResult: string;
  medicalResult: string;
  notes: string | null;
  checkedAt: string;
}

export function MedicalCheckPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');

  const [pendingList, setPendingList] = useState<PendingCheck[]>([]);
  const [assignedList, setAssignedList] = useState<AssignedEntry[]>([]);
  const [historyList, setHistoryList] = useState<MedicalRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state — shared for create / edit / recheck
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'recheck'>('create');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [selectedRegId, setSelectedRegId] = useState<number | null>(null);
  const [selectedHorseName, setSelectedHorseName] = useState('');

  // Form fields
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [dopingResult, setDopingResult] = useState('Negative');
  const [medicalResult, setMedicalResult] = useState('Pass');
  const [failReason, setFailReason] = useState('');
  const [notes, setNotes] = useState('');

  // ✅ Business Rule: A horse can only Pass if ALL vital signs and weight are within safe range
  const isEligibleForPass =
    parseFloat(temperature) >= 37.2 && parseFloat(temperature) <= 38.3 &&
    parseInt(heartRate)     >= 28   && parseInt(heartRate)     <= 44 &&
    parseFloat(weight)      >= 300  && parseFloat(weight)      <= 700 &&
    dopingResult === 'Negative';

  // Auto-force medicalResult to 'Fail' if not eligible for Pass
  useEffect(() => {
    if (!isEligibleForPass && medicalResult === 'Pass') {
      setMedicalResult('Fail');
    }
  }, [isEligibleForPass]);

  useEffect(() => { loadData(); }, []);

  function loadData() {
    setLoading(true);
    setError('');
    Promise.allSettled([
      getPendingRegistrations(),
      getAssignedEntries(),
      getMedicalChecks(),
    ]).then(([pendingRes, assignedRes, historyRes]) => {
      if (pendingRes.status === 'fulfilled') setPendingList(pendingRes.value?.result ?? []);
      if (assignedRes.status === 'fulfilled') setAssignedList(assignedRes.value?.result ?? []);
      if (historyRes.status === 'fulfilled') setHistoryList(historyRes.value?.result ?? []);
      if (pendingRes.status === 'rejected' && assignedRes.status === 'rejected' && historyRes.status === 'rejected') {
        setError('Failed to load health inspection data.');
      }
      setLoading(false);
    });
  }

  function resetForm() {
    setWeight(''); setTemperature(''); setHeartRate('');
    setDopingResult('Negative'); setMedicalResult('Pass');
    setFailReason(''); setNotes('');
  }

  function openCreate(pc: PendingCheck) {
    setModalType('create');
    setSelectedRegId(pc.registrationId);
    setSelectedHorseName(pc.horseName);
    resetForm();
    setShowModal(true);
  }

  function openEdit(mr: MedicalRecord) {
    setModalType('edit');
    setSelectedRecordId(mr.id);
    setSelectedHorseName(mr.horseName);
    setWeight(mr.weight.toString());
    setTemperature(mr.temperature?.toString() ?? '');
    setHeartRate(mr.heartRate?.toString() ?? '');
    setDopingResult(mr.dopingResult);
    setMedicalResult(mr.medicalResult);
    setFailReason(''); setNotes(mr.notes ?? '');
    setShowModal(true);
  }

  function openRecheck(ae: AssignedEntry) {
    setModalType('recheck');
    setSelectedRegId(ae.registrationId);
    setSelectedHorseName(ae.horseName ?? `Horse #${ae.raceId}`);
    resetForm();
    setShowModal(true);
  }

  function handleDelete(id: number) {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    setLoading(true);
    deleteMedicalCheck(id)
      .then(() => { setSuccess('Medical record deleted successfully!'); loadData(); })
      .catch((err: any) => { setError(err.response?.data?.message ?? 'Error deleting.'); setLoading(false); });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) { setError('Weight must be greater than 0.'); return; }
    if (medicalResult === 'Fail' && modalType === 'recheck' && !failReason.trim()) {
      setError('FailReason is required when result is Fail.'); return;
    }

    const base = {
      weight: parseFloat(weight),
      temperature: temperature ? parseFloat(temperature) : null,
      heartRate: heartRate ? parseInt(heartRate) : null,
      dopingResult,
      medicalResult,
      failReason: failReason || null,
      notes: notes || null,
    };

    setLoading(true); setError(''); setSuccess('');

    if (modalType === 'create') {
      createMedicalCheck({ registrationId: selectedRegId, ...base })
        .then(() => { setSuccess('Inspection result saved!'); setShowModal(false); loadData(); })
        .catch((err: any) => { setError(parseApiError(err)); setLoading(false); });
    } else if (modalType === 'edit') {
      updateMedicalCheck(selectedRecordId!, base)
        .then(() => { setSuccess('Medical record updated!'); setShowModal(false); loadData(); })
        .catch((err: any) => { setError(parseApiError(err)); setLoading(false); });
    } else {
      // recheck
      performRecheck({ registrationId: selectedRegId, ...base })
        .then((res: any) => {
          const withdrawn = res?.result?.horseWithdrawn;
          setSuccess(withdrawn
            ? `Recheck completed — Horse withdrawn from the race (Failed).`
            : `Recheck completed — Horse continues to compete (Passed).`);
          setShowModal(false); loadData();
        })
        .catch((err: any) => { setError(parseApiError(err)); setLoading(false); });
    }
  }

  const INPUT_CLS = 'w-full bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 text-sm text-white focus:border-gold outline-none';

  const filteredPending = pendingList.filter(pc =>
    [pc.horseName, pc.tournamentName, pc.ownerName].some(s => s?.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredAssigned = assignedList.filter(ae =>
    [ae.horseName, ae.raceName, ae.tournamentName, ae.ownerName].some(s => s?.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredHistory = historyList.filter(mr =>
    [mr.horseName, mr.tournamentName, mr.checkedByName].some(s => s?.toLowerCase().includes(search.toLowerCase()))
  );

  const TAB_BTN = (t: Tab, label: string, count: number) => (
    <button
      onClick={() => { setActiveTab(t); setSearch(''); }}
      className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all ${activeTab === t ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-white'}`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Horse Health Inspection"
            subtitle="Medical record, doping test and entry eligibility check - re-inspection of scheduled horses"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
          />

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
          {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">{success}</div>}

          {/* Tabs & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-glass-border">
            <div className="flex items-center gap-1">
              {TAB_BTN('pending', 'Awaiting Inspection', pendingList.length)}
              {TAB_BTN('assigned', 'Race Scheduled', assignedList.length)}
              {TAB_BTN('history', 'Inspection History', historyList.length)}
            </div>
            <div className="flex items-center gap-2 bg-white/[0.04] border border-glass-border rounded-lg px-3 py-2 w-full md:w-64 mb-3">
              <Search size={14} className="text-muted shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search horses, tournaments, owners..." className="bg-transparent text-sm text-white placeholder:text-muted/60 outline-none w-full" />
            </div>
          </div>

          {/* Tab: Awaiting Inspection */}
          {activeTab === 'pending' && (
            loading ? <div className="text-center py-12 text-muted">Loading...</div>
            : filteredPending.length === 0
              ? <div className="glass-panel rounded-xl p-12 text-center text-muted">No horses awaiting inspection.</div>
              : (
                <div className="glass-panel rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                          <th className="px-6 py-4">Horse</th>
                          <th className="px-6 py-4">Tournaments</th>
                          <th className="px-6 py-4">Owner</th>
                          <th className="px-6 py-4">Registration Date</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                        {filteredPending.map(pc => (
                          <tr key={pc.registrationId} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 font-medium text-gold">{pc.horseName}</td>
                            <td className="px-6 py-4 text-muted">{pc.tournamentName}</td>
                            <td className="px-6 py-4 text-muted">{pc.ownerName}</td>
                            <td className="px-6 py-4 text-muted">{new Date(pc.registeredAt).toLocaleDateString('vi-VN')}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => openCreate(pc)} className="bg-gold/10 hover:bg-gold/20 text-gold px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 border border-gold/30">
                                <Plus size={12} /> Medical Check
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
          )}

          {/* Tab: Horse đã xếp lịch đua */}
          {activeTab === 'assigned' && (
            loading ? <div className="text-center py-12 text-muted">Loading...</div>
            : filteredAssigned.length === 0
              ? <div className="glass-panel rounded-xl p-12 text-center text-muted">No horses scheduled for races.</div>
              : (
                <div className="glass-panel rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                          <th className="px-6 py-4">Horse</th>
                          <th className="px-6 py-4">Race</th>
                          <th className="px-6 py-4">Race Date</th>
                          <th className="px-6 py-4">Lane</th>
                          <th className="px-6 py-4">Last Check</th>
                          <th className="px-6 py-4">Status entry</th>
                          <th className="px-6 py-4 text-right">Recheck</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                        {filteredAssigned.map(ae => (
                          <tr key={ae.raceEntryId} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gold">{ae.horseName ?? '—'}</div>
                              {ae.ownerName && <div className="text-xs text-muted">{ae.ownerName}</div>}
                            </td>
                            <td className="px-6 py-4 text-muted">
                              <div>{ae.raceName ?? '—'}</div>
                              {ae.tournamentName && <div className="text-xs text-muted/60">{ae.tournamentName}</div>}
                            </td>
                            <td className="px-6 py-4 text-muted whitespace-nowrap">
                              {ae.raceDate ? new Date(ae.raceDate).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-6 py-4 text-center font-mono font-bold text-champagne">{ae.laneNo}</td>
                            <td className="px-6 py-4">
                              {ae.lastMedicalResult ? (
                                <div>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ae.lastMedicalResult === 'Pass' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {ae.lastMedicalResult === 'Pass' ? 'Pass' : 'Fail'}
                                  </span>
                                  {ae.lastCheckType && <span className="ml-1 text-[10px] text-muted">{ae.lastCheckType}</span>}
                                  {ae.lastCheckedAt && <div className="text-[10px] text-muted/60 mt-0.5">{new Date(ae.lastCheckedAt).toLocaleDateString('vi-VN')}</div>}
                                </div>
                              ) : <span className="text-muted text-xs">None</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                ae.raceEntryStatus === 'Withdrawn' || ae.raceEntryStatus === 'Disqualified'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : ae.raceEntryStatus === 'Confirmed' || ae.raceEntryStatus === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                {ae.raceEntryStatus || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => openRecheck(ae)}
                                disabled={ae.raceEntryStatus === 'Withdrawn' || ae.raceEntryStatus === 'Disqualified'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <RefreshCw size={11} /> Recheck
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
          )}

          {/* Tab: Inspection History */}
          {activeTab === 'history' && (
            loading ? <div className="text-center py-12 text-muted">Loading history...</div>
            : filteredHistory.length === 0
              ? <div className="glass-panel rounded-xl p-12 text-center text-muted">No medical records found.</div>
              : (
                <div className="glass-panel rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-glass-border bg-white/[0.02] text-xs font-semibold text-muted uppercase tracking-wider">
                          <th className="px-6 py-4">Horse</th>
                          <th className="px-6 py-4">Tournaments</th>
                          <th className="px-6 py-4">Weight</th>
                          <th className="px-6 py-4">Temperature</th>
                          <th className="px-6 py-4">Heart Rate</th>
                          <th className="px-6 py-4">Doping</th>
                          <th className="px-6 py-4">Medical</th>
                          <th className="px-6 py-4">Checked By</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass-border/40 text-sm text-white">
                        {filteredHistory.map(mr => (
                          <tr key={mr.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-6 py-4 font-medium text-gold">{mr.horseName}</td>
                            <td className="px-6 py-4 text-muted text-xs max-w-[150px] truncate">{mr.tournamentName}</td>
                            <td className="px-6 py-4 font-mono">{mr.weight} kg</td>
                            <td className="px-6 py-4 font-mono">{mr.temperature ? `${mr.temperature}°C` : '—'}</td>
                            <td className="px-6 py-4 font-mono">{mr.heartRate ? `${mr.heartRate} bpm` : '—'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${mr.dopingResult === 'Negative' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {mr.dopingResult === 'Negative' ? 'Negative' : 'Positive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${mr.medicalResult === 'Pass' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {mr.medicalResult === 'Pass' ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted text-xs">{mr.checkedByName}</td>
                            <td className="px-6 py-4 text-right space-x-2 shrink-0">
                              <button onClick={() => openEdit(mr)} className="text-gold hover:text-white bg-gold/10 hover:bg-gold/20 p-1.5 rounded transition-all inline-flex items-center" title="Edit">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => handleDelete(mr.id)} className="text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 p-1.5 rounded transition-all inline-flex items-center" title="Delete">
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
          )}

          {/* Modal: tạo / sửa / tái khám */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-[#0f172a] border border-glass-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-white/[0.02]">
                  <h3 className="font-serif text-lg font-bold text-champagne">
                    {modalType === 'create' && `Medical Check: ${selectedHorseName}`}
                    {modalType === 'edit' && `Edit Medical Record: ${selectedHorseName}`}
                    {modalType === 'recheck' && `Recheck: ${selectedHorseName}`}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-muted hover:text-white text-xl font-bold">×</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {modalType === 'recheck' && (
                    <div className="text-[11px] text-cyan-400/80 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-3 py-2">
                      Re-inspect scheduled horses. If result is Fail, the system automatically withdraws the horse and sends notifications.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase mb-1">Weight (kg) *</label>
                      <input type="number" step="0.01" required value={weight} onChange={e => setWeight(e.target.value)} placeholder="E.g.: 450.5" className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase mb-1">Temperature (°C)</label>
                      <input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="E.g.: 38.2" className={INPUT_CLS} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-1">Heart Rate (bpm)</label>
                    <input type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} placeholder="E.g.: 40" className={INPUT_CLS} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase mb-1">Results Doping *</label>
                      <select value={dopingResult} onChange={e => setDopingResult(e.target.value)} className={INPUT_CLS}>
                        <option value="Negative" className="bg-[#0f172a]">Negative (Negative)</option>
                        <option value="Positive" className="bg-[#0f172a]">Positive (Positive)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase mb-1">Medical Assessment *</label>
                      <select
                        value={medicalResult}
                        onChange={e => setMedicalResult(e.target.value)}
                        className={INPUT_CLS}
                      >
                        <option
                          value="Pass"
                          disabled={!isEligibleForPass}
                          className="bg-[#0f172a]"
                          style={!isEligibleForPass ? { color: '#6b7280', cursor: 'not-allowed' } : {}}
                        >
                          {isEligibleForPass ? 'Pass (✔ Eligible)' : 'Pass (⛔ Ineligible)'}
                        </option>
                        <option value="Fail" className="bg-[#0f172a]">Fail (Fail)</option>
                      </select>
                    </div>
                  </div>

                  {/* ⚠️ Health threshold warning — shown when vital signs or weight are out of safe range */}
                  {!isEligibleForPass && (
                    <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <span className="text-red-400 text-base mt-0.5 shrink-0">⚠️</span>
                      <div>
                        <p className="text-xs font-bold text-red-400 mb-0.5">Horse does not meet health and physical standards for competition</p>
                        <p className="text-[11px] text-red-300/80 leading-relaxed">
                          Temperature: 37.2-38.3°C &nbsp;•&nbsp; Heart Rate: 28-44 bpm &nbsp;•&nbsp; Weight: 300-700 kg &nbsp;•&nbsp; Doping: Negative<br />
                          Must select <strong className="text-red-300">Fail</strong> result.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* FailReason — required for recheck with Fail result */}
                  {modalType === 'recheck' && medicalResult === 'Fail' && (
                    <div>
                      <label className="block text-xs font-bold text-muted uppercase mb-1">Reason Fail *</label>
                      <select value={failReason} onChange={e => setFailReason(e.target.value)} className={INPUT_CLS}>
                        <option value="" className="bg-[#0f172a]">— Select Reason —</option>
                        <option value="FailedMedicalReCheck" className="bg-[#0f172a]">Failed Medical Re-inspection</option>
                        <option value="VeterinaryDecision" className="bg-[#0f172a]">Veterinary Decision</option>
                        <option value="HorseInjury" className="bg-[#0f172a]">Horse Injury</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-muted uppercase mb-1">Medical notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={3} className={`${INPUT_CLS} resize-none`} />
                  </div>

                  {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

                  <div className="pt-4 flex justify-end gap-3 border-t border-glass-border">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-glass-border hover:bg-white/[0.05] rounded-lg text-sm text-muted hover:text-white transition-all">Cancel</button>
                    <button
                      type="submit"
                      disabled={loading || (medicalResult === 'Pass' && !isEligibleForPass)}
                      title={medicalResult === 'Pass' && !isEligibleForPass ? 'Cannot save: Horse is not eligible for Pass' : ''}
                      className="bg-gold hover:bg-gold/80 text-black font-bold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : modalType === 'recheck' ? 'Save Recheck Result' : 'Save Result'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
