import { motion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1];

export default function PolicySection({ eyebrow, title, children }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.6, ease: easeOut }}
      className="flex flex-col gap-4 py-10 sm:py-12"
    >
      {/* Eyebrow label */}
      {eyebrow ? (
        <span className="text-xs font-black uppercase tracking-[0.25em] text-emerald-500">
          {eyebrow}
        </span>
      ) : null}

      {/* Section title — full width, underline green on hover */}
      <h2 className="w-full text-2xl sm:text-4xl lg:text-5xl font-black leading-[1.15] tracking-tight text-foreground underline-offset-8 decoration-emerald-500 hover:underline hover:decoration-[3px] transition-all duration-200 cursor-default">
        {title}
      </h2>

      {/* Body text — full width, justified */}
      <div className="w-full space-y-4 text-base sm:text-lg leading-relaxed text-muted-foreground text-justify">
        {children}
      </div>
    </motion.article>
  );
}
