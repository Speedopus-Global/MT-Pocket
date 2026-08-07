import { motion } from "framer-motion";

export default function PolicyDivider() {
  return (
    <div className="flex items-center justify-center" aria-hidden="true">
      <motion.span
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="h-px w-20 origin-right bg-border sm:w-28"
      />
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mx-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"
      />
      <motion.span
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="h-px w-20 origin-left bg-border sm:w-28"
      />
    </div>
  );
}
