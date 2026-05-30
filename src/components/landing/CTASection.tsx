import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden border-t border-glass-border">
      {/* Intense Glowing Background */}
      <div className="absolute inset-0 bg-navy z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full bg-gold/20 blur-[150px] mix-blend-screen pointer-events-none z-0" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-gold/30 text-gold text-xs font-semibold uppercase tracking-widest mb-8">
            Join The Vanguard
          </div>
          
          <h2 className="text-5xl md:text-7xl font-serif text-white mb-8 leading-tight">
            Enter The Future <br/><span className="italic text-gradient-gold text-glow">Of Racing.</span>
          </h2>
          
          <p className="text-lg text-body mb-12 max-w-xl mx-auto">
            Don't just participate in the sport. Dominate it with the world's most advanced equestrian platform.
          </p>
          
          <button className="btn-gold px-12 py-5 rounded-lg flex items-center gap-3 text-sm mx-auto shadow-[0_0_40px_rgba(201,168,76,0.4)] hover:shadow-[0_0_60px_rgba(201,168,76,0.6)]">
            Create Your Account <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
