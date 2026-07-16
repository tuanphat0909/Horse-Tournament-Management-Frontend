import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { verifyEmail, parseApiError } from '../api/authService';
import { BrandLogo } from '../components/ui/BrandLogo';
import { useNotifications } from '../context/NotificationContext';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function CornerOrnament() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M0 40V0H40" stroke="#d4af37" strokeOpacity="0.6" strokeWidth="1" />
      <path d="M4 36V4H36" stroke="#d4af37" strokeOpacity="0.3" strokeWidth="1" />
      <circle cx="4" cy="4" r="1.5" fill="#d4af37" />
    </svg>
  );
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const token = searchParams.get('token');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      setStatus('error');
      setErrorMessage('Không tìm thấy mã xác thực (token) hợp lệ trên đường dẫn.');
      return;
    }

    async function performVerification() {
      try {
        await verifyEmail(token!);
        setStatus('success');
        showToast('Kích hoạt thành công', 'Tài khoản của bạn đã được kích hoạt thành công. Bạn đã có thể đăng nhập.', 'success');
      } catch (err: unknown) {
        setStatus('error');
        const parsedError = parseApiError(err as Error);
        setErrorMessage(parsedError || 'Mã kích hoạt không hợp lệ hoặc đã hết hạn.');
        showToast('Kích hoạt thất bại', parsedError || 'Đã xảy ra lỗi khi xác thực tài khoản.', 'error');
      }
    }

    performVerification();
  }, [token, showToast]);

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: '#0b101e',
        backgroundImage:
          'radial-gradient(ellipse at 0% 100%, rgba(212,175,55,0.15) 0%, transparent 50%), radial-gradient(ellipse at 100% 0%, rgba(212,175,55,0.1) 0%, transparent 40%)',
        fontFamily: '"DM Sans", sans-serif',
        color: '#e2e8f0',
      }}
    >
      {/* Background wave lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="#d4af37" strokeWidth="0.1" />
        <path d="M0,60 Q35,10 60,60 T100,60" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.8" />
        <path d="M0,40 Q15,80 40,40 T100,40" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.6" />
        <path d="M0,70 Q45,30 70,70 T100,70" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.4" />
        <path d="M0,80 Q50,90 80,40 T100,80" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.5" />
        <path d="M-10,110 C30,70 60,10 110,-10" fill="none" stroke="#d4af37" strokeWidth="0.2" opacity="0.3" />
        <path d="M-10,90 C40,50 80,30 110,10" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.2" />
      </svg>

      {/* Logo */}
      <header className="absolute top-0 left-0 w-full px-12 py-8 z-20">
        <div
          className="tracking-widest font-semibold cursor-pointer"
          style={{ fontFamily: '"Playfair Display", serif', color: '#d4af37', fontSize: '26px' }}
          onClick={() => navigate('/')}
        >
          EQUESTRIA
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center relative z-10 px-6 py-12 w-full max-w-[1600px] mx-auto">
        <section className="w-full flex justify-center">
          <div className="w-full max-w-md" style={{
            padding: '1px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.55) 0%, rgba(212,175,55,0.08) 40%, rgba(212,175,55,0.45) 100%)',
            boxShadow: '0 0 30px rgba(212,175,55,0.12), 0 0 60px rgba(212,175,55,0.06)',
          }}>
            <motion.div
              className="rounded-2xl p-10 relative overflow-hidden auth-card"
              style={{
                background: 'rgba(15,23,42,0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '15px',
                boxShadow: 'inset 0 1px 0 rgba(212,175,55,0.1), 0 25px 50px -12px rgba(0,0,0,0.6)',
              }}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {/* Corners */}
              <div className="absolute top-3 left-3 pointer-events-none"><CornerOrnament /></div>
              <div className="absolute top-3 right-3 pointer-events-none scale-x-[-1]"><CornerOrnament /></div>
              <div className="absolute bottom-3 left-3 pointer-events-none scale-y-[-1]"><CornerOrnament /></div>
              <div className="absolute bottom-3 right-3 pointer-events-none scale-x-[-1] scale-y-[-1]"><CornerOrnament /></div>

              {/* Brand Logo Header */}
              <motion.div variants={fadeUp} className="text-center mb-6 relative z-10">
                <BrandLogo size={84} className="mb-3" />
                <h2
                  className="text-2xl tracking-widest mb-2"
                  style={{ fontFamily: '"Playfair Display", serif', color: '#d4af37' }}
                >
                  EQUESTRIA
                </h2>
              </motion.div>

              {/* Status Rendering */}
              {status === 'loading' && (
                <motion.div variants={fadeUp} className="text-center py-6 relative z-10 flex flex-col items-center">
                  <div className="mb-6">
                    <Loader2 size={48} className="text-[#d4af37] animate-spin" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
                    Xác Thực Tài Khoản
                  </h3>
                  <p className="text-sm px-4" style={{ color: '#94a3b8' }}>
                    Đang xác thực tài khoản của bạn, vui lòng đợi...
                  </p>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div variants={fadeUp} className="text-center py-6 relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <CheckCircle2 size={32} className="text-[#10b981]" />
                  </div>
                  <h3 className="text-xl font-bold tracking-wider mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#d4af37' }}>
                    Kích Hoạt Thành Công!
                  </h3>
                  <p className="text-sm leading-relaxed mb-8 px-4" style={{ color: '#e2e8f0' }}>
                    Chúc mừng! Tài khoản của bạn đã được kích hoạt thành công.
                  </p>
                  <button
                    className="w-full font-bold text-sm tracking-wider uppercase py-3.5 rounded-md flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    style={{ background: 'linear-gradient(135deg,#e9c46a 0%,#d4af37 50%,#aa8c2c 100%)', color: '#0b101e' }}
                    type="button"
                    onClick={() => navigate('/login')}
                  >
                    Đi đến Đăng nhập
                  </button>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div variants={fadeUp} className="text-center py-6 relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <XCircle size={32} className="text-[#ef4444]" />
                  </div>
                  <h3 className="text-xl font-bold tracking-wider mb-4" style={{ fontFamily: '"Playfair Display", serif', color: '#ef4444' }}>
                    Kích Hoạt Thất Bại
                  </h3>
                  <p className="text-sm leading-relaxed mb-8 px-4" style={{ color: '#e2e8f0' }}>
                    {errorMessage || 'Mã kích hoạt không hợp lệ hoặc đã hết hạn (quá 15 phút). Vui lòng thực hiện đăng ký lại hoặc liên hệ Admin.'}
                  </p>
                  <button
                    className="w-full font-bold text-sm tracking-wider uppercase py-3.5 rounded-md flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    style={{ background: 'linear-gradient(135deg,#e9c46a 0%,#d4af37 50%,#aa8c2c 100%)', color: '#0b101e' }}
                    type="button"
                    onClick={() => navigate('/register')}
                  >
                    Quay lại Đăng ký
                  </button>
                </motion.div>
              )}

            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
