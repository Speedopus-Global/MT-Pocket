import { useState } from "react";
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
    <div className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-secondary bg-primary p-8 lg:p-10 transition-all duration-300">
      <div className="absolute inset-0 opacity-[0.035] mix-blend-soft-light bg-[radial-gradient(circle_at_center,rgba(255,255,255,.12)_0.7px,transparent_0.8px)] bg-[length:18px_18px]" />

      <div className="relative z-10">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-8 w-8 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
        </div>

        <span className="text-sm text-primary-foreground/60">Step {index + 1}</span>
        <h3 className="mt-2 text-2xl font-semibold text-primary-foreground">
          <span className="hover-line">{step.title}</span>
        </h3>
        <p className="mt-5 leading-8 text-primary-foreground/80">{step.description}</p>
      </div>
    </div>
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
        <h2 className="mb-16 text-center text-[clamp(3rem,6vw,5.5rem)] font-medium tracking-[-.04em] leading-none bg-gradient-to-r from-primary-foreground via-secondary to-primary-foreground bg-clip-text text-transparent">
          Two sides, two simple paths
        </h2>

        <div className="mb-20 flex justify-center">
          <div className="relative inline-flex rounded-full bg-primary-foreground p-1 border-2 border-primary">
            <div
              className="absolute inset-y-1 rounded-full bg-primary"
              style={{
                left: active === "borrower" ? "4px" : "50%",
                width: "calc(50% - 4px)",
                transition: "left 0.3s ease",
              }}
            />
            {Object.entries(PATHS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setActive(k)}
                className={`relative z-10 min-w-[180px] cursor-pointer rounded-full px-8 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.03] ${
                  active === k ? "text-primary-foreground" : "text-primary"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-[12%] right-[12%] top-8 hidden h-[2px] overflow-hidden lg:block">
            <div className="h-full bg-gradient-to-r from-transparent via-secondary to-transparent" />
          </div>

          {/* Desktop cards: hidden on small, visible on lg+ */}
          <div className="hidden lg:grid gap-10 md:gap-12 lg:grid-cols-3">
            {steps.map((s, i) => (
              <Card key={s.title} step={s} index={i} />
            ))}
          </div>

          {/* Mobile timeline: visible on small, hidden on lg+ */}
          <div className="mt-12 flex flex-col gap-8 lg:hidden">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="h-4 w-4 rounded-full bg-secondary ring-4 ring-secondary/20" />
                  {i < steps.length - 1 && (
                    <div className="mt-2 w-px bg-gradient-to-b from-secondary via-white/40 to-transparent" />
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-primary-foreground">{s.title}</h4>
                  <p className="mt-2 text-primary-foreground/80">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
