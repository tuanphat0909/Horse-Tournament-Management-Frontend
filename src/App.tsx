import { useState } from 'react';
import { Navbar } from './components/landing/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { TrustSection } from './components/landing/TrustSection';
import { StatsSection } from './components/landing/StatsSection';
import { FeaturesSection } from './components/landing/FeaturesSection';
import { RoleExperienceSection } from './components/landing/RoleExperienceSection';
import { FeaturedTournamentSection } from './components/landing/FeaturedTournamentSection';
import { HowItWorksSection } from './components/landing/HowItWorksSection';
import { TestimonialsSection } from './components/landing/TestimonialsSection';
import { CTASection } from './components/landing/CTASection';
import { Footer } from './components/landing/Footer';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

export type RouteView = 'home' | 'login' | 'register' | 'dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<RouteView>('home');

  const navigateTo = (view: RouteView) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-navy text-body font-sans selection:bg-gold/30 selection:text-white">
      {currentView === 'home' && (
        <>
          <Navbar navigateTo={navigateTo} />
          <main>
            <HeroSection />
            <TrustSection />
            <StatsSection />
            <FeaturesSection />
            <RoleExperienceSection />
            <FeaturedTournamentSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <CTASection />
          </main>
          <Footer />
        </>
      )}
      {currentView === 'login' && <Login navigateTo={navigateTo} />}
      {currentView === 'register' && <Register navigateTo={navigateTo} />}
      {currentView === 'dashboard' && <Dashboard navigateTo={navigateTo} />}
    </div>
  );
}
