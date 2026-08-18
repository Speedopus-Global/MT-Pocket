/**
 * Register.jsx — New User Onboarding Stepper
 * -----------------------------------------------------------------------
 * Flow:  Identifier (Email/Phone) → OTP → Password → Full Name → Role & Terms Modal
 * ----------------------------------------------------------------------- */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  User as UserIcon,
  Mail,
  Smartphone,
  ShieldAlert,
  FileText,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StickyBanner } from '../components/ui/sticky-banner';

const logo = 'https://res.cloudinary.com/hyztwkou/image/upload/v1787051288/logo_pvvfwz.png';

const CONSENT_SUMMARY = [
  'MT Pocket is a peer-to-peer technology matching platform and never handles, holds, or transmits money between users.',
  'All interest rates, loan amounts, and repayment schedules are privately negotiated directly between borrower and lender.',
  'Identity verification is a safety and risk-reduction measure, not a guarantee of repayment or financial solvency.',
  'You are solely responsible for conducting your own due diligence before entering into any private agreement.',
];

const STEPS = [
  { id: 'phone',    label: 'Contact',  icon: UserPlus,    title: 'Create Account',    subtitle: 'Enter your email or phone number to get started.' },
  { id: 'otp',      label: 'Verify',   icon: ShieldCheck, title: 'Verify Code',       subtitle: 'Enter the 6-digit verification code.' },
  { id: 'password', label: 'Security', icon: KeyRound,    title: 'Set Password',      subtitle: 'Create a secure password for your account.' },
  { id: 'name',     label: 'Profile',  icon: UserIcon,    title: 'Your Name',         subtitle: 'Use your real legal name for identity verification.' },
  { id: 'role',     label: 'Role',     icon: CheckCircle2,title: 'Account Role',      subtitle: 'Select how you plan to use MT Pocket.' },
];

const ROLE_OPTIONS = [
  {
    value: 'borrower',
    emoji: '🙋',
    label: 'I need to borrow',
    hint: 'Post loan requests, set repayment terms, and connect with verified lenders nearby',
    accent: 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/40',
  },
  {
    value: 'lender',
    emoji: '💰',
    label: 'I want to lend',
    hint: 'Discover verified borrowing requests, make custom offers, and earn agreed returns',
    accent: 'from-blue-500/10 to-indigo-500/5 hover:border-blue-500/40',
  },
  {
    value: 'both',
    emoji: '🔄',
    label: 'Both (Borrow & Lend)',
    hint: 'Full flexibility to switch between borrowing and lending anytime from your dashboard',
    accent: 'from-purple-500/10 to-pink-500/5 hover:border-purple-500/40',
  },
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    x: direction < 0 ? 30 : -30,
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  }),
};

export default function Register() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const [stepIndex, setStepIndex]   = useState(0);
  const [direction, setDirection]   = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp]               = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName]     = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setSubmit]   = useState(false);
  const [error, setError]           = useState('');
  
  // Terms & Conditions Modal State
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const currentStep = STEPS[stepIndex];

  const goToStep = (newIndex) => {
    setDirection(newIndex > stepIndex ? 1 : -1);
    setStepIndex(newIndex);
  };

  // ── Step 1: Request OTP ──────────────────────────────────────────────
  async function handleRequestOtp(e) {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter a valid email address or phone number');
      return;
    }
    setError('');
    setSubmit(true);
    try {
      await api.registerRequestOtp(cleanId);
      goToStep(1);
    } catch (err) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setSubmit(false);
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }
    setError('');
    setSubmit(true);
    try {
      await api.registerVerifyOtp(identifier.trim(), otp);
      goToStep(2);
    } catch (err) {
      setError(err.message || 'Incorrect verification code');
    } finally {
      setSubmit(false);
    }
  }

  // ── Step 3: Password ────────────────────────────────────────────────
  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    goToStep(3);
  }

  // ── Step 4: Name ────────────────────────────────────────────────────
  function handleNameSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full legal name is required');
      return;
    }
    setError('');
    goToStep(4);
  }

  // ── Step 5: Role Selected -> Open Terms Modal ───────────────────────
  function handleSelectRole(roleValue) {
    setSelectedRole(roleValue);
    setTermsModalOpen(true);
  }

  // ── Final Registration Completion via Terms Modal ────────────────────
  async function handleConfirmRegistration() {
    if (!consentChecked || !selectedRole) return;
    setError('');
    setSubmit(true);
    try {
      const result = await api.registerComplete(
        identifier.trim(),
        password,
        fullName.trim(),
        selectedRole,
        'tc_v2026_08_12',
        'pp_v2026_08_12'
      );
      setTermsModalOpen(false);
      completeLogin(result);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setTermsModalOpen(false);
    } finally {
      setSubmit(false);
    }
  }

  const isEmail = identifier.includes('@');

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans relative overflow-hidden">
      {/* Sticky Banner - only on Registration page */}
      <StickyBanner>
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
         
          <span className="text-white/95 text-xs sm:text-sm">
            Phone OTP is currently touching grass while telecom clearance is cooking . Use <strong className="text-white font-bold underline decoration-emerald-300/80 underline-offset-2">Email Verification</strong> for instant green flags & zero delays! 
          </span>
        </div>
      </StickyBanner>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-96 rounded-full bg-primary/10 blur-[100px]" />
        
        <div className="w-full max-w-md relative z-10">
          
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2.5 group mb-2">
              <img src={logo} alt="MT Pocket Logo" className="w-12 h-12 object-contain group-hover:scale-105 transition-transform" />
              <span className="text-2xl font-black tracking-tight text-foreground">
                MT <span className="text-primary">Pocket</span>
              </span>
            </Link>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Direct Peer-to-Peer Financial Platform
            </span>
          </div>

        {/* ── Interactive Progress Stepper ─────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md p-3.5 shadow-sm">
          <div className="flex items-center justify-between relative">
            {/* Background connecting bar */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[2px] bg-border z-0" />
            
            {/* Active connecting bar */}
            <div
              className="absolute top-1/2 left-4 -translate-y-1/2 h-[2px] bg-primary transition-all duration-500 z-0"
              style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100 * 0.9}%` }}
            />

            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isPast = idx < stepIndex;
              const isCurrent = idx === stepIndex;

              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isPast
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-md'
                        : 'bg-muted border border-border text-muted-foreground'
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={15} strokeWidth={2.5} /> : idx + 1}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isCurrent ? 'text-primary' : isPast ? 'text-foreground' : 'text-muted-foreground/60'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Card Body with Animated Transitions ───────────────────────── */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Step Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <motion.div
              key={currentStep.id + '-icon'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm"
            >
              <currentStep.icon size={22} strokeWidth={2.2} />
            </motion.div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {currentStep.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
              {stepIndex === 1
                ? `Enter the 6-digit code sent to ${identifier}`
                : currentStep.subtitle}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-5 overflow-hidden rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-xs font-semibold text-destructive flex items-center gap-2"
              >
                <ShieldAlert size={15} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stepper Forms */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* ── STEP 0: Identifier (Email / Phone) ────────────────────────── */}
              {stepIndex === 0 && (
                <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-identifier" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Email or Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {isEmail ? <Mail size={17} /> : <Smartphone size={17} />}
                      </div>
                      <input
                        id="reg-identifier"
                        type="text"
                        required
                        autoFocus
                        placeholder="Enter email address or mobile number"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      You can add your other contact channel anytime after registration.
                    </span>
                  </div>

                  <PrimaryButton isSubmitting={isSubmitting} label="Send Verification Code" icon={<ArrowRight size={16} />} />

                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-primary hover:underline">
                      Log in here
                    </Link>
                  </p>
                </form>
              )}

              {/* ── STEP 1: 6-Digit OTP ───────────────────────────────────────── */}
              {stepIndex === 1 && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                      Enter 6-Digit Code
                    </label>
                    <input
                      id="reg-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="Enter 6-digit OTP code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-border bg-background py-3.5 text-center text-2xl font-mono font-bold tracking-[0.35em] text-foreground placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  <PrimaryButton isSubmitting={isSubmitting} label="Verify & Continue" icon={<CheckCircle2 size={16} />} />
                  
                  <div className="flex items-center justify-between mt-1">
                    <BackButton onClick={() => { goToStep(0); setOtp(''); }} label="Change Identifier" />
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={isSubmitting}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                </form>
              )}

              {/* ── STEP 2: Password ─────────────────────────────────────────── */}
              {stepIndex === 2 && (
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Create Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Lock size={17} />
                      </div>
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        placeholder="Enter secure password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <PrimaryButton isSubmitting={false} label="Continue" icon={<ArrowRight size={16} />} />
                  <BackButton onClick={() => goToStep(1)} />
                </form>
              )}

              {/* ── STEP 3: Full Name ────────────────────────────────────────── */}
              {stepIndex === 3 && (
                <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <UserIcon size={17} />
                      </div>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        autoFocus
                        placeholder="Enter your full legal name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      This must match your government-issued ID for verification.
                    </span>
                  </div>


                  <PrimaryButton isSubmitting={false} label="Continue to Role Selection" icon={<ArrowRight size={16} />} />
                  <BackButton onClick={() => goToStep(2)} />
                </form>
              )}

              {/* ── STEP 4: Choose Role ──────────────────────────────────────── */}
              {stepIndex === 4 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Select your primary intent (you can change or use both anytime):
                  </p>

                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectRole(opt.value)}
                      className={`text-left rounded-2xl border border-border bg-gradient-to-r p-4 hover:shadow-md transition-all duration-200 cursor-pointer group relative overflow-hidden ${opt.accent}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-bold text-sm text-foreground">
                          <span className="text-xl">{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </div>
                        <ArrowRight size={15} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed pl-8">
                        {opt.hint}
                      </p>
                    </button>
                  ))}

                  <div className="mt-2 text-center">
                    <BackButton onClick={() => goToStep(3)} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Footer Notes */}
        <p className="text-xs text-center mt-5 text-muted-foreground">
          Protected by MT Pocket's P2P Identity &amp; Verification Protocol.
        </p>

      </div>
    </div>

      {/* ── Standard Terms & Legal Consent Modal Popup ────────────────── */}
      <AnimatePresence>
        {termsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-base sm:text-lg">Terms &amp; Legal Consent</h3>
                    <p className="text-xs text-muted-foreground">Please review and confirm to complete your registration</p>
                  </div>
                </div>
                <button
                  onClick={() => setTermsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Scrollable Summary */}
              <div className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles size={14} /> Key Platform Understanding
                  </p>
                  <div className="space-y-2.5">
                    {CONSENT_SUMMARY.map((text, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground leading-relaxed px-1">
                  By clicking <strong className="text-foreground">Accept &amp; Complete Registration</strong>, you agree to our full{' '}
                  <Link to="/terms" target="_blank" className="text-primary font-semibold hover:underline">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" className="text-primary font-semibold hover:underline">
                    Privacy Policy
                  </Link>.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border/80 space-y-4 shrink-0">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <Checkbox
                    checked={consentChecked}
                    onCheckedChange={(v) => setConsentChecked(!!v)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-muted-foreground leading-snug group-hover:text-foreground transition-colors font-medium">
                    I acknowledge that MT Pocket does not hold or handle funds and I agree to the Terms &amp; Conditions and Privacy Policy.
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!consentChecked || isSubmitting}
                    onClick={handleConfirmRegistration}
                    className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-primary/20"
                  >
                    {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    <span>{isSubmitting ? 'Creating Account...' : 'Accept & Complete Registration'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrimaryButton({ isSubmitting, label, icon }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold py-3 hover:bg-primary/95 transition-all duration-200 shadow-md shadow-primary/20 disabled:opacity-60 cursor-pointer"
    >
      {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}

function BackButton({ onClick, label = 'Go Back' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      <ArrowLeft size={13} />
      <span>{label}</span>
    </button>
  );
}
