import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, X, ShieldCheck } from 'lucide-react';

// Shared across MarketPlace.jsx and UserProfile.jsx (and anywhere else that
// needs to gate an action behind login) — one prompt, one place to style it.
export default function LoginPromptModal({ open, onClose, message }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="font-bold text-foreground">Log in required</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {message || 'Please log in or create an account to continue.'}
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <LogIn size={14} /> Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 text-sm font-bold border border-border text-foreground px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <UserPlus size={14} /> Create an account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}