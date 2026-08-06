import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Search, Loader2, Tag, MapPin, Clock, Percent, Handshake,
  X, ArrowLeft, Coins, ChevronLeft, ChevronRight, Inbox,
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
  const isLender = user?.role === 'lender' || user?.role === 'both';

  const [keyword, setKeyword]   = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage]         = useState(1);
  const [results, setResults]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [offerLoan, setOfferLoan] = useState(null); // loan object or null

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

  useEffect(() => { load(1, keyword, category); setPage(1); }, [category]); // eslint-disable-line
  useEffect(() => { load(1); }, []); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, keyword, category);
  };

  const goPage = (p) => { setPage(p); load(p); };

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
        ) : results.length === 0 ? (
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
              {results.map((loan) => (
                <LoanCard
                  key={loan._id}
                  loan={loan}
                  canOffer={isLender}
                  onOffer={() => setOfferLoan(loan)}
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
                  onDone={() => setOfferLoan(null)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Loan card ────────────────────────────────────────────────────────────
function LoanCard({ loan, canOffer, onOffer }) {
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag size={9} /> {loan.category}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">
          {loan.description}
        </p>

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
        {canOffer ? (
          <button
            onClick={onOffer}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
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