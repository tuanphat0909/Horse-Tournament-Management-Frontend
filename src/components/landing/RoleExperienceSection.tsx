import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const roles = [
  { id: 'owner', label: 'Horse Owner', desc: 'Manage your stables, register for premium tournaments, and track performance metrics across seasons.' },
  { id: 'jockey', label: 'Jockey', desc: 'View your upcoming race assignments, study track conditions, and analyze your win probabilities.' },
  { id: 'referee', label: 'Referee', desc: 'Input official times, manage disputes, and finalize race results with secure verification.' },
  { id: 'spectator', label: 'Spectator', desc: 'Follow your favorite horses, view live streams, and access deep statistical analysis.' }
];

export const RoleExperienceSection = () => {
  const [activeTab, setActiveTab] = useState(roles[0].id);

  const activeRole = roles.find(r => r.id === activeTab)!;

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
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Bespoke <span className="text-gradient-gold italic">Experiences</span></h2>
            <p className="text-muted mb-12 max-w-md">Interfaces crafted precisely for every participant in the racing ecosystem.</p>
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
                  {role.label}
                </h3>
                <AnimatePresence mode="wait">
                  {activeTab === role.id && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-muted leading-relaxed"
                    >
                      {role.desc}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right: Dashboard Preview Image (Placeholder) */}
        <motion.div
          className="relative h-[500px] rounded-2xl glass-panel-elevated overflow-hidden border border-gold/20 flex items-center justify-center p-8"
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
              transition={{ duration: 0.4 }}
              className="relative z-10 w-full h-full border border-glass-border rounded-xl bg-navy/80 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Mock Browser/Dashboard Header */}
              <div className="h-10 border-b border-glass-border flex items-center px-4 gap-2 bg-black/20">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <div className="ml-4 text-[10px] uppercase font-mono text-muted/50 tracking-widest">{activeRole.label} Dashboard</div>
              </div>
              
              {/* Mock Content */}
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="h-8 w-1/3 bg-gradient-to-r from-gold/20 to-transparent rounded" />
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="h-24 bg-white/5 rounded-lg border border-glass-border relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  </div>
                  <div className="h-24 bg-white/5 rounded-lg border border-glass-border relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  </div>
                  <div className="h-24 bg-white/5 rounded-lg border border-glass-border relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  </div>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg border border-glass-border w-full flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />
                   <div className="text-gold/20 font-serif text-2xl tracking-widest uppercase z-10">{activeRole.label} UI</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};
