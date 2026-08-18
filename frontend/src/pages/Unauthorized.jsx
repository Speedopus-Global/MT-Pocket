import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Home, Compass, HelpCircle, Lock, ShieldAlert, KeyRound } from 'lucide-react';
import MtPocketLogo from '../components/ui/MtPocketLogo';

export default function Unauthorized() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);

  const handleLockClick = () => {
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl mx-auto px-6 sm:px-12 pt-8 sm:pt-12 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <MtPocketLogo className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-[-0.04em] text-foreground text-xl sm:text-2xl">
            MT Pocket
          </span>
        </Link>

        {/* Minimalist Menu Button */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Quick Menu Dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-48 rounded-xl border border-border bg-card shadow-lg p-2 z-50 space-y-1"
              >
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Home size={14} />
                  <span>Home</span>
                </Link>
                <Link
                  to="/marketplace"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Compass size={14} />
                  <span>Marketplace</span>
                </Link>
                <Link
                  to="/support"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <HelpCircle size={14} />
                  <span>Help & Support</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* ── Main Canvas ─────────────────────────────────────────────── */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-12 flex-1 flex flex-col justify-center py-8 sm:py-12">
        
        {/* Left-Aligned Headline Quote */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="max-w-2xl text-left space-y-2"
        >
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
            Error 403 · Restricted Area
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-[38px] font-medium tracking-[-0.03em] text-foreground leading-[1.25]">
            This pocket is zipped shut with a high-security lock.
          </h1>
        </motion.div>

        {/* ── Centered Minimalist Interactive Lock & Shield ──────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="my-12 sm:my-20 flex items-center justify-center select-none cursor-pointer self-center"
          onClick={handleLockClick}
          title="Click to check lock!"
        >
          <motion.div
            animate={isWiggling ? { rotate: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="relative flex items-center justify-center"
          >
            {/* Outer Protective Halo */}
            <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full border-[5px] sm:border-[6px] border-foreground/20 bg-card shadow-inner flex items-center justify-center" />
            
            {/* Inner Modern Padlock Graphic */}
            <div className="absolute flex flex-col items-center">
              {/* Shackle */}
              <div className="w-12 sm:w-16 h-10 sm:h-12 border-[5px] sm:border-[6px] border-foreground rounded-t-full border-b-0 -mb-1" />
              {/* Lock Body */}
              <div className="w-20 sm:w-28 h-16 sm:h-22 rounded-2xl bg-foreground text-background flex flex-col items-center justify-center shadow-lg">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-background mt-1" />
                <div className="w-1.5 h-4 sm:h-5 bg-background rounded-b-sm -mt-0.5" />
              </div>
            </div>

            {/* Subtle Alert Badge */}
            <div className="absolute -top-1 -right-1 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md">
              <Lock size={16} className="sm:w-5 sm:h-5" />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Cute & Impressive Quote + "Let's take you home" button ──── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col items-center justify-center gap-5 text-center max-w-md mx-auto"
        >
          <p className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed italic">
            “Curiosity is wonderful, but this vault is reserved for administrators only. Let’s get you back to safe ground.”
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all duration-200 hover:scale-[1.03] cursor-pointer"
          >
            <Home size={16} />
            <span>Let’s take you home</span>
            <ArrowRight size={15} />
          </Link>
        </motion.div>
      </main>

      {/* ── Minimal Footer ──────────────────────────────────────────── */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-6 text-xs text-muted-foreground/60 flex items-center justify-between">
        <p>© {new Date().getFullYear()} MT Pocket</p>
       
      </footer>
    </div>
  );
}