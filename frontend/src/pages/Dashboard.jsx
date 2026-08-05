import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Fingerprint,
  PlusCircle,
  ArrowUpRight,
  Coins,
  Handshake,
  Info,
  AlertTriangle,
  UploadCloud,
  Loader2,
} from 'lucide-react';

const DOCUMENT_OPTIONS = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving Licence' },
];

export default function Dashboard() {
  const { user, accessToken, updateUser } = useAuth();

  if (!user) return null;

  const isLender = user.role === 'lender' || user.role === 'both';
  const isBorrower = user.role === 'borrower' || user.role === 'both';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      className="flex-1 flex flex-col space-y-8 min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >

      {/* Interactive Title Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <motion.h1
          className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-600 to-primary/80"
          initial={{ backgroundPosition: '0% 50%' }}
          animate={{ backgroundPosition: '100% 50%' }}
          style={{ backgroundSize: '200% auto' }}
          transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse' }}
        >
          Welcome back, {user.fullName || 'Member'}!
        </motion.h1>
        <p className="text-muted-foreground text-sm font-medium">
          Here is your MT Pocket peer-to-peer trust dashboard and metrics overview.
        </p>
      </motion.div>

      {/* Spaced out Card: Trust score + badges */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between flex-1 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div>
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-primary h-6 w-6" />
              <h2 className="font-bold text-lg text-foreground tracking-tight">Profile Verifications Status</h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold tracking-wider uppercase">
              Trust Score Badges
            </span>
          </div>

          {/* Glowing Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">

            {/* Phone Badge */}
            <div className="relative group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]">
              {/* Static Status Badge */}
              <span className="absolute top-4 right-4 text-[9px] font-bold tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                Verified
              </span>

              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Phone Indicator</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.phone}</p>
                </div>
              </div>
            </div>

            {/* Email Badge */}
            <div className={`relative group rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
              user.emailVerified
                ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]'
                : 'border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40 hover:bg-amber-500/[0.04]'
            }`}>
              {/* Static Status Badge */}
              <span className={`absolute top-4 right-4 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${
                user.emailVerified
                  ? 'text-emerald-600 bg-emerald-500/10'
                  : 'text-amber-600 bg-amber-500/10'
              }`}>
                {user.emailVerified ? 'Verified' : 'Pending'}
              </span>

              <div className="flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                  user.emailVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Email Indicator</h4>
                  {user.email ? (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.email}</p>
                  ) : (
                    <Link to="/dashboard/profile" className="text-[11px] text-primary hover:underline block font-semibold mt-1">
                      Set Email
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Identity Badge — now with real upload/resubmit flow */}
            <IdentityBadge user={user} accessToken={accessToken} updateUser={updateUser} />

          </div>
        </div>
      </motion.div>

      {/* Grid Expansion (occupying full-height card segments) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

        {/* Borrower Section */}
        {isBorrower && (
          <div className="group rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
                <Coins size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">Borrow Funds</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Post borrowing request listings, configure interest payback rates, matching periods, and request funds from nearby lenders.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <button
                onClick={() => alert('Borrowing request submissions are coming in Phase 3!')}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-emerald-600 transition-colors"
              >
                Create loan request <PlusCircle size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Lender Section */}
        {isLender && (
          <div className="group rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#A1BC98]/20 text-primary flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
                <Handshake size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">Active Offers</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Scan active loan demands in your city, analyze trust metrics, offer custom deals, and coordinate face-to-face repayment contracts.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-emerald-600 transition-colors"
              >
                Browse marketplace <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        )}

      </motion.div>

      {/* Advisory Message */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
            <Info size={16} />
          </span>
          <div>
            <h4 className="font-bold text-foreground text-sm">Security Advisory Notice</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Always negotiate loan terms transparently within the application. MT Pocket handles connection, trust metrics, and matching logic. Remember to verify each other's identity metrics on-site during deal finalize.
            </p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}

// ── Identity badge + inline upload/resubmit form ──────────────────────────
function IdentityBadge({ user, accessToken, updateUser }) {
  const status = user.idDocumentStatus || 'none'; // 'none' | 'pending' | 'approved' | 'rejected'
  const [formOpen, setFormOpen] = useState(false);

  const isApproved = user.identityVerified;
  const isPending = !isApproved && status === 'pending';
  const isRejected = !isApproved && status === 'rejected';

  const badgeLabel = isApproved ? 'Verified' : isPending ? 'Under Review' : isRejected ? 'Rejected' : 'Not Started';
  const badgeColorClass = isApproved
    ? 'text-emerald-600 bg-emerald-500/10'
    : isRejected
      ? 'text-destructive bg-destructive/10'
      : isPending
        ? 'text-amber-600 bg-amber-500/10'
        : 'text-muted-foreground bg-muted';

  const borderColorClass = isApproved
    ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]'
    : isRejected
      ? 'border-destructive/20 bg-destructive/[0.02]'
      : 'border-border bg-muted/40 hover:border-border/80';

  return (
    <div className={`relative group rounded-2xl border p-5 shadow-sm transition-all duration-300 ${borderColorClass}`}>
      <span className={`absolute top-4 right-4 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${badgeColorClass}`}>
        {badgeLabel}
      </span>

      <div className="flex flex-col gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
          isApproved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
        }`}>
          <Fingerprint size={20} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Identity Verification</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isApproved ? 'KYC Complete' : isPending ? 'Document submitted — awaiting admin review' : 'KYC Pending'}
          </p>

          {isRejected && user.idDocumentRejectionReason && (
            <p className="text-[11px] text-destructive mt-2 flex items-start gap-1.5">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>{user.idDocumentRejectionReason}</span>
            </p>
          )}

          {!isApproved && !isPending && (
            <button
              onClick={() => setFormOpen((v) => !v)}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
            >
              <UploadCloud size={13} />
              {isRejected ? 'Resubmit document' : 'Verify identity'}
            </button>
          )}
        </div>
      </div>

      {formOpen && !isApproved && !isPending && (
        <IdentityUploadForm
          accessToken={accessToken}
          onSubmitted={(newStatus) => {
            updateUser({ idDocumentStatus: newStatus, idDocumentRejectionReason: null });
            setFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

function IdentityUploadForm({ accessToken, onSubmitted }) {
  const [documentType, setDocumentType] = useState(DOCUMENT_OPTIONS[0].value);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await api.uploadDocument({ file, documentType }, accessToken);
      onSubmitted(result.idDocumentStatus);
    } catch (err) {
      setError(err.message || 'Upload failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
      <select
        value={documentType}
        onChange={(e) => setDocumentType(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {DOCUMENT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-[11px] text-muted-foreground file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
      />

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {submitting ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
        {submitting ? 'Uploading…' : 'Submit for review'}
      </button>
    </form>
  );
}