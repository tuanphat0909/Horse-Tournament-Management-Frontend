import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, FileText, Cookie } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

// Gộp 3 mục pháp lý vào một trang có mục lục — footer trỏ tới bằng anchor
// (/legal#privacy, /legal#terms, /legal#cookies) thay vì tách 3 trang gần giống nhau.
const SECTIONS = [
  {
    id: 'privacy',
    icon: Shield,
    title: 'Privacy Policy',
    blocks: [
      ['What we collect', 'Account details you provide when registering (name, email, role) and the racing data you create in the system: horses, registrations, jockey contracts, race results, predictions and wallet transactions.'],
      ['How we use it', 'Only to operate the platform: authenticating you, showing the data belonging to your role, sending notifications about your tournaments, and calculating standings and prize payouts.'],
      ['Who can see it', 'Each account only sees data relevant to its role. Referees and veterinarians see the horses of the races they are assigned to; owners and jockeys see their own records; administrators see tournament-level data needed to run the season.'],
      ['Retention & control', 'Racing records are kept for the history of the season. You may request correction or deletion of your account data by contacting the organizers.'],
    ],
  },
  {
    id: 'terms',
    icon: FileText,
    title: 'Terms of Service',
    blocks: [
      ['Using an account', 'Accounts are issued per person and per role. Keep your credentials private — actions taken with your account (approving an entry, confirming a result, placing a prediction) are recorded as yours.'],
      ['Fair competition', 'Horses must pass a veterinary check before competing. Entries can be rejected, and results can be adjusted, when a referee records a violation.'],
      ['Results & prizes', 'A race result becomes official only after a referee confirms it and an administrator publishes it. Prize money is credited to owner and jockey wallets from published results.'],
      ['Wallet', 'Deposits, withdrawals and prize credits are logged in your transaction history. Locked or inactive accounts may withdraw a remaining balance but cannot place new bets or registrations.'],
      ['Suspension', 'Accounts that violate competition rules or misuse the platform may be locked by an administrator.'],
    ],
  },
  {
    id: 'cookies',
    icon: Cookie,
    title: 'Cookie Policy',
    blocks: [
      ['Essential storage only', 'The platform stores your sign-in token and display preferences in your browser so you stay logged in while moving between pages.'],
      ['No advertising trackers', 'We do not use cookies for advertising or third-party profiling.'],
      ['Clearing it', 'Signing out removes the stored session. Clearing your browser storage will also sign you out of the platform.'],
    ],
  },
];

export function LegalPage() {
  const { hash } = useLocation();

  // Cuộn tới mục được trỏ từ footer sau khi nội dung đã render
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const el = document.getElementById(hash.slice(1));
    if (el) window.scrollTo({ top: Math.max(el.offsetTop - 100, 0), behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="min-h-screen bg-navy text-body font-sans selection:bg-gold/30">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">Legal</span>
          <h1 className="font-serif text-4xl font-bold text-white mt-3 mb-4">Policies & Terms</h1>
          <p className="text-sm text-muted">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Mục lục */}
        <div className="flex flex-wrap justify-center gap-2 mb-14">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="px-5 py-2 rounded-full text-xs font-bold border border-glass-border text-muted hover:text-champagne hover:border-gold/30 hover:bg-gold/[0.06] transition-all flex items-center gap-2">
              <s.icon size={13} /> {s.title}
            </a>
          ))}
        </div>

        <div className="space-y-14">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
                  <section.icon size={18} />
                </div>
                <h2 className="font-serif text-2xl text-white font-bold">{section.title}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 via-glass-border to-transparent" />
              </div>

              <div className="glass-panel rounded-2xl border border-glass-border divide-y divide-glass-border/40">
                {section.blocks.map(([heading, body]) => (
                  <div key={heading} className="p-6">
                    <h3 className="text-sm font-bold text-champagne mb-2">{heading}</h3>
                    <p className="text-xs text-muted leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs text-muted/70 text-center mt-14 leading-relaxed">Equestria is an academic tournament management project. Questions about these policies can be sent to the organizing team.</p>
      </main>

      <Footer />
    </div>
  );
}
