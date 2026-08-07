import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const easeOut = [0.16, 1, 0.3, 1];

export default function PolicyHero({ title, subtitle }) {
  return (
    <section className="flex min-h-[35vh] flex-col items-center justify-center gap-6 py-20 text-center sm:min-h-[45vh]">
      <motion.div
        initial={{ opacity: 0, filter: "blur(8px)", y: 12 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.8, ease: easeOut }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.5} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, filter: "blur(10px)", y: 16 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.9, delay: 0.1, ease: easeOut }}
        className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, filter: "blur(6px)", y: 10 }}
        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 0.8, delay: 0.22, ease: easeOut }}
        className="max-w-xl px-4 text-base text-muted-foreground sm:text-lg"
      >
        {subtitle}
      </motion.p>
    </section>
  );
}
