"use client";

import { motion } from "framer-motion";
import {
  BadgeCheck,
  ShieldCheck,
  Ban,
  Sparkles,
  MessageSquare,
  Lock,
} from "lucide-react";
import { HoverEffect } from "@/components/ui/card-hover-effect";

export const projects = [
  {
    title: "ID Verification",
    description:
      "Government-issued ID verification is required before any borrower or lender can send or receive offers.",
    icon: BadgeCheck,
  },
  {
    title: "Trust Score",
    description:
      "Every profile earns a dynamic trust score based on verification status, profile completeness and platform history.",
    icon: ShieldCheck,
  },
  {
    title: "Block & Report",
    description:
      "Flag suspicious behaviour or instantly block any user from a profile or conversation with one click.",
    icon: Ban,
  },
  {
    title: "Verified Profiles",
    description:
      "Only verified members can participate, creating a safer and more reliable community.",
    icon: BadgeCheck,
  },
  {
    title: "Private Conversations",
    description:
      "Communicate securely through private in-app messaging before making any lending decision.",
    icon: MessageSquare,
  },
  {
    title: "You're in Control",
    description:
      "MT Pocket never handles funds. Borrowers and lenders stay in complete control of every agreement.",
    icon: Lock,
  },
];

export default function TrustSafetySection() {
  return (
    <section className="relative overflow-hidden bg-background py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/10 px-5 py-2">
            <Sparkles size={18} className="text-primary" />
            <span className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
              Trust &amp; Safety
            </span>
          </div>

          <h2 className="mt-8 text-6xl font-light leading-[1.02] tracking-[-0.06em] text-secondary lg:text-8xl">
            Built for trust.
            <br />
            Designed for people.
          </h2>

          <p className="mt-8 max-w-3xl text-lg leading-9 text-secondary/80 lg:text-xl">
            Every user completes identity verification before joining the marketplace.
            We surface meaningful trust signals and provide the tools you need to
            connect with confidence.
          </p>
        </motion.div>

        <div className="mt-20">
          <HoverEffect items={projects} />
        </div>
      </div>
    </section>
  );
}