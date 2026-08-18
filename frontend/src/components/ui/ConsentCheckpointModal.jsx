/**
 * ConsentCheckpointModal.jsx — blocking consent modal with checkbox.
 * Used for:
 *   - Step 0: Landing page soft gate (first-time CTA click)
 *   - Global: T&C / Privacy Policy re-consent on version change
 *
 * Uses ShadCN Dialog + Checkbox primitives.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

const DISCLAIMERS = [
  "MT Pocket never handles, holds, or transmits any money between users.",
  "MT Pocket never sets loan terms — all terms are negotiated privately between borrower and lender.",
  "Identity verification is a trust measure, not a guarantee of any user's honesty or ability to repay.",
  "You are solely responsible for conducting your own due diligence before entering any agreement.",
];

export default function ConsentCheckpointModal({
  open,
  onAccept,
  onCancel,
}) {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (!agreed) return;
    setAgreed(false);
    onAccept();
  };

  const handleCancel = () => {
    setAgreed(false);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold">Before you continue</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            Please read and acknowledge the following before creating your MT Pocket account.
          </DialogDescription>
        </DialogHeader>

        {/* Disclaimer bullets */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 max-h-[40vh] overflow-y-auto">
          {DISCLAIMERS.map((text, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group py-1">
          <Checkbox
            checked={agreed}
            onCheckedChange={(v) => setAgreed(!!v)}
            className="mt-0.5"
          />
          <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors select-none">
            I have read and understood this, and I agree to MT Pocket's{" "}
            <Link to="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto cursor-pointer rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!agreed}
            className="w-full sm:w-auto cursor-pointer rounded-xl shadow-xs"
          >
            I Agree & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
