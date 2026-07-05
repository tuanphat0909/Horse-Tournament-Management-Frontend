import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { getAdminReferees } from '../../api/adminService';
import { parseApiError } from '../../api/authService';

export function AdminRefereesPage() {
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getAdminReferees()
      .then((data: any) => {
        const list = data?.result ?? (Array.isArray(data) ? data : []);
        setReferees(list);
      })
      .catch((err: unknown) => setError(parseApiError(err as Error)))
      .finally(() => setLoading(false));
  }, []);

  // Backend field shape for referees is not specified, so we read every field
  // defensively (fullName/name/email/licenseNumber/experienceYears + id fallbacks).
  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: 'var(--page-bg)'}}>
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-y-auto relative">
        <PageAmbience accent="gold" />
        <Topbar />
        <main className="max-w-400 mx-auto px-8 py-6 space-y-6 relative z-10">

          <PageHero
            title="Referee Management"
            subtitle="Danh sách trọng tài"
            imageUrl="/images/hero-admin.jpg"
            imagePosition="center center"
          />

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-serif text-white">Referee List</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                {referees.length}
              </span>
            </div>

            {error ? (
              <div className="text-sm px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>
            ) : loading ? (
              <div className="text-center py-12 text-muted text-sm">Đang tải...</div>
            ) : referees.length === 0 ? (
              <div className="glass-panel rounded-xl p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="text-4xl opacity-40 mb-3">🧑‍⚖️</div>
                <div className="text-muted text-sm">Chưa có dữ liệu</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {referees.map((r, i) => {
                  const name = r.fullName ?? r.name ?? ('Referee #' + (r.userId ?? r.refereeId ?? r.id));
                  return (
                    <div key={r.refereeId ?? r.userId ?? r.id ?? i} className="glass-panel rounded-xl p-4 border border-glass-border hover:border-gold/25 transition-all relative overflow-hidden">
                      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                      <div className="text-sm font-semibold text-white">{name}</div>
                      {r.email != null && <div className="text-xs text-muted mt-1">{r.email}</div>}
                      <div className="mt-2 space-y-1 text-xs text-muted">
                        {r.licenseNumber != null && (
                          <div className="flex justify-between">
                            <span>Giấy phép:</span>
                            <span className="text-white font-medium">{r.licenseNumber}</span>
                          </div>
                        )}
                        {r.experienceYears != null && (
                          <div className="flex justify-between">
                            <span>Kinh nghiệm:</span>
                            <span className="text-gold font-bold">{r.experienceYears} năm</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

        </main>
      </div>
    </div>
  );
}
