/**
 * OfferAcceptDialog.jsx — high-stakes confirmation dialog for accepting an offer.
 *
 * This is the single most important alert in the app. It replaces window.confirm()
 * with a proper ShadCN Dialog that makes the user acknowledge they're entering a
 * private agreement.
 */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Handshake, AlertTriangle } from "lucide-react";

export default function OfferAcceptDialog({
  open,
  onConfirm,
  onCancel,
  variant = "accept", // "accept" | "reject" | "close"
}) {
  const configs = {
    accept: {
      icon: Handshake,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      iconColor: "text-emerald-600",
      title: "Accept this offer?",
      description:
        "Accepting this offer notifies the lender and moves your request to In Progress. You're entering a private agreement — MT Pocket is not a party to it and can't enforce it.",
      confirmLabel: "Accept Offer",
      confirmClass: "bg-emerald-600 text-white hover:bg-emerald-700",
    },
    reject: {
      icon: AlertTriangle,
      iconBg: "bg-destructive/10 border-destructive/20",
      iconColor: "text-destructive",
      title: "Decline this offer?",
      description:
        "Are you sure you want to decline this offer? The lender will be notified. You can still receive new offers from other lenders.",
      confirmLabel: "Decline Offer",
      confirmClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
    close: {
      icon: Handshake,
      iconBg: "bg-primary/10 border-primary/20",
      iconColor: "text-primary",
      title: "Close this request?",
      description:
        "Marking this closed won't affect any in-progress agreements. The request will no longer appear in the marketplace.",
      confirmLabel: "Close Request",
      confirmClass: "bg-primary text-primary-foreground hover:bg-primary/90",
    },
  };

  const cfg = configs[variant] || configs.accept;
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${cfg.iconBg}`}>
              <Icon size={20} className={cfg.iconColor} />
            </div>
            <DialogTitle className="text-lg font-bold">{cfg.title}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground leading-relaxed text-sm">
            {cfg.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto cursor-pointer rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={`w-full sm:w-auto cursor-pointer rounded-xl shadow-xs ${cfg.confirmClass}`}
          >
            {cfg.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
