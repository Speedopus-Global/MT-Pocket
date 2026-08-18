import { motion } from 'framer-motion';
import ScrollStack, { ScrollStackItem } from '../components/ui/ScrollStack';

import {
  MapPin,
  Search,
 MessagesSquare,
  ShieldCheck
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Hyperlocal Matching",
    description:
      "Discover verified borrowers and lenders within your preferred location radius. By keeping every connection local, MT Pocket helps build trust, encourages faster responses, and creates lending opportunities that feel more personal and reliable.",

    bullets: [
      "Connect with verified people nearby",
      "Build trust through local interactions",
      "Receive faster and more relevant matches",
    ],
  },

  {
    icon: Search,
    title: "Smart Search & Filters",
    description:
      "Find exactly what you're looking for using powerful search and intelligent filters. Narrow results by amount, location, availability, and verification status to reach the right opportunities in seconds.",

    bullets: [
      "Filter by amount, location, and category",
      "Prioritise verified borrowers and lenders",
      "Spend less time searching, more time connecting",
    ],
  },

  {
    icon: MessagesSquare,
    title: "Secure In-App Messaging",
    description:
      "Discuss borrowing requirements, repayment terms, and expectations without leaving the platform. Every conversation stays organised, private, and available whenever you need to revisit important details.",

    bullets: [
      "Private conversations inside the platform",
      "Complete message history for every interaction",
      "Report or block suspicious users instantly",
    ],
  },

  {
    icon: ShieldCheck,
    title: "Complete Control",
    description:
      "Every agreement is created directly between the borrower and lender. MT Pocket never holds funds, processes payments, or decides repayment terms—giving both parties complete transparency and full control over every transaction.",

    bullets: [
      "No platform involvement in money transfers",
      "Negotiate terms directly with confidence",
      "Transparent agreements from start to finish",
    ],
  },
];
function FeatureSection() {
    
  return (
  <section className="relative overflow-hidden bg-background text-foreground">

    <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl space-y-4"
      >
        <p className="text-5xl font-medium uppercase tracking-[0.30em] text-primary">
          What we offer
        </p>
      </motion.div>

      <ScrollStack  useWindowScroll
        className="relative z-10 flex w-full flex-col gap-8 py-8"
      >

        {features.map((feature) => (

          <ScrollStackItem
            key={feature.title}
            itemClassName="bg-transparent"
          >

            <motion.div
              whileHover={{ y: -4, scale: 1.008 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative flex h-full w-full items-center justify-center px-5 py-2 lg:px-8"
        >
       {/* ---------- FEATURE LAYOUT ---------- */}
<div className="relative w-full border-t border-primary bg-background">
  <div className="flex flex-col md:grid md:grid-cols-12">

    {/* LEFT */}
    <div className="relative md:col-span-3 lg:col-span-4 pt-6 sm:pt-8 md:pt-14 lg:pt-16 px-4 md:px-0">
      <div className="md:absolute md:left-6 lg:left-10 md:top-40 lg:top-52 mb-2 md:mb-0">
        <feature.icon
          size={36}
          strokeWidth={1.8}
          className="text-primary sm:size-10 md:size-11 lg:size-12"
        />
      </div>
    </div>

    {/* RIGHT */}
    <div className="md:col-span-9 lg:col-span-8 flex flex-col pt-2 md:pt-14 lg:pt-16 pb-8 md:pb-10 lg:pb-12 px-4 md:px-0 md:pr-8 lg:pr-12">

      {/* Title */}
      <h3 className="max-w-4xl pt-2 sm:pt-4 md:pt-10 text-xl font-semibold leading-tight tracking-[-0.03em] text-secondary sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-[3.5rem]">
        {feature.title}
      </h3>

      {/* Description */}
      <div className="mt-5 md:mt-6 max-w-3xl">
        <p className="text-left text-sm leading-7 text-secondary sm:text-base md:text-lg lg:text-xl xl:text-[1.35rem] xl:leading-9">
          {feature.description}
        </p>
      </div>

      {/* Bullet List */}
      <div className="mt-8 md:mt-10">

        {feature.bullets.map((bullet, index) => (
          <div key={bullet}>

            <div className="flex items-start gap-4 md:gap-5 lg:gap-6 py-4 md:py-5">

              {/* Number */}
              <span className="w-8 md:w-10 shrink-0 text-lg md:text-xl lg:text-2xl font-semibold tracking-wide text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Text */}
              <p className="flex-1 text-sm leading-7 text-secondary sm:text-base md:text-lg lg:text-xl xl:text-[1.25rem] xl:leading-9">
                {bullet}
              </p>

            </div>

            {index !== feature.bullets.length - 1 && (
              <div className="ml-8 md:ml-10 h-px bg-primary/30" />
            )}

          </div>
        ))}

      </div>

    </div>

  </div>
</div>



            </motion.div>

          </ScrollStackItem>

        ))}

      </ScrollStack>

    </div>

  </section>
);
}

export default FeatureSection;
