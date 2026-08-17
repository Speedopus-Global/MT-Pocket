import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import MessageButton from '../components/ui/MessageButton';
import NotificationDrawer from '../components/notifications/NotificationDrawer';
import OfferAcceptDialog from '../components/ui/OfferAcceptDialog';
import InfoBanner from '../components/ui/InfoBanner';
import {
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  ArrowUpRight,
  Handshake,
  Info,
  Loader2,
  X,
  TrendingUp,
  Banknote,
  Hospital,
  GraduationCap,
  Briefcase,
  User as UserIcon,
  Lightbulb,
  MapPin,
  CalendarDays,
  Shield,
  HelpCircle,
  CheckCircle,
  Search,
  ExternalLink
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

function lenderIdOf(offer) {
  return typeof offer.lenderId === 'object' ? offer.lenderId?._id : offer.lenderId;
}
function lenderNameOf(offer) {
  return typeof offer.lenderId === 'object' ? offer.lenderId?.fullName : null;
}

export default function Dashboard() {
  const { user, accessToken } = useAuth();

  // Offers state lists
  const [myLoans, setMyLoans]             = useState([]);
  const [myLoansLoading, setMyLoansLoading] = useState(false);
  const [sentOffers, setSentOffers]       = useState([]);
  const [sentOffersLoading, setSentOffersLoading] = useState(false);

  // Selected tab: pending / accepted / rejected
  const [offersTab, setOffersTab]         = useState('pending');

  // Modal profile preview state
  const [previewContext, setPreviewContext] = useState(null);

  // Offer dialog state
  const [pendingAccept, setPendingAccept] = useState(null); // { loanRequestId, offerId }
  const [pendingReject, setPendingReject] = useState(null); // { loanRequestId, offerId }

  const isLender   = user?.role === 'lender'   || user?.role === 'both';
  const isBorrower = user?.role === 'borrower' || user?.role === 'both';

  // Fetch borrower requests
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

  // Received offers flat mapped
  const receivedOffers = myLoans.flatMap((loan) =>
    (loan.offers || []).map((o) => ({ ...o, loanRequest: loan }))
  );

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

  const pendingReceivedCount = receivedOffers.filter((o) => o.status === 'pending').length;
  const pendingSentCount = sentOffers.filter((o) => o.status === 'pending').length;
  const totalMatchesCount = receivedOffers.filter((o) => o.status === 'accepted').length + sentOffers.filter((o) => o.status === 'accepted').length;

  return (
    <div className="flex-1 flex flex-col space-y-6 w-full min-h-full">
      {/* ── TOP EXECUTIVE HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Dashboard Overview
            </h1>
            {user.identityVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                <ShieldCheck size={13} /> Verified Member
              </span>
            ) : (
              <Link
                to="/dashboard/settings"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full transition-colors"
              >
                <ShieldAlert size={13} /> Complete KYC
              </Link>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Welcome back, <span className="text-foreground font-bold">{user.fullName || 'Member'}</span>. Monitor your active loan proposals, matches, and messaging in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-xs transition-colors cursor-pointer"
          >
            <Search size={14} />
            <span>Explore Marketplace</span>
          </Link>
          <NotificationDrawer accessToken={accessToken} />
        </div>
      </div>

      {/* ── KPI METRICS CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Active Requests</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Banknote size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">{myLoans.length}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Borrowing listings posted</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Proposals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">
              {isBorrower ? pendingReceivedCount : pendingSentCount}
            </span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isBorrower ? `${pendingReceivedCount} awaiting your review` : `${pendingSentCount} sent to borrowers`}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Accepted Matches</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Handshake size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-foreground">{totalMatchesCount}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active lending agreements</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Account Role</span>
            <div className="w-8 h-8 rounded-xl bg-muted text-foreground flex items-center justify-center">
              <UserIcon size={16} />
            </div>
          </div>
          <div>
            <span className="text-lg font-black text-foreground capitalize">{user.role}</span>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              <Link to="/dashboard/settings" className="text-primary hover:underline font-bold">
                Manage Profile →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* New offers notification banner */}
      {pendingReceivedCount > 0 && (
        <InfoBanner variant="info" dismissible={true}>
          You have <strong>{pendingReceivedCount} new offer{pendingReceivedCount > 1 ? 's' : ''}</strong> on your active requests. Review terms and connect with lenders below.
        </InfoBanner>
      )}

      {/* ── ACTIVE PROPOSALS & MATCHES SECTION ──────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2.5">
            <Handshake className="text-primary h-5 w-5" />
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">Active Proposals &amp; Matches</h2>
              <p className="text-xs text-muted-foreground">Manage your incoming and outgoing loan negotiations</p>
            </div>
          </div>

          {/* 3-way toggle pill */}
          <div className="flex rounded-xl border border-border/80 p-1 bg-muted/40 self-start sm:self-auto">
            {OFFER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setOffersTab(tab.value)}
                className={`relative px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  offersTab === tab.value ? 'text-primary-foreground bg-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proposals content */}
        <div className="space-y-8">
          {/* LENDER MODE SECTION */}
          {isLender && (
            <div>
              {isBorrower && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Offers Sent (As Lender)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                    {offersTab}
                  </span>
                </div>
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
                      className="rounded-xl border border-border/80 bg-background/50 p-4 hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <CategoryIcon size={16} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">
                                ₹{o.amount?.toLocaleString()}
                              </h4>
                              <p className="text-[11px] text-muted-foreground font-semibold">
                                {CATEGORY_LABELS[o.category] || o.category} Loan
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            o.loanRequestStatus === 'open' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            {o.loanRequestStatus}
                          </span>
                        </div>

                        {/* Middle body */}
                        <div className="space-y-1 text-xs font-medium bg-card p-3 rounded-lg border border-border/50 mb-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Borrower:</span>
                            <button
                              onClick={() => setPreviewContext({
                                userId: o.borrower?._id,
                                loanRequestId: o.loanRequestId,
                                lenderId: user.id,
                              })}
                              className="text-primary hover:underline font-bold cursor-pointer"
                            >
                              {o.borrower?.fullName || 'View Profile'}
                            </button>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Offered Rate:</span>
                            <span className="text-foreground font-bold">{o.offeredRate}%</span>
                          </div>
                          {o.message && (
                            <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40 mt-1 line-clamp-2">
                              "{o.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div>
                        <div className="mb-2">
                          <MessageButton loanRequestId={o.loanRequestId} lenderId={user.id} className="w-full justify-center h-8 text-xs" />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium pt-1">
                          <span>Sent {new Date(o.createdAt).toLocaleDateString()}</span>
                          <span className="capitalize font-bold text-foreground">{o.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}

          {isLender && isBorrower && <Separator className="my-6" />}

          {/* BORROWER MODE SECTION */}
          {isBorrower && (
            <div>
              {isLender && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Offers Received (As Borrower)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase">
                    {offersTab}
                  </span>
                </div>
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
                      className="rounded-xl border border-border/80 bg-background/50 p-4 hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <CategoryIcon size={16} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-foreground">
                                ₹{o.loanRequest.amount?.toLocaleString()}
                              </h4>
                              <p className="text-[11px] text-muted-foreground font-semibold">
                                {CATEGORY_LABELS[o.loanRequest.category] || o.loanRequest.category}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md capitalize">
                            {o.loanRequest.status}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1 text-xs font-medium bg-card p-3 rounded-lg border border-border/50 mb-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Lender:</span>
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
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Offered Rate:</span>
                            <span className="text-foreground font-bold">{o.offeredRate}%</span>
                          </div>
                          {o.message && (
                            <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40 mt-1 line-clamp-2">
                              "{o.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {lId && <MessageButton loanRequestId={o.loanRequest._id} lenderId={lId} className="flex-1 justify-center h-8 text-xs" />}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {o.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => setPendingAccept({ loanRequestId: o.loanRequest._id, offerId: o._id })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => setPendingReject({ loanRequestId: o.loanRequest._id, offerId: o._id })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer"
                                >
                                  Decline
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] capitalize text-muted-foreground font-bold">{o.status}</span>
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
      </div>

      {/* ── SECURITY / ADVISORY FOOTNOTE ─────────────────────────────── */}
      <div className="rounded-xl border border-border/70 bg-card p-4 flex items-start gap-3 text-xs text-muted-foreground">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-semibold">Security Note:</strong> Always verify identity credentials and agree on repayment terms securely. MT Pocket facilitates peer connections and matches but never holds funds or enforces payments directly.
        </p>
      </div>

      {/* ── USER PROFILE PREVIEW MODAL ───────────────────────────────── */}
      <AnimatePresence>
        {previewContext && (
          <ProfilePreviewModal
            context={previewContext}
            onClose={() => setPreviewContext(null)}
            accessToken={accessToken}
          />
        )}
      </AnimatePresence>

      {/* Offer Accept Dialog */}
      <OfferAcceptDialog
        open={!!pendingAccept}
        variant="accept"
        onConfirm={async () => {
          const { loanRequestId, offerId } = pendingAccept;
          setPendingAccept(null);
          await acceptOffer(loanRequestId, offerId);
        }}
        onCancel={() => setPendingAccept(null)}
      />

      {/* Offer Reject Dialog */}
      <OfferAcceptDialog
        open={!!pendingReject}
        variant="reject"
        onConfirm={async () => {
          const { loanRequestId, offerId } = pendingReject;
          setPendingReject(null);
          await rejectOffer(loanRequestId, offerId);
        }}
        onCancel={() => setPendingReject(null)}
      />
    </div>
  );
}

function OffersGrid({ loading, items, renderCard, emptyLabel }) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/70 bg-muted/20 text-muted-foreground text-xs font-medium">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(renderCard)}
    </div>
  );
}

function ProfilePreviewModal({ context, onClose, accessToken }) {
  const { userId, loanRequestId, lenderId } = context;

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
    unset: 'Member',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <span className="font-bold text-foreground text-sm">Member Profile Overview</span>
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
                <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex items-center justify-center ${profile.identityVerified ? 'border-emerald-500' : 'border-border'}`}>
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
                <MessageButton loanRequestId={loanRequestId} lenderId={lenderId} className="flex-1 justify-center text-xs h-9" />
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
                            placeholder="Add details about the infraction…"
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