import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/landing/HeroSection';
import { StatsSection } from '../components/landing/StatsSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { RoleExperienceSection } from '../components/landing/RoleExperienceSection';
import { FeaturedTournamentSection } from '../components/landing/FeaturedTournamentSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { CTASection } from '../components/landing/CTASection';
import { SectionScroller } from '../components/landing/SectionScroller';

export function HomePage() {
  return (
    <div className="min-h-screen bg-navy text-body font-sans selection:bg-gold/30 selection:text-white">
      <Navbar />
      <main>
        <div className="landing-section"><HeroSection /></div>
        <div className="landing-section"><StatsSection /></div>
        <div className="landing-section"><FeaturesSection /></div>
        <div className="landing-section"><RoleExperienceSection /></div>
        <div className="landing-section"><FeaturedTournamentSection /></div>
        <div className="landing-section"><HowItWorksSection /></div>
        <div className="landing-section"><CTASection /></div>
      </main>
      <Footer />
      <SectionScroller />
    </div>
  );
}
