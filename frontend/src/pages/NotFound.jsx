import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ShoppingBag, HelpCircle } from 'lucide-react';
import MtPocketLogo from '../components/ui/MtPocketLogo';

export default function NotFound() {
  const navigate = useNavigate();
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);

  const [leftPupil, setLeftPupil] = useState({ x: 0, y: -12 });
  const [rightPupil, setRightPupil] = useState({ x: 0, y: -12 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Mouse move listener to track pupils
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;

      const calcPupilOffset = (eyeEl) => {
        if (!eyeEl) return { x: 0, y: -10 };
        const rect = eyeEl.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;

        const deltaX = clientX - eyeCenterX;
        const deltaY = clientY - eyeCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.min(22, Math.hypot(deltaX, deltaY) / 10);

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
      setTimeout(() => setIsBlinking(false), 180);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary font-sans">
      
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <header className="px-6 sm:px-12 py-6 flex items-center justify-between border-b border-border/40">
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <MtPocketLogo className="w-5 h-5" />
          </div>
          <span className="font-black tracking-tight text-foreground text-lg">MT Pocket</span>
        </Link>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto w-full">
        
        {/* Headline Quote */}
        <div className="space-y-3 max-w-2xl">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Error 404
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Looks like this pocket is truly empty.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
            We searched high and low, checked every seam, but the page you’re looking for doesn’t exist or has moved.
          </p>
        </div>

        {/* ── Interactive Looking Eyes ───────────────────────────────── */}
        <div className="my-10 sm:my-14 flex items-center justify-center gap-6 sm:gap-10 select-none">
          
          {/* Left Eye */}
          <div className="flex flex-col items-center gap-3">
            {/* Eyebrow */}
            <div className="w-16 sm:w-20 h-4 border-t-[5px] border-foreground rounded-[50%/12px_12px_0_0] transform -rotate-6 transition-transform duration-200" />
            
            {/* Eye Sclera */}
            <div
              ref={leftEyeRef}
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[5px] border-foreground bg-card shadow-inner flex items-center justify-center transition-all duration-150 ${
                isBlinking ? 'scale-y-[0.05] border-t-[8px]' : 'scale-y-100'
              }`}
            >
              {/* Pupil */}
              {!isBlinking && (
                <div
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-foreground transition-transform duration-75 ease-out flex items-start justify-end p-1.5"
                  style={{
                    transform: `translate(${leftPupil.x}px, ${leftPupil.y}px)`,
                  }}
                >
                  {/* Catchlight */}
                  <div className="w-2.5 h-2.5 rounded-full bg-card" />
                </div>
              )}
            </div>
          </div>

          {/* Right Eye */}
          <div className="flex flex-col items-center gap-3">
            {/* Eyebrow */}
            <div className="w-16 sm:w-20 h-4 border-t-[5px] border-foreground rounded-[50%/12px_12px_0_0] transform rotate-6 transition-transform duration-200" />
            
            {/* Eye Sclera */}
            <div
              ref={rightEyeRef}
              className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[5px] border-foreground bg-card shadow-inner flex items-center justify-center transition-all duration-150 ${
                isBlinking ? 'scale-y-[0.05] border-t-[8px]' : 'scale-y-100'
              }`}
            >
              {/* Pupil */}
              {!isBlinking && (
                <div
                  className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-foreground transition-transform duration-75 ease-out flex items-start justify-end p-1.5"
                  style={{
                    transform: `translate(${rightPupil.x}px, ${rightPupil.y}px)`,
                  }}
                >
                  {/* Catchlight */}
                  <div className="w-2.5 h-2.5 rounded-full bg-card" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/95 shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <Home size={16} />
            <span>Return Home</span>
          </Link>

          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <ShoppingBag size={16} />
            <span>Explore Marketplace</span>
          </Link>

          <Link
            to="/support"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <HelpCircle size={16} />
            <span>Help Center</span>
          </Link>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        <p>© {new Date().getFullYear()} MT Pocket. All rights reserved.</p>
      </footer>
    </div>
  );
}
