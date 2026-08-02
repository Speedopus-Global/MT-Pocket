/**
 * Login.jsx — standard login with logo, toggle password vs OTP login,
 * forgot password reset wizard.
 * ----------------------------------------------------------------------- */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, ArrowLeft, KeyRound, Lock, Smartphone } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const { completeLogin } = useAuth();

  const [loginMode, setLoginMode]       = useState('password'); // 'password' | 'otp'
  const [identifier, setIdentifier]     = useState(''); // phone or email
  const [password, setPassword]         = useState('');
  
  // OTP login states
  const [otpStep, setOtpStep]           = useState('request'); // 'request' | 'verify'
  const [otp, setOtp]                   = useState('');

  // Forgot password states
  const [isForgot, setIsForgot]         = useState(false);
  const [forgotStep, setForgotStep]     = useState('request'); // 'request' | 'reset'
  const [forgotOtp, setForgotOtp]       = useState('');
  const [newPassword, setNewPassword]   = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  const resetAllStates = () => {
    setError('');
    setSuccess('');
    setOtp('');
    setOtpStep('request');
    setPassword('');
    setForgotStep('request');
    setForgotOtp('');
    setNewPassword('');
  };

  // ── Password Login ──────────────────────────────────────────────────
  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await api.loginPassword(identifier, password);
      completeLogin(result);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── OTP Login: Request Code ──────────────────────────────────────────
  async function handleRequestLoginOtp(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.loginOtpRequest(identifier);
      setOtpStep('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── OTP Login: Verify Code ───────────────────────────────────────────
  async function handleVerifyLoginOtp(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await api.loginOtpVerify(identifier, otp);
      completeLogin(result);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Forgot Password: Request Code ────────────────────────────────────
  async function handleRequestForgotOtp(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await api.forgotPasswordRequest(identifier);
      setForgotStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Forgot Password: Reset ───────────────────────────────────────────
  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.forgotPasswordReset(identifier, forgotOtp, newPassword);
      setSuccess('Password updated successfully! Please log in.');
      setIsForgot(false);
      setLoginMode('password');
      resetAllStates();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm">

        {/* Logo and Brand Heading */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="MT Pocket Logo" className="w-16 h-16 object-contain mb-2" />
          <span className="text-xl font-bold tracking-tight text-primary">MT Pocket</span>
        </div>

        {/* Card wrapper */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
              {isForgot ? <Lock size={22} /> : loginMode === 'password' ? <KeyRound size={22} /> : <Smartphone size={22} />}
            </span>
            <h1 className="text-xl font-semibold text-foreground">
              {isForgot 
                ? (forgotStep === 'request' ? 'Reset password' : 'Create new password')
                : (loginMode === 'password' ? 'Log in to MT Pocket' : 'Login with OTP')
              }
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isForgot
                ? (forgotStep === 'request' ? 'We will send a code to verify ownership.' : 'Enter the code and set a new password.')
                : (loginMode === 'password' ? 'Enter your details below to log in.' : (otpStep === 'request' ? 'Use a secure code sent to your phone/email.' : `Sent to ${identifier}`))
              }
            </p>
          </div>

          {/* Alert messages */}
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-600">
              {success}
            </div>
          )}

          {/* Selector tab (only when not in Forgot Password flow) */}
          {!isForgot && otpStep === 'request' && (
            <div className="flex rounded-lg bg-muted p-1 mb-6 text-sm">
              <button
                type="button"
                onClick={() => { setLoginMode('password'); resetAllStates(); }}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${loginMode === 'password' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('otp'); resetAllStates(); }}
                className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${loginMode === 'otp' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                OTP Login
              </button>
            </div>
          )}

          {/* ────────────────── FLOWS ────────────────── */}

          {/* A. Forgot Password Flow */}
          {isForgot && (
            <div className="flex flex-col gap-4">
              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestForgotOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="forgot-identifier" className="text-sm font-medium text-foreground">Phone or Email</label>
                    <input
                      id="forgot-identifier"
                      type="text"
                      required
                      placeholder="+919876543210 or email@domain.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <PrimaryButton isSubmitting={isSubmitting} label="Request code" />
                  <button
                    type="button"
                    onClick={() => { setIsForgot(false); resetAllStates(); }}
                    className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-2"
                  >
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="forgot-otp" className="text-sm font-medium text-foreground">6-digit reset code</label>
                    <input
                      id="forgot-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.125rem' }}
                      className="form-input"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="forgot-new-password" className="text-sm font-medium text-foreground">Create new password</label>
                    <input
                      id="forgot-new-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <PrimaryButton isSubmitting={isSubmitting} label="Reset Password" />
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-2"
                  >
                    <ArrowLeft size={14} /> Request new code
                  </button>
                </form>
              )}
            </div>
          )}

          {/* B. Password Login Flow */}
          {!isForgot && loginMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-identifier" className="text-sm font-medium text-foreground">Phone or Email</label>
                <input
                  id="login-identifier"
                  type="text"
                  required
                  placeholder="+919876543210 or email@domain.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() => { setIsForgot(true); setError(''); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              <PrimaryButton isSubmitting={isSubmitting} label="Log in" />
              
              <p className="text-center text-sm text-muted-foreground mt-2">
                New here?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            </form>
          )}

          {/* C. OTP Login Flow */}
          {!isForgot && loginMode === 'otp' && (
            <div className="flex flex-col gap-4">
              {otpStep === 'request' ? (
                <form onSubmit={handleRequestLoginOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="otp-identifier" className="text-sm font-medium text-foreground">Phone or Email</label>
                    <input
                      id="otp-identifier"
                      type="text"
                      required
                      placeholder="+919876543210 or email@domain.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <PrimaryButton isSubmitting={isSubmitting} label="Send code" />
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    New here?{' '}
                    <Link to="/register" className="font-medium text-primary hover:underline">
                      Create an account
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyLoginOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-otp" className="text-sm font-medium text-foreground">6-digit code</label>
                    <input
                      id="login-otp"
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
                  <PrimaryButton isSubmitting={isSubmitting} label="Verify & log in" />
                  <button
                    type="button"
                    onClick={() => setOtpStep('request')}
                    className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-2"
                  >
                    <ArrowLeft size={14} /> Send new code
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

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