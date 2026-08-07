import { motion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1];

export default function PolicySection({ eyebrow, title, children }) {
  return (
    <motion.article
      initial={{ opacity: 0.32, filter: "blur(6px)", y: 26 }}
      whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.7, ease: easeOut }}
      className="flex min-h-[55vh] flex-col justify-center gap-5 py-16 sm:py-20"
    >
      {eyebrow ? (
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </span>
      ) : null}

      <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground transition-colors duration-300 sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>

      <div className="max-w-[70ch] space-y-4 text-lg leading-relaxed text-muted-foreground sm:text-xl">
        {children}
      </div>
    </motion.article>
  );
}
