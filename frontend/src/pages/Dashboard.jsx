import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import {
  ShieldCheck, Smartphone, Mail, Fingerprint,
  PlusCircle, ArrowUpRight, Coins, Handshake,
  Info, AlertTriangle, UploadCloud, Loader2, Bell,
  X, CheckCircle2, Clock, RefreshCw, ChevronRight,
  FileText, TrendingUp, Banknote, Tag,
} from 'lucide-react';

const DOCUMENT_OPTIONS = [
  { value: 'aadhaar',         label: 'Aadhaar Card' },
  { value: 'pan',             label: 'PAN Card' },
  { value: 'passport',        label: 'Passport' },
  { value: 'driving_license', label: 'Driving Licence' },
];

const LOAN_CATEGORIES = [
  { value: 'medical',   label: 'Medical',   emoji: '🏥' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'business',  label: 'Business',  emoji: '💼' },
  { value: 'personal',  label: 'Personal',  emoji: '🏠' },
  { value: 'other',     label: 'Other',     emoji: '💡' },
];

// The three offer tabs shown for both the "sent" (lender) and "received"
// (borrower) lists. Every offer sits in exactly one of these at any time.
const OFFER_TABS = [
  { value: 'pending',  label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

// Notification type → icon + colour helpers
const NOTIF_META = {
  doc_submitted:          { color: 'text-primary',     bg: 'bg-primary/10',     icon: FileText },
  doc_under_review:       { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: Clock },
  doc_approved:           { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  doc_rejected:           { color: 'text-destructive', bg: 'bg-destructive/10', icon: X },
  doc_reupload_required:  { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: RefreshCw },
  account_suspended:      { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
  account_unsuspended:    { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  account_banned:         { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
  report_filed:           { color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: AlertTriangle },
  offer_received:         { color: 'text-primary',     bg: 'bg-primary/10',     icon: Handshake },
  offer_accepted:         { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  offer_rejected:         { color: 'text-destructive', bg: 'bg-destructive/10', icon: X },
};
const defaultMeta = { color: 'text-muted-foreground', bg: 'bg-muted', icon: Bell };

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 26 } },
  exit:    { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};
const rowVariants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  exit:    { opacity: 0, x: -8, transition: { duration: 0.15 } },
};

// A loan's `offers[].lenderId` comes back as a bare ObjectId string unless
// the backend query populates it (see getMyRequests). Handle both shapes
// so this component works whether or not that populate has been added yet.
function lenderIdOf(offer) {
  return typeof offer.lenderId === 'object' ? offer.lenderId?._id : offer.lenderId;
}
function lenderNameOf(offer) {
  return typeof offer.lenderId === 'object' ? offer.lenderId?.fullName : null;
}

export default function Dashboard() {
  const { user, accessToken, updateUser } = useAuth();

  // ── KYC status (live from API, more reliable than stale profile) ──────────
  const [kycStatus, setKycStatus]         = useState(null); // null = loading
  const [kycLoading, setKycLoading]       = useState(true);
  const [kycModalOpen, setKycModalOpen]   = useState(false);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifs, setNotifs]               = useState([]);
  const [unread, setUnread]               = useState(0);
  const [notifLoading, setNotifLoading]   = useState(false);
  const notifRef = useRef(null);

  // ── Marketplace count (lender) ────────────────────────────────────────────
  const [marketCount, setMarketCount]     = useState(null);

  // ── Loan request form (borrower) ──────────────────────────────────────────
  const [loanFormOpen, setLoanFormOpen]   = useState(false);
  const [myLoans, setMyLoans]             = useState([]);
  const [myLoansLoading, setMyLoansLoading] = useState(false);

  // ── Offers (sent — lender / received — borrower) ───────────────────────────
  // Three-way split: pending / accepted / rejected. Every offer lives in
  // exactly one bucket based on its own `status` field — nothing here is
  // inferred, it's a straight filter on what the backend returns.
  const [offersTab, setOffersTab]         = useState('pending');
  const [sentOffers, setSentOffers]       = useState([]);
  const [sentOffersLoading, setSentOffersLoading] = useState(false);

  // NOTE: these two must stay above the `if (!user) return null` guard
  // below, along with every hook — see Rules of Hooks. They're plain
  // consts (not hooks) so it's safe for them to run on the render where
  // `user` is still null; `?.` just makes them false until it loads.
  const isLender   = user?.role === 'lender'   || user?.role === 'both';
  const isBorrower = user?.role === 'borrower' || user?.role === 'both';

  // Fetch KYC status on mount
  useEffect(() => {
    if (!accessToken) return;
    api.getVerificationStatus(accessToken)
      .then((res) => setKycStatus(res))
      .catch(() => setKycStatus(null))
      .finally(() => setKycLoading(false));
  }, [accessToken]);

  // Fetch unread count on mount
  useEffect(() => {
    if (!accessToken) return;
    // NotificationsService.unreadCount() returns a bare number, not { count }.
    api.getUnreadCount(accessToken)
      .then((count) => setUnread(count ?? 0))
      .catch(() => {});
  }, [accessToken]);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (!notifOpen || !accessToken) return;
    setNotifLoading(true);
    api.getNotifications(accessToken)
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [notifOpen, accessToken]);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch marketplace count for lenders
  useEffect(() => {
    if (!isLender) return;
    api.searchLoanRequests({ limit: 1 })
      .then((res) => setMarketCount(res.total ?? 0))
      .catch(() => {});
  }, [isLender]);

  // Fetch my loan requests for borrowers (this doubles as "offers received"
  // source data — getMyLoanRequests returns the full doc, offers included)
  useEffect(() => {
    if (!isBorrower || !accessToken) return;
    setMyLoansLoading(true);
    api.getMyLoanRequests(accessToken)
      .then(setMyLoans)
      .catch(() => {})
      .finally(() => setMyLoansLoading(false));
  }, [isBorrower, accessToken]);

  // Fetch offers sent, for lenders
  useEffect(() => {
    if (!isLender || !accessToken) return;
    setSentOffersLoading(true);
    api.getMyOffersSent(accessToken)
      .then(setSentOffers)
      .catch(() => {})
      .finally(() => setSentOffersLoading(false));
  }, [isLender, accessToken]);

  const markAllRead = async () => {
    await api.markAllNotificationsRead(accessToken).catch(() => {});
    setUnread(0);
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };

  const onKycSubmitted = (newStatus) => {
    setKycStatus(newStatus);
    updateUser({ idDocumentStatus: newStatus?.status, idDocumentRejectionReason: null });
    setKycModalOpen(false);
  };

  const onLoanCreated = (loan) => {
    setMyLoans((prev) => [loan, ...prev]);
    setLoanFormOpen(false);
  };

  // Borrower: flatten every offer across all of my loan requests into one
  // list, carrying the parent request along so each row has context.
  const receivedOffers = myLoans.flatMap((loan) =>
    (loan.offers || []).map((o) => ({ ...o, loanRequest: loan }))
  );

  // Accept and reject are two independent, manual, per-offer actions the
  // borrower takes. Accepting one offer does NOT touch any other offer —
  // every other pending offer on the same request stays pending until the
  // borrower explicitly rejects it (or accepts it instead).
  const acceptOffer = async (loanRequestId, offerId) => {
    try {
      const updated = await api.acceptOffer(loanRequestId, offerId, accessToken);
      setMyLoans((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
    } catch (err) {
      console.error('Failed to accept offer:', err.message);
    }
  };

  const rejectOffer = async (loanRequestId, offerId) => {
    try {
      const updated = await api.rejectOffer(loanRequestId, offerId, accessToken);
      setMyLoans((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
    } catch (err) {
      console.error('Failed to reject offer:', err.message);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      className="flex-1 flex flex-col space-y-8 min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── HEADER ROW ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
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
            Your MT Pocket trust dashboard — verification, loans, and activity at a glance.
          </p>
        </div>

        {/* Notification bell */}
        <div className="relative shrink-0 mt-1" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 rounded-2xl border border-border bg-card shadow-xl shadow-foreground/5 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-primary" />
                    <p className="text-sm font-bold text-foreground">Notifications</p>
                  </div>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline font-semibold cursor-pointer">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {notifLoading ? (
                    <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
                  ) : notifs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-10">No notifications yet</p>
                  ) : notifs.map((n) => {
                    const meta = NOTIF_META[n.type] || defaultMeta;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={n._id}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${n.read ? 'opacity-60' : 'bg-primary/[0.02]'}`}
                      >
                        <div className={`w-7 h-7 rounded-full ${meta.bg} ${meta.color} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── TRUST / VERIFICATION CARD ──────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-border bg-card p-8 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-primary h-6 w-6" />
            <h2 className="font-bold text-lg text-foreground tracking-tight">Profile Verification Status</h2>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold tracking-wider uppercase">
            Trust Score Badges
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          {/* Phone Badge */}
          <div className="relative group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]">
            <span className="absolute top-4 right-4 text-[9px] font-bold tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
              Verified
            </span>
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Phone</h4>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.phone}</p>
              </div>
            </div>
          </div>

          {/* Email Badge */}
          <div className={`relative group rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
            user.emailVerified
              ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40'
              : 'border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40'
          }`}>
            <span className={`absolute top-4 right-4 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${
              user.emailVerified ? 'text-emerald-600 bg-emerald-500/10' : 'text-amber-600 bg-amber-500/10'
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
                <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Email</h4>
                {user.email ? (
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.email}</p>
                ) : (
                  <Link to="/dashboard/profile" className="text-[11px] text-primary hover:underline block font-semibold mt-1 cursor-pointer">
                    Set Email
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Identity Badge — interactive */}
          <IdentityBadge
            kycStatus={kycStatus}
            kycLoading={kycLoading}
            user={user}
            onOpenModal={() => setKycModalOpen(true)}
          />
        </div>
      </motion.div>

      {/* KYC Upload Modal */}
      <AnimatePresence>
        {kycModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Fingerprint size={18} className="text-primary" />
                  <h3 className="font-bold text-foreground">Submit Identity Document</h3>
                </div>
                <button
                  onClick={() => setKycModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <IdentityUploadForm
                  accessToken={accessToken}
                  onSubmitted={onKycSubmitted}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BORROWER / LENDER CARDS ───────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Borrower Section */}
        {isBorrower && (
          <div className="group rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
                <Coins size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">Borrow Funds</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Post borrowing requests, set interest hints, repayment duration, and get matched with nearby lenders.
              </p>

              {/* My loan requests mini-list */}
              {myLoansLoading ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" /> Loading your requests…
                </div>
              ) : myLoans.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Your recent requests</p>
                  {myLoans.slice(0, 3).map((loan) => (
                    <div key={loan._id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag size={11} className="text-primary" />
                        <span className="text-xs font-semibold text-foreground">₹{loan.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{loan.category}</span>
                      </div>
                      <LoanStatusBadge status={loan.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-border/60 flex items-center gap-4">
              <button
                onClick={() => setLoanFormOpen(true)}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <PlusCircle size={18} /> New loan request
              </button>
              {myLoans.length > 3 && (
                <span className="text-xs text-muted-foreground">{myLoans.length} total</span>
              )}
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
              <h3 className="text-xl font-bold text-foreground tracking-tight">Active Marketplace</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Browse open loan demands, analyse trust metrics, and send custom offers to verified borrowers.
              </p>

              {marketCount !== null && (
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
                  <TrendingUp size={16} className="text-primary" />
                  <div>
                    <p className="text-lg font-extrabold text-primary leading-none">{marketCount}</p>
                    <p className="text-[11px] text-muted-foreground">open requests right now</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-emerald-600 transition-colors cursor-pointer"
              >
                Browse marketplace <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── OFFERS SECTION (sent — lender / received — borrower) ───────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Handshake className="text-primary h-6 w-6" />
            <h2 className="font-bold text-xl text-foreground tracking-tight">Offers</h2>
          </div>

          {/* Sliding 3-way toggle: Pending / Accepted / Rejected */}
          <div className="relative flex rounded-xl border border-border p-1 bg-muted/30 self-start">
            {OFFER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setOffersTab(tab.value)}
                className={`relative z-10 px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  offersTab === tab.value ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {offersTab === tab.value && (
                  <motion.span
                    layoutId="offers-tab-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Users with role="both" see both lists stacked, each labelled;
            single-role users just see their one relevant list. Each list
            is filtered to whichever status tab is currently selected. */}
        <div className="space-y-8">
          {isLender && (
            <div>
              {isBorrower && (
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  As a lender — {offersTab} offers you sent
                </p>
              )}
              <OffersList
                loading={sentOffersLoading}
                items={sentOffers.filter((o) => o.status === offersTab)}
                emptyLabel={
                  offersTab === 'pending'  ? "You haven't sent any offers yet" :
                  offersTab === 'accepted' ? 'No accepted offers yet' :
                                              'No rejected offers'
                }
                renderRow={(o) => (
                  <motion.div
                    key={o.offerId}
                    layout
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex items-center justify-between px-1 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-bold text-foreground truncate">
                        ₹{o.amount.toLocaleString()} · <span className="capitalize font-semibold text-muted-foreground">{o.category}</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        to{' '}
                        {o.borrower?._id ? (
                          <Link to={`/users/${o.borrower._id}`} className="text-primary hover:underline font-semibold cursor-pointer">
                            {o.borrower.fullName || 'Borrower'}
                          </Link>
                        ) : (
                          o.borrower?.fullName || 'Borrower'
                        )}
                        {o.offeredRate != null && ` · offered ${o.offeredRate}%`}
                      </p>
                    </div>
                    <OfferStatusBadge status={o.status} />
                  </motion.div>
                )}
              />
            </div>
          )}

          {isLender && isBorrower && <div className="border-t border-border" />}

          {isBorrower && (
            <div>
              {isLender && (
                <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  As a borrower — {offersTab} offers received
                </p>
              )}
              <OffersList
                loading={myLoansLoading}
                items={receivedOffers.filter((o) => o.status === offersTab)}
                emptyLabel={
                  offersTab === 'pending'  ? 'No offers received yet' :
                  offersTab === 'accepted' ? 'No accepted offers yet' :
                                              'No rejected offers'
                }
                renderRow={(o) => {
                  const lId = lenderIdOf(o);
                  const lName = lenderNameOf(o);
                  return (
                    <motion.div
                      key={o._id}
                      layout
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex items-center justify-between px-1 py-4 gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-base font-bold text-foreground truncate">
                          ₹{o.loanRequest.amount.toLocaleString()} · <span className="capitalize font-semibold text-muted-foreground">{o.loanRequest.category}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {lId && (
                            <Link to={`/users/${lId}`} className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                              {lName || 'View lender'}
                            </Link>
                          )}
                          {o.offeredRate != null && (
                            <span className="text-sm text-muted-foreground">· offered {o.offeredRate}%</span>
                          )}
                          {o.message && (
                            <span className="text-sm text-muted-foreground truncate">· "{o.message}"</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {o.status === 'pending' ? (
                          <>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => acceptOffer(o.loanRequest._id, o._id)}
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                            >
                              <CheckCircle2 size={14} /> Accept
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => rejectOffer(o.loanRequest._id, o._id)}
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                            >
                              <X size={14} /> Reject
                            </motion.button>
                          </>
                        ) : (
                          <OfferStatusBadge status={o.status} />
                        )}
                      </div>
                    </motion.div>
                  );
                }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── LOAN REQUEST MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {loanFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Banknote size={18} className="text-primary" />
                  <h3 className="font-bold text-foreground">Create Loan Request</h3>
                </div>
                <button
                  onClick={() => setLoanFormOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <LoanRequestForm
                  accessToken={accessToken}
                  onCreated={onLoanCreated}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADVISORY ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
            <Info size={16} />
          </span>
          <div>
            <h4 className="font-bold text-foreground text-sm">Security Advisory Notice</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Always negotiate loan terms transparently within the application. MT Pocket handles connection, trust metrics, and matching logic. Remember to verify each other's identity metrics on-site during deal finalisation.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Identity Badge ──────────────────────────────────────────────────────────
function IdentityBadge({ kycStatus, kycLoading, user, onOpenModal }) {
  // kycStatus shape: { status, documentType, submittedAt, rejectionReason, ... } | null
  const status      = kycStatus?.status ?? user.idDocumentStatus ?? 'none';
  const isApproved  = status === 'approved' || user.identityVerified;
  const isPending   = !isApproved && status === 'pending';
  const isRejected  = !isApproved && status === 'rejected';
  const needsAction = !isApproved && !isPending;

  const badgeLabel = isApproved ? 'Verified' : isPending ? 'Under Review' : isRejected ? 'Rejected' : 'Not Started';
  const badgeColor = isApproved
    ? 'text-emerald-600 bg-emerald-500/10'
    : isRejected ? 'text-destructive bg-destructive/10'
    : isPending  ? 'text-amber-600 bg-amber-500/10'
    : 'text-muted-foreground bg-muted';

  const borderClass = isApproved
    ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40'
    : isRejected
    ? 'border-destructive/20 bg-destructive/[0.02] hover:border-destructive/30'
    : 'border-border bg-muted/40 hover:border-border/80';

  return (
    <div
      className={`relative group rounded-2xl border p-5 shadow-sm transition-all duration-300 ${borderClass} ${needsAction ? 'cursor-pointer' : ''}`}
      onClick={needsAction ? onOpenModal : undefined}
      role={needsAction ? 'button' : undefined}
      tabIndex={needsAction ? 0 : undefined}
      onKeyDown={needsAction ? (e) => e.key === 'Enter' && onOpenModal() : undefined}
    >
      <span className={`absolute top-4 right-4 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${badgeColor}`}>
        {badgeLabel}
      </span>

      {/* Pulsing ring when pending */}
      {isPending && (
        <span className="absolute top-3 right-3 w-3 h-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
      )}

      <div className="flex flex-col gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110 ${
          isApproved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
        }`}>
          {kycLoading ? <Loader2 size={20} className="animate-spin" /> : <Fingerprint size={20} />}
        </div>
        <div>
          <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Identity (KYC)</h4>
          <p className="text-[11px] text-muted-foreground mt-1">
            {isApproved ? 'KYC verified ✓' : isPending ? 'Awaiting admin review…' : isRejected ? 'Resubmission required' : 'Tap to verify identity'}
          </p>

          {isRejected && (kycStatus?.rejectionReason || user.idDocumentRejectionReason) && (
            <p className="text-[11px] text-destructive mt-2 flex items-start gap-1.5">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>{kycStatus?.rejectionReason || user.idDocumentRejectionReason}</span>
            </p>
          )}

          {needsAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              <UploadCloud size={13} />
              {isRejected ? 'Resubmit document' : 'Verify identity'}
              <ChevronRight size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── KYC Upload Form (inside modal) ─────────────────────────────────────────
function IdentityUploadForm({ accessToken, onSubmitted }) {
  const [documentType, setDocumentType] = useState(DOCUMENT_OPTIONS[0].value);
  const [file,         setFile]         = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [dragOver,     setDragOver]     = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please choose a file to upload'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await api.uploadVerificationDocument({ file, documentType }, accessToken);
      onSubmitted(result);
    } catch (err) {
      setError(err.message || 'Upload failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
          Document type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          {DOCUMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Drag-and-drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed transition-colors p-6 text-center cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onClick={() => document.getElementById('kyc-file-input').click()}
      >
        <input
          id="kyc-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <UploadCloud size={28} className={`mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
        {file ? (
          <p className="text-sm font-semibold text-foreground">{file.name}</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">Drop file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP or PDF · max 8MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
          <AlertTriangle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !file}
        className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        {submitting ? 'Uploading…' : 'Submit for review'}
      </button>
    </form>
  );
}

// ── Loan Request Form (inside modal) ───────────────────────────────────────
function LoanRequestForm({ accessToken, onCreated }) {
  const [form, setForm] = useState({
    amount: '',
    category: 'personal',
    description: '',
    interestRateHint: '',
    durationDays: '',
    city: '',
    state: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description.trim()) {
      setError('Amount and description are required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        amount:           Number(form.amount),
        category:         form.category,
        description:      form.description.trim(),
        ...(form.interestRateHint ? { interestRateHint: Number(form.interestRateHint) } : {}),
        ...(form.durationDays     ? { durationDays:     Number(form.durationDays) }     : {}),
        ...(form.city.trim()      ? { city:  form.city.trim() }  : {}),
        ...(form.state.trim()     ? { state: form.state.trim() } : {}),
      };
      const result = await api.createLoanRequest(payload, accessToken);
      onCreated(result);
    } catch (err) {
      setError(err.message || 'Submission failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* Amount */}
      <div>
        <label className={labelCls}>Amount (₹) *</label>
        <input
          type="number" min="1" value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          placeholder="e.g. 50000"
          className={inputCls}
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Category *</label>
        <div className="grid grid-cols-5 gap-1.5">
          {LOAN_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => set('category', cat.value)}
              className={`flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] font-semibold border transition-all cursor-pointer ${
                form.category === cat.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span className="text-base">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description *</label>
        <textarea
          rows={3} value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Briefly describe your need…"
          maxLength={2000}
          className={`${inputCls} resize-none`}
        />
        <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.description.length}/2000</p>
      </div>

      {/* Interest hint + Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Interest hint (%)</label>
          <input
            type="number" min="0" max="100" step="0.1" value={form.interestRateHint}
            onChange={(e) => set('interestRateHint', e.target.value)}
            placeholder="e.g. 12"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Duration (days)</label>
          <input
            type="number" min="1" value={form.durationDays}
            onChange={(e) => set('durationDays', e.target.value)}
            placeholder="e.g. 30"
            className={inputCls}
          />
        </div>
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>City</label>
          <input
            type="text" value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="e.g. Mumbai"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input
            type="text" value={form.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="e.g. Maharashtra"
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
          <AlertTriangle size={13} className="shrink-0" /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-4 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
        {submitting ? 'Submitting…' : 'Post loan request'}
      </button>
    </form>
  );
}

// ── Tiny loan status badge ─────────────────────────────────────────────────
function LoanStatusBadge({ status }) {
  const map = {
    open:        'text-emerald-600 bg-emerald-500/10',
    in_progress: 'text-primary bg-primary/10',
    closed:      'text-muted-foreground bg-muted',
    cancelled:   'text-destructive bg-destructive/10',
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${map[status] || 'bg-muted text-muted-foreground'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// ── Offers list + status badge ──────────────────────────────────────────────
function OffersList({ loading, items, renderRow, emptyLabel }) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">{emptyLabel}</p>;
  }
  return (
    <AnimatePresence initial={false}>
      <div className="divide-y divide-border">{items.map(renderRow)}</div>
    </AnimatePresence>
  );
}

function OfferStatusBadge({ status }) {
  const map = {
    pending:  'text-amber-600 bg-amber-500/10',
    accepted: 'text-emerald-600 bg-emerald-500/10',
    rejected: 'text-destructive bg-destructive/10',
  };
  return (
    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${map[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}