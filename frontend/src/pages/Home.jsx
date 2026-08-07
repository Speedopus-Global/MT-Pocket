import { Link, useLocation} from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.li
      variants={fadeUp}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-foreground"
    >
      <Check className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </motion.li>
  );
}


export default function Home() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);


  return (
    <>
    <motion.section
      className="relative flex min-h-screen overflow-hidden px-6 py-20 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.55,
            staggerChildren: 0.11,
            ease: [0.22, 1, 0.36, 1]
          }
        }
      }}
    >
      {/* Add your FlowLines component here */}
      {/* <FlowLines className="absolute inset-0 -z-10" /> */}

      <div className="mx-auto flex min-h-[85vh] w-full max-w-5xl flex-col items-center justify-center text-center">
        <motion.div
          variants={fadeUp}
          className="mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            Trusted Peer-to-Peer Lending Marketplace
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-8 max-w-5xl text-5xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            Connecting Trust.
            <span className="mt-2 block text-primary">
              Empowering Every Loan.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl"
          >
            Whether you're looking to borrow or lend, MT Pocket helps verified
            individuals connect, negotiate, and build trusted financial
            relationships—all without handling your money.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              to="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-sm transition duration-300 hover:scale-[1.02] hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
                to="marketplace"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-7 text-sm font-semibold text-foreground transition duration-300 hover:border-primary hover:text-primary"
              >
                Explore Marketplace
              </Link>
          </motion.div>

          <motion.ul
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.45
                }
              }
            }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            aria-label="Trust indicators"
          >
            {trustItems.map((item) => (
              <TrustBadge key={item} label={item} />
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </motion.section>
    <WhyTrust />

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="what-we-offer">
        <FeatureSection />
      </div>

      <TrustSafetySection />
      <Testimonials />

      <div id="faq">
        <FAQSection />
      </div>

      <ContactSection />
    
    </>
  );
}