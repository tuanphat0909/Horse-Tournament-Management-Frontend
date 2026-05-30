import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '../components/Input';
import { Checkbox } from '../components/Checkbox';
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

interface LoginProps {
  navigateTo: (view: RouteView) => void;
}

export function Login({ navigateTo }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Invalid email or password');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      navigateTo('dashboard');
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
            "Where Champions<br/>Are Made."
          </h2>
          
          <div className="w-20 h-px bg-gold/50 mb-8" />
          
          <p className="text-muted text-[13px] tracking-wide mb-12 uppercase">
            Horse Racing Tournament Management System
          </p>
          
          <div className="flex gap-4">
            {['86 Pages', '5 Roles', 'Real-time'].map((stat, i) => (
              <div key={i} className="px-4 py-1.5 rounded-full border border-gold/30 text-gold text-xs font-semibold bg-gold/5">
                {stat}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <motion.div 
          className="w-full max-w-[380px]"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
            <h1 className="font-serif text-2xl font-bold text-champagne mb-4">EQUESTRIA</h1>
            <div className="w-12 h-px bg-gold/40 mb-4" />
            <p className="text-muted text-sm">Sign in to your account</p>
          </motion.div>

          <form onSubmit={handleSignIn} className="w-full">
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
                error={error}
                rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                onRightIconClick={() => setShowPassword(!showPassword)}
              />
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center justify-between mt-2 mb-6">
              <Checkbox label="Remember me" />
              <a href="#" className="text-gold hover:text-champagne text-xs transition-colors">
                Forgot password?
              </a>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Signing in...</>
                ) : (
                  'SIGN IN →'
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div variants={fadeUp} className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-8">
            {roles.map((role, i) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 ${
                  i === 4 ? 'col-span-2 md:col-span-1' : '' // Center the last odd one on mobile
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
          </motion.div>

          <motion.div variants={fadeUp} className="text-center text-xs text-muted">
            Don't have an account?{' '}
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); navigateTo('register'); }}
              className="text-gold hover:text-champagne transition-colors focus:outline-none focus:underline"
            >
              Register here
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
