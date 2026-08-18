import { Link, useLocation, useNavigate} from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import ConsentCheckpointModal from '../components/ui/ConsentCheckpointModal';
import WhyTrust from "./TrustStripe";
import HowItWorks from './HowitWorks';
import FeatureSection from './FeatureSection';
import TrustSafetySection from './TrustSafetySection';
import Testimonials from './Testimonials';
import FAQSection from './Faq';
import ContactSection from './ContactSection';


const trustItems = [
  'Verified Users',
  'Secure Conversations',
  'Transparent Negotiation',
  'Local Lending'
];


const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

 

function TrustBadge({ label }) {
  return (
    <li className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs sm:text-sm font-semibold text-muted-foreground shadow-2xs transition-all hover:border-primary/50 hover:text-foreground">
      <Check className="h-4 w-4 text-primary shrink-0" />
      <span>{label}</span>
    </li>
  );
}

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.slice(1);
    const scrollTarget = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    scrollTarget();
    const timer = setTimeout(scrollTarget, 100);
    return () => clearTimeout(timer);
  }, [location.hash, location.pathname]);

  const handleGetStarted = () => {
    // If already consented (soft gate), skip modal
    if (localStorage.getItem('mt_landing_consent') === 'true') {
      navigate('/register');
      return;
    }
    setConsentOpen(true);
  };

  return (
    <div className="bg-background text-foreground font-sans">
      {/* Hero Section with Clean Typography Hierarchy */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center text-center">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Peer-to-Peer Lending Marketplace
          </div>

          {/* Main Headline with Neo-Grotesque Typography */}
          <h1 className="mt-6 max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.035em] text-foreground leading-[1.08]">
            Connecting Trust.
            <span className="block text-primary mt-1">
              Empowering Every Loan.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Whether you're looking to borrow or lend, MT Pocket helps verified
            individuals connect, negotiate, and build trusted financial
            relationships—all without handling your money.
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row w-full sm:w-auto">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-primary/95 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              to="/marketplace"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-border bg-card px-8 py-3.5 text-sm font-bold text-foreground transition-all hover:border-primary/50 hover:text-primary shadow-2xs cursor-pointer"
            >
              Explore Marketplace
            </Link>
          </div>

          {/* Trust Indicators */}
          <ul
            className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
            aria-label="Trust indicators"
          >
            {trustItems.map((item) => (
              <TrustBadge key={item} label={item} />
            ))}
          </ul>
        </div>
      </section>

      <WhyTrust />

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="what-we-offer">
        <FeatureSection />
      </div>

      <div id="trust-safety">
        <TrustSafetySection />
      </div>

      <div id="testimonials">
        <Testimonials />
      </div>

      <div id="faq">
        <FAQSection />
      </div>

      <div id="contact">
        <ContactSection />
      </div>

      {/* ⚠️ Step 0 Consent Modal — soft gate, not legally binding */}
      <ConsentCheckpointModal
        open={consentOpen}
        onAccept={() => {
          localStorage.setItem('mt_landing_consent', 'true');
          setConsentOpen(false);
          navigate('/register');
        }}
        onCancel={() => setConsentOpen(false)}
      />
    </div>
  );
}