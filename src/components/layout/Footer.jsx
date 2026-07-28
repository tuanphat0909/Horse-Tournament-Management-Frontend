import { Link } from 'react-router-dom';
import { Globe, Mail, MessageCircle } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

export function Footer() {
  return (
    <footer className="bg-navy-light/95 backdrop-blur-xl border-t border-glass-border pt-20 pb-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-50 shadow-[0_0_20px_rgba(201,168,76,1)]" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative z-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <BrandLogo size={44} />
            <div className="font-serif text-xl font-bold text-champagne tracking-wider">EQUESTRIA</div>
          </div>
          <p className="text-sm text-muted mb-6">{'The ultimate management platform for elite equestrian tournaments.'}</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-all" aria-label="Home">
              <Globe className="w-4 h-4" />
            </Link>
            <Link to="/about" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-all" aria-label="About">
              <MessageCircle className="w-4 h-4" />
            </Link>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=dackimvo@gmail.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-all" aria-label="Email">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Chỉ giữ những mục dẫn tới nội dung có thật trong hệ thống */}
        <div>
          <h4 className="text-white font-bold mb-6">{'Platform'}</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <Link to="/" className="hover:text-gold transition-colors">
                {'Tournaments'}
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" className="hover:text-gold transition-colors">
                {'Leaderboard'}
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-gold transition-colors">
                {'Live Results'}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">{'Company'}</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <Link to="/about" className="hover:text-gold transition-colors">
                {'About Us'}
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-gold transition-colors">
                {'Register'}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">{'Legal'}</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li>
              <Link to="/legal#privacy" className="hover:text-gold transition-colors">
                {'Privacy Policy'}
              </Link>
            </li>
            <li>
              <Link to="/legal#terms" className="hover:text-gold transition-colors">
                {'Terms of Service'}
              </Link>
            </li>
            <li>
              <Link to="/legal#cookies" className="hover:text-gold transition-colors">
                {'Cookie Policy'}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted relative z-10">
        <div>
          &copy; {new Date().getFullYear()} Equestria Racing Platform. {'All rights reserved.'}
        </div>
        <div className="flex items-center gap-2">
          {'Made with'} <span className="text-gold animate-pulse">✦</span> {'for Champions'}
        </div>
      </div>
    </footer>
  );
}
