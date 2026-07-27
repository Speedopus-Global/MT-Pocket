import { useState, useEffect , useLayoutEffect, useRef} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Users, Landmark, Handshake, MessageSquareLock, BadgeCheck, MousePointer2 } from "lucide-react";
import OptionWheel from "@/components/ui/OptionWheel";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";



const data = [
  {
    title: "Verified Identities",
    icon: ShieldCheck,
    description:
      "Every borrower and lender verifies their government ID before they can send a single message — no anonymous accounts, ever. That verified badge, backed by a running community trust score, is what tells you the person on the other side is real before you decide to engage."
  },
  {
    title: "Borrow & Lend Directly",
    icon: Users,
    description:
      "Discovery is built around who's actually near you, so you're matched with genuine local borrowers and lenders instead of a random national pool. Conversations stay transparent and direct from the first message, which is what makes matching faster than any middleman ever could."
  },
  {
    title: "Your Money Stays With You",
    icon: Landmark,
    description:
      "MT Pocket never holds a wallet, never touches a payment, and never sits between you and your money. Every transfer happens directly between borrower and lender, off-platform — full transparency, with nothing routed through us to go wrong."
  },
  {
    title: "You Decide Every Term",
    icon: Handshake,
    description:
      "Interest rate, repayment schedule, every clause of the agreement — that's entirely between the two of you, negotiated on your terms, not ours. We never recommend a number or push a template; you keep full control of what you agree to."
  },
  {
    title: "Private Conversations",
    icon: MessageSquareLock,
    description:
      "Every negotiation happens in a private chat with a full, searchable history, so nothing gets lost or misremembered later. If someone crosses a line, reporting and blocking are one tap away — your conversation stays yours, and safe."
  },
  {
    title: "Trust & Safety",
    icon: BadgeCheck,
    description:
      "A dedicated admin team moderates reports and monitors trust signals across the platform, quietly, in the background. It's what keeps one bad actor from being able to operate for long before the community — and we — catch it."
  }
];

const WHEEL_ITEMS = data.map((d) => d.title);


function useResponsiveTier() {
  const getTier = () => {
    if (typeof window === "undefined") return "desktop";
    if (window.innerWidth < 640) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
  };
  const [tier, setTier] = useState(getTier);
  useEffect(() => {
    const onResize = () => setTier(getTier());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return tier;
}

const WHEEL_CONFIG = {
  mobile: { fontSize: 1.35, spacing: 2.0, tilt: 8, inset: 20 },
  tablet: { fontSize: 1.9, spacing: 2.1, tilt: 9, inset: 30 },
  desktop: { fontSize: 2.5, spacing: 2.2, tilt: 10, inset: 40 },
};

gsap.registerPlugin(ScrollTrigger);
export default function WhyTrust() {
  const [selected, setSelected] = useState(0);
  const [wheelHovered, setWheelHovered] = useState(false);
  const tier = useResponsiveTier();
  const isMobile = tier === "mobile";
  const wheelCfg = WHEEL_CONFIG[tier];
  const current = data[selected];
  const Icon = current.icon;
   const headingRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        {
          y: 100,
          opacity:0,
          scale: 0.96,
          filter: "none",
         
        },
        {
          y: 0,
          autoAlpha: 1,
          
          scale: 1,
          
          ease: "none",
          clearProps: "filter",
          scrollTrigger: {
            trigger: headingRef.current,
            start: "top 90%",
            end: "top 55%",
            scrub: 1,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);
  

  return (
    <section className="py-14 sm:py-16 lg:py-20">
      
           
     <h2
  ref={headingRef}
  className="
    mx-auto
    max-w-7xl
    text-center
    text-[clamp(4.5rem,9vw,8rem)]
    font-semibold
    leading-[0.95]
    tracking-[-0.035em]

    bg-[radial-gradient(circle_at_center,var(--secondary)_0%,var(--primary)_45%,var(--foreground)_100%)]
    bg-clip-text
    [-webkit-background-clip:text]
    text-transparent
    [-webkit-text-fill-color:transparent]

    antialiased
    [text-rendering:optimizeLegibility]
    [transform:translateZ(0)]
    [backface-visibility:hidden]
    will-change-transform
  "
>
  Why Trust MT Pocket
</h2>
     
 
      {/* Grid, columns, gap-x/gap-y — unchanged. */}
      <div className="mx-auto mt-8 grid max-w-7xl gap-y-10 gap-x-24 px-6 sm:mt-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-x-40 xl:mt-16 xl:grid-cols-[520px_minmax(0,1fr)] xl:gap-x-48">

        {/* LEFT — wheel, hover glow, hint, dots: unchanged. */}
        <div
          className="relative mx-auto w-full max-w-[320px] sm:max-w-[420px] xl:max-w-[520px] lg:mx-0"
          onMouseEnter={() => setWheelHovered(true)}
          onMouseLeave={() => setWheelHovered(false)}
        >
          <motion.div
            aria-hidden
            animate={{ opacity: wheelHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute -inset-10 rounded-full bg-primary/10 blur-3xl"
          />

          <div className="relative h-[420px] sm:h-[480px] lg:h-[560px]">
            <OptionWheel
              items={WHEEL_ITEMS}
              defaultSelected={selected}
              textColor="var(--color-muted-foreground)"
              activeColor="var(--color-primary)"
              side="left"
              fontSize={wheelCfg.fontSize}
              spacing={wheelCfg.spacing}
              curve={1}
              tilt={wheelCfg.tilt}
              blur={2}
              fade={0.3}
              smoothing={200}
              inset={wheelCfg.inset}
              loop
              draggable
              onChange={(index) => setSelected(index)}
            />
          </div>

          <AnimatePresence>
            {wheelHovered && !isMobile && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="pointer-events-none absolute -bottom-2 left-10 flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <MousePointer2 size={12} /> scroll, drag, or click to explore
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-center gap-1.5 lg:mt-6 lg:justify-start">
            {data.map((_, i) => (
              <motion.span
                key={i}
                animate={{ width: i === selected ? 22 : 6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`h-1.5 rounded-full ${i === selected ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT — content typography/spacing refined; section number
            removed; icon container softened; motion tuned to be calmer. */}
        <div className="flex min-h-[280px] items-center lg:min-h-[520px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, x: isMobile ? 0 : 16, y: isMobile ? 10 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: isMobile ? 0 : -16, y: isMobile ? -10 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[700px] text-center lg:mx-0 lg:text-left"
            >
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6 lg:items-center lg:justify-start">
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 text-primary sm:h-14 sm:w-14 xl:h-16 xl:w-16"
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8" strokeWidth={1.75} />
                </motion.div>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl xl:text-5xl">
                  {current.title}
                </h3>
              </div>

              <p className="mt-8 text-base font-normal leading-7 text-muted-foreground sm:mt-10 sm:text-lg sm:leading-8 lg:text-lg lg:leading-9 xl:text-xl xl:leading-10">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}