import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1];

export default function PolicyHero({ title, subtitle }) {
  return (
    <section className="flex flex-col items-start justify-center gap-4 py-10 sm:py-14">
      {/* Icon + Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="flex items-center gap-2.5 text-primary"
      >
        <Sparkles className="h-5 w-5 shrink-0" strokeWidth={2} />
        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">
          MT Pocket
        </span>
      </motion.div>

      {/* Hero Title */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.08, ease: easeOut }}
        className="text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]"
      >
        {title}
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease: easeOut }}
        className="text-base sm:text-lg text-muted-foreground font-medium leading-relaxed max-w-3xl"
      >
        {subtitle}
      </motion.p>
    </section>
  );
}
