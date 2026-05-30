import { motion } from 'framer-motion';
import { Activity, BrainCircuit, Users, ShieldCheck, Smartphone } from 'lucide-react';

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative overflow-hidden">
      {/* Background Section with Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/bg-features.png')] bg-cover bg-center opacity-15 mix-blend-screen" />
        <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" />
        {/* Radial Glow Spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle,rgba(15,35,70,0.8)_0%,rgba(7,17,31,0)_70%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Engineered for <span className="text-gradient-gold italic">Excellence</span></h2>
          <p className="text-muted max-w-2xl mx-auto text-lg">The most advanced technological suite built specifically for the demands of elite equestrian sports.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Live Tournament Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="feature-card p-0 rounded-2xl group cursor-pointer overflow-hidden relative md:col-span-2 flex flex-col md:flex-row"
          >
            <div className="p-10 flex-1 z-10 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-navy/80 border border-glass-border flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                <Activity className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-3">Live Tournament Tracking</h3>
              <p className="text-sm text-body leading-relaxed">Millisecond-precise live updates across all active championships. Monitor horse positions, track conditions, and race assignments seamlessly.</p>
            </div>
            <div className="relative w-full md:w-[55%] h-64 md:h-auto overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-[rgba(32,54,90,0.95)] via-transparent to-transparent z-10 hidden md:block" />
               <div className="absolute inset-0 bg-gradient-to-t from-[rgba(32,54,90,0.95)] via-transparent to-transparent z-10 md:hidden" />
               <img src="/feature-live.png" alt="Live Tracking Dashboard" className="w-full h-full object-cover object-left opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </motion.div>

          {/* Card 2: AI Predictive Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="feature-card p-0 rounded-2xl group cursor-pointer overflow-hidden relative flex flex-col"
          >
            <div className="p-8 pb-4 z-10 relative">
              <div className="w-12 h-12 rounded-xl bg-navy/80 border border-glass-border flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                <BrainCircuit className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xl font-serif text-white mb-3">AI Predictive Analytics</h3>
              <p className="text-sm text-body leading-relaxed">Advanced models forecasting race outcomes based on historical performance.</p>
            </div>
            <div className="flex-1 relative w-full mt-4">
              <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent z-10 pointer-events-none" />
              <img src="/feature-ai.png" alt="AI Analytics Chart" className="w-full h-48 object-cover object-top opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </motion.div>

          {/* Card 3: Role-based Dashboards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="feature-card p-0 rounded-2xl group cursor-pointer overflow-hidden relative flex flex-col"
          >
            <div className="p-8 pb-4 z-10 relative">
              <div className="w-12 h-12 rounded-xl bg-navy/80 border border-glass-border flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xl font-serif text-white mb-3">Role-based Dashboards</h3>
              <p className="text-sm text-body leading-relaxed">Customized management experiences for Owners, Jockeys, and Referees.</p>
            </div>
            <div className="flex-1 relative w-full mt-4">
              <div className="absolute inset-0 bg-gradient-to-t from-navy/50 to-transparent z-10 pointer-events-none" />
              <img src="/feature-dash.png" alt="Role-based Dashboard" className="w-full h-48 object-cover object-top opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </motion.div>

          {/* Card 4: Mobile-First Experience */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="feature-card p-0 rounded-2xl group cursor-pointer overflow-hidden relative md:col-span-2 flex flex-col md:flex-row-reverse"
          >
            <div className="p-10 flex-1 z-10 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-xl bg-navy/80 border border-glass-border flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                <Smartphone className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-3">Mobile-First Experience</h3>
              <p className="text-sm text-body leading-relaxed">Flawless execution on any device. Manage stables, enter tournaments, and view live results directly from the stands or on the go.</p>
            </div>
            <div className="relative w-full md:w-[55%] h-64 md:h-auto overflow-hidden bg-navy/30">
               <div className="absolute inset-0 bg-gradient-to-l from-[rgba(32,54,90,0.95)] via-transparent to-transparent z-10 hidden md:block" />
               <div className="absolute inset-0 bg-gradient-to-t from-[rgba(32,54,90,0.95)] via-transparent to-transparent z-10 md:hidden" />
               <img src="/feature-mobile.png" alt="Mobile App Experience" className="w-full h-full object-cover object-center opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" />
            </div>
          </motion.div>
          
          {/* Card 5: Instant Referee Updates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="feature-card p-10 rounded-2xl group cursor-pointer overflow-hidden relative flex flex-col justify-center md:col-span-3 items-center text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-900/40 border border-green-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.15)] group-hover:shadow-[0_0_50px_rgba(34,197,94,0.3)] group-hover:scale-110 transition-all duration-500">
                  <ShieldCheck className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-champagne transition-colors">Instant Referee Updates</h3>
                <p className="text-base text-body leading-relaxed mb-8 max-w-2xl">Secure, immutable race results verified instantly on-chain. Approvals are pushed via a dedicated secure workflow ensuring complete integrity of the tournament results before public release.</p>
                <div className="flex justify-center items-center gap-3 px-4 py-2 rounded-full bg-green-950/40 border border-green-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs font-mono text-green-400 uppercase tracking-widest font-bold">Blockchain Verified</span>
                </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
