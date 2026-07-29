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
        >{/* ---------- FEATURE LAYOUT ---------- */}
        <div className="relative w-full border-t border-primary bg-background">

         <div className="grid  grid-cols-12">

        <div className="relative col-span-4 pt-24 min-h-[220px]">

            <div className="absolute left-10 top-50">

                <feature.icon
                size={56}
                strokeWidth={1.8}
                className="text-primary"
                />

            </div>

            </div>

    {/* RIGHT */}
    <div className="col-span-8 flex flex-col pt-24 pb-12 pr-12">

      {/* Title */}
      <h3 className="max-w-4xl pt-24  text-4xl font-semibold leading-[1.15] tracking-[-0.05em] text-secondary md:text-5xl lg:text-6xl xl:text-[4.8rem]">

        {feature.title}

      </h3>

      {/* Description */}
      <div className="mt-12 max-w-3xl">

        <p className="text-left text-lg leading-[1.9] text-secondary md:text-xl lg:text-2xl xl:text-[1.8rem]">

          {feature.description}

        </p>

      </div>

      {/* Bullet List */}
      <div className="mt-16">

        {feature.bullets.map((bullet, index) => (

          <div key={bullet}>

            <div className="flex items-center gap-8 py-8">

              {/* Number */}
              <span className="w-14 shrink-0 text-2xl font-semibold tracking-wide text-primary">

                {String(index + 1).padStart(2, "0")}

              </span>

              {/* Text */}
              <p className="flex-1 text-xl leading-[1.8] text-secondary lg:text-[1.6rem] xl:text-[1.75rem]">

                {bullet}

              </p>

            </div>

            {index !== feature.bullets.length - 1 && (

              <div className="ml-14 h-[2px] bg-primary" />

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
