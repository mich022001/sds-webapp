import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import FeaturedProducts from "../components/landing/FeaturedProducts";
import PackagesSection from "../components/landing/PackagesSection";
import OpportunitySection from "../components/landing/OpportunitySection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import AboutSection from "../components/landing/AboutSection";
import ContactSection from "../components/landing/ContactSection";
import LandingFooter from "../components/landing/LandingFooter";

export default function LandingPage({ onLogin }) {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar onLogin={onLogin} />
      <HeroSection />
      <FeaturedProducts />
      <PackagesSection />
      <OpportunitySection />
      <AboutSection />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}
