"use client";

import { useState } from "react";
import { motion } from "motion/react";
import WorldMapWrapper from "@/components/ui/worldMapWrapper";
import ContactModal from "@/hooks/ContactModal";    

export default function ContactSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="px-4 py-24">
        <motion.div
          initial={{opacity:0,y:40}}
          whileInView={{opacity:1,y:0}}
          transition={{duration:0.6}}
          viewport={{once:true}}
          className="relative mx-auto max-w-[1600px] overflow-hidden rounded-[40px] border border-border bg-card shadow-2xl"
        >
          <div className="pointer-events-none absolute inset-[10px] rounded-[32px] border border-primary/15" />

          <div className="relative z-10 px-8 pt-14 text-center md:px-16">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
              Contact
            </span>

            <h2 className="mt-6 text-4xl font-bold md:text-6xl">
              Let's build something incredible.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
              Reach out from anywhere in the world. We'd love to hear about your
              next idea.
            </p>
          </div>

          <div className="relative mt-24 h-[650px]">
            <button
              onClick={() => setOpen(true)}
              className="absolute left-1/2 top-0 z-30 -translate-x-1/2 rounded-full bg-primary px-8 py-4 text-primary-foreground shadow-xl transition hover:scale-105"
            >
              Contact Us
            </button>

            <WorldMapWrapper />
          </div>
        </motion.div>
      </section>

      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}