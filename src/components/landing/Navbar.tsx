import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import type { RouteView } from '../../App';

interface NavbarProps {
  navigateTo: (view: RouteView) => void;
}

export const Navbar = ({ navigateTo }: NavbarProps) => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-navy-light/80 backdrop-blur-xl border-b border-glass-border shadow-2xl' : 'bg-transparent'
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30 group-hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all">
            <svg viewBox="0 0 24 24" fill="var(--color-gold)" className="w-4 h-4">
              <path d="M12 2C9 2 8 5 8 5L6 6V10L8 12V18L6 20H8V22H10V20H14V22H16V20H18L16 18V12L18 10V6L16 5C16 5 15 2 12 2Z" />
            </svg>
          </div>
          <span className="font-serif text-2xl font-bold text-champagne tracking-wider">Chưa có tên</span>
        </div>

        {/* Center: Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Tournaments', 'Leaderboard', 'Features', 'About'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-body hover:text-white transition-colors relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo('login')}
            className="text-sm font-medium text-body hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50 rounded-md px-2 py-1"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigateTo('register')}
            className="btn-gold px-6 py-2.5 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-navy"
          >
            Register
          </button>
        </div>
      </div>
    </motion.nav>
  );
};
