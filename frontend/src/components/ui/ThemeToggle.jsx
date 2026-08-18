/**
 * ThemeToggle.jsx — dark/light switch button
 * -----------------------------------------------------------------------
 * Suggested path: src/components/ThemeToggle.jsx
 * Drop into Navbar.jsx (or the PillNav items row) wherever you want it.
 * ----------------------------------------------------------------------- */

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/UseTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background text-foreground hover:bg-muted transition-colors"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}