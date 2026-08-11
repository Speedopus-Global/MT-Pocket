import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import MessageButton from '../components/ui/MessageButton';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Mail,
  Fingerprint,
  PlusCircle,
  ArrowUpRight,
  Coins,
  Handshake,
  Info,
  AlertTriangle,
  Loader2,
  Bell,
  X,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
  FileText,
  TrendingUp,
  Banknote,
  Tag,
  Hospital,
  GraduationCap,
  Briefcase,
  User as UserIcon,
  Lightbulb,
  MapPin,
  CalendarDays,
  Shield,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { Separator } from '../components/ui/separator';

const CATEGORY_ICONS = {
  medical: Hospital,
  education: GraduationCap,
  business: Briefcase,
  personal: UserIcon,
  other: Lightbulb,
};

const CATEGORY_LABELS = {
  medical: 'Medical',
  education: 'Education',
  business: 'Business',
  personal: 'Personal',
  other: 'Other',
};

const OFFER_TABS = [
  { value: 'pending',  label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

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
  new_message:            { color: 'text-primary',     bg: 'bg-primary/10',     icon: Bell },
};
const defaultMeta = { color: 'text-muted-foreground', bg: 'bg-muted', icon: Bell };

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 26 } },
  exit:    { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

function lenderIdOf(offer) {
  return typeof offer.lenderId === 'object' ? offer.lenderId?._id : offer.lenderId;
}
function lenderNameOf(offer) {
  return typeof offer.lenderId === 'object' ? offer.lenderId?.fullName : null;
}

export default function Dashboard() {
  const { user, accessToken } = useAuth();

  // Notifications
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifs, setNotifs]               = useState([]);
  const [unread, setUnread]               = useState(0);
  const [notifLoading, setNotifLoading]   = useState(false);
  const notifRef = useRef(null);

  // Offers state lists
  const [myLoans, setMyLoans]             = useState([]);
  const [myLoansLoading, setMyLoansLoading] = useState(false);
  const [sentOffers, setSentOffers]       = useState([]);
  const [sentOffersLoading, setSentOffersLoading] = useState(false);

  // Selected tab: pending / accepted / rejected
  const [offersTab, setOffersTab]         = useState('pending');

  // Modal profile preview state — carries loanRequestId + lenderId
  // alongside the previewed userId, since MessageButton (used inside the
  // modal) needs the actual offer relationship, not just "who is this".
  const [previewContext, setPreviewContext] = useState(null);

  const isLender   = user?.role === 'lender'   || user?.role === 'both';
  const isBorrower = user?.role === 'borrower' || user?.role === 'both';

  // Unread count
  useEffect(() => {
    if (!accessToken) return;
    api.getUnreadCount(accessToken)
      .then((count) => setUnread(count ?? 0))
      .catch(() => {});
  }, [accessToken]);

  // Notifications loader
  useEffect(() => {
    if (!notifOpen || !accessToken) return;
    setNotifLoading(true);
    api.getNotifications(accessToken)
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [notifOpen, accessToken]);

  // Outside click close notifications
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch borrower requests (has nested offers received)
  const fetchBorrowerLoans = () => {
    if (!isBorrower || !accessToken) return;
    setMyLoansLoading(true);
    api.getMyLoanRequests(accessToken)
      .then(setMyLoans)
      .catch(() => {})
      .finally(() => setMyLoansLoading(false));
  };

  // Fetch sent offers
  const fetchLenderOffers = () => {
    if (!isLender || !accessToken) return;
    setSentOffersLoading(true);
    api.getMyOffersSent(accessToken)
      .then(setSentOffers)
      .catch(() => {})
      .finally(() => setSentOffersLoading(false));
  };

  useEffect(() => {
    fetchBorrowerLoans();
    fetchLenderOffers();
  }, [isBorrower, isLender, accessToken]);

  const markAllRead = async () => {
    await api.markAllNotificationsRead(accessToken).catch(() => {});
    setUnread(0);
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };

  // Received offers flat mapped
  const receivedOffers = myLoans.flatMap((loan) =>
    (loan.offers || []).map((o) => ({ ...o, loanRequest: loan }))
  );

  const acceptOffer = async (loanRequestId, offerId) => {
    if (!window.confirm('Are you sure you want to accept this offer? This will transition the request to "In Progress".')) return;
    try {
      const updated = await api.acceptOffer(loanRequestId, offerId, accessToken);
      setMyLoans((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
    } catch (err) {
      console.error('Failed to accept offer:', err.message);
    }
  };

  const rejectOffer = async (loanRequestId, offerId) => {
    if (!window.confirm('Are you sure you want to decline this offer?')) return;
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
      {/* HEADER SECTION */}
      <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
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
            Track and manage your borrowing and lending matches in real-time.
          </p>
        </div>

        {/* Notifications */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-3 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={20} />
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
                className="absolute right-0 top-14 w-80 rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-50"
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

      {/* OFFERS MONOLITHIC CARD VIEW */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
          <div className="flex items-center gap-2.5">
            <Handshake className="text-primary h-6 w-6" />
            <h2 className="font-extrabold text-2xl text-foreground tracking-tight">Active Proposals & Matches</h2>
          </div>

          {/* Sliding 3-way toggle: Pending / Accepted / Rejected */}
          <div className="relative flex rounded-xl border border-border p-1 bg-muted/40 self-start">
            {OFFER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setOffersTab(tab.value)}
                className={`relative z-10 px-5 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  offersTab === tab.value ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {offersTab === tab.value && (
                  <motion.span
                    layoutId="offers-tab-pill-dash"
                    className="absolute inset-0 -z-10 rounded-lg bg-primary"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Both, Single Lender, Single Borrower Lists */}
        <div className="space-y-8">
          {/* LENDER MODE SECTION */}
          {isLender && (
            <div>
              {isBorrower && (
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Offers Sent (As Lender) — {offersTab} status
                </h3>
              )}
              
              <OffersGrid
                loading={sentOffersLoading}
                items={sentOffers.filter((o) => o.status === offersTab)}
                emptyLabel={
                  offersTab === 'pending'  ? "You don't have any pending sent offers." :
                  offersTab === 'accepted' ? 'No offers accepted yet.' :
                                              'No rejected offers in this view.'
                }
                renderCard={(o) => {
                  const CategoryIcon = CATEGORY_ICONS[o.category] || HelpCircle;
                  return (
                    <div
                      key={o.offerId}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/10 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <CategoryIcon size={18} />
                            </div>
                            <div>
                              <h4 className="text-base font-extrabold text-foreground tracking-tight">
                                ₹{o.amount.toLocaleString()}
                              </h4>
                              <p className="text-xs text-muted-foreground font-semibold">
                                {CATEGORY_LABELS[o.category] || o.category} Request
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            o.loanRequestStatus === 'open' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            {o.loanRequestStatus}
                          </span>
                        </div>

                        <Separator className="my-3.5" />

                        {/* Middle body */}
                        <div className="space-y-1.5 text-sm font-medium">
                          <p className="text-muted-foreground">
                            Borrower:{' '}
                            <button
                              onClick={() => setPreviewContext({
                                userId: o.borrower?._id,
                                loanRequestId: o.loanRequestId,
                                lenderId: user.id, // we're the lender in this thread
                              })}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              {o.borrower?.fullName || 'View Profile'}
                            </button>
                          </p>
                          <p className="text-muted-foreground">
                            Offered Rate: <span className="text-foreground font-bold">{o.offeredRate}%</span>
                          </p>
                          {o.message && (
                            <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">
                              "{o.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div>
                        <Separator className="my-3.5" />
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <MessageButton loanRequestId={o.loanRequestId} lenderId={user.id} />
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Sent {new Date(o.createdAt).toLocaleDateString()}</span>
                          <span className="capitalize text-foreground font-bold">{o.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}

          {isLender && isBorrower && <Separator className="my-8" />}

          {/* BORROWER MODE SECTION */}
          {isBorrower && (
            <div>
              {isLender && (
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Offers Received (As Borrower) — {offersTab} status
                </h3>
              )}

              <OffersGrid
                loading={myLoansLoading}
                items={receivedOffers.filter((o) => o.status === offersTab)}
                emptyLabel={
                  offersTab === 'pending'  ? 'No pending proposals received.' :
                  offersTab === 'accepted' ? 'No offers accepted yet.' :
                                              'No rejected offers.'
                }
                renderCard={(o) => {
                  const CategoryIcon = CATEGORY_ICONS[o.loanRequest.category] || HelpCircle;
                  const lId = lenderIdOf(o);
                  const lName = lenderNameOf(o);
                  return (
                    <div
                      key={o._id}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/10 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <CategoryIcon size={18} />
                            </div>
                            <div>
                              <h4 className="text-base font-extrabold text-foreground tracking-tight">
                                ₹{o.loanRequest.amount.toLocaleString()}
                              </h4>
                              <p className="text-xs text-muted-foreground font-semibold">
                                {CATEGORY_LABELS[o.loanRequest.category] || o.loanRequest.category}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-primary/5 text-primary px-2 py-0.5 rounded-full capitalize">
                            {o.loanRequest.status}
                          </span>
                        </div>

                        <Separator className="my-3.5" />

                        {/* Bid Proposal Details */}
                        <div className="space-y-1.5 text-sm font-medium">
                          <p className="text-muted-foreground">
                            Lender:{' '}
                            {lId ? (
                              <button
                                onClick={() => setPreviewContext({
                                  userId: lId,
                                  loanRequestId: o.loanRequest._id,
                                  lenderId: lId,
                                })}
                                className="text-primary hover:underline font-bold cursor-pointer"
                              >
                                {lName || 'View Profile'}
                              </button>
                            ) : (
                              <span className="text-foreground font-bold">Anonymous</span>
                            )}
                          </p>
                          <p className="text-muted-foreground">
                            Offered Rate: <span className="text-foreground font-bold">{o.offeredRate}%</span>
                          </p>
                          {o.message && (
                            <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">
                              "{o.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div>
                        <Separator className="my-3.5" />
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {lId && <MessageButton loanRequestId={o.loanRequest._id} lenderId={lId} />}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Received {new Date(o.createdAt).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-2">
                            {o.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => acceptOffer(o.loanRequest._id, o._id)}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => rejectOffer(o.loanRequest._id, o._id)}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className="text-xs capitalize text-muted-foreground font-bold">{o.status}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* SECURITY / ADVISORY CARD */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-md">
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground shrink-0 mt-0.5">
            <Info size={18} />
          </span>
          <div>
            <h4 className="font-extrabold text-foreground text-sm">Escrow matching advisory note</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Always negotiate loan repayments and agreement parameters securely within the application parameters. MT Pocket handles location searches, risk-mitigation data, and match logging. Remember to manually examine verified IDs when confirming transfers.
            </p>
          </div>
        </div>
      </motion.div>

      {/* USER PROFILE DETAILS MODAL (INSTEAD OF NAVIGATION) */}
      <AnimatePresence>
        {previewContext && (
          <ProfilePreviewModal
            context={previewContext}
            onClose={() => setPreviewContext(null)}
            accessToken={accessToken}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Grid helper component
function OffersGrid({ loading, items, renderCard, emptyLabel }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10 font-medium">{emptyLabel}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(renderCard)}
    </div>
  );
}

// Profile Preview Modal
// context = { userId, loanRequestId, lenderId } — loanRequestId/lenderId
// are what the Message button below needs to open the right chat thread;
// userId is who the profile itself belongs to.
function ProfilePreviewModal({ context, onClose, accessToken }) {
  const { userId, loanRequestId, lenderId } = context;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Safety actions state
  const [showSafety, setShowSafety] = useState(false);
  const [safetyMode, setSafetyMode] = useState('report'); // 'report' | 'block'
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
      setSafetyMessage('Report submitted successfully to the administrators.');
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
      setSafetyMessage('User has been blocked. Reloading matching items…');
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
    unset: 'Member',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <span className="font-extrabold text-foreground text-base">User Profile Overview</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-6 text-destructive flex flex-col items-center gap-2">
              <ShieldAlert size={28} />
              <p className="font-bold">{error}</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Card Basic info */}
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex items-center justify-center ${profile.identityVerified ? 'border-emerald-500' : 'border-muted'}`}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xl">
                      {profile.fullName ? profile.fullName[0].toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-foreground tracking-tight">
                      {profile.fullName || 'Unnamed Member'}
                    </h3>
                    {/* Separate green check vs grey shield logo */}
                    {profile.identityVerified ? (
                      <ShieldCheck size={18} className="text-emerald-500 shrink-0" title="Verified Identity" />
                    ) : (
                      <Shield size={18} className="text-muted-foreground/50 shrink-0" title="Unverified Identity" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase mt-0.5">
                    {ROLE_LABELS[profile.role] || 'Member'}
                  </p>
                </div>
              </div>

              {/* Location and Member date */}
              <div className="space-y-2 text-sm text-muted-foreground font-semibold">
                {(profile.city || profile.state) && (
                  <p className="inline-flex items-center gap-2 w-full">
                    <MapPin size={15} />
                    <span className="text-foreground">{[profile.city, profile.state].filter(Boolean).join(', ')}</span>
                  </p>
                )}
                {profile.createdAt && (
                  <p className="inline-flex items-center gap-2 w-full">
                    <CalendarDays size={15} />
                    <span className="text-foreground">
                      Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                  </p>
                )}
              </div>

              {!profile.identityVerified && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-700 font-semibold">
                  This member has not verified their identity records yet. Exercise caution.
                </div>
              )}

              <Separator />

              {/* Actions row: Message, Block & Report */}
              <div className="flex items-center justify-between gap-3">
                {/* Message — opens/creates the chat thread tied to this
                    offer relationship, then navigates to /dashboard/messages */}
                <MessageButton loanRequestId={loanRequestId} lenderId={lenderId} className="flex-1 justify-center" />

                {/* Safety options trigger */}
                <button
                  onClick={() => setShowSafety(!showSafety)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/20 text-destructive text-sm font-bold hover:bg-destructive/10 transition-all cursor-pointer"
                >
                  <ShieldAlert size={16} />
                  <span>Report / Block</span>
                </button>
              </div>

              {/* Block & Report forms wrapper */}
              <AnimatePresence>
                {showSafety && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-border bg-muted/30 p-4 space-y-4 overflow-hidden"
                  >
                    <div className="flex border-b border-border gap-4 pb-2">
                      <button
                        onClick={() => { setSafetyMode('report'); setSafetyMessage(''); }}
                        className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                          safetyMode === 'report' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Report
                      </button>
                      <button
                        onClick={() => { setSafetyMode('block'); setSafetyMessage(''); }}
                        className={`text-xs font-extrabold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                          safetyMode === 'block' ? 'text-destructive border-b-2 border-destructive' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Block
                      </button>
                    </div>

                    {safetyMessage && (
                      <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                        {safetyMessage}
                      </div>
                    )}

                    {safetyMode === 'report' ? (
                      <form onSubmit={handleReport} className="space-y-3.5">
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
                            placeholder="Add details about the infraction…"
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary cursor-text"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingSafety}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all cursor-pointer"
                        >
                          {submittingSafety && <Loader2 size={12} className="animate-spin" />}
                          <span>Submit Abuse Report</span>
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3 text-center">
                        <p className="text-xs text-muted-foreground leading-normal">
                          Blocking this member hides their loan requests and proposals from your feeds and prevents future interaction.
                        </p>
                        <button
                          type="button"
                          onClick={handleBlock}
                          disabled={submittingSafety}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90 transition-all cursor-pointer"
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