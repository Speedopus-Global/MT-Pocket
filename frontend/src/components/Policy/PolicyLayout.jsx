import { ArrowUp, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PolicyLayout({ children }) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Back Button */}
      <div className="sticky top-0 z-40 flex items-center border-b border-border/60 bg-background/90 backdrop-blur-sm px-4 sm:px-10 lg:px-12 h-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-10 lg:px-12">
        {children}
      </div>

      {/* Floating Scroll to Top */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Scroll to top"
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-border bg-card text-primary shadow-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 cursor-pointer active:scale-95"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      <div className="h-24" />
    </main>
  );
}
