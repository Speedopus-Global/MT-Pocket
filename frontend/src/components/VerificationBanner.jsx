/**
 * VerificationBanner
 * ─────────────────────────────────────────────────────────────
 * Shown when the user tries an action that requires full
 * verification (both phone + email confirmed) but isn't there yet.
 *
 * Usage:
 *   import { useVerificationBanner, VerificationBanner } from '../components/VerificationBanner';
 *
 *   // In your component:
 *   const { showVerificationBanner, verificationBannerProps } = useVerificationBanner();
 *
 *   // In your catch block:
 *   } catch (err) {
 *     if (err.requiresFullVerification) {
 *       showVerificationBanner(err.verificationStatus);
 *       return;
 *     }
 *     setError(err.message);
 *   }
 *
 *   // In JSX:
 *   <VerificationBanner {...verificationBannerProps} />
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function useVerificationBanner() {
  const [banner, setBanner] = useState(null); // null = hidden

  const showVerificationBanner = (verificationStatus = null) => {
    setBanner({ verificationStatus });
  };

  const hideVerificationBanner = () => setBanner(null);

  return {
    showVerificationBanner,
    verificationBannerProps: {
      isOpen: banner !== null,
      verificationStatus: banner?.verificationStatus ?? null,
      onClose: hideVerificationBanner,
    },
  };
}

export function VerificationBanner({ isOpen, verificationStatus, onClose }) {
  const navigate = useNavigate();

  const hasPhone = verificationStatus?.hasPhone;
  const hasEmail = verificationStatus?.hasEmail;
  const phoneVerified = verificationStatus?.phoneVerified;
  const emailVerified = verificationStatus?.emailVerified;

  const missingPhone = !hasPhone || !phoneVerified;
  const missingEmail = !hasEmail || !emailVerified;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Banner popup */}
          <motion.div
            key="banner"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-2xl border border-amber-500/30 bg-card shadow-2xl p-6"
          >
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                <ShieldAlert size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  Complete your verification first
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  For the safety of all users, loan-related actions require both
                  your phone number and email to be verified.
                </p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Status items */}
            <div className="mt-4 space-y-2">
              <StatusRow
                icon={<Phone size={14} />}
                label="Phone number"
                done={!missingPhone}
                missing={missingPhone}
                missingText={!hasPhone ? 'Not added yet' : 'Not verified'}
              />
              <StatusRow
                icon={<Mail size={14} />}
                label="Email address"
                done={!missingEmail}
                missing={missingEmail}
                missingText={!hasEmail ? 'Not added yet' : 'Not verified'}
              />
            </div>

            {/* CTA */}
            <button
              onClick={() => { onClose(); navigate('/dashboard/settings'); }}
              className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Settings to complete verification
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatusRow({ icon, label, done, missingText }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${done ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
        {done ? <CheckCircle2 size={13} /> : icon}
      </span>
      <span className="flex-1 text-xs font-medium text-foreground">{label}</span>
      <span className={`text-xs font-medium ${done ? 'text-emerald-500' : 'text-amber-500'}`}>
        {done ? 'Verified ✓' : missingText}
      </span>
    </div>
  );
}
