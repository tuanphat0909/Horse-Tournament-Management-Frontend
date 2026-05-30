import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RouteView } from '../App';

const roles = [
  { id: 'owner', label: 'Horse Owner', icon: '🐴' },
  { id: 'jockey', label: 'Jockey', icon: '🏇' },
  { id: 'referee', label: 'Referee', icon: '⚖️' },
  { id: 'spectator', label: 'Spectator', icon: '👁️' },
  { id: 'admin', label: 'Admin', icon: '🛡️' },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface RegisterProps {
  navigateTo: (view: RouteView) => void;
}

export function Register({ navigateTo }: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !selectedRole) {
      setError('Please fill in all fields and select a role');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      navigateTo('home');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex w-full bg-navy overflow-hidden font-sans text-body">
      {/* LEFT PANEL */}
      <motion.div 
        className="hidden md:flex w-[40%] bg-sidebar relative flex-col items-center justify-center p-12 overflow-hidden border-r border-gold/10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#0B1628] to-[#08111E] pointer-events-none" />
        
        <div 
          onClick={() => navigateTo('home')}
          className="absolute top-12 left-12 font-serif text-xl font-bold text-champagne z-10 cursor-pointer hover:scale-105 transition-transform"
        >
          EQUESTRIA
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl italic text-champagne leading-tight mb-8">
            "Join the Legacy."
          </h2>
          
          <div className="w-20 h-px bg-gold/50 mb-8" />
          
          <p className="text-muted text-[13px] tracking-wide mb-12 uppercase">
            Start Your Journey to Greatness
          </p>
          
          <div className="flex gap-4">
            {['Global', 'Elite', 'Secure'].map((stat, i) => (
              <div key={i} className="px-4 py-1.5 rounded-full border border-gold/30 text-gold text-xs font-semibold bg-gold/5">
                {stat}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">
        <motion.div 
          className="w-full max-w-[380px] py-12"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="flex flex-col items-center mb-6">
            <h1 className="font-serif text-2xl font-bold text-champagne mb-4">EQUESTRIA</h1>
            <div className="w-12 h-px bg-gold/40 mb-4" />
            <p className="text-muted text-sm">Create your premium account</p>
          </motion.div>

          <form onSubmit={handleRegister} className="w-full">
            <motion.div variants={fadeUp}>
              <Input 
                label="Full Name" 
                type="text" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={error && !name ? 'Required' : ''}
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="champion@equestria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error && !email ? 'Required' : ''}
              />
            </motion.div>
            
            <motion.div variants={fadeUp}>
              <Input 
                label="Password" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error && !password ? 'Required' : ''}
                rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                onRightIconClick={() => setShowPassword(!showPassword)}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="mb-6 mt-4">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {roles.map((role, i) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 ${
                      i === 4 ? 'col-span-2 md:col-span-1' : ''
                    } ${
                      selectedRole === role.id 
                        ? 'border-gold bg-gold/5 text-gold shadow-[0_0_15px_rgba(201,168,76,0.15)]' 
                        : 'border-border bg-surface hover:border-gold/50 text-muted hover:text-body'
                    }`}
                  >
                    <span className="text-xl mb-1.5">{role.icon}</span>
                    <span className="text-[11px] leading-tight text-center">{role.label}</span>
                  </button>
                ))}
              </div>
              {error && !selectedRole && (
                 <p className="mt-2 text-xs text-red-500 font-medium">Please select a role</p>
              )}
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Creating account...</>
                ) : (
                  'REGISTER →'
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={fadeUp} className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} className="text-center text-xs text-muted">
            Already have an account?{' '}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigateTo('login'); }}
              className="text-gold hover:text-champagne transition-colors focus:outline-none focus:underline"
            >
              Sign in here
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
