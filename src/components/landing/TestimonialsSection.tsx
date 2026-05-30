import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "Equestria has completely transformed how we manage our stable's entries. The AI analytics alone are worth their weight in gold.",
    author: "Eleanor Sterling",
    role: "Owner, Sterling Stables"
  },
  {
    quote: "As a referee, the immutable results ledger gives me complete confidence. No disputes, just pure racing.",
    author: "Marcus Vance",
    role: "Chief Referee, Royal Ascot"
  },
  {
    quote: "The interface is stunning. It feels less like a management tool and more like a luxury experience.",
    author: "Julian Cross",
    role: "Elite Jockey"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Voices of the <span className="text-gradient-gold italic">Elite</span></h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
              className="glass-panel p-8 rounded-2xl relative group hover:-translate-y-2 transition-transform duration-500"
            >
              <Quote className="w-10 h-10 text-gold/20 mb-6 group-hover:text-gold/40 transition-colors" />
              <p className="text-body italic leading-relaxed mb-8">"{t.quote}"</p>
              <div>
                <div className="text-white font-bold">{t.author}</div>
                <div className="text-xs text-gold uppercase tracking-wider mt-1">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
