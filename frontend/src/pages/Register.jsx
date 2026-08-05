/**
 * Register.jsx — new-user onboarding
 * -----------------------------------------------------------------------
 * Flow:  phone → otp → password → name → role selection → /
 * ----------------------------------------------------------------------- */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, KeyRound, User as UserIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const STEPS = ['phone', 'otp', 'password', 'name', 'role'];

const ROLE_OPTIONS = [
  {
    value: 'borrower',
    emoji: '🙋',
    label: 'I need to borrow',
    hint: 'Post a request and connect with lenders nearby',
  },
  {
    value: 'lender',
    emoji: '💰',
    label: 'I want to lend',
    hint: 'Browse verified requests and offer your terms',
  },
  {
    value: 'both',
    emoji: '🔄',
    label: 'Both',
    hint: 'Switch between borrowing and lending anytime',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const [step, setStep]             = useState('phone');
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [password, setPassword]     = useState('');
  const [fullName, setFullName]     = useState('');
  const [isSubmitting, setSubmit]   = useState(false);
  const [error, setError]           = useState('');

  // ── Step 1: request OTP ──────────────────────────────────────────────
  async function handleRequestOtp(e) {
    e.preventDefault();
    setError('');
    setSubmit(true);
    try {
      await api.registerRequestOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmit(false);
    }
  }

  // ── Step 2: verify OTP ──────────────────────────────────────────────
  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setSubmit(true);
    try {
      await api.registerVerifyOtp(phone, otp);
      setStep('password');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmit(false);
    }
  }

  // ── Step 3: create password ──────────────────────────────────────────
  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep('name');
  }

  // ── Step 4: name ─────────────────────────────────────────────────────
  function handleNameSubmit(e) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    setError('');
    setStep('role');
  }

  // ── Step 5: pick role → complete registration ────────────────────────
  async function handleSetRole(role) {
    setError('');
    setSubmit(true);
    try {
      const result = await api.registerComplete(phone, password, fullName, role);
      completeLogin(result);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmit(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);
  const totalVisible = STEPS.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">
        
        {/* Logo and Brand Heading */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="MT Pocket Logo" className="w-16 h-16 object-contain mb-2" />
          <span className="text-xl font-bold tracking-tight text-primary">MT Pocket</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalVisible }).map((_, i) => (
            <span
              key={i}
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === stepIndex ? '24px' : '8px',
                height: '8px',
                background: i <= stepIndex ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
              {step === 'phone' && <UserPlus size={22} />}
              {step === 'otp' && <ShieldCheck size={22} />}
              {step === 'password' && <KeyRound size={22} />}
              {step === 'name' && <UserIcon size={22} />}
              {step === 'role' && <CheckCircle2 size={22} />}
            </span>

            <h1 className="text-xl font-semibold text-foreground">
              {step === 'phone' && 'Create your account'}
              {step === 'otp' && 'Verify your phone'}
              {step === 'password' && 'Choose a password'}
              {step === 'name' && 'Tell us your name'}
              {step === 'role' && 'Select your role'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 'phone' && "Enter your mobile number to get started."}
              {step === 'otp' && `Code sent to ${phone}`}
              {step === 'password' && 'Keep your account secure.'}
              {step === 'name' && 'Use your real name for verification.'}
              {step === 'role' && 'How will you use MT Pocket?'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Phone Form */}
          {step === 'phone' && (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-phone" className="text-sm font-medium text-foreground">Mobile number</label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>
              <PrimaryButton isSubmitting={isSubmitting} label="Send verification code" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </form>
          )}

          {/* OTP Verification Form */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-otp" className="text-sm font-medium text-foreground">6-digit code</label>
                <input
                  id="reg-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.125rem' }}
                  className="form-input"
                />
              </div>
              <PrimaryButton isSubmitting={isSubmitting} label="Verify & continue" />
              <BackButton onClick={() => { setStep('phone'); setOtp(''); }} />
            </form>
          )}

          {/* Create Password Form */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-password" className="text-sm font-medium text-foreground">Create password</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              <PrimaryButton isSubmitting={false} label="Continue" />
            </form>
          )}

          {/* Enter Name Form */}
          {step === 'name' && (
            <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-name" className="text-sm font-medium text-foreground">Full name</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Enter Your username"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                />
              </div>
              <PrimaryButton isSubmitting={false} label="Continue" />
            </form>
          )}

          {/* Choose Role */}
          {step === 'role' && (
            <div className="flex flex-col gap-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={isSubmitting}
                  onClick={() => handleSetRole(opt.value)}
                  className="text-left rounded-xl border border-border bg-background px-4 py-3 hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 font-medium mb-0.5 text-foreground">
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                    {isSubmitting && <Loader2 size={14} className="animate-spin ml-auto text-primary" />}
                  </div>
                  <div className="text-sm text-muted-foreground">{opt.hint}</div>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Footer notes */}
        {step === 'phone' && (
          <p className="text-xs text-center mt-4 text-muted-foreground">
            By continuing, you agree to MT Pocket's{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        )}

      </div>
    </div>
  );
}

function PrimaryButton({ isSubmitting, label }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-medium py-2.5 hover:bg-primary/90 transition-all duration-200 disabled:opacity-60"
    >
      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
      {label}
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
    >
      <ArrowLeft size={14} />
      Go back
    </button>
  );
}
