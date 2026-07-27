import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  MapPin,
  MessagesSquare,
  Search,
  ShieldCheck,
  Send,
} from "lucide-react";

const PATHS = {
  borrower: {
    label: "For Borrowers",
    steps: [
      {
        icon: FileText,
        title: "Post your request",
        description:
          "Share your borrowing requirement in minutes and become visible to verified lenders nearby.",
      },
      {
        icon: MapPin,
        title: "Get matched nearby",
        description: "Verified lenders near you can discover and connect directly.",
      },
      {
        icon: MessagesSquare,
        title: "Negotiate & Finalise",
        description: "Discuss terms securely and agree on repayment together.",
      },
    ],
  },
  lender: {
    label: "For Lenders",
    steps: [
      {
        icon: Search,
        title: "Browse Requests",
        description: "Explore nearby verified borrowing requests.",
      },
      {
        icon: ShieldCheck,
        title: "Review Trust Score",
        description: "Check verification and trust history before responding.",
      },
      {
        icon: Send,
        title: "Send an Offer",
        description: "Start the conversation and negotiate directly.",
      },
    ],
  },
};

function Card({ step, index }) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.55, delay: index * 0.15 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="group relative overflow-hidden rounded-3xl p-[1px]"
    >
      <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(135deg,var(--secondary),rgba(255,255,255,.18),var(--primary),var(--secondary))] bg-[length:250%_250%] animate-[gradient_8s_linear_infinite]" />

      <div className="relative h-full rounded-[calc(1.5rem-1px)] bg-primary/90 p-8 lg:p-10 backdrop-blur-2xl">
        <div className="absolute inset-0 opacity-[0.035] mix-blend-soft-light bg-[radial-gradient(circle_at_center,rgba(255,255,255,.12)_0.7px,transparent_0.8px)] bg-[length:18px_18px]" />

        <div className="relative z-10">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-card/10 ring-1 ring-border">
            <Icon className="h-8 w-8 text-primary-foreground" />
          </div>

          <span className="text-sm text-muted-foreground">Step {index + 1}</span>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">{step.title}</h3>
          <p className="mt-5 leading-8 text-muted-foreground">{step.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HowItWorksV3() {
  const [active, setActive] = useState("borrower");
  const steps = PATHS[active].steps;

  return (
    <section className="relative overflow-hidden bg-primary py-28">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-[-10%] top-0 h-[420px] w-[420px] rounded-full bg-secondary blur-[140px]" />
        <div className="absolute right-[-10%] bottom-0 h-[360px] w-[360px] rounded-full bg-white/10 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.035] mix-blend-soft-light bg-[radial-gradient(circle_at_center,rgba(255,255,255,.12)_0.7px,transparent_0.8px)] bg-[length:18px_18px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 80, scale: 0.96, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ amount: 0.7 }}
          transition={{ duration: 1 }}
          className="mb-16 text-center text-[clamp(3rem,6vw,5.5rem)] font-medium tracking-[-.04em] leading-none bg-gradient-to-r from-primary-foreground via-secondary to-primary-foreground bg-clip-text text-transparent"
        >
          Two sides, two simple paths
        </motion.h2>

        <div className="mb-20 flex justify-center">
          <div className="relative inline-flex rounded-full bg-white/10 p-1 backdrop-blur-xl ring-1 ring-white/10">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 250, damping: 24 }}
              className="absolute inset-y-1 rounded-full bg-secondary"
              style={{ left: active === "borrower" ? "4px" : "50%", width: "calc(50% - 4px)" }}
            />
            {Object.entries(PATHS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setActive(k)}
                className={`relative z-10 min-w-[180px] cursor-pointer rounded-full px-8 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.03] ${
                  active === k ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
            <div className="absolute left-[12%] right-[12%] top-8 hidden h-[2px] overflow-hidden lg:block">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "left" }}
                className="h-full bg-gradient-to-r from-transparent via-secondary to-transparent"
              />
            </div>

            {/* Desktop cards: hidden on small, visible on lg+ */}
            <div className="hidden lg:grid gap-10 md:gap-12 lg:grid-cols-3">
              {steps.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.55, delay: i * 0.28 }}
                >
                  <Card step={s} index={i} />
                </motion.div>
              ))}
            </div>

            {/* Mobile timeline: visible on small, hidden on lg+ */}
            <div className="mt-12 flex flex-col gap-8 lg:hidden">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.25, type: "spring", stiffness: 280 }}
                      className="h-4 w-4 rounded-full bg-secondary ring-4 ring-secondary/20"
                    />
                    {i < steps.length - 1 && (
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: "100%" }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.25 + 0.1, duration: 0.5 }}
                        className="mt-2 w-px bg-gradient-to-b from-secondary via-white/40 to-transparent"
                      />
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground">{s.title}</h4>
                    <p className="mt-2 text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
