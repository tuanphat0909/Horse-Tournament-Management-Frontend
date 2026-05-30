import { motion } from 'framer-motion';

const steps = [
  { title: "Onboard", desc: "Create your profile as an owner, jockey, or spectator with bank-grade security." },
  { title: "Register", desc: "Enter horses into premium tournaments and pay entry fees seamlessly." },
  { title: "Race", desc: "View real-time schedules, track conditions, and race assignments." },
  { title: "Triumph", desc: "Official times verified by referees and recorded instantly on global leaderboards." }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface/30 via-navy to-navy" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Path to <span className="text-gradient-gold italic">Victory</span></h2>
          <p className="text-muted max-w-2xl mx-auto">A streamlined, cinematic journey from registration to the winner's circle.</p>
        </motion.div>

        <div className="relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
              >
                <div className="w-24 h-24 mx-auto glass-panel border border-gold/30 rounded-full flex items-center justify-center mb-8 relative group shadow-[0_0_20px_rgba(0,0,0,0.5)] cursor-default">
                  {/* Outer Glow */}
                  <div className="absolute inset-0 rounded-full border border-gold/10 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gold/5 rounded-full group-hover:bg-gold/20 transition-colors duration-500 blur-md" />
                  
                  <span className="font-serif text-3xl font-bold text-champagne relative z-10">0{i + 1}</span>
                </div>
                <h3 className="text-xl font-serif text-white mb-3">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
