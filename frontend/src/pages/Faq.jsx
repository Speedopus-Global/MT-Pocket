"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";

const faqs = [
  {
    q: "Is MT Pocket a bank or NBFC?",
    a: "No. MT Pocket is a technology platform that helps people discover and connect with each other for personal lending — similar in role to a classifieds site. We are not a bank, NBFC, or licensed financial institution."
  },
  {
    q: "Do you handle my money?",
    a: "No, never. All payments and repayments happen directly between you and the other person, entirely outside MT Pocket. We don't process, hold, or transfer funds at any point."
  },
  {
    q: "Who decides the interest rate?",
    a: "You and the other person, together. MT Pocket doesn't set, recommend, or approve loan terms — the amount, interest rate, and repayment schedule are entirely up to the two of you."
  },
  {
    q: "Is there a limit on the interest rate we can agree to?",
    a: "MT Pocket doesn't cap or approve interest rates — but the rate you agree to still has to comply with the lending laws in your state. It's your responsibility, not ours, to keep your agreement within what's legally allowed where you live."
  },
  {
    q: "How is my identity verified?",
    a: "We verify your submitted ID documents before you can send or receive an offer. Verification reduces risk but isn't a guarantee — you're always encouraged to do your own due diligence before agreeing to anything."
  },
  {
    q: "What happens if my verification is rejected?",
    a: "You'll be notified and can re-submit with corrected or clearer documents. Until verification is approved, you can browse the platform but can't send or receive offers."
  },
  {
    q: "What if the other person doesn't pay me back?",
    a: "MT Pocket isn't a party to your agreement and can't enforce repayment. But the agreement itself is a private contract between you and the other person, and normal legal remedies for unpaid debts still apply — the same as any personal loan made outside the platform. This is exactly why we recommend only proceeding with verified users and terms you're genuinely comfortable with."
  },
  {
    q: "How do I report or block someone?",
    a: "Every profile and chat has a one-tap option to report or block. Reported accounts are reviewed by our team, and blocked users can no longer see your profile or contact you."
  },
  {
    q: "Is MT Pocket free to use?",
    a: "Yes — browsing, verification, and connecting with borrowers or lenders is free."
  },
  {
    q: "Which areas does MT Pocket cover?",
    a: "Coverage depends on launch regions. Supported cities and regions will be announced as they become available."
  },
  {
    q: "Can I delete my account and data?",
    a: "Yes. You can request account and data deletion from your settings at any time."
  },
  {
    q: "Is my data safe?",
    a: "Your documents and personal information are encrypted and only used for verification. See our Privacy Policy for complete details."
  }
];


export default function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-background py-32">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .6 }}
        >
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-primary/15 bg-card px-5 py-2">
           <div className="flex h-8 w-8 items-center justify-center">
                <svg width="0" height="0">
                    <defs>
                    <linearGradient id="sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    </defs>
                </svg>

                <Sparkles
                    size={24}
                    strokeWidth={2.3}
                    style={{ stroke: "url(#sparkle-gradient)" }}
                />
                </div>

            <span className="text-sm font-medium uppercase tracking-[0.32em] text-primary">
              FAQ
            </span>
          </div>

          <h2 className="max-w-full whitespace-nowrap text-5xl font-light tracking-[-0.06em] text-foreground md:text-7xl xl:text-[6rem]">
            Frequently asked questions
          </h2>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-muted-foreground">
            We've compiled the most important information to help you. Can't find what you're looking for?
            <button className="ml-2 font-medium text-primary hover:underline">
              Contact us.
            </button>
          </p>
        </motion.div>

        <div className="mt-20 divide-y divide-border border-y border-border">
          {faqs.map((item, i) => {
            const active = open === i;

            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(active ? -1 : i)}
                  className="flex w-full cursor-pointer items-start justify-between py-6 text-left transition-colors"
                >
                  <div className="ml-6 grid w-full grid-cols-[110px_1fr] items-start gap-x-10 lg:ml-8 lg:grid-cols-[130px_1fr] lg:gap-x-12">

                    <span className="select-none text-6xl font-thin tracking-[-0.08em] text-primary lg:text-7xl">
                      {String(i + 1).padStart(2, "0").split("").join(" ")}
                    </span>

                    <h3
                      className={`pr-10 text-xl font-medium leading-8 transition-colors duration-300 md:text-[1.35rem] ${
                        active ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {item.q}
                    </h3>

                  </div>

                  <motion.div
                    animate={{
                      rotate: active ? 225 : 0,
                      scale: active ? 1.08 : 1,
                    }}
                    transition={{
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mr-4 mt-1 flex h-12 w-12 shrink-0 items-center justify-center"
                  >
                    <Plus className="h-6 w-6 text-primary" strokeWidth={2} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 grid grid-cols-[110px_1fr] gap-x-10 pb-6 lg:ml-8 lg:grid-cols-[130px_1fr] lg:gap-x-12">

                        <div />

                        <p className="max-w-5xl pr-12 text-base leading-7 text-muted-foreground">
                          {item.a}
                        </p>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}