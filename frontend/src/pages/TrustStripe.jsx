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
    text-[clamp(2.25rem,6.5vw,7rem)]
    font-medium
    leading-[1.05]
    tracking-[-0.035em]
    px-4

    bg-[linear-gradient(90deg,var(--primary)_30%,var(--primary)_50%,var(--secondary)_100%,var(--primary)_100%)]
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
     
 
      {/* Grid, columns, gap-x/gap-y */}
      <div className="mx-auto mt-8 grid max-w-7xl gap-y-10 gap-x-8 px-4 sm:px-6 sm:mt-10 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-x-16 xl:mt-16 xl:grid-cols-[520px_minmax(0,1fr)] xl:gap-x-24">

        {/* LEFT — wheel, hover glow, hint, dots */}
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

          <div className="relative h-[360px] sm:h-[480px] lg:h-[560px]">
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

        {/* RIGHT — Large animated description, no card border */}
        <div className="flex min-h-[260px] items-center lg:min-h-[460px] px-2 sm:px-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[680px] mx-auto lg:mx-0 text-center lg:text-left"
            >
              {/* Small icon + pillar label */}
              <div className="mb-5 flex items-center justify-center lg:justify-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
                  0{selected + 1} of {data.length}
                </span>
              </div>

              {/* Large editorial description text */}
              <p className="text-xl sm:text-2xl lg:text-[1.7rem] xl:text-[1.9rem] font-medium leading-[1.55] sm:leading-[1.55] lg:leading-[1.6] text-foreground tracking-tight">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}