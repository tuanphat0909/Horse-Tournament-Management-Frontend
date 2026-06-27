import { Globe, Mail, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#040810] border-t border-gold/20 pt-20 pb-10 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-gold to-transparent opacity-50 shadow-[0_0_20px_rgba(201,168,76,1)]" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 relative z-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center border border-gold/30">
              <svg viewBox="0 0 24 24" fill="var(--color-gold)" className="w-3 h-3">
                <path d="M12 2C9 2 8 5 8 5L6 6V10L8 12V18L6 20H8V22H10V20H14V22H16V20H18L16 18V12L18 10V6L16 5C16 5 15 2 12 2Z" />
              </svg>
            </div>
            <div className="font-serif text-xl font-bold text-champagne tracking-wider">EQUESTRIA</div>
          </div>
          <p className="text-sm text-muted mb-6">The ultimate management platform for elite equestrian tournaments.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-all">
              <Globe className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-all">
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-muted hover:text-gold hover:border-gold/50 transition-all">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li><a href="#" className="hover:text-gold transition-colors">Tournaments</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Leaderboards</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">AI Analytics</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Live Tracking</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Company</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li><a href="#" className="hover:text-gold transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Partners</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Legal</h4>
          <ul className="space-y-3 text-sm text-muted">
            <li><a href="#" className="hover:text-gold transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted relative z-10">
        <div>&copy; {new Date().getFullYear()} Equestria Racing Platform. All rights reserved.</div>
        <div className="flex items-center gap-2">
          Made with <span className="text-gold animate-pulse">✦</span> for Champions
        </div>
      </div>
    </footer>
  );
}
