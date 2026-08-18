"use client";
import React, { useState } from "react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
  storageKey = "mt_phone_under_dev_banner_dismissed",
}) => {
  const [open, setOpen] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      return sessionStorage.getItem(storageKey) !== "true";
    }
    return true;
  });

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (hideOnScroll) {
      if (latest > 60) {
        setOpen(false);
      } else if (!sessionStorage.getItem(storageKey)) {
        setOpen(true);
      }
    }
  });

  const handleClose = () => {
    setOpen(false);
    if (typeof window !== "undefined" && storageKey) {
      sessionStorage.setItem(storageKey, "true");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "sticky inset-x-0 top-0 z-[100] flex min-h-11 w-full items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-md transition-colors",
            "bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800 backdrop-blur-md border-b border-white/10",
            className
          )}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-center gap-2 pr-7 text-center leading-tight">
            {children}
          </div>

          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Dismiss banner"
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            onClick={handleClose}
          >
            <CloseIcon className="h-4 w-4" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CloseIcon = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
};

export default StickyBanner;
