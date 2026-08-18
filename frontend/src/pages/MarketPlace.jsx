import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import LoginPromptModal from '../components/ui/LoginPromptModal';
import InfoBanner from '../components/ui/InfoBanner';
import { VerificationBanner, useVerificationBanner } from '../components/VerificationBanner';
const logo = 'https://res.cloudinary.com/hyztwkou/image/upload/v1787051288/logo_pvvfwz.png';
import { CanvasText } from '@/components/ui/canvas-text';
import { UserAvatarMarquee } from '@/components/ui/user-avatar-marquee';
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from '@/components/ui/AutoComplete';
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
  Sparkles,
  TrendingUp,
  ArrowUpDown,
  Calendar,
  Layers,
  CalendarDays,
  Shield,
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

  // Sorting state
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'amount' | 'duration'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offerLoan, setOfferLoan] = useState(null);
  const [blockedIds, setBlockedIds] = useState([]);
  const [safetyLoan, setSafetyLoan] = useState(null);
  const [loginPrompt, setLoginPrompt] = useState(null);
  const [previewUserId, setPreviewUserId] = useState(null);

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
    if (borrowerId) {
      setPreviewUserId(borrowerId);
    }
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

  // Filtered & Sorted Results
  const visibleResults = useMemo(() => {
    const list = results.filter((loan) => {
      if (blockedIds.includes(loan.borrowerId?._id)) return false;
      if (selectedCategories.length && !selectedCategories.includes(loan.category)) return false;
      const amt = Number(loan.amount) || 0;
      if (amt < amountRange[0] || amt > amountRange[1]) return false;
      return true;
    });

    return list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortBy === 'amount') {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else if (sortBy === 'duration') {
        valA = Number(a.durationDays) || 0;
        valB = Number(b.durationDays) || 0;
      } else {
        // 'date'
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [results, blockedIds, selectedCategories, amountRange, sortBy, sortOrder]);

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
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20 selection:text-primary">
      {/* ── INTEGRATED TOP NAVBAR WITH SEARCH & FILTERS ────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={user ? '/dashboard' : '/'}
              className="p-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted/60 hover:border-primary/40 transition-all cursor-pointer shadow-2xs"
              title="Return"
            >
              <ArrowLeft size={18} className="text-foreground" />
            </Link>
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="MT Pocket Logo" className="h-8 w-auto object-contain shrink-0" />
              <h1 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight hidden sm:block">
                MT Pocket
              </h1>
            </div>
          </div>

          {/* Embedded Search & Filter Control Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl flex items-center gap-2">
            <div className="flex-1">
              <Autocomplete
                value={keyword}
                onValueChange={(val) => setKeyword(val)}
                items={filteredSuggestions}
                itemToStringValue={(item) => item.value}
              >
                <AutocompleteInput
                  placeholder="Search opportunities by purpose, city, state..."
                  showClear
                  size="lg"
                  className="bg-background border-border/80 focus:border-primary text-xs sm:text-sm rounded-xl h-11 shadow-2xs"
                />
                <AutocompleteContent align="start" sideOffset={6} className="rounded-xl border-border shadow-xl">
                  <AutocompleteEmpty className="text-xs text-muted-foreground p-3">
                    No matching suggestions found
                  </AutocompleteEmpty>
                  <AutocompleteList>
                    {(item) => (
                      <AutocompleteItem key={item.id} value={item} className="cursor-pointer text-xs font-medium py-2.5">
                        <Search className="mr-2 h-3.5 w-3.5 text-primary" />
                        {item.value}
                      </AutocompleteItem>
                    )}
                  </AutocompleteList>
                </AutocompleteContent>
              </Autocomplete>
            </div>

            <button
              type="submit"
              className="px-4 sm:px-5 h-11 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-98"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search</span>
            </button>

            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="relative shrink-0 gap-2 px-3.5 h-11 rounded-xl border-border/80 bg-background hover:bg-muted/60 cursor-pointer font-semibold text-xs sm:text-sm shadow-2xs"
                  />
                }
              >
                <SlidersHorizontal size={15} className="text-muted-foreground" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
                    {activeFilterCount}
                  </span>
                )}
              </PopoverTrigger>

              <PopoverContent align="end" sideOffset={8} className="w-80 rounded-2xl border-border p-5 shadow-2xl backdrop-blur-md">
                <div className="grid gap-5">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="font-bold text-sm text-foreground">Filter Marketplace</span>
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
                                ? 'bg-primary/10 border-primary/40 text-foreground font-semibold'
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

                  <Button type="button" onClick={applyFilters} className="w-full text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-xs">
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </form>

          {!user && (
            <Link
              to="/login"
              className="shrink-0 text-xs sm:text-sm font-semibold text-primary-foreground bg-primary px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            >
              <LogIn size={15} />
              <span className="hidden md:inline">Log in to Lend</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── HERO BANNER WITH CANVAS ANIMATED TEXT ───────────────────────────── */}
      <section className="relative overflow-hidden pt-10 pb-6 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-2xs">
            <TrendingUp size={16} /> Direct Peer-to-Peer Capital Network
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground leading-tight">
            Empowering Borrowers,{' '}
            <CanvasText
              text="Rewarding Lenders"
              backgroundClassName="bg-primary dark:bg-primary"
              colors={[
                'rgba(59, 130, 246, 1)',
                'rgba(99, 102, 241, 0.9)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(236, 72, 153, 0.7)',
                'rgba(59, 130, 246, 0.5)',
              ]}
              lineGap={5}
              animationDuration={15}
            />
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Transparent, verified, and direct funding opportunities. Connect with high-trust individuals seeking capital for real growth.
          </p>
        </div>

        {/* Infinite Avatar Marquee Loop with breathing room */}
        <div className="mt-8 mb-4">
          <UserAvatarMarquee
            users={results}
            onSelectUser={(uid) => requestProfile(uid)}
          />
        </div>
      </section>

      {/* ── EXPANDED CATEGORY FILTER BUTTONS ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers size={16} className="text-primary" /> Filter Category
            </span>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="text-xs font-extrabold text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} /> Clear Filter ({selectedCategories.length})
              </button>
            )}
          </div>

          {/* Full-width Responsive Grid of Category Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 w-full">
            <button
              onClick={() => setSelectedCategories([])}
              className={`relative py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all duration-300 border cursor-pointer hover:scale-[1.02] active:scale-95 shadow-sm ${
                selectedCategories.length === 0
                  ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20'
                  : 'bg-card/80 backdrop-blur-md text-foreground border-border/80 hover:bg-muted/70 hover:border-primary/40'
              }`}
            >
              <Layers size={18} />
              <span>All Opportunities</span>
            </button>

            {LOAN_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`relative py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all duration-300 border cursor-pointer hover:scale-[1.02] active:scale-95 shadow-sm ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-card/80 backdrop-blur-md text-foreground border-border/80 hover:bg-muted/70 hover:border-primary/40'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-primary-foreground' : 'text-primary'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN MARKETPLACE GRID SECTION ─────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-8">
        {/* Results Metadata & Sorting Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground font-semibold pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="text-sm font-medium">
              Displaying <strong className="text-foreground font-extrabold text-base">{visibleResults.length}</strong> active opportunity{visibleResults.length !== 1 ? 'ies' : ''}
            </span>
          </div>

          {/* Sorting Controls */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-muted-foreground font-bold flex items-center gap-1.5 text-xs sm:text-sm">
              <ArrowUpDown size={15} /> Sort by:
            </span>
            <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-2xl p-1.5 shadow-sm">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-foreground focus:outline-none cursor-pointer px-3 py-1"
              >
                <option value="date">Date Posted</option>
                <option value="amount">Loan Amount</option>
                <option value="duration">Tenure Days</option>
              </select>

              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                title={sortOrder === 'asc' ? 'Ascending Order' : 'Descending Order'}
                className="px-2.5 py-1 text-xs sm:text-sm font-extrabold text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
              >
                {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}
              </button>
            </div>
          </div>
        </div>

        {/* Grid Content with Framer Motion Category Filter Animations */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground space-y-4">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-muted-foreground">Fetching Live Requests...</p>
          </div>
        ) : visibleResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-muted-foreground space-y-5 text-center border-2 border-dashed border-border/80 rounded-3xl bg-card/30 backdrop-blur-md p-8">
            <div className="p-5 rounded-2xl bg-muted/60 border border-border">
              <Inbox size={44} className="text-primary" />
            </div>
            <div className="space-y-2 max-w-md">
              <p className="text-lg font-extrabold text-foreground">No matching loan requests found</p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Try loosening your category selection or amount range filter to discover available opportunities.
              </p>
            </div>
            <Button onClick={resetFilters} className="text-xs sm:text-sm font-extrabold px-6 py-2.5 rounded-xl cursor-pointer shadow-md">
              Reset All Filters
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategories.join(',') + '-' + sortBy + '-' + sortOrder}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {visibleResults.map((loan, index) => (
                <motion.div
                  key={loan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
                >
                  <LoanItem
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
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-center gap-5 pt-12 border-t border-border/60">
            <button
              disabled={page === 1}
              onClick={() => goPage(page - 1)}
              className="p-3 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs sm:text-sm font-bold text-muted-foreground px-3">
              Page <strong className="text-foreground font-black text-base">{page}</strong> of <strong className="text-foreground font-black text-base">{pages}</strong>
            </span>
            <button
              disabled={page >= pages}
              onClick={() => goPage(page + 1)}
              className="p-3 rounded-2xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {offerLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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

      <AnimatePresence>
        {previewUserId && (
          <MarketplaceProfileModal
            userId={previewUserId}
            onClose={() => setPreviewUserId(null)}
            accessToken={accessToken}
          />
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

// ── ELEVATED LOAN ITEM CARD ──────────────────────────────────────────────
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
  const fullLocation = [loan.city, loan.state].filter(Boolean).join(', ') || 'India';

  return (
    <div className="group relative rounded-3xl border border-border bg-card p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-lg cursor-pointer">
      <div>
        {/* Header: Amount & Category Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-muted-foreground block mb-1">
              Capital Required
            </span>
            <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
              ₹{Number(loan.amount).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm capitalize font-extrabold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs">
              <Tag size={13} />
              {loan.category}
            </span>
            {!isOwnRequest && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSafety();
                }}
                title="Report or block"
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
              >
                <ShieldAlert size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Formatted Purpose Description Box */}
        <div className="mt-4 p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs sm:text-sm font-medium text-foreground/90 leading-relaxed min-h-[4.5rem] flex items-center">
          <p className="line-clamp-2">
            {loan.description || 'No detailed description provided by the borrower.'}
          </p>
        </div>

        {/* Borrower Profile Information Bar */}
        {loan.borrowerId?._id && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProfile();
            }}
            className="flex items-center justify-between mt-5 pt-4 border-t border-border/60 text-left w-full group/borrower cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                {loan.borrowerId.avatarUrl ? (
                  <img
                    src={loan.borrowerId.avatarUrl}
                    alt={loan.borrowerId.fullName || 'Borrower'}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20 group-hover/borrower:ring-primary/60 transition-all"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black ring-2 ring-primary/20">
                    {(loan.borrowerId.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                {loan.borrowerId.identityVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-emerald-500 rounded-full text-white ring-2 ring-card">
                    <ShieldCheck size={11} />
                  </span>
                )}
              </div>

              <div className="flex flex-col truncate">
                <span className="text-xs sm:text-sm font-bold text-foreground group-hover/borrower:text-primary transition-colors truncate">
                  {loan.borrowerId.fullName || 'Anonymous User'}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {loan.borrowerId.identityVerified ? 'Verified Account' : 'Standard Member'}
                </span>
              </div>
            </div>

            <ChevronRight size={16} className="text-muted-foreground group-hover/borrower:text-primary transition-transform group-hover/borrower:translate-x-0.5" />
          </button>
        )}

        {/* Key Metrics Row - Perfectly Aligned 3 Highlight Pill Boxes */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-5 p-3.5 sm:p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <div className="flex flex-col group/loc relative" title={fullLocation}>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase text-muted-foreground">
              <MapPin size={13} className="text-primary shrink-0" />
              <span className="truncate">Location</span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate group-hover/loc:whitespace-normal group-hover/loc:overflow-visible transition-all mt-1">
              {fullLocation}
            </p>
          </div>

          <div className="flex flex-col truncate border-l border-primary/15 pl-2.5 sm:pl-3" title="Expected Rate">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase text-muted-foreground">
              <Percent size={13} className="text-primary shrink-0" />
              <span className="truncate">Interest</span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">
              {loan.interestRateHint != null ? `${loan.interestRateHint}% p.a.` : 'Open'}
            </p>
          </div>

          <div className="flex flex-col truncate border-l border-primary/15 pl-2.5 sm:pl-3" title="Tenure">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase text-muted-foreground">
              <Clock size={13} className="text-primary shrink-0" />
              <span className="truncate">Duration</span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-foreground truncate mt-1">
              {loan.durationDays ? `${loan.durationDays} Days` : 'Flexible'}
            </p>
          </div>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="mt-6 pt-4 border-t border-border/60">
        {!isLoggedIn ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOffer();
            }}
            className="w-full text-xs sm:text-sm font-extrabold border border-border bg-background hover:bg-muted text-foreground py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
          >
            <Handshake size={18} /> Log in to offer
          </button>
        ) : isLender ? (
          hasSentOffer ? (
            <div className="w-full text-xs sm:text-sm font-extrabold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-2xs">
              <CheckCircle2 size={18} /> Offer Submitted
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOffer();
              }}
              disabled={sentOfferIdsLoading}
              className="w-full text-xs sm:text-sm font-extrabold bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-98"
            >
              <Handshake size={18} /> Send Funding Offer
            </button>
          )
        ) : (
          <p className="text-xs font-semibold text-muted-foreground text-center py-2.5 bg-muted/30 rounded-xl border border-border/60">
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
  const { showVerificationBanner, verificationBannerProps } = useVerificationBanner();

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
      if (err.requiresFullVerification) {
        showVerificationBanner(err.verificationStatus);
        return;
      }
      setError(err.message || 'Could not send offer — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <VerificationBanner {...verificationBannerProps} />
      <form onSubmit={submit} className="flex flex-col gap-4">
      {/* 🔵 Step 6 Disclaimer — one-time lender alert */}
      <InfoBanner variant="info" dismissible={true} storageKey="mt_lender_disclaimer_seen">
        You're responsible for verifying repayment terms directly with the borrower.
      </InfoBanner>

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
          placeholder="Enter proposed interest rate %"
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
          placeholder="Enter repayment terms or message to borrower…"
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
    </>
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
              placeholder="Enter details about this issue or report…"
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

// ── MARKETPLACE PROFILE PREVIEW MODAL ─────────────────────────────────────
function MarketplaceProfileModal({ userId, onClose, accessToken }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Safety actions state
  const [showSafety, setShowSafety] = useState(false);
  const [safetyMode, setSafetyMode] = useState('report');
  const [reportReason, setReportReason] = useState('fake_identity');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingSafety, setSubmittingSafety] = useState(false);
  const [safetyMessage, setSafetyMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getPublicProfile(userId, accessToken)
      .then((res) => setProfile(res))
      .catch((err) => {
        setError(err.message || 'Failed to fetch public profile.');
      })
      .finally(() => setLoading(false));
  }, [userId, accessToken]);

  const REPORT_REASONS = [
    { value: 'fake_identity',     label: 'Fake Identity' },
    { value: 'fraud_attempt',     label: 'Fraud Attempt' },
    { value: 'harassment',        label: 'Harassment' },
    { value: 'impersonation',     label: 'Impersonation' },
    { value: 'spam',              label: 'Spam' },
    { value: 'abusive_behaviour', label: 'Abusive Behaviour' },
    { value: 'other',             label: 'Other' },
  ];

  const handleReport = async (e) => {
    e.preventDefault();
    if (reportReason === 'other' && !reportDetails.trim()) {
      setSafetyMessage('Please add report details for "Other".');
      return;
    }
    setSubmittingSafety(true);
    setSafetyMessage('');
    try {
      await api.fileReport(
        { reportedUserId: userId, reason: reportReason, details: reportDetails.trim() || undefined, reportContext: 'profile' },
        accessToken
      );
      setSafetyMessage('Report submitted successfully.');
      setReportDetails('');
      setTimeout(() => setShowSafety(false), 2000);
    } catch (err) {
      setSafetyMessage(err.message || 'Could not submit report.');
    } finally {
      setSubmittingSafety(false);
    }
  };

  const handleBlock = async () => {
    if (!window.confirm(`Are you sure you want to block ${profile?.fullName || 'this user'}? This will hide their listings.`)) return;
    setSubmittingSafety(true);
    setSafetyMessage('');
    try {
      await api.blockUser(userId, accessToken);
      setSafetyMessage('User has been blocked. Reloading…');
      setTimeout(() => {
        setShowSafety(false);
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setSafetyMessage(err.message || 'Could not block user.');
    } finally {
      setSubmittingSafety(false);
    }
  };

  const ROLE_LABELS = {
    borrower: 'Borrower',
    lender: 'Lender',
    both: 'Borrower & Lender',
    unset: 'Community Member',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <span className="font-bold text-foreground text-sm">Member Profile Preview</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-6 text-destructive flex flex-col items-center gap-2">
              <ShieldAlert size={24} />
              <p className="font-bold text-xs">{error}</p>
            </div>
          ) : profile ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center ${profile.identityVerified ? 'border-emerald-500' : 'border-border'}`}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                      {profile.fullName ? profile.fullName[0].toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-foreground tracking-tight">
                      {profile.fullName || 'Unnamed Member'}
                    </h3>
                    {profile.identityVerified ? (
                      <ShieldCheck size={16} className="text-emerald-500 shrink-0" title="Verified Identity" />
                    ) : (
                      <Shield size={16} className="text-muted-foreground/50 shrink-0" title="Unverified Identity" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                    {ROLE_LABELS[profile.role] || 'Member'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground font-medium bg-muted/30 p-3 rounded-xl">
                {(profile.city || profile.state) && (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span className="text-foreground">{[profile.city, profile.state].filter(Boolean).join(', ')}</span>
                  </p>
                )}
                {profile.createdAt && (
                  <p className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-primary shrink-0" />
                    <span className="text-foreground">
                      Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 px-3 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => setShowSafety(!showSafety)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-destructive/20 text-destructive text-xs font-bold hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <ShieldAlert size={14} />
                  <span>Report / Block</span>
                </button>
              </div>

              <AnimatePresence>
                {showSafety && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 overflow-hidden text-xs"
                  >
                    <div className="flex border-b border-border gap-4 pb-2">
                      <button
                        onClick={() => { setSafetyMode('report'); setSafetyMessage(''); }}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                          safetyMode === 'report' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Report
                      </button>
                      <button
                        onClick={() => { setSafetyMode('block'); setSafetyMessage(''); }}
                        className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                          safetyMode === 'block' ? 'text-destructive border-b-2 border-destructive' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Block
                      </button>
                    </div>

                    {safetyMessage && (
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                        {safetyMessage}
                      </div>
                    )}

                    {safetyMode === 'report' ? (
                      <form onSubmit={handleReport} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Reason</label>
                          <select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            {REPORT_REASONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Details</label>
                          <textarea
                            rows={2}
                            placeholder="Enter details about this violation…"
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary cursor-text"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingSafety}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors cursor-pointer"
                        >
                          {submittingSafety && <Loader2 size={12} className="animate-spin" />}
                          <span>Submit Report</span>
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-2.5 text-center">
                        <p className="text-xs text-muted-foreground">
                          Blocking this member hides their loan requests and prevents further messaging.
                        </p>
                        <button
                          type="button"
                          onClick={handleBlock}
                          disabled={submittingSafety}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-colors cursor-pointer"
                        >
                          {submittingSafety && <Loader2 size={12} className="animate-spin" />}
                          <span>Block {profile.fullName || 'Member'}</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}