"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export const HoverEffect = ({ items, className }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-8 py-10 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={item.title ?? idx}
          className="group relative block h-full w-full cursor-pointer"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                className="absolute inset-0 h-full w-full rounded-3xl bg-primary/5"
              />
            )}
          </AnimatePresence>

          <Card>
            {item.icon && (
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <item.icon
                  size={28}
                  strokeWidth={2}
                  className="text-primary"
                />
              </div>
            )}

            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        </div>
      ))}
    </div>
  );
};

export const Card = ({ className, children }) => {
  return (
    <div
      className={cn(
        "relative z-20 h-full w-full overflow-hidden rounded-3xl border border-secondary/30 bg-background p-4 transition-all duration-300 group-hover:border-primary",
        className
      )}
    >
      <div className="relative z-10 p-4">{children}</div>
    </div>
  );
};

export const CardTitle = ({ className, children }) => (
  <h4
    className={cn(
      "mt-4 text-xl font-semibold tracking-[-0.02em] text-primary",
      className
    )}
  >
    {children}
  </h4>
);

export const CardDescription = ({ className, children }) => (
  <p
    className={cn(
      "mt-6 text-base leading-7 text-secondary/80",
      className
    )}
  >
    {children}
  </p>
);