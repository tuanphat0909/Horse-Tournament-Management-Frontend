import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useLanguage } from '../../context/LanguageContext';

const NAV_LINKS = [
  { label: 'Tournaments', href: '#tournaments' },
  { label: 'Leaderboard', href: '#leaderboard' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
];

export function Navbar() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen ? 'bg-navy-light/95 backdrop-blur-xl border-b border-glass-border shadow-2xl' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => { navigate('/'); setMobileOpen(false); }}
        >
          <BrandLogo size={56} />
          <span className="font-serif text-2xl font-bold text-champagne tracking-wider">EQUESTRIA</span>
        </div>

        {/* Center Links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-body hover:text-white transition-colors relative group"
            >
              {t(item.label)}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Right Buttons — desktop only */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-body hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 rounded-md px-2 py-1"
          >
            {t('Sign In')}
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-gold px-6 py-2.5 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-navy"
          >
            {t('Register')}
          </button>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden p-2 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden overflow-hidden border-t border-glass-border bg-navy-light/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {NAV_LINKS.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-body hover:text-white transition-colors py-2 border-b border-glass-border/40 last:border-0"
                >
                  {t(item.label)}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { navigate('/login'); setMobileOpen(false); }}
                  className="flex-1 py-2.5 rounded-lg border border-glass-border text-sm font-medium text-body hover:text-white hover:bg-white/5 transition-colors"
                >
                  {t('Sign In')}
                </button>
                <button
                  onClick={() => { navigate('/register'); setMobileOpen(false); }}
                  className="flex-1 btn-gold py-2.5 rounded-lg text-xs font-bold"
                >
                  {t('Register')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
