import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { login, parseApiError } from '../api/authService';
import { getDashboardPath } from '../utils/roleRoutes';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function HorseSVG() {
  return (
    <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg"
         className="w-full h-full drop-shadow-[0_0_18px_rgba(212,175,55,0.35)]">
      <defs>
        <linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e9c46a"/>
          <stop offset="50%" stopColor="#d4af37"/>
          <stop offset="100%" stopColor="#aa8c2c"/>
        </linearGradient>
      </defs>
      <path
        d="M70,80 C60,70 40,75 20,85 C30,75 45,65 55,65 C55,65 65,55 75,45 C85,35 100,25 115,20 C120,25 130,20 140,25 C145,30 150,40 155,50 C150,45 140,40 135,45 C130,50 135,60 140,65 C130,65 125,75 120,85 C115,95 110,110 100,120 C95,115 90,105 85,95 C80,85 75,75 70,80 Z"
        fill="url(#gg)" stroke="#d4af37" strokeWidth="1.5"/>
      <path d="M115,20 C105,15 95,20 85,30 C95,25 105,25 115,35" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
      <path d="M110,25 C100,20 90,25 80,35" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
      <path d="M20,85 C10,90 5,95 0,105 C10,100 20,95 30,95" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
      <path d="M25,80 C15,85 10,90 5,100" fill="none" stroke="#d4af37" strokeWidth="1.5"/>
    </svg>
  );
}

function CornerOrnament() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
      <path d="M0 40V0H40" stroke="#d4af37" strokeOpacity="0.6" strokeWidth="1"/>
      <path d="M4 36V4H36" stroke="#d4af37" strokeOpacity="0.3" strokeWidth="1"/>
      <circle cx="4" cy="4" r="1.5" fill="#d4af37"/>
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err: unknown) {
      setError(parseApiError(err as Error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: '#0b101e',
        backgroundImage:
          'radial-gradient(ellipse at 0% 100%, rgba(212,175,55,0.15) 0%, transparent 50%), radial-gradient(ellipse at 100% 0%, rgba(212,175,55,0.1) 0%, transparent 40%)',
        fontFamily: '"Inter", sans-serif',
        color: '#e2e8f0',
      }}
    >
      {/* Subtle background wave lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="#d4af37" strokeWidth="0.1"/>
        <path d="M0,60 Q35,10 60,60 T100,60" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.8"/>
        <path d="M0,40 Q15,80 40,40 T100,40" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.6"/>
        <path d="M0,70 Q45,30 70,70 T100,70" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.4"/>
        <path d="M0,80 Q50,90 80,40 T100,80" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.5"/>
        <path d="M-10,110 C30,70 60,10 110,-10" fill="none" stroke="#d4af37" strokeWidth="0.2" opacity="0.3"/>
        <path d="M-10,90 C40,50 80,30 110,10" fill="none" stroke="#d4af37" strokeWidth="0.1" opacity="0.2"/>
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
      <main className="flex-grow flex items-center justify-center relative z-10 px-6 py-12 lg:px-16 w-full max-w-[1600px] mx-auto">
        {/* Vertical divider */}
        <div
          className="absolute hidden lg:flex flex-col items-center pointer-events-none z-0"
          style={{ left: '50%', transform: 'translateX(-50%)', top: '10%', bottom: '10%' }}
        >
          <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.35) 30%, rgba(212,175,55,0.35) 70%, transparent)' }} />
          <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', flexShrink: 0, margin: '10px 0' }}>
            <path d="M12,0 L24,12 L12,24 L0,12 Z" fill="#d4af37" fillOpacity="0.6"/>
            <path d="M12,4 L20,12 L12,20 L4,12 Z" fill="none" stroke="#d4af37" strokeOpacity="0.35" strokeWidth="0.8"/>
          </svg>
          <div style={{ width: '1px', height: '60px', background: 'rgba(212,175,55,0.25)', flexShrink: 0 }} />
          <svg viewBox="0 0 16 16" style={{ width: '14px', height: '14px', flexShrink: 0, margin: '8px 0' }}>
            <path d="M8,0 L16,8 L8,16 L0,8 Z" fill="none" stroke="#d4af37" strokeOpacity="0.45" strokeWidth="1"/>
            <circle cx="8" cy="8" r="2" fill="#d4af37" fillOpacity="0.5"/>
          </svg>
          <div style={{ width: '1px', height: '60px', background: 'rgba(212,175,55,0.25)', flexShrink: 0 }} />
          <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', flexShrink: 0, margin: '10px 0' }}>
            <path d="M12,0 L24,12 L12,24 L0,12 Z" fill="#d4af37" fillOpacity="0.6"/>
            <path d="M12,4 L20,12 L12,20 L4,12 Z" fill="none" stroke="#d4af37" strokeOpacity="0.35" strokeWidth="0.8"/>
          </svg>
          <div style={{ width: '1px', flex: 1, background: 'linear-gradient(to bottom, rgba(212,175,55,0.35), transparent)' }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center w-full">

          {/* Left: Branding */}
          <motion.section
            className="hidden lg:flex flex-col items-center justify-center text-center px-8"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-8 w-72">
              <HorseSVG />
            </div>
            <div className="mb-10">
              <h1
                className="italic font-medium mb-6 leading-tight"
                style={{ fontFamily: '"Playfair Display", serif', color: '#e9c46a', fontSize: '52px', lineHeight: '1.15' }}
              >
                "Where Champions<br/>Are Made."
              </h1>
              <p className="tracking-[0.22em] uppercase font-semibold" style={{ color: '#94a3b8', fontSize: '13px' }}>
                Horse Racing Tournament Management System
              </p>
            </div>
            <div className="flex gap-3">
              {['5 Races', 'Real-time', 'Secure'].map((s) => (
                <span
                  key={s}
                  className="px-5 py-2 rounded-full font-medium tracking-wide"
                  style={{ border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37', background: 'rgba(30,41,59,0.3)', fontSize: '13px' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Right: Login form */}
          <section className="w-full flex justify-center">
            <div className="w-full max-w-md" style={{
              padding: '1px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.55) 0%, rgba(212,175,55,0.08) 40%, rgba(212,175,55,0.45) 100%)',
              boxShadow: '0 0 30px rgba(212,175,55,0.12), 0 0 60px rgba(212,175,55,0.06)',
            }}>
            <motion.div
              className="rounded-2xl p-10 relative overflow-hidden"
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

              {/* Header */}
              <motion.div variants={fadeUp} className="text-center mb-8 relative z-10">
                <h2
                  className="text-2xl tracking-widest mb-2"
                  style={{ fontFamily: '"Playfair Display", serif', color: '#d4af37' }}
                >
                  EQUESTRIA
                </h2>
                <p className="text-sm" style={{ color: '#94a3b8' }}>Sign in to your account</p>
              </motion.div>

              <div className="space-y-5 relative z-10">
                {/* Email */}
                <motion.div variants={fadeUp}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                    Email
                  </label>
                  <input
                    className="w-full rounded-md px-4 py-3 text-sm outline-none transition-all duration-300"
                    style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0' }}
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = '#d4af37')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(148,163,184,0.2)')}
                  />
                </motion.div>

                {/* Password */}
                <motion.div variants={fadeUp}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full rounded-md px-4 py-3 pr-10 text-sm outline-none transition-all duration-300"
                      style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0' }}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                      onFocus={(e) => (e.target.style.borderColor = '#d4af37')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(148,163,184,0.2)')}
                    />
                    <button
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      style={{ color: '#94a3b8' }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>

                {/* Remember / Forgot */}
                <motion.div variants={fadeUp} className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded h-4 w-4" style={{ accentColor: '#d4af37' }} />
                    <span style={{ color: '#94a3b8' }}>Remember me</span>
                  </label>
                  <a href="#" style={{ color: '#d4af37' }}>Forgot password?</a>
                </motion.div>

                {/* Error message */}
                {error && (
                  <motion.div
                    variants={fadeUp}
                    className="rounded-md px-4 py-3 text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit */}
                <motion.div variants={fadeUp}>
                  <button
                    className="w-full font-bold text-sm tracking-wider uppercase py-3.5 rounded-md flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#e9c46a 0%,#d4af37 50%,#aa8c2c 100%)', color: '#0b101e' }}
                    type="button"
                    onClick={handleSignIn}
                    disabled={loading}
                  >
                    {loading ? 'Signing in…' : 'Sign In'}
                    {!loading && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </motion.div>

                {/* Register link */}
                <motion.div variants={fadeUp} className="text-center text-xs" style={{ color: '#94a3b8' }}>
                  Don't have an account?{' '}
                  <a
                    href="#"
                    className="font-medium transition-colors"
                    style={{ color: '#d4af37' }}
                    onClick={(e) => { e.preventDefault(); navigate('/register'); }}
                  >
                    Register here
                  </a>
                </motion.div>
              </div>
            </motion.div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
