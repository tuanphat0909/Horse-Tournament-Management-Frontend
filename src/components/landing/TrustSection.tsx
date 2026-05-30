import { motion } from 'framer-motion';

const logos = [
  "Jockey Club", "Royal Ascot", "Meydan", "Equestrian Fed", "Breeder's Cup", "Churchill Downs"
];

export const TrustSection = () => {
  return (
    <section className="py-12 border-y border-glass-border bg-navy-light/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-transparent to-navy z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-0 flex items-center overflow-hidden">
        <motion.div 
          className="flex items-center space-x-16 whitespace-nowrap"
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          {[...logos, ...logos, ...logos].map((logo, i) => (
            <div 
              key={i} 
              className="font-serif text-2xl font-bold text-muted hover:text-gold transition-colors duration-300 opacity-40 hover:opacity-100 cursor-default px-8"
            >
              {logo}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
