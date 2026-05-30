import { motion } from 'framer-motion';

const stats = [
  { value: "142+", label: "Horses Registered" },
  { value: "18", label: "Live Championships" },
  { value: "50K+", label: "Spectators" },
  { value: "0.1s", label: "Real-time Latency" }
];

export const StatsSection = () => {
  return (
    <section className="py-32 relative noise-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gold/5 blur-xl group-hover:bg-gold/10 transition-colors duration-500 rounded-full" />
              <div className="glass-panel p-8 text-center rounded-2xl relative z-10 group-hover:border-gold/30 group-hover:-translate-y-2 transition-all duration-500">
                <div className="text-4xl md:text-5xl font-serif font-bold text-champagne mb-3 group-hover:text-glow transition-all">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-muted uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
