import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import LoginPromptModal from '../components/ui/LoginPromptModal';
import {
  Search, Loader2, Tag, MapPin, Clock, Percent, Handshake,
  X, ArrowLeft, Coins, ChevronLeft, ChevronRight, Inbox, ShieldAlert, ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const LOAN_CATEGORIES = [
  { value: '',           label: 'All',       emoji: '✨' },
  { value: 'medical',    label: 'Medical',   emoji: '🏥' },
  { value: 'education',  label: 'Education', emoji: '📚' },
  { value: 'business',   label: 'Business',  emoji: '💼' },
  { value: 'personal',   label: 'Personal',  emoji: '🏠' },
  { value: 'other',      label: 'Other',     emoji: '💡' },
];

const PAGE_SIZE = 12;

const gridVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};

export default function Marketplace() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!accessToken;
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
  const [loginPrompt, setLoginPrompt] = useState(null); // message string or null

  // Loan request IDs this lender has already sent an offer on — drives the
  // "Offer sent" state on cards. Seeded from every offer they've ever sent
  // (not just this session) so it's correct even after a page refresh or
  // when paging through results that were fetched before this mount.
  const [sentOfferIds, setSentOfferIds] = useState(new Set());
  const [sentOfferIdsLoading, setSentOfferIdsLoading] = useState(false);

  // Gated entry points — guests get a login/register prompt instead of the
  // real action. Loan-card browsing itself stays public (no gating here);
  // only viewing a specific person's profile, offering, blocking, and
  // reporting require an account (enforced server-side too — see
  // user.controller.ts's GET /:id/public, which now requires JwtAccessGuard).
  const requestOffer = (loan) => {
    if (!isLoggedIn) { setLoginPrompt('Please log in as a lender to send an offer.'); return; }
    setOfferLoan(loan);
  };
  const requestSafety = (loan) => {
    if (!isLoggedIn) { setLoginPrompt('Please log in to report or block a user.'); return; }
    setSafetyLoan(loan);
  };
  const requestProfile = (borrowerId) => {
    if (!isLoggedIn) { setLoginPrompt('Please log in to view this user\u2019s profile.'); return; }
    navigate(`/users/${borrowerId}`);
  };

  // Fetch this user's block list once, so we can hide blocked borrowers'
  // requests client-side too (search() already filters server-side when a
  // token is sent — this is just a belt-and-suspenders client mirror).
  useEffect(() => {
    if (!accessToken) { setBlockedIds([]); return; }
    api.getMyBlockedUserIds(accessToken).then(setBlockedIds).catch(() => {});
  }, [accessToken]);

  // Seed sentOfferIds from every offer this lender has ever sent, so cards
  // show "Offer sent" correctly even on a fresh page load — not just for
  // offers sent in the current browser session.
  useEffect(() => {
    if (!isLender || !accessToken) { setSentOfferIds(new Set()); return; }
    setSentOfferIdsLoading(true);
    api.getMyOffersSent(accessToken)
      .then((offers) => setSentOfferIds(new Set(offers.map((o) => o.loanRequestId))))
      .catch(() => {})
      .finally(() => setSentOfferIdsLoading(false));
  }, [isLender, accessToken]);

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

  // Called by OfferForm right after a successful send — flips the card to
  // "Offer sent" immediately, without waiting for a refetch of anything.
  const onOfferSent = (loanRequestId) => {
    setSentOfferIds((prev) => new Set(prev).add(loanRequestId));
    setOfferLoan(null);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-[#FDF6ED]/20">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={user ? '/dashboard' : '/'}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight text-foreground truncate">Marketplace</h1>
              <p className="text-[11px] text-muted-foreground">Open loan requests from verified borrowers</p>
            </div>
          </div>
          {!user && (
            <Link
              to="/login"
              className="shrink-0 text-sm font-bold text-primary-foreground bg-primary px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
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
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:bg-primary/90 transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {LOAN_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                category === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* ── RESULTS ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground rounded-2xl border border-dashed border-border">
            <Inbox size={30} strokeWidth={1.4} />
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
                  isLoggedIn={isLoggedIn}
                  isLender={isLender}
                  isOwnRequest={user && loan.borrowerId?._id === user.id}
                  hasSentOffer={sentOfferIds.has(loan._id)}
                  sentOfferIdsLoading={sentOfferIdsLoading}
                  onOffer={() => requestOffer(loan)}
                  onSafety={() => requestSafety(loan)}
                  onProfile={() => requestProfile(loan.borrowerId?._id)}
                />
              ))}
            </motion.div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  disabled={page === 1}
                  onClick={() => goPage(page - 1)}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
                <button
                  disabled={page >= pages}
                  onClick={() => goPage(page + 1)}
                  className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Handshake size={18} className="text-primary" />
                  <h3 className="font-bold text-foreground">Send Offer</h3>
                </div>
                <button
                  onClick={() => setOfferLoan(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <OfferForm
                  loan={offerLoan}
                  accessToken={accessToken}
                  onSent={onOfferSent}
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-destructive" />
                  <h3 className="font-bold text-foreground">Report or block</h3>
                </div>
                <button
                  onClick={() => setSafetyLoan(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

      <LoginPromptModal
        open={!!loginPrompt}
        message={loginPrompt}
        onClose={() => setLoginPrompt(null)}
      />
    </div>
  );
}

// ── Loan card ────────────────────────────────────────────────────────────
function LoanCard({ loan, isLoggedIn, isLender, isOwnRequest, hasSentOffer, sentOfferIdsLoading, onOffer, onSafety, onProfile }) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Coins size={17} />
            </div>
            <p className="text-lg font-extrabold text-foreground">₹{Number(loan.amount).toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Tag size={9} /> {loan.category}
            </span>
            {/* Shown even to guests — clicking it opens the login prompt
                rather than being hidden, so the feature is discoverable. */}
            {!isOwnRequest && (
              <button
                onClick={onSafety}
                title="Report or block"
                className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <ShieldAlert size={13} />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">
          {loan.description}
        </p>

        {loan.borrowerId?._id && (
          <button
            type="button"
            onClick={onProfile}
            className="flex items-center gap-2 mt-3 group w-fit text-left"
          >
            {loan.borrowerId.avatarUrl ? (
              <img
                src={loan.borrowerId.avatarUrl}
                alt={loan.borrowerId.fullName || 'Borrower avatar'}
                className="w-6 h-6 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                {(loan.borrowerId.fullName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              {loan.borrowerId.fullName || 'Unnamed borrower'}
            </span>
            {loan.borrowerId.identityVerified && (
              <ShieldCheck size={12} className="text-emerald-600" />
            )}
          </button>
        )}

        <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-muted-foreground">
          {(loan.city || loan.state) && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} /> {[loan.city, loan.state].filter(Boolean).join(', ')}
            </span>
          )}
          {loan.durationDays && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} /> {loan.durationDays}d
            </span>
          )}
          {loan.interestRateHint != null && (
            <span className="inline-flex items-center gap-1">
              <Percent size={11} /> {loan.interestRateHint}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/60">
        {!isLoggedIn ? (
          <button
            onClick={onOffer}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold border border-border text-foreground px-4 py-2.5 rounded-xl hover:bg-muted transition-colors"
          >
            <Handshake size={15} /> Log in to send an offer
          </button>
        ) : isLender ? (
          hasSentOffer ? (
            <div className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
              <CheckCircle2 size={15} /> Offer sent
            </div>
          ) : (
            <button
              onClick={onOffer}
              disabled={sentOfferIdsLoading}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <Handshake size={15} /> Send offer
            </button>
          )
        ) : (
          <p className="text-[11px] text-muted-foreground text-center">Only lenders can send offers</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Offer form ───────────────────────────────────────────────────────────
function OfferForm({ loan, accessToken, onSent }) {
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
      onSent(loan._id);
    } catch (err) {
      setError(err.message || 'Could not send offer — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        Offering on a <strong className="text-foreground">₹{Number(loan.amount).toLocaleString()}</strong> {loan.category} request.
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
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {error && (
        <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
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
        <ShieldAlert size={28} className="text-emerald-600" />
        <p className="text-sm font-semibold text-foreground">Report submitted</p>
        <p className="text-xs text-muted-foreground">Our team will review it shortly.</p>
        <button
          onClick={() => onDone()}
          className="mt-2 text-xs font-bold text-primary hover:underline"
        >
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
            Reporting <strong className="text-foreground">{borrowerName}</strong> to MT Pocket's trust & safety team.
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && (
            <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
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
            Blocking <strong className="text-foreground">{borrowerName}</strong> hides their requests from your
            marketplace and stops them from receiving offers from you. You can unblock them later from settings.
          </div>
          {error && (
            <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={submitBlock}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-destructive text-destructive-foreground px-4 py-3 rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            {submitting ? 'Blocking…' : `Block ${borrowerName}`}
          </button>
        </div>
      )}
    </div>
  );
}