import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, X, Lock, ArrowRight } from 'lucide-react';

export default function LoginPromptModal({ open, onClose, message }) {
  // Close on Escape key press for keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Subtle backdrop overlay with minimal blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-all cursor-pointer"
            aria-hidden="true"
          />

          {/* Premium Shadcn Dialog/Popover Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-[calc(100vw-2rem)] max-w-[380px] rounded-2xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-all cursor-default"
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground/70 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header / Brand Icon */}
            <div className="flex flex-col items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                <Lock size={20} className="stroke-[2.25]" />
              </div>

              <div className="space-y-1">
                <h3
                  id="modal-title"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  Authentication required
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {message || 'Sign in or set up a new account to unlock full access.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={onClose}
                className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer active:scale-[0.99]"
              >
                <LogIn size={15} />
                <span>Log in</span>
                <ArrowRight size={14} className="ml-auto opacity-60 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/register"
                onClick={onClose}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-input bg-background/50 px-4 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer active:scale-[0.99]"
              >
                <UserPlus size={15} />
                <span>Create an account</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}