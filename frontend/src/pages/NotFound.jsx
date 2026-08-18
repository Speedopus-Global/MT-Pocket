import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowLeft, Home, Compass, HelpCircle } from 'lucide-react';
import MtPocketLogo from '../components/ui/MtPocketLogo';

export default function NotFound() {
  const navigate = useNavigate();
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Default resting position looking up and slightly to the right (like in the picture)
  const [leftPupil, setLeftPupil] = useState({ x: 8, y: -16 });
  const [rightPupil, setRightPupil] = useState({ x: 8, y: -16 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Mouse move listener to track pupils dynamically
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;

      const calcPupilOffset = (eyeEl) => {
        if (!eyeEl) return { x: 8, y: -16 };
        const rect = eyeEl.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;

        const deltaX = clientX - eyeCenterX;
        const deltaY = clientY - eyeCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(26, Math.hypot(deltaX, deltaY) / 8);

        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        };
      };

      setLeftPupil(calcPupilOffset(leftEyeRef.current));
      setRightPupil(calcPupilOffset(rightEyeRef.current));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Periodic natural blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-12 flex-1 flex flex-col justify-center py-10">
        
        {/* Left-Aligned Headline Quote matching reference */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="max-w-xl text-left"
        >
          <h1 className="text-2xl sm:text-4xl md:text-[42px] font-medium tracking-[-0.03em] text-foreground leading-[1.25]">
            Uh oh, the page you’re looking for can’t be found.
          </h1>
        </motion.div>

        {/* ── Centered Big Expressive Eyes ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="my-16 sm:my-24 flex items-center justify-center gap-6 sm:gap-10 select-none cursor-pointer self-center"
          onClick={() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 200);
          }}
          title="Click to blink!"
        >
          {/* Left Eye */}
          <div className="flex flex-col items-center gap-3">
            {/* Curved Eyebrow */}
            <div className="w-20 sm:w-28 h-5 border-t-[6px] sm:border-t-[7px] border-foreground rounded-[50%/16px_16px_0_0] transform -rotate-6 transition-transform duration-200" />
            
            {/* Eye Sclera */}
            <div
              ref={leftEyeRef}
              className={`relative w-28 h-28 sm:w-40 sm:h-40 rounded-full border-[6px] sm:border-[8px] border-foreground bg-card shadow-inner flex items-center justify-center transition-all duration-150 ${
                isBlinking ? 'scale-y-[0.04] border-t-[10px]' : 'scale-y-100'
              }`}
            >
              {/* Pupil */}
              {!isBlinking && (
                <div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-foreground transition-transform duration-75 ease-out flex items-start justify-end p-1 sm:p-1.5 shadow-sm"
                  style={{
                    transform: `translate(${leftPupil.x}px, ${leftPupil.y}px)`,
                  }}
                >
                  {/* Catchlight */}
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-card" />
                </div>
              )}
            </div>
          </div>

          {/* Right Eye */}
          <div className="flex flex-col items-center gap-3">
            {/* Curved Eyebrow */}
            <div className="w-20 sm:w-28 h-5 border-t-[6px] sm:border-t-[7px] border-foreground rounded-[50%/16px_16px_0_0] transform rotate-6 transition-transform duration-200" />
            
            {/* Eye Sclera */}
            <div
              ref={rightEyeRef}
              className={`relative w-28 h-28 sm:w-40 sm:h-40 rounded-full border-[6px] sm:border-[8px] border-foreground bg-card shadow-inner flex items-center justify-center transition-all duration-150 ${
                isBlinking ? 'scale-y-[0.04] border-t-[10px]' : 'scale-y-100'
              }`}
            >
              {/* Pupil */}
              {!isBlinking && (
                <div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-foreground transition-transform duration-75 ease-out flex items-start justify-end p-1 sm:p-1.5 shadow-sm"
                  style={{
                    transform: `translate(${rightPupil.x}px, ${rightPupil.y}px)`,
                  }}
                >
                  {/* Catchlight */}
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-card" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Minimal Bottom Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground"
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer underline underline-offset-4"
          >
            <ArrowLeft size={13} />
            <span>Go back to previous page</span>
          </button>
          <span>·</span>
          <Link
            to="/marketplace"
            className="hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
          >
            Explore marketplace
          </Link>
          <span>·</span>
          <Link
            to="/"
            className="hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
          >
            Return to homepage
          </Link>
        </motion.div>
      </main>

      {/* ── Minimal Footer ──────────────────────────────────────────── */}
      <footer className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-6 text-xs text-muted-foreground/60">
        <p>© {new Date().getFullYear()} MT Pocket</p>
      </footer>
    </div>
  );
}
