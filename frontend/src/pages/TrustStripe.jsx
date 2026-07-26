import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Users, Landmark, Handshake, MessageSquareLock, BadgeCheck, Check } from "lucide-react";
import OptionWheel from "@/components/ui/OptionWheel";

const data = [
  {
    title:"Verified Identities",
    icon:ShieldCheck,
    description:"Every borrower and lender completes identity verification before interacting, helping create a trusted community.",
    points:["Government ID verification","Verified profile badge","Fraud prevention","Community trust score"]
  },
  {
    title:"Borrow & Lend Directly",
    icon:Users,
    description:"Connect directly with verified borrowers and lenders without unnecessary intermediaries.",
    points:["Nearby discovery","Transparent conversations","Direct communication","Faster matching"]
  },
  {
    title:"Your Money Stays With You",
    icon:Landmark,
    description:"MT Pocket never receives or stores your money. Payments always happen directly between both parties.",
    points:["No wallet","No payment holding","Direct transfers","Complete transparency"]
  },
  {
    title:"You Decide Every Term",
    icon:Handshake,
    description:"Interest, repayment schedule and agreement are always decided by borrower and lender.",
    points:["Flexible repayment","Custom interest","Mutual agreement","Full control"]
  },
  {
    title:"Private Conversations",
    icon:MessageSquareLock,
    description:"Discuss everything privately before proceeding with confidence.",
    points:["Private chat","Conversation history","Report users","Block users"]
  },
  {
    title:"Trust & Safety",
    icon:BadgeCheck,
    description:"Moderation, verification and reporting work together to create a safer marketplace.",
    points:["Admin moderation","Report & block","Trust monitoring","Safer community"]
  }
];

export default function WhyTrust(){
  const [selected,setSelected]=useState(0);
  const current=data[selected];
  const Icon=current.icon;

  return(
    <section className="py-28">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex rounded-full border px-4 py-2 text-sm text-primary">
          Why Trust MT Pocket
        </span>

        <h2 className="mt-6 text-4xl font-bold lg:text-6xl">
          Built Around Trust.
          <span className="block text-primary">Not Transactions.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Every interaction is designed to build confidence before money ever changes hands.
        </p>
      </div>

      <div className="mx-auto mt-24 grid max-w-7xl gap-16 px-6 lg:grid-cols-[340px_minmax(0,1fr)]">

        {/* LEFT */}
        <div className="relative h-[560px] w-[340px]">
          <OptionWheel
            items={['Ambient', 'House', 'Techno', 'Jazz', 'Lo-Fi', 'Synthwave']}
            defaultSelected={2}
            textColor="#a6a6a6"
            activeColor="#10B981"
            side="left"
            fontSize={3}
            spacing={1.4}
            curve={1}
            tilt={6}
            blur={2}
            fade={0.25}
            smoothing={200}
            inset={80}
            loop={false}
            draggable
            soundUrl="/assets/sounds/click-soft.mp3"
            soundVolume={0.5}
            onChange={(index, item) => console.log(index, item)}
            />
        </div>

        {/* RIGHT */}
        <div className="flex min-h-[560px] items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected}
              initial={{opacity:0,x:20}}
              animate={{opacity:1,x:0}}
              exit={{opacity:0,x:-20}}
              transition={{duration:.35}}
              className="max-w-xl"
            >
              <div className="flex items-center gap-4">
                <Icon className="h-8 w-8 text-primary"/>
                <h3 className="text-4xl font-semibold">{current.title}</h3>
              </div>

              <p className="mt-8 text-lg leading-8 text-muted-foreground">
                {current.description}
              </p>

              <motion.ul
                className="mt-10 space-y-5"
                initial="hidden"
                animate="show"
                variants={{hidden:{},show:{transition:{staggerChildren:.08}}}}
              >
                {current.points.map(p=>(
                  <motion.li
                    key={p}
                    variants={{hidden:{opacity:0,y:8},show:{opacity:1,y:0}}}
                    className="flex items-start gap-3"
                  >
                    <Check className="mt-1 h-4 w-4 text-primary"/>
                    <span className="text-muted-foreground">{p}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}