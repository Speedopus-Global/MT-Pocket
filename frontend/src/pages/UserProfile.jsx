import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2, ShieldCheck, MapPin, CalendarDays, ArrowLeft,
  ShieldAlert, X, UserX,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import LoginPromptModal from '../components/ui/LoginPromptModal';

const ROLE_LABEL = { borrower: 'Borrower', lender: 'Lender', both: 'Borrower & Lender', unset: 'Member' };

const REPORT_REASONS = [
  { value: 'fake_identity',     label: 'Fake identity' },
  { value: 'fraud_attempt',     label: 'Fraud attempt' },
  { value: 'harassment',        label: 'Harassment' },
  { value: 'impersonation',     label: 'Impersonation' },
  { value: 'spam',              label: 'Spam' },
  { value: 'abusive_behaviour', label: 'Abusive behaviour' },
  { value: 'other',             label: 'Other' },
];

export default function UserProfile() {
  const { id } = useParams();
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const isOwnProfile = user && user.id === id;

  useEffect(() => {
    if (!accessToken) { setLoading(false); return; } // login prompt renders instead, below
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    api
      .getPublicProfile(id, accessToken)
      .then((res) => { if (!cancelled) setProfile(res); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, accessToken]);

  const [profilePromptOpen, setProfilePromptOpen] = useState(true);

  if (!accessToken) {
    return (
      <div className="max-w-lg mx-auto py-24 px-4 text-center flex flex-col items-center gap-3">
        <ShieldCheck size={32} className="text-primary" strokeWidth={1.4} />
        <p className="text-sm font-semibold text-foreground">Log in to view this profile</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Profiles, offers, blocking, and reporting are only available to logged-in members.
        </p>
        <Link to="/marketplace" className="mt-1 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={12} /> Back to marketplace
        </Link>
        <LoginPromptModal
          open={profilePromptOpen}
          onClose={() => setProfilePromptOpen(false)}
          message="Please log in or create an account to view this profile."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-lg mx-auto py-24 px-4 text-center flex flex-col items-center gap-3">
        <UserX size={32} className="text-muted-foreground" strokeWidth={1.4} />
        <p className="text-sm font-semibold text-foreground">This profile isn't available</p>
        <p className="text-xs text-muted-foreground">
          The user may not exist, or their account isn't currently active.
        </p>
        <Link to="/marketplace" className="mt-2 text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={12} /> Back to marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={13} /> Back to marketplace
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-7 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName || 'User avatar'}
                className="w-16 h-16 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                {(profile.fullName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-extrabold text-foreground">
                  {profile.fullName || 'Unnamed user'}
                </h1>
                {profile.identityVerified && (
                  <ShieldCheck size={16} className="text-emerald-600" title="Identity verified" />
                )}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                {ROLE_LABEL[profile.role] || 'Member'}
              </p>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              onClick={() => setSafetyOpen(true)}
              title="Report or block"
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <ShieldAlert size={16} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-6 pt-5 border-t border-border/60 text-xs text-muted-foreground">
          {(profile.city || profile.state) && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} /> {[profile.city, profile.state].filter(Boolean).join(', ')}
            </span>
          )}
          {profile.createdAt && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} />
              Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>

        {blocked && (
          <div className="mt-5 rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-xs text-muted-foreground">
            You've blocked this user. Their requests are hidden from your marketplace.
          </div>
        )}

        {!profile.identityVerified && (
          <div className="mt-5 rounded-xl bg-amber-500/5 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
            This user hasn't completed identity verification yet.
          </div>
        )}
      </motion.div>

      {safetyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-destructive" />
                <h3 className="font-bold text-foreground">Report or block</h3>
              </div>
              <button
                onClick={() => setSafetyOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <ProfileSafetyForm
                userId={id}
                userName={profile.fullName || 'this user'}
                accessToken={accessToken}
                onDone={(didBlock) => {
                  setSafetyOpen(false);
                  if (didBlock) setBlocked(true);
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProfileSafetyForm({ userId, userName, accessToken, onDone }) {
  const [mode, setMode]             = useState('report');
  const [reason, setReason]         = useState(REPORT_REASONS[0].value);
  const [details, setDetails]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [done, setDone]             = useState(false);

  const submitReport = async (e) => {
    e.preventDefault();
    if (reason === 'other' && !details.trim()) {
      setError('Please add a few details for "Other"');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.fileReport(
        { reportedUserId: userId, reason, details: details.trim() || undefined, reportContext: 'profile' },
        accessToken,
      );
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not submit report — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBlock = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.blockUser(userId, accessToken);
      onDone(true);
    } catch (err) {
      setError(err.message || 'Could not block user — please try again');
      setSubmitting(false);
    }
  };

  if (!accessToken) {
    return <p className="text-sm text-muted-foreground">Please log in to report or block a user.</p>;
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <ShieldAlert size={28} className="text-emerald-600" />
        <p className="text-sm font-semibold text-foreground">Report submitted</p>
        <p className="text-xs text-muted-foreground">Our team will review it shortly.</p>
        <button onClick={() => onDone(false)} className="mt-2 text-xs font-bold text-primary hover:underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {['report', 'block'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              mode === m ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'report' ? (
        <form onSubmit={submitReport} className="flex flex-col gap-4">
          <div className="rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            Reporting <strong className="text-foreground">{userName}</strong> to MT Pocket's trust & safety team.
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Details {reason === 'other' && '(required)'}
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What happened?"
              maxLength={1000}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-destructive text-destructive-foreground px-4 py-3 rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            Blocking <strong className="text-foreground">{userName}</strong> hides their requests from your
            marketplace and stops them from sending or receiving offers with you.
          </div>
          {error && <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">{error}</div>}
          <button
            type="button"
            onClick={submitBlock}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-destructive text-destructive-foreground px-4 py-3 rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            {submitting ? 'Blocking…' : `Block ${userName}`}
          </button>
        </div>
      )}
    </div>
  );
}