import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Trash2, Calendar, ShieldAlert, Flag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getReferees, getRacesRefereeAssignments, removeReferee } from '../../api/adminService';
import { parseApiError } from '../../api/authService';
import { useNotifications } from '../../context/NotificationContext';

import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
const fixMojibake = (str: string): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
};

export function AdminRefereesPage() {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [referees, setReferees] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [refereesRes, racesRes] = await Promise.all([
        getReferees(),
        getRacesRefereeAssignments()
      ]);

      const refereesData = refereesRes?.result ?? (Array.isArray(refereesRes) ? refereesRes : []);
      setReferees(refereesData.map((r: any) => ({ ...r, fullName: fixMojibake(r.fullName) })));

      const racesData = racesRes?.result ?? (Array.isArray(racesRes) ? racesRes : []);
      setRaces(racesData.map((race: any) => ({
        ...race,
        raceName: fixMojibake(race.raceName),
        roundName: fixMojibake(race.roundName),
        tournamentName: fixMojibake(race.tournamentName),
        referees: (race.referees ?? []).map((ref: any) => ({ ...ref, fullName: fixMojibake(ref.fullName) }))
      })));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRemove = async (raceId: number, refereeId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy phân công trọng tài này cho cuộc đua?')) return;
    try {
      await removeReferee(raceId, refereeId);
      showToast('Thành công', 'Đã hủy phân công trọng tài.');
      await fetchData();
    } catch (err: any) {
      showToast('Lỗi', parseApiError(err), 'error');
    }
  };

  // Tra cứu ngược: mỗi trọng tài đang phụ trách những cuộc đua nào (vòng nào, giải nào)
  const assignmentsByReferee = useMemo(() => {
    const map: Record<number, any[]> = {};
    races.forEach((race: any) => {
      (race.referees ?? []).forEach((ref: any) => {
        (map[ref.refereeId] ??= []).push({
          raceId: race.raceId,
          raceName: race.raceName,
          roundName: race.roundName,
          tournamentName: race.tournamentName,
          raceDate: race.raceDate,
          status: race.status
        });
      });
    });
    return map;
  }, [races]);

  // Filter races into assigned and unassigned
  const unassignedRaces = races.filter(r => !r.referees || r.referees.length === 0);
  const assignedRaces = races.filter(r => r.referees && r.referees.length > 0);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{ backgroundColor: '#0b101e' }}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-[1600px] mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Quản lý trọng tài"
            subtitle="Theo dõi danh sách trọng tài và phân công theo từng vòng, từng giải — việc gán trọng tài thực hiện tại trang Quản lý cuộc đua, sau khi ghép làn"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
            actions={
              <button onClick={() => navigate('/admin/races')} className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-bold">
                Tới trang Quản lý cuộc đua <ArrowRight size={15} />
              </button>
            }
          />

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">

              {/* Left Column: Tổng danh sách trọng tài + đang phụ trách vòng/giải nào */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel rounded-xl overflow-hidden h-fit"
              >
                <div className="p-5 border-b border-glass-border flex items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <h2 className="text-lg font-serif text-white font-semibold">Danh Sách Trọng Tài</h2>
                  <span className="ml-auto px-2.5 py-0.5 rounded-full bg-gold/10 text-gold text-xs font-bold border border-gold/20">
                    {referees.length}
                  </span>
                </div>
                <div className="p-5">
                  {referees.length === 0 ? (
                    <div className="text-center py-12 text-muted">Không có trọng tài nào trong hệ thống.</div>
                  ) : (
                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                      {referees.map((r) => {
                        const assigns = assignmentsByReferee[r.refereeId] ?? [];
                        return (
                          <div
                            key={r.refereeId}
                            className="p-3 rounded-lg bg-white/[0.02] border border-glass-border hover:border-gold/20 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 text-gold text-sm font-bold font-serif">
                                {r.fullName ? r.fullName.charAt(0).toUpperCase() : 'R'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-white truncate">{r.fullName}</div>
                                <div className="text-xs text-muted truncate">{r.email}</div>
                                <div className="text-[10px] text-gold/80 mt-0.5">
                                  GP: {r.licenseNumber || 'N/A'} • {r.experienceYears} năm KN
                                </div>
                              </div>
                              {assigns.length > 0 ? (
                                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {assigns.length} cuộc đua
                                </span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-muted border border-glass-border">
                                  Chưa phân công
                                </span>
                              )}
                            </div>

                            {/* Đang phụ trách: cuộc đua • vòng • giải */}
                            {assigns.length > 0 && (
                              <div className="mt-2.5 pt-2.5 border-t border-glass-border/50 space-y-1.5">
                                {assigns.map((a: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-[11px]">
                                    <Flag size={11} className="text-cyan-400 shrink-0" />
                                    <span className="text-white truncate">{a.raceName}</span>
                                    <span className="text-muted truncate">• {a.roundName || 'Vòng ?'} • {a.tournamentName || 'Giải ?'}</span>
                                    <span className="ml-auto text-muted/70 shrink-0">{a.raceDate ? new Date(a.raceDate).toLocaleDateString('vi-VN') : ''}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Right Column: Phân công theo cuộc đua (chỉ xem / gỡ — gán tại trang Quản lý cuộc đua) */}
              <div className="space-y-6">

                {/* 1. Races chưa có trọng tài — cảnh báo, dẫn sang trang lịch đua */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel rounded-xl overflow-hidden"
                >
                  <div className="p-5 border-b border-glass-border flex items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                    <AlertCircle size={18} className="text-yellow-400" />
                    <h2 className="text-lg font-serif text-white font-semibold">Chưa Phân Công Trọng Tài (Unassigned)</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold border border-yellow-500/20">
                      {unassignedRaces.length}
                    </span>
                  </div>

                  <div className="p-5">
                    {unassignedRaces.length === 0 ? (
                      <div className="p-8 text-center text-muted">
                        <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                        Tất cả các trận đấu đã được phân công trọng tài.
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 text-[11px] text-champagne/80 bg-gold/5 border border-gold/15 rounded-lg px-3 py-2 leading-relaxed">
                          Các cuộc đua dưới đây chưa có trọng tài. Vào <b>Quản lý cuộc đua</b> → bấm nút <b>phân công trọng tài</b> trên card cuộc đua (sau khi đã ghép ngựa vào làn).
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {unassignedRaces.map((race) => (
                            <div
                              key={race.raceId}
                              className="p-4 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/10 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold/80 bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                                    {race.roundName || 'Prefinal'}
                                  </span>
                                  <span className="text-xs text-muted flex items-center gap-1">
                                    <Calendar size={12} />
                                    {new Date(race.raceDate).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                                <h3 className="text-sm font-semibold text-white mb-1">{race.raceName}</h3>
                                <p className="text-xs text-muted mb-3 truncate">{race.tournamentName || 'Giải đấu'}</p>
                                <div className="text-xs text-muted/80">
                                  Cự ly: <span className="text-white font-mono">{race.distanceMeter}m</span>
                                </div>
                              </div>
                              <div className="pt-3 mt-3 border-t border-glass-border">
                                <button
                                  onClick={() => navigate('/admin/races')}
                                  className="w-full py-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                                >
                                  Phân công tại Quản lý cuộc đua <ArrowRight size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* 2. Đã phân công — chỉ xem chi tiết + gỡ */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel rounded-xl overflow-hidden"
                >
                  <div className="p-5 border-b border-glass-border flex items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                    <CheckCircle size={18} className="text-emerald-400" />
                    <h2 className="text-lg font-serif text-white font-semibold">Đã Phân Công Trọng Tài (Assigned)</h2>
                    <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      {assignedRaces.length}
                    </span>
                  </div>

                  <div className="p-5">
                    {assignedRaces.length === 0 ? (
                      <div className="p-8 text-center text-muted">
                        <ShieldAlert size={32} className="mx-auto mb-2 text-yellow-400 opacity-60" />
                        Chưa có cuộc đua nào được gán trọng tài.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignedRaces.map((race) => (
                          <div
                            key={race.raceId}
                            className="p-4 rounded-xl bg-white/[0.02] border border-glass-border hover:border-gold/10 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  {race.roundName || 'Prefinal'}
                                </span>
                                <span className="text-xs text-muted flex items-center gap-1">
                                  <Calendar size={12} />
                                  {new Date(race.raceDate).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              <h3 className="text-sm font-semibold text-white mb-1">{race.raceName}</h3>
                              <p className="text-xs text-muted mb-3 truncate">{race.tournamentName || 'Giải đấu'}</p>
                              <div className="text-xs text-muted/80 mb-4">
                                Cự ly: <span className="text-white font-mono">{race.distanceMeter}m</span>
                              </div>
                            </div>

                            {/* Assigned Referees List */}
                            <div className="pt-3 border-t border-glass-border space-y-2">
                              <div className="text-xs font-semibold text-white/70 mb-1">Trọng tài phụ trách:</div>
                              <div className="space-y-1.5">
                                {race.referees.map((ref: any) => (
                                  <div
                                    key={ref.refereeId}
                                    className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-white/5 text-xs"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-white truncate">{ref.fullName}</div>
                                      <div className="text-[10px] text-muted truncate">GP: {ref.licenseNumber}</div>
                                    </div>
                                    <button
                                      className="p-1 rounded text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                                      onClick={() => handleRemove(race.raceId, ref.refereeId)}
                                      title="Hủy phân công"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
