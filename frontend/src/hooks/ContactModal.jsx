"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function ContactModal({open,onClose}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{opacity:0}}
          animate={{opacity:1}}
          exit={{opacity:0}}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{opacity:0,scale:.92,y:20}}
            animate={{opacity:1,scale:1,y:0}}
            exit={{opacity:0,scale:.92}}
            className="relative w-full max-w-xl rounded-[32px] border border-border bg-card p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 text-xl"
            >
              ×
            </button>

            <h3 className="text-3xl font-bold">Get in touch</h3>

            <div className="mt-8 space-y-4">
              <input placeholder="Name" className="w-full rounded-xl border border-input bg-background p-3"/>
              <input placeholder="Email" className="w-full rounded-xl border border-input bg-background p-3"/>
              <input placeholder="Subject" className="w-full rounded-xl border border-input bg-background p-3"/>
              <textarea rows="5" placeholder="Message" className="w-full rounded-xl border border-input bg-background p-3"/>
              <button className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground">
                Send Message
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}