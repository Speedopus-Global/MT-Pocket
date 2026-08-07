import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Search, Loader2, MapPin, Clock, Percent, Handshake,
  X, ArrowLeft, Coins, ChevronLeft, ChevronRight, Inbox, ShieldAlert,
  BadgeCheck,
} from 'lucide-react';

const LOAN_CATEGORIES = [
  { value: '',           label: 'All' },
  { value: 'medical',    label: 'Medical' },
  { value: 'education',  label: 'Education' },
  { value: 'business',   label: 'Business' },
  { value: 'personal',   label: 'Personal' },
  { value: 'other',      label: 'Other' },
];

const PAGE_SIZE = 12;

const gridVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

export default function Marketplace() {
  const { user, accessToken } = useAuth();
  const isLender = user?.role === 'lender' || user?.role === 'both';

  const [keyword, setKeyword]   = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage]         = useState(1);
  const [results, setResults]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [offerLoan, setOfferLoan] = useState(null); // loan object or null
  const [blockedIds, setBlockedIds] = useState([]); // borrower ids this user has blocked
  const [safetyLoan, setSafetyLoan] = useState(null); // loan being reported/blocked from

  // Fetch this user's block list once, so we can hide blocked borrowers'
  // requests client-side. (See loan-requests.service.PATCH.md for why this
  // isn't also enforced server-side yet — search() is a public route.)
  useEffect(() => {
    if (!accessToken) { setBlockedIds([]); return; }
    api.getMyBlockedUserIds(accessToken).then(setBlockedIds).catch(() => {});
  }, [accessToken]);

  const visibleResults = results.filter((loan) => !blockedIds.includes(loan.borrowerId?._id));

  const load = useCallback(async (p = page, kw = keyword, cat = category) => {
    setLoading(true);
    try {
      const res = await api.searchLoanRequests({
        keyword: kw || undefined,
        category: cat || undefined,
        page: p,
        limit: PAGE_SIZE,
      });
      setResults(res.results ?? res.data ?? res.items ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, category]);

  // Single mount/category effect — this already fires on first render,
  // so a separate `[]` mount effect was firing a duplicate initial search.
  useEffect(() => { load(1, keyword, category); setPage(1); }, [category]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, keyword, category);
  };

  const goPage = (p) => { setPage(p); load(p); };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={user ? '/dashboard' : '/'}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">Marketplace</h1>
              <p className="text-[11px] text-muted-foreground">Open loan requests from verified borrowers</p>
            </div>
          </div>
          {!user && (
            <Link
              to="/login"
              className="shrink-0 text-sm font-semibold text-primary-foreground bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Log in to lend
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* ── SEARCH + FILTERS ───────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search description, city…"
              className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:bg-primary/90 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1.5 flex-wrap border-b border-border pb-5">
          {LOAN_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                category === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground rounded-xl border border-dashed border-border">
            <Inbox size={28} strokeWidth={1.3} />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">No loan requests found</p>
              <p className="text-xs mt-0.5">Try a different keyword or category.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground font-medium">
              {total} open request{total !== 1 ? 's' : ''}
            </p>
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {visibleResults.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  canOffer={isLender}
                  isOwnRequest={user && loan.borrowerId?._id === user.id}
                  onOffer={() => setOfferLoan(loan)}
                  onSafety={() => setSafetyLoan(loan)}
                />
              ))}
            </motion.div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  disabled={page === 1}
                  onClick={() => goPage(page - 1)}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
                <button
                  disabled={page >= pages}
                  onClick={() => goPage(page + 1)}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── OFFER MODAL ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {offerLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Handshake size={17} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Send offer</h3>
                </div>
                <button
                  onClick={() => setOfferLoan(null)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <OfferForm
                  loan={offerLoan}
                  accessToken={accessToken}
                  onDone={() => setOfferLoan(null)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SAFETY MODAL (report / block) ─────────────────────────────────── */}
      <AnimatePresence>
        {safetyLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={17} className="text-destructive" />
                  <h3 className="font-semibold text-foreground">Report or block</h3>
                </div>
                <button
                  onClick={() => setSafetyLoan(null)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <SafetyForm
                  loan={safetyLoan}
                  accessToken={accessToken}
                  onDone={(blockedId) => {
                    setSafetyLoan(null);
                    if (blockedId) setBlockedIds((ids) => [...ids, blockedId]);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────
function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';
}

function Avatar({ src, name, size = 36 }) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size };

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        style={dim}
        onError={() => setFailed(true)}
        className="rounded-full object-cover border border-border shrink-0"
      />
    );
  }
  return (
    <div
      style={dim}
      className="rounded-full bg-muted text-foreground/70 border border-border flex items-center justify-center text-xs font-semibold shrink-0"
    >
      {initials(name)}
    </div>
  );
}

// ── Loan card ────────────────────────────────────────────────────────────
function LoanCard({ loan, canOffer, isOwnRequest, onOffer, onSafety }) {
  const borrower = loan.borrowerId || {};

  return (
    <motion.div
      variants={cardVariants}
      className="rounded-xl border border-border bg-card flex flex-col justify-between transition-colors duration-200 hover:border-foreground/25"
    >
      {/* Borrower row */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={borrower.avatarUrl} name={borrower.fullName} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {borrower.fullName || 'Borrower'}
              </p>
              {borrower.identityVerified && (
                <BadgeCheck size={13} className="text-primary shrink-0" />
              )}
            </div>
            {(borrower.city || borrower.state) && (
              <p className="text-[11px] text-muted-foreground truncate">
                {[borrower.city, borrower.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
        {!isOwnRequest && (
          <button
            onClick={onSafety}
            title="Report or block"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
          >
            <ShieldAlert size={14} />
          </button>
        )}
      </div>

      {/* Amount + category */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-muted-foreground" />
            <p className="text-xl font-semibold text-foreground tabular-nums">
              ₹{Number(loan.amount).toLocaleString('en-IN')}
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border px-2 py-1 rounded-md">
            {loan.category}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">
          {loan.description}
        </p>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 mt-4 text-[11px] text-muted-foreground">
        {(loan.city || loan.state) && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} /> {[loan.city, loan.state].filter(Boolean).join(', ')}
          </span>
        )}
        {loan.durationDays && (
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {loan.durationDays} days
          </span>
        )}
        {loan.interestRateHint != null && (
          <span className="inline-flex items-center gap-1">
            <Percent size={11} /> {loan.interestRateHint}%
          </span>
        )}
      </div>

      <div className="mt-5 px-5 pb-5 pt-4 border-t border-border/70">
        {canOffer ? (
          <button
            onClick={onOffer}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Handshake size={15} /> Send offer
          </button>
        ) : (
          <p className="text-[11px] text-muted-foreground text-center">Log in as a lender to send an offer</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Offer form ───────────────────────────────────────────────────────────
function OfferForm({ loan, accessToken, onDone }) {
  const [message, setMessage]           = useState('');
  const [offeredRate, setOfferedRate]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.sendOffer(
        {
          loanRequestId: loan._id,
          message: message.trim() || undefined,
          offeredRate: offeredRate ? Number(offeredRate) : undefined,
        },
        accessToken,
      );
      onDone();
    } catch (err) {
      setError(err.message || 'Could not send offer — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 text-xs text-muted-foreground">
        Offering on a <strong className="text-foreground">₹{Number(loan.amount).toLocaleString('en-IN')}</strong> {loan.category} request.
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
          Offered rate (%)
        </label>
        <input
          type="number" min="0" max="100" step="0.1"
          value={offeredRate}
          onChange={(e) => setOfferedRate(e.target.value)}
          placeholder="e.g. 10"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
          Message
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself, propose terms…"
          maxLength={1000}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
        />
      </div>
      {error && (
        <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Handshake size={14} />}
        {submitting ? 'Sending…' : 'Send offer'}
      </button>
    </form>
  );
}

// ── Safety form (report / block a borrower) ────────────────────────────────
const REPORT_REASONS = [
  { value: 'fake_identity',     label: 'Fake identity' },
  { value: 'fraud_attempt',     label: 'Fraud attempt' },
  { value: 'harassment',        label: 'Harassment' },
  { value: 'impersonation',     label: 'Impersonation' },
  { value: 'spam',              label: 'Spam' },
  { value: 'abusive_behaviour', label: 'Abusive behaviour' },
  { value: 'other',             label: 'Other' },
];

function SafetyForm({ loan, accessToken, onDone }) {
  const [mode, setMode]           = useState('report'); // 'report' | 'block'
  const [reason, setReason]       = useState(REPORT_REASONS[0].value);
  const [details, setDetails]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState(false);

  const borrowerId   = loan.borrowerId?._id;
  const borrowerName = loan.borrowerId?.fullName || 'this user';

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
        { reportedUserId: borrowerId, reason, details: details.trim() || undefined, reportContext: 'marketplace' },
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
      await api.blockUser(borrowerId, accessToken);
      onDone(borrowerId); // tells Marketplace to hide this borrower's cards immediately
    } catch (err) {
      setError(err.message || 'Could not block user — please try again');
      setSubmitting(false);
    }
  };

  if (!accessToken) {
    return (
      <p className="text-sm text-muted-foreground">
        Please log in to report or block a user.
      </p>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <ShieldAlert size={26} className="text-emerald-600" />
        <p className="text-sm font-semibold text-foreground">Report submitted</p>
        <p className="text-xs text-muted-foreground">Our team will review it shortly.</p>
        <button
          onClick={() => onDone()}
          className="mt-2 text-xs font-semibold text-primary hover:underline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border w-fit">
        {['report', 'block'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              mode === m ? 'bg-card text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'report' ? (
        <form onSubmit={submitReport} className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 text-xs text-muted-foreground">
            Reporting <strong className="text-foreground">{borrowerName}</strong> to MT Pocket's trust & safety team.
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
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
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
            />
          </div>
          {error && (
            <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-destructive text-destructive-foreground px-4 py-3 rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted/40 border border-border px-3 py-2.5 text-xs text-muted-foreground">
            Blocking <strong className="text-foreground">{borrowerName}</strong> hides their requests from your
            marketplace and stops them from receiving offers from you. You can unblock them later from settings.
          </div>
          {error && (
            <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={submitBlock}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold bg-destructive text-destructive-foreground px-4 py-3 rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            {submitting ? 'Blocking…' : `Block ${borrowerName}`}
          </button>
        </div>
      )}
    </div>
  );
}