import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

export const HeroSection = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden noise-bg">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* New Background Image with Overlay */}
        <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat opacity-20" />
        <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" />
        
        {/* Existing Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] mix-blend-screen animate-[slow-spin_15s_linear_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0F355C] rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 mt-12 lg:mt-0">
        {/* Left Content */}
        <motion.div 
          className="flex flex-col justify-center"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-gold/30 text-gold text-[10px] sm:text-xs font-semibold uppercase tracking-widest w-fit mb-8 shadow-[0_0_15px_rgba(201,168,76,0.2)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            Premium Racing Platform
          </motion.div>

          <motion.h1 
            className="text-5xl sm:text-7xl lg:text-[84px] font-serif leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-white font-bold">Where Legends</div>
            <div className="italic text-gradient-gold pb-2 text-glow">Race.</div>
          </motion.h1>

          <motion.p 
            className="text-base sm:text-lg text-body mb-10 max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Experience the pinnacle of equestrian sports management. A cinematic, AI-driven platform for elite tournaments, owners, and champions.
          </motion.p>

          <motion.div 
            className="flex flex-wrap items-center gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <button className="btn-gold px-8 py-4 rounded-lg flex items-center gap-2 text-sm shadow-[0_0_20px_rgba(201,168,76,0.3)]">
              Explore Platform <ArrowRight className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-3 text-body hover:text-gold transition-colors font-medium group">
              <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-all">
                <Play className="w-4 h-4 ml-1 fill-current" />
              </div>
              Watch Showreel
            </button>
          </motion.div>

          <motion.div 
            className="mt-16 flex items-center gap-6 text-sm font-semibold text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-white">500+</span> Elite Horses
            </div>
            <div className="w-1 h-1 rounded-full bg-glass-border" />
            <div className="flex items-center gap-2">
              <span className="text-white">12</span> Championships
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content / Cards */}
        <div className="relative h-[600px] hidden lg:block perspective-1000">
          <motion.div 
            style={{ y: y1 }}
            className="absolute right-0 top-10 w-80 glass-panel-elevated rounded-2xl p-6 animate-[float_6s_ease-in-out_infinite]"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-serif text-xl text-white mb-1">Dubai World Cup</h3>
                <p className="text-xs text-muted">Meydan Racecourse</p>
              </div>
              <div className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] uppercase font-bold rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {[
                { name: "Thunderstrike", pos: "1st", time: "1:58.4", diff: "-0.00" },
                { name: "Desert Wind", pos: "2nd", time: "1:59.1", diff: "+0.70" },
                { name: "Midnight Run", pos: "3rd", time: "2:00.3", diff: "+1.90" }
              ].map((horse, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-navy/50 border border-glass-border hover:border-gold/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gold w-6">{horse.pos}</span>
                    <span className="text-sm font-medium text-white">{horse.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-white">{horse.time}</div>
                    <div className="text-[10px] text-muted">{horse.diff}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full py-3 rounded text-xs font-bold text-champagne bg-gold/10 hover:bg-gold/20 transition-colors border border-gold/30">
              View Live Analytics
            </button>
          </motion.div>

          <motion.div 
            style={{ y: y2 }}
            className="absolute -left-4 bottom-32 w-64 glass-panel rounded-2xl p-5 z-20 animate-[float_8s_ease-in-out_infinite_reverse]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-yellow-700 p-px">
                <div className="w-full h-full bg-navy rounded-full flex items-center justify-center font-serif text-lg font-bold text-white">AI</div>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Win Probability</div>
                <div className="text-xs text-muted">Updating live</div>
              </div>
            </div>
            <div className="h-2 bg-navy rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gold w-[74%] rounded-full relative">
                <div className="absolute inset-0 bg-white/20 blur-sm" />
              </div>
            </div>
            <div className="mt-2 flex justify-between items-center text-xs">
              <span className="font-bold text-gold">74%</span>
              <span className="text-muted">Thunderstrike</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
