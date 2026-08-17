/**
 * InfoBanner.jsx — reusable dismissible info/warning/success/destructive banner.
 * Supports one-time display via localStorage storageKey.
 *
 * Variants: info (blue), warning (amber), success (emerald), destructive (red).
 */
import { useState } from "react";
import { X, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

const VARIANT_STYLES = {
  info: {
    container: "bg-primary/5 border-primary/20 text-primary",
    icon: Info,
  },
  warning: {
    container: "bg-amber-500/5 border-amber-500/20 text-amber-600",
    icon: AlertTriangle,
  },
  success: {
    container: "bg-emerald-500/5 border-emerald-500/20 text-emerald-600",
    icon: CheckCircle2,
  },
  destructive: {
    container: "bg-destructive/5 border-destructive/20 text-destructive",
    icon: AlertCircle,
  },
};

export default function InfoBanner({
  variant = "info",
  children,
  dismissible = true,
  storageKey,
  className = "",
}) {
  const alreadySeen = storageKey ? localStorage.getItem(storageKey) === "true" : false;
  const [dismissed, setDismissed] = useState(alreadySeen);

  if (dismissed) return null;

  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = style.icon;

  const handleDismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "true");
    setDismissed(true);
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${style.container} ${className}`}
      role="alert"
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-0.5 rounded-md hover:bg-foreground/5 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
