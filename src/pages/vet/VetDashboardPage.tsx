import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { Topbar } from '../../components/layout/Topbar';
import { PageHero } from '../../components/layout/PageHero';
import { PageAmbience } from '../../components/layout/PageAmbience';
import { ClipboardList, Activity, Heart, ShieldAlert, ChevronRight } from 'lucide-react';
import { getMedicalChecks, getPendingRegistrations } from '../../api/vetService';

export function VetDashboardPage() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [dopingCount, setDopingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPendingRegistrations(), getMedicalChecks()])
      .then(([pendingRes, historyRes]) => {
        if (pendingRes && pendingRes.result) {
          setPendingCount(pendingRes.result.length);
        }
        if (historyRes && historyRes.result) {
          const history = historyRes.result;
          setTotalCount(history.length);
          setPassedCount(history.filter((h: any) => h.medicalResult === 'Pass').length);
          setDopingCount(history.filter((h: any) => h.dopingResult === 'Positive').length);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen text-body font-sans flex" style={{backgroundColor: '#0b101e'}}>
      <Sidebar />
      <div className="flex-1 relative min-w-0 overflow-y-auto">
        <PageAmbience accent="red" />
        <Topbar />
        <main className="relative z-10 max-w-[1600px] mx-auto px-8 py-6 space-y-6">

          <PageHero
            title="Bảng điều khiển Thú y"
            subtitle="Hệ thống quản lý kiểm tra y tế và an toàn sinh học dành cho ngựa đua"
            imageUrl="/images/hero-referee.jpg"
            imagePosition="right 52%"
          />

          {loading ? (
            <div className="text-center py-12 text-muted">Đang tải số liệu thống kê...</div>
          ) : (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div 
                  onClick={() => navigate('/vet/medical-check')}
                  className="glass-panel rounded-xl p-6 flex items-center justify-between hover:border-gold/30 hover:bg-white/[0.03] transition-all cursor-pointer group"
                >
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted uppercase">Chờ kiểm tra</span>
                    <h3 className="text-3xl font-serif font-bold text-white group-hover:text-gold transition-colors">{pendingCount}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                    <ClipboardList className="text-gold" size={24} />
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted uppercase">Đã thực hiện</span>
                    <h3 className="text-3xl font-serif font-bold text-white">{totalCount}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Activity className="text-blue-400" size={24} />
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted uppercase">Đạt chuẩn y tế</span>
                    <h3 className="text-3xl font-serif font-bold text-white">{passedCount}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Heart className="text-emerald-400" size={24} />
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-6 flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted uppercase">Nghi nhiễm Doping</span>
                    <h3 className="text-3xl font-serif font-bold text-red-400">{dopingCount}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <ShieldAlert className="text-red-400" size={24} />
                  </div>
                </div>

              </div>

              {/* Quick Actions Panel */}
              <div className="glass-panel rounded-xl p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none" />
                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-champagne">Bắt đầu quy trình kiểm tra sức khỏe ngựa</h4>
                  <p className="text-sm text-muted">Xem danh sách các ngựa đã được phê duyệt đăng ký nhưng chưa tiến hành khám lâm sàng.</p>
                </div>
                <button
                  onClick={() => navigate('/vet/medical-check')}
                  className="bg-gold hover:bg-gold-hover text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-all inline-flex items-center gap-2 shrink-0 self-start md:self-auto"
                >
                  Bắt đầu khám <ChevronRight size={16} />
                </button>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
