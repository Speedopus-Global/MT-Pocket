import { motion } from "framer-motion";

export default function PolicyDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="my-8 sm:my-12 h-[2px] w-full origin-left rounded-full bg-emerald-500/70"
      aria-hidden="true"
    />
  );
}
