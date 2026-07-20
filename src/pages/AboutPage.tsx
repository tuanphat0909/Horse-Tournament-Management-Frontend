import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Trophy, Users, Flag, Stethoscope, Eye, ArrowRight, Wallet, Bell,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SectionScroller } from '../components/landing/SectionScroller';

// Nội dung bám đúng những gì hệ thống đang làm được, không phóng đại tính năng.
const ROLES = [
  { icon: Shield, title: 'Administrator', desc: 'Creates tournaments, approves registrations, schedules races, assigns referees and publishes official results.' },
  { icon: Flag, title: 'Horse Owner', desc: 'Manages the stable, registers horses for tournaments, invites jockeys and tracks prize money.' },
  { icon: Users, title: 'Jockey', desc: 'Receives contract invitations, confirms race assignments and follows their own schedule and achievements.' },
  { icon: Trophy, title: 'Referee', desc: 'Inspects horses before each race, records violations and confirms finishing times and rankings.' },
  { icon: Stethoscope, title: 'Veterinarian', desc: 'Performs medical checks and decides whether a horse is fit to compete.' },
  { icon: Eye, title: 'Spectator', desc: 'Follows tournaments and live results, places predictions and manages their wallet.' },
];

const FLOW = [
  { step: '01', title: 'Tournament opens', desc: 'An administrator creates the tournament and opens the registration window.' },
  { step: '02', title: 'Entries & contracts', desc: 'Owners register horses and invite jockeys; a horse is only eligible once its jockey accepts.' },
  { step: '03', title: 'Health clearance', desc: 'Veterinarians examine each registered horse before the entry can be approved.' },
  { step: '04', title: 'Scheduling', desc: 'Races and lanes are arranged, and referees are assigned to every race.' },
  { step: '05', title: 'Race day', desc: 'Results are recorded, violations handled, and standings update in real time.' },
  { step: '06', title: 'Prizes', desc: 'Once results are confirmed and published, prize money is paid into owner and jockey wallets.' },
];

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy text-body font-sans selection:bg-gold/30">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 space-y-20">
        {/* Intro */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="landing-section text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">About Equestria</span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mt-3 mb-5">
            One platform for the <span className="text-champagne italic">whole racing season</span>
          </h1>
          <p className="text-sm text-muted max-w-2xl mx-auto leading-relaxed">
            Equestria is a horse racing tournament management system. It keeps every party of a race
            meeting — organizers, owners, jockeys, referees, veterinarians and spectators — working on
            the same schedule, the same entry list and the same official results, instead of scattered
            spreadsheets and phone calls.
          </p>
        </motion.section>

        {/* Roles */}
        <section className="landing-section">
          <h2 className="font-serif text-2xl text-white font-bold mb-2">Built around six roles</h2>
          <p className="text-sm text-muted mb-8">Each account only sees the work that belongs to it.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-panel rounded-2xl p-6 border border-glass-border hover:border-gold/25 transition-all h-full"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-4">
                  <r.icon size={19} />
                </div>
                <h3 className="font-serif text-lg text-white font-bold mb-2">{r.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Flow */}
        <section className="landing-section">
          <h2 className="font-serif text-2xl text-white font-bold mb-2">How a tournament runs</h2>
          <p className="text-sm text-muted mb-8">
            The system enforces this order, so a race cannot start with an unapproved or unfit horse.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {FLOW.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-panel rounded-2xl p-6 border border-glass-border relative overflow-hidden h-full"
              >
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                <span className="font-serif text-3xl font-bold text-gold/25">{s.step}</span>
                <h3 className="font-serif text-base text-white font-bold mt-2 mb-2">{s.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Highlights */}
        <section className="landing-section grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Bell, title: 'Real-time notifications', desc: 'Contract responses, health results and published standings arrive the moment they happen.' },
            { icon: Wallet, title: 'Wallet & prize payouts', desc: 'Deposits, withdrawals and prize money are tracked per account with a full transaction history.' },
            { icon: Shield, title: 'Verified results', desc: 'Nothing is published until a referee confirms the finishing order of the race.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass-panel rounded-2xl p-6 border border-glass-border h-full"
            >
              <f.icon size={20} className="text-gold mb-4" />
              <h3 className="font-serif text-base text-white font-bold mb-2">{f.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* CTA */}
        <section className="landing-section glass-panel rounded-2xl p-10 text-center border border-gold/20 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
          <h2 className="font-serif text-2xl text-white font-bold mb-3">Ready to join the season?</h2>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Create an account to follow live races, or sign in if your stable is already registered.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/register')} className="btn-gold px-7 py-3 rounded-lg text-xs font-bold inline-flex items-center gap-2">
              Create account <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 rounded-lg text-xs font-bold border border-glass-border text-body hover:text-white hover:bg-white/5 transition-colors"
            >
              Sign in
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <SectionScroller />
    </div>
  );
}
