import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

const roles = [
  { id: 'owner', label: 'Horse Owner', desc: 'Manage your stables, register for premium tournaments, and track performance metrics across seasons.' },
  { id: 'jockey', label: 'Jockey', desc: 'View your upcoming race assignments, study track conditions, and analyze your win probabilities.' },
  { id: 'referee', label: 'Referee', desc: 'Input official times, manage disputes, and finalize race results with secure verification.' },
  { id: 'spectator', label: 'Spectator', desc: 'View tournament schedules, follow live race results and rankings, submit predictions, and receive reward notifications for correct forecasts.' }
];

/* ────────── Mini Dashboard Previews ────────── */

const OwnerPreview = () => {
  const { t } = useLanguage();
  return (
    <div className="p-4 flex-1 flex flex-col gap-2.5 overflow-hidden">
      <div className="rounded-lg bg-gradient-to-r from-gold/10 to-transparent border border-gold/15 p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[9px] text-gold font-bold uppercase tracking-widest">{t('Season 2026')}</span>
        </div>
        <div className="text-white font-serif text-sm">{t('Welcome,')} <span className="italic text-[#d4b87a]">Andy Nguyen</span></div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { value: '12', label: t('Horse'), color: 'text-[#c9a84c]' },
          { value: '₫1.2B', label: t('Prizes'), color: 'text-emerald-400' },
          { value: '#3', label: t('Season Rank'), color: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-2 text-center">
            <div className={`text-base font-bold font-serif ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-1.5 overflow-hidden">
        <div className="text-[9px] text-white/30 uppercase tracking-widest">{t('My Horses')}</div>
        {[
          { name: 'Thunderstrike', breed: 'Thoroughbred', status: t('Competing'), sc: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { name: 'Desert Wind', breed: 'Arabian', status: t('Competing'), sc: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { name: 'Silver Arrow', breed: 'Warmblood', status: t('Resting'), sc: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
        ].map((h, i) => (
          <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-sm">🐴</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-white font-medium truncate">{h.name}</div>
              <div className="text-[9px] text-white/30">{h.breed}</div>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${h.sc}`}>{h.status}</span>
          </div>
        ))}
      </div>

      <div className="h-7 rounded-lg bg-[#c9a84c]/15 border border-[#c9a84c]/20 flex items-center justify-center">
        <span className="text-[10px] text-[#c9a84c] font-bold">+ {t('Register New Horse')}</span>
      </div>
    </div>
  );
};

const JockeyPreview = () => {
  const { t } = useLanguage();
  return (
    <div className="p-4 flex-1 flex flex-col gap-2.5 overflow-hidden">
      <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/15 p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">3 {t('pending invitations')}</span>
        </div>
        <div className="text-white font-serif text-sm">{t('Welcome,')} <span className="italic text-[#d4b87a]">David Tran</span></div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { value: '45', label: t('Wins'), color: 'text-[#c9a84c]' },
          { value: '68', label: t('Race'), color: 'text-purple-400' },
          { value: '66%', label: t('Win Rate'), color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-2 text-center">
            <div className={`text-base font-bold font-serif ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-1.5 overflow-hidden">
        <div className="text-[9px] text-white/30 uppercase tracking-widest">{t('Race Invitations')}</div>
        {[
          { horse: 'Storm Rider', round: 'Finals - Spring Tournament', owner: 'Helen Le' },
          { horse: 'Dark Knight', round: 'Qualifiers - National Cup', owner: 'Marcus Vu' },
        ].map((inv, i) => (
          <div key={i} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] text-white font-medium truncate">{inv.horse}</div>
                <div className="text-[9px] text-white/40">{inv.round}</div>
                <div className="text-[9px] text-white/25">{t('Owner')}: {inv.owner}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <div className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-[9px] text-emerald-400 font-bold">{t('Accept')}</div>
                <div className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-bold">{t('Decline')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
        <div className="text-[9px] text-blue-400 font-bold mb-0.5">{t("Today's Schedule")}</div>
        <div className="text-[10px] text-white">09:00 — Round 3 Spring Tournament 2026</div>
      </div>
    </div>
  );
};

const RefereePreview = () => {
  const { t } = useLanguage();
  return (
    <div className="p-4 flex-1 flex flex-col gap-2.5 overflow-hidden">
      <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/15 p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">2 {t('races today')}</span>
        </div>
        <div className="text-white font-serif text-sm">{t('Welcome,')} <span className="italic text-[#d4b87a]">William Nguyen</span></div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {[
          { value: '2', label: t('Race'), color: 'text-blue-400' },
          { value: '5', label: t('Horse Inspection'), color: 'text-yellow-400' },
          { value: '1', label: t('Violations'), color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.04] border border-white/[0.06] rounded-lg p-2 text-center">
            <div className={`text-base font-bold font-serif ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">{t('Pending Violations')}</div>
        <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-red-400 text-[11px]">⚠</span>
                <span className="text-[11px] text-white font-semibold">Desert Wind</span>
              </div>
              <div className="text-[9px] text-white/40">Lane crossing at curve #3</div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">{t('Pending')}</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-[9px] text-white/40 mb-1">
              <span>{t('Appeal Time')}</span>
              <span className="text-yellow-400 font-bold">12 mins left</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className="h-full w-[35%] rounded-full bg-gradient-to-r from-yellow-500 to-orange-500" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 h-5 rounded bg-red-500/20 border border-red-500/25 flex items-center justify-center">
              <span className="text-[9px] text-red-400 font-bold">{t('Confirm Violation')}</span>
            </div>
            <div className="flex-1 h-5 rounded bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <span className="text-[9px] text-white/50 font-bold">{t('Dismiss')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-white/40">{t('Horse Inspection')}</span>
          <span className="text-[9px] text-emerald-400 font-bold">3 / 5 {t('completed')}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10">
          <div className="h-full w-[60%] rounded-full bg-emerald-500/60" />
        </div>
      </div>
    </div>
  );
};

const SpectatorPreview = () => {
  const { t } = useLanguage();
  return (
    <div className="p-4 flex-1 flex flex-col gap-2.5 overflow-hidden">
      <div className="rounded-lg bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/15 p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Live — 1 {t('race in progress')}</span>
        </div>
        <div className="text-white font-serif text-sm">{t('Welcome,')} <span className="italic text-[#d4b87a]">Alex Howard</span></div>
      </div>

      <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Live · Round 3 Group 2</span>
          <span className="text-[9px] text-white/40 font-mono">1:23.8</span>
        </div>
        {[
          { pos: 1, name: 'Silver Arrow', bar: '100%', time: '1:23.8' },
          { pos: 2, name: 'Thunder Storm', bar: '91%', time: '+0.4s' },
          { pos: 3, name: 'Desert Wind', bar: '79%', time: '+1.2s' },
        ].map((h, i) => (
          <div key={i} className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] font-bold w-3 ${i === 0 ? 'text-[#c9a84c]' : 'text-white/30'}`}>{h.pos}</span>
            <span className="text-[10px] text-white w-[72px] truncate">{h.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-[#c9a84c] to-yellow-600' : 'bg-white/25'}`}
                style={{ width: h.bar }}
              />
            </div>
            <span className="text-[9px] text-white/40 font-mono w-9 text-right">{h.time}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1.5">{t('My Predictions')}</div>
        {[
          { horse: 'Thunderstrike', pred: '1st Place', correct: true, reward: '₫500k' },
          { horse: 'Desert Wind', pred: '1st Place', correct: true, reward: '₫600k' },
          { horse: 'Storm Rider', pred: '2nd Place', correct: null, reward: '—' },
        ].map((p, i) => (
          <div key={i} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/[0.02] mb-0.5">
            <span className={`text-[10px] w-3 ${p.correct === true ? 'text-emerald-400' : 'text-white/25'}`}>
              {p.correct === true ? '✓' : '⏳'}
            </span>
            <span className="text-[10px] text-white flex-1">{p.horse}</span>
            <span className="text-[9px] text-white/40">{p.pred}</span>
            <span className={`text-[9px] font-bold ${p.correct === true ? 'text-[#c9a84c]' : 'text-white/30'}`}>{p.reward}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 h-7 rounded-lg bg-[#c9a84c]/15 border border-[#c9a84c]/20 flex items-center justify-center">
          <span className="text-[10px] text-[#c9a84c] font-bold">{t('Watch Live')}</span>
        </div>
        <div className="flex-1 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
          <span className="text-[10px] text-blue-400 font-bold">+ {t('Add Prediction')}</span>
        </div>
      </div>
    </div>
  );
};

const PREVIEWS: Record<string, () => React.ReactElement> = {
  owner: OwnerPreview,
  jockey: JockeyPreview,
  referee: RefereePreview,
  spectator: SpectatorPreview,
};

/* ────────── Main Section ────────── */

export const RoleExperienceSection = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(roles[0].id);
  const activeRole = roles.find(r => r.id === activeTab)!;
  const Preview = PREVIEWS[activeTab];

  return (
    <section className="py-32 relative bg-navy-light/40 border-y border-glass-border">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left: Tabs */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">{t('Bespoke')} <span className="text-gradient-gold italic">{t('Experiences')}</span></h2>
            <p className="text-muted mb-12 max-w-md">{t('Interfaces crafted precisely for every participant in the racing ecosystem.')}</p>
          </motion.div>

          <div className="space-y-4">
            {roles.map((role) => (
              <motion.button
                key={role.id}
                onClick={() => setActiveTab(role.id)}
                className={`w-full text-left p-6 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                  activeTab === role.id
                    ? 'border-gold/30 bg-surface-elevated shadow-[0_0_30px_rgba(201,168,76,0.1)]'
                    : 'border-glass-border bg-surface hover:bg-surface-elevated/50 hover:border-gold/20'
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {activeTab === role.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gold shadow-[0_0_10px_rgba(201,168,76,0.8)]"
                  />
                )}
                <h3 className={`text-xl font-serif mb-2 transition-colors ${activeTab === role.id ? 'text-champagne' : 'text-white'}`}>
                  {t(role.label)}
                </h3>
                <AnimatePresence mode="wait">
                  {activeTab === role.id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-muted leading-relaxed"
                    >
                      {t(role.desc)}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right: Dashboard Preview */}
        <motion.div
          className="relative h-[500px] rounded-2xl glass-panel-elevated overflow-hidden border border-gold/20 flex items-center justify-center p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy to-navy-light opacity-90 z-0" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.35 }}
              className="relative z-10 w-full h-full border border-white/[0.08] rounded-xl bg-[#0d1b2e]/90 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Mock Browser Bar */}
              <div className="h-9 border-b border-white/[0.06] flex items-center px-3 gap-2 bg-black/20 shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                <div className="ml-3 text-[9px] uppercase font-mono text-white/25 tracking-widest">
                  equestria · {t(activeRole.label)} {t('Dashboard')}
                </div>
              </div>

              {/* Role-specific content */}
              <Preview />
            </motion.div>
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};
