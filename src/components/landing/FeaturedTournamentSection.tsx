import { motion } from 'framer-motion';
import { ArrowRight, Clock, Users, Trophy } from 'lucide-react';

export const FeaturedTournamentSection = () => {
  return (
    <section id="tournaments" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden glass-panel-elevated p-1"
        >
          {/* Animated Border Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-gold via-champagne to-gold opacity-30 blur-sm animate-pulse" />
          
          <div className="relative bg-navy rounded-[22px] overflow-hidden">
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-navy to-navy" />
            
            <div className="relative p-10 md:p-16 flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Event
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight">The Royal Ascot <br/><span className="text-gradient-gold italic">Invitational 2025</span></h2>
                
                <div className="flex flex-wrap gap-6 text-sm text-muted">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gold" /> June 18-22, 2025</div>
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-gold" /> £8,500,000 Pool</div>
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gold" /> 200 Elite Horses</div>
                </div>
                
                <p className="text-body leading-relaxed max-w-lg">
                  The crown jewel of the racing calendar. Secure your place in the most prestigious event of the season, powered by Equestria's management platform.
                </p>
              </div>
              
              <div className="w-full lg:w-[400px] glass-panel p-8 rounded-2xl relative shadow-2xl">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-gold/20 blur-3xl rounded-full pointer-events-none" />
                <h3 className="text-lg font-serif text-white mb-6">Registration Status</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted font-medium">Total Slots Filled</span>
                    <span className="font-bold text-white">142 / 200</span>
                  </div>
                  <div className="h-2.5 bg-navy-light rounded-full overflow-hidden shadow-inner border border-glass-border">
                    <motion.div 
                      className="h-full bg-gold relative"
                      initial={{ width: 0 }}
                      whileInView={{ width: '71%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-white/20" />
                    </motion.div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-navy/60 p-4 rounded-xl border border-glass-border text-center hover:border-gold/30 transition-colors">
                      <div className="text-3xl font-serif text-champagne mb-1">12</div>
                      <div className="text-[10px] uppercase text-muted tracking-wider font-bold">Days Left</div>
                   </div>
                   <div className="bg-navy/60 p-4 rounded-xl border border-glass-border text-center hover:border-gold/30 transition-colors">
                      <div className="text-3xl font-serif text-champagne mb-1">18</div>
                      <div className="text-[10px] uppercase text-muted tracking-wider font-bold">Live Streams</div>
                   </div>
                </div>
                
                <button className="btn-gold w-full py-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(201,168,76,0.2)]">
                  Enter Tournament <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
