import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import LoginPromptModal from '../components/ui/LoginPromptModal';
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Loader2,
  Tag,
  MapPin,
  Clock,
  Percent,
  Handshake,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Inbox,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  GraduationCap,
  Briefcase,
  User,
  Lightbulb,
  LogIn,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

const LOAN_CATEGORIES = [
  { value: 'medical', label: 'Medical', icon: Stethoscope },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'business', label: 'Business', icon: Briefcase },
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'other', label: 'Other', icon: Lightbulb },
];

const BASE_SEARCH_SUGGESTIONS = [
  'Medical Emergency',
  'Higher Education',
  'Small Business Expansion',
  'Personal Loan',
  'Working Capital',
  'Student Fees',
];

const PAGE_SIZE = 12;
const AMOUNT_MIN = 0;
const AMOUNT_MAX = 1000000;
const AMOUNT_STEP = 5000;

export default function Marketplace() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!accessToken;
  const isLender = user?.role === 'lender' || user?.role === 'both';

  const [keyword, setKeyword] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [amountRange, setAmountRange] = useState([AMOUNT_MIN, AMOUNT_MAX]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offerLoan, setOfferLoan] = useState(null);
  const [blockedIds, setBlockedIds] = useState([]);
  const [safetyLoan, setSafetyLoan] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(null);

  const [sentOfferIds, setSentOfferIds] = useState(new Set());
  const [sentOfferIdsLoading, setSentOfferIdsLoading] = useState(false);

  const activeFilterCount =
    selectedCategories.length +
    (amountRange[0] !== AMOUNT_MIN || amountRange[1] !== AMOUNT_MAX ? 1 : 0);

  const dynamicSuggestionPool = useMemo(() => {
    const seen = new Set();
    const pool = [];

    const add = (value) => {
      if (!value) return;
      const trimmed = String(value).trim();
      if (trimmed.length < 3) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      pool.push(trimmed);
    };

    BASE_SEARCH_SUGGESTIONS.forEach(add);

    results.forEach((loan) => {
      add(loan.category);
      add(loan.city);
      add(loan.state);
      if (loan.description) {
        loan.description
          .split(/\s+/)
          .map((w) => w.replace(/[^a-zA-Z]/g, ''))
          .filter((w) => w.length > 3)
          .forEach(add);
      }
    });

    return pool.map((value, i) => ({ id: `sugg-${i}`, value }));
  }, [results]);

  const filteredSuggestions = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    if (!q) return dynamicSuggestionPool.slice(0, 8);
    return dynamicSuggestionPool
      .filter((s) => s.value.toLowerCase().includes(q))
      .slice(0, 8);
  }, [dynamicSuggestionPool, keyword]);

  const requestOffer = (loan) => {
    if (!isLoggedIn) {
      setLoginPrompt('Please log in as a lender to send an offer.');
      return;
    }
    setOfferLoan(loan);
  };

  const requestSafety = (loan) => {
    if (!isLoggedIn) {
      setLoginPrompt('Please log in to report or block a user.');
      return;
    }
    setSafetyLoan(loan);
  };

  const requestProfile = (borrowerId) => {
    if (!isLoggedIn) {
      setLoginPrompt('Please log in to view this user’s profile.');
      return;
    }
    navigate(`/users/${borrowerId}`);
  };

  useEffect(() => {
    if (!accessToken) {
      setBlockedIds([]);
      return;
    }
    api
      .getMyBlockedUserIds(accessToken)
      .then(setBlockedIds)
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!isLender || !accessToken) {
      setSentOfferIds(new Set());
      return;
    }
    setSentOfferIdsLoading(true);
    api
      .getMyOffersSent(accessToken)
      .then((offers) =>
        setSentOfferIds(new Set(offers.map((o) => o.loanRequestId)))
      )
      .catch(() => {})
      .finally(() => setSentOfferIdsLoading(false));
  }, [isLender, accessToken]);

  const load = useCallback(
    async (p = page, kw = keyword, cats = selectedCategories) => {
      setLoading(true);
      try {
        const res = await api.searchLoanRequests({
          keyword: kw || undefined,
          category: cats.length ? cats.join(',') : undefined,
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
    },
    [page, keyword, selectedCategories]
  );

  useEffect(() => {
    load(1, keyword, selectedCategories);
    setPage(1);
  }, [selectedCategories]);

  const visibleResults = results.filter((loan) => {
    if (blockedIds.includes(loan.borrowerId?._id)) return false;
    if (selectedCategories.length && !selectedCategories.includes(loan.category)) return false;
    const amt = Number(loan.amount) || 0;
    if (amt < amountRange[0] || amt > amountRange[1]) return false;
    return true;
  });

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    load(1, keyword, selectedCategories);
  };

  const goPage = (p) => {
    setPage(p);
    load(p);
  };

  const onOfferSent = (loanRequestId) => {
    setSentOfferIds((prev) => new Set(prev).add(loanRequestId));
    setOfferLoan(null);
  };

  const toggleCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setAmountRange([AMOUNT_MIN, AMOUNT_MAX]);
  };

  const applyFilters = () => {
    setFiltersOpen(false);
    setPage(1);
    load(1, keyword, selectedCategories);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to={user ? '/dashboard' : '/'}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-all cursor-pointer"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  Borrowing Marketplace
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 tracking-wider uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>

          {!user && (
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold text-primary-foreground bg-primary px-3.5 py-2 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn size={15} />
              <span>Log in to lend</span>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── SEARCH & FILTER BAR ─────────────────────────────────────── */}
        <div className="mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1">
              <Autocomplete
                value={keyword}
                onValueChange={(val) => setKeyword(val)}
                items={filteredSuggestions}
                itemToStringValue={(item) => item.value}
              >
                <AutocompleteInput
                  placeholder="Search by purpose, city, state, or keywords..."
                  showClear
                  size="lg"
                  className="bg-card border-border focus:border-primary text-sm rounded-xl h-11"
                />
                <AutocompleteContent align="start" sideOffset={6} className="rounded-xl border-border shadow-lg">
                  <AutocompleteEmpty className="text-xs text-muted-foreground p-3">
                    No matching suggestions found
                  </AutocompleteEmpty>
                  <AutocompleteList>
                    {(item) => (
                      <AutocompleteItem key={item.id} value={item} className="cursor-pointer text-xs font-medium py-2">
                        <Search className="mr-2 h-3.5 w-3.5 opacity-60 text-primary" />
                        {item.value}
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompleteContent>
              </Autocomplete>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Search size={16} />
                <span>Search</span>
              </button>

              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="relative shrink-0 gap-2 px-4 h-11 rounded-xl border-border bg-card hover:bg-muted/60 cursor-pointer font-semibold text-sm"
                    />
                  }
                >
                  <SlidersHorizontal size={16} className="text-muted-foreground" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold">
                      {activeFilterCount}
                    </span>
                  )}
                </PopoverTrigger>

                <PopoverContent align="end" sideOffset={8} className="w-80 rounded-2xl border-border p-5 shadow-xl">
                  <div className="grid gap-5">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <span className="font-bold text-sm text-foreground">Filter Requests</span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-7 rounded-full px-2 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={resetFilters}
                      >
                        <RotateCcw size={11} />
                        Reset
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Category
                      </Label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {LOAN_CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          const isChecked = selectedCategories.includes(cat.value);
                          return (
                            <div
                              key={cat.value}
                              onClick={() => toggleCategory(cat.value)}
                              className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-primary/5 border-primary/40 text-foreground font-semibold'
                                  : 'border-transparent hover:bg-muted/40 text-muted-foreground'
                              }`}
                            >
                              <Checkbox
                                id={`filter-cat-${cat.value}`}
                                checked={isChecked}
                                onCheckedChange={() => toggleCategory(cat.value)}
                                className="cursor-pointer"
                              />
                              <Label
                                htmlFor={`filter-cat-${cat.value}`}
                                className="flex items-center gap-2 text-xs cursor-pointer font-medium text-foreground pointer-events-none"
                              >
                                <Icon size={14} className={isChecked ? 'text-primary' : 'text-muted-foreground'} />
                                {cat.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3 pt-2 border-t border-border">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Amount Range
                      </Label>
                      <div className="space-y-3 pt-1">
                        <Slider
                          value={amountRange}
                          onValueChange={(value) => setAmountRange(value)}
                          min={AMOUNT_MIN}
                          max={AMOUNT_MAX}
                          step={AMOUNT_STEP}
                          aria-label="Amount range"
                          className="cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-xs font-bold text-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
                          <span>₹{amountRange[0].toLocaleString('en-IN')}</span>
                          <span className="text-muted-foreground text-[10px] font-medium">to</span>
                          <span>₹{amountRange[1].toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <Button type="button" onClick={applyFilters} className="w-full text-xs font-bold py-2.5 rounded-xl cursor-pointer">
                      Apply Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </form>
        </div>

        {/* ── RESULTS META ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-4">
          <span>
            Showing <strong className="text-foreground font-bold">{visibleResults.length}</strong> of{' '}
            <strong className="text-foreground font-bold">{total}</strong> active request{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── GRID CONTENT ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Loading loan requests...</p>
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3 text-center border border-dashed border-border rounded-2xl bg-card/40">
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <Inbox size={32} className="text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">No loan requests found</p>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Try adjusting your search terms or clearing active filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {visibleResults.map((loan) => (
              <LoanItem
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
          </div>
        )}

        {/* ── PAGINATION ────────────────────────────────────────────────── */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-8 mt-6 border-t border-border">
            <button
              disabled={page === 1}
              onClick={() => goPage(page - 1)}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-semibold text-muted-foreground px-2">
              Page <strong className="text-foreground font-bold">{page}</strong> of <strong className="text-foreground font-bold">{pages}</strong>
            </span>
            <button
              disabled={page >= pages}
              onClick={() => goPage(page + 1)}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </main>

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {offerLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Handshake size={18} className="text-primary" />
                  <h3 className="font-bold text-foreground text-sm">Send Funding Offer</h3>
                </div>
                <button
                  onClick={() => setOfferLoan(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5">
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

      <AnimatePresence>
        {safetyLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-destructive" />
                  <h3 className="font-bold text-foreground text-sm">Trust & Safety</h3>
                </div>
                <button
                  onClick={() => setSafetyLoan(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-5">
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

// ── STANDARD LOAN OFFER CARD ─────────────────────────────────────────────
function LoanItem({
  loan,
  isLoggedIn,
  isLender,
  isOwnRequest,
  hasSentOffer,
  sentOfferIdsLoading,
  onOffer,
  onSafety,
  onProfile,
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between transition-all duration-200 hover:border-border/80 hover:shadow-md">
      <div>
        {/* Amount & Category Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Requested Amount</span>
            <p className="text-xl font-black text-foreground tracking-tight mt-0.5">
              ₹{Number(loan.amount).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] capitalize font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Tag size={11} />
              {loan.category}
            </span>
            {!isOwnRequest && (
              <button
                onClick={onSafety}
                title="Report or block"
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
              >
                <ShieldAlert size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed font-normal">
          {loan.description || 'No detailed description provided.'}
        </p>

        {/* Borrower Profile */}
        {loan.borrowerId?._id && (
          <button
            type="button"
            onClick={onProfile}
            className="flex items-center gap-2 mt-4 pt-3 border-t border-border/80 text-left w-full group/borrower cursor-pointer"
          >
            {loan.borrowerId.avatarUrl ? (
              <img
                src={loan.borrowerId.avatarUrl}
                alt={loan.borrowerId.fullName || 'Borrower'}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-border group-hover/borrower:ring-primary/40 transition-all"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                {(loan.borrowerId.fullName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-foreground group-hover/borrower:text-primary transition-colors truncate">
              {loan.borrowerId.fullName || 'Anonymous User'}
            </span>
            {loan.borrowerId.identityVerified && (
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            )}
          </button>
        )}

        {/* Details Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] font-medium text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60">
          <div className="flex items-center gap-1.5 truncate" title="Location">
            <MapPin size={12} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{[loan.city, loan.state].filter(Boolean).join(', ') || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate" title="Tenure">
            <Clock size={12} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{loan.durationDays ? `${loan.durationDays} days` : 'Flexible'}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate" title="Interest Expectation">
            <Percent size={12} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{loan.interestRateHint != null ? `${loan.interestRateHint}%` : 'Open'}</span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-5 pt-3 border-t border-border/80">
        {!isLoggedIn ? (
          <button
            onClick={onOffer}
            className="w-full text-xs font-bold border border-border bg-background hover:bg-muted text-foreground py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
          >
            <Handshake size={15} /> Log in to offer
          </button>
        ) : isLender ? (
          hasSentOffer ? (
            <div className="w-full text-xs font-bold text-emerald-600 bg-emerald-50/80 border border-emerald-200 py-2.5 rounded-xl flex items-center justify-center gap-1.5 dark:bg-emerald-950/30 dark:border-emerald-800/60 dark:text-emerald-400">
              <CheckCircle2 size={15} /> Offer Submitted
            </div>
          ) : (
            <button
              onClick={onOffer}
              disabled={sentOfferIdsLoading}
              className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-98"
            >
              <Handshake size={15} /> Send Offer
            </button>
          )
        ) : (
          <p className="text-[11px] font-medium text-muted-foreground text-center py-1 bg-muted/20 rounded-lg border border-border/60">
            Lender account required
          </p>
        )}
      </div>
    </div>
  );
}

// ── OFFER FORM ──────────────────────────────────────────────────────────
function OfferForm({ loan, accessToken, onSent }) {
  const [message, setMessage] = useState('');
  const [offeredRate, setOfferedRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        accessToken
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
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed">
        Offering capital funding on a <strong className="text-foreground font-bold">₹{Number(loan.amount).toLocaleString('en-IN')}</strong> loan request.
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground block">
          Offered Interest Rate (% p.a.)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={offeredRate}
          onChange={(e) => setOfferedRate(e.target.value)}
          placeholder="e.g. 10.5"
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground block">
          Message to Borrower
        </label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Specify repayment terms or questions..."
          maxLength={1000}
          className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-medium resize-none focus:outline-none focus:border-primary shadow-xs leading-relaxed"
        />
      </div>

      {error && (
        <div className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full text-xs font-bold bg-primary text-primary-foreground py-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-98 mt-1"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Handshake size={16} />}
        {submitting ? 'Submitting...' : 'Confirm & Send Offer'}
      </button>
    </form>
  );
}

// ── SAFETY FORM ─────────────────────────────────────────────────────────
const REPORT_REASONS = [
  { value: 'fake_identity', label: 'Fake Identity or Impersonation' },
  { value: 'fraud_attempt', label: 'Fraudulent Activity' },
  { value: 'harassment', label: 'Harassment or Threats' },
  { value: 'spam', label: 'Spam or Unsolicited Promotion' },
  { value: 'abusive_behaviour', label: 'Abusive Language / Behavior' },
  { value: 'other', label: 'Other Reason' },
];

function SafetyForm({ loan, accessToken, onDone }) {
  const [mode, setMode] = useState('report');
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const borrowerId = loan.borrowerId?._id;
  const borrowerName = loan.borrowerId?.fullName || 'this borrower';

  const submitReport = async (e) => {
    e.preventDefault();
    if (reason === 'other' && !details.trim()) {
      setError('Please provide specific details for "Other"');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.fileReport(
        {
          reportedUserId: borrowerId,
          reason,
          details: details.trim() || undefined,
          reportContext: 'marketplace',
        },
        accessToken
      );
      setDone(true);
    } catch (err) {
      setError(err.message || 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBlock = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.blockUser(borrowerId, accessToken);
      onDone(borrowerId);
    } catch (err) {
      setError(err.message || 'Could not block user');
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <ShieldCheck size={28} />
        </div>
        <p className="text-base font-bold text-foreground">Report Submitted</p>
        <p className="text-xs text-muted-foreground leading-relaxed">Our trust and safety team will review this report shortly.</p>
        <button
          onClick={() => onDone()}
          className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          Close window
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border">
        {['report', 'block'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
              mode === m ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'report' ? (
        <form onSubmit={submitReport} className="flex flex-col gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground block">Details</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium resize-none focus:outline-none focus:border-primary shadow-xs leading-relaxed"
            />
          </div>

          {error && <div className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-2.5">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-xs font-bold bg-destructive text-destructive-foreground py-2.5 rounded-xl hover:bg-destructive/90 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-98"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
            Blocking <strong className="text-foreground font-bold">{borrowerName}</strong> will immediately hide all of their active requests from your marketplace feed.
          </p>

          {error && <div className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-2.5">{error}</div>}

          <button
            type="button"
            onClick={submitBlock}
            disabled={submitting}
            className="w-full text-xs font-bold bg-destructive text-destructive-foreground py-2.5 rounded-xl hover:bg-destructive/90 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-98"
          >
            {submitting ? 'Blocking...' : `Block ${borrowerName}`}
          </button>
        </div>
      )}
    </div>
  );
}