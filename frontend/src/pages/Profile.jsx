import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { VerificationBanner, useVerificationBanner } from '../components/VerificationBanner';
import {
  Loader2,
  ShieldCheck,
  Shield,
  MapPin,
  CalendarDays,
  PlusCircle,
  X,
  Banknote,
  Tag,
  Hospital,
  GraduationCap,
  Briefcase,
  User as UserIcon,
  Lightbulb,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  Undo
} from 'lucide-react';
import { Separator } from '../components/ui/separator';
import InfoBanner from '../components/ui/InfoBanner';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 15 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 350, damping: 26 } },
  exit:    { opacity: 0, scale: 0.95, y: 15, transition: { duration: 0.15 } },
};

export default function Profile() {
  const { user, accessToken } = useAuth();

  // Basic lists
  const [myLoans, setMyLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(false);
  
  const [myOffers, setMyOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Error/Success state
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const isLender = user?.role === 'lender' || user?.role === 'both';
  const isBorrower = user?.role === 'borrower' || user?.role === 'both';

  // Active sub-tab inside Profile page: 'loans' or 'offers'
  const [activeTab, setActiveTab] = useState(isBorrower ? 'loans' : 'offers');

  useEffect(() => {
    if (isBorrower) setActiveTab('loans');
    else setActiveTab('offers');
  }, [user?.role]);

  // Fetch Loans
  const fetchLoans = async () => {
    if (!isBorrower || !accessToken) return;
    setLoansLoading(true);
    try {
      const res = await api.getMyLoanRequests(accessToken);
      setMyLoans(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoansLoading(false);
    }
  };

  // Fetch Offers Sent
  const fetchOffers = async () => {
    if (!isLender || !accessToken) return;
    setOffersLoading(true);
    try {
      const res = await api.getMyOffersSent(accessToken);
      setMyOffers(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOffersLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchOffers();
  }, [accessToken, user?.role]);

  // Close loan request
  const handleCloseLoan = async (loanId) => {
    if (!window.confirm('Are you sure you want to close this loan request?')) return;
    setActionError('');
    setActionSuccess('');
    try {
      await api.closeLoanRequest(loanId, accessToken);
      setActionSuccess('Loan request closed successfully.');
      fetchLoans();
    } catch (err) {
      setActionError(err.message || 'Failed to close loan request.');
    }
  };

  // Withdraw sent offer
  const handleWithdrawOffer = async (loanRequestId, offerId) => {
    if (!window.confirm('Are you sure you want to withdraw this offer?')) return;
    setActionError('');
    setActionSuccess('');
    try {
      await api.withdrawOffer(loanRequestId, offerId, accessToken);
      setActionSuccess('Offer withdrawn successfully.');
      fetchOffers();
    } catch (err) {
      setActionError(err.message || 'Failed to withdraw offer.');
    }
  };

  const handleEditClick = (loan) => {
    setSelectedLoan(loan);
    setEditModalOpen(true);
  };

  const handleLoanCreated = () => {
    setCreateModalOpen(false);
    setActionSuccess('Loan request created successfully!');
    fetchLoans();
  };

  const handleLoanUpdated = () => {
    setEditModalOpen(false);
    setSelectedLoan(null);
    setActionSuccess('Loan request updated successfully!');
    fetchLoans();
  };

  if (!user) return null;

  return (
    <motion.div
      className="flex-1 flex flex-col min-h-full w-full px-3 sm:px-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Profile Header (Instagram style) */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 md:gap-16 pt-4 sm:pt-6 pb-6 sm:pb-8"
      >
        {/* Left Side: Circular Avatar with Verified Ring */}
        <div className="relative shrink-0">
          <div className={`rounded-full p-[3.5px] flex items-center justify-center ${user.identityVerified ? 'bg-gradient-to-tr from-primary via-emerald-500 to-accent' : 'bg-muted border border-border'}`}>
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-sidebar bg-card flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center text-4xl">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Details & Stats */}
        <div className="flex-1 flex flex-col text-center md:text-left">
          {/* Row 1: Name and Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h1 className="text-xl sm:text-2xl font-normal text-foreground tracking-tight">
                {user.fullName || 'Member Profile'}
              </h1>
              {user.identityVerified ? (
                <ShieldCheck size={20} className="text-emerald-500 shrink-0" title="Verified Identity" />
              ) : (
                <Shield size={20} className="text-muted-foreground/60 shrink-0" title="Unverified Identity" />
              )}
            </div>

            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              {isBorrower && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/95 transition-all shadow-sm hover:shadow cursor-pointer"
                >
                  Create Loan Request
                </button>
              )}
              <Link
                to="/dashboard/settings"
                className="px-4 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Row 2: Stats (Desktop) */}
          <div className="hidden sm:flex items-center gap-8 text-sm text-muted-foreground my-4">
            <span>
              <strong className="text-foreground font-semibold">{myLoans.length}</strong> loan requests
            </span>
            <span>
              <strong className="text-foreground font-semibold">{myOffers.length}</strong> offers sent
            </span>
            <span className="capitalize">
              <strong className="text-foreground font-semibold">{user.role}</strong> account
            </span>
          </div>

          {/* Row 3: Bio and Information */}
          <div className="mt-3 md:mt-0 space-y-1 text-sm text-foreground/90 font-normal">
            <p className="font-semibold text-foreground tracking-tight capitalize">
              {user.fullName || 'Member Profile'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground justify-center md:justify-start">
              {(user.city || user.state) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {[user.city, user.state].filter(Boolean).join(', ')}
                </span>
              )}
              {user.createdAt && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={13} />
                  Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
            <div className="mt-2 flex justify-center md:justify-start">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${user.identityVerified ? 'text-emerald-600 bg-emerald-500/10' : 'text-amber-600 bg-amber-500/10'}`}>
                {user.identityVerified ? '✓ Identity Verified' : '⚠ Identity Unverified'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Row 2: Stats (Mobile) */}
      <div className="flex sm:hidden border-y border-border/50 py-3 justify-around text-xs text-center text-muted-foreground my-2 w-full">
        <div>
          <strong className="block text-foreground font-semibold text-sm">{myLoans.length}</strong> loan requests
        </div>
        <div>
          <strong className="block text-foreground font-semibold text-sm">{myOffers.length}</strong> offers sent
        </div>
        <div className="capitalize">
          <strong className="block text-foreground font-semibold text-sm">{user.role}</strong> account
        </div>
      </div>

      {/* Action status popups */}
      <AnimatePresence mode="wait">
        {actionError && (
          <motion.div
            key="action-err"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
          >
            {actionError}
          </motion.div>
        )}
        {actionSuccess && (
          <motion.div
            key="action-ok"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 font-semibold"
          >
            {actionSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instagram-style Tabs Selector */}
      <motion.div variants={itemVariants} className="flex justify-center border-t border-border/60 mt-4 sm:mt-8">
        <div className="flex gap-12 -mt-[1.5px]">
          {isBorrower && (
            <button
              onClick={() => setActiveTab('loans')}
              className={`flex items-center gap-1.5 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'loans'
                  ? 'border-t-2 border-foreground text-foreground'
                  : 'border-t border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Banknote size={14} />
              <span>My Loans</span>
            </button>
          )}
          {isLender && (
            <button
              onClick={() => setActiveTab('offers')}
              className={`flex items-center gap-1.5 pt-4 pb-2 text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'offers'
                  ? 'border-t-2 border-foreground text-foreground'
                  : 'border-t border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tag size={14} />
              <span>My Offers</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {/* Borrower Content Panel */}
        {activeTab === 'loans' && isBorrower && (
          <motion.div
            variants={itemVariants}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">Your Loan Requests</h2>
              <span className="text-xs text-muted-foreground font-semibold">{myLoans.length} total requests</span>
            </div>

            {loansLoading ? (
              <div className="flex justify-center py-16 text-muted-foreground">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : myLoans.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-border border-dashed bg-card">
                <Banknote size={40} className="mx-auto text-muted-foreground/60 mb-3" />
                <p className="text-base font-bold text-foreground">No loan requests created yet</p>
                <p className="text-sm text-muted-foreground mt-1">Need money? Create a loan request above to get matching offers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myLoans.map((loan) => {
                  const CategoryIcon = CATEGORY_ICONS[loan.category] || HelpCircle;
                  return (
                    <div
                      key={loan._id}
                      className="rounded-2xl border border-primary/20 bg-card p-5 shadow-xs hover:shadow-md hover:border-primary hover:bg-primary/[0.01] transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <CategoryIcon size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                                ₹{loan.amount.toLocaleString()}
                              </h3>
                              <p className="text-xs text-muted-foreground font-semibold">
                                {CATEGORY_LABELS[loan.category] || loan.category}
                              </p>
                            </div>
                          </div>
                          <LoanStatusBadge status={loan.status} />
                        </div>

                        {/* Description */}
                        <p className="text-sm text-foreground line-clamp-3 mb-4 leading-relaxed">
                          {loan.description}
                        </p>

                        <Separator className="my-4" />

                        {/* Details row */}
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground font-semibold mb-4">
                          {loan.interestRateHint != null && (
                            <div>
                              <span className="block text-[10px] uppercase text-muted-foreground/80 mb-0.5">Interest Hint</span>
                              <span className="text-foreground text-sm font-bold">{loan.interestRateHint}% per year</span>
                            </div>
                          )}
                          {loan.durationDays != null && (
                            <div>
                              <span className="block text-[10px] uppercase text-muted-foreground/80 mb-0.5">Duration</span>
                              <span className="text-foreground text-sm font-bold">{loan.durationDays} days</span>
                            </div>
                          )}
                          {(loan.city || loan.state) && (
                            <div className="col-span-2">
                              <span className="block text-[10px] uppercase text-muted-foreground/80 mb-0.5">Preferred Area</span>
                              <span className="text-foreground text-sm font-bold inline-flex items-center gap-1">
                                <MapPin size={12} /> {[loan.city, loan.state].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                            {loan.offers?.length || 0} Offers Received
                          </span>
                          
                          <div className="flex gap-2">
                            {loan.status === 'open' && (
                              <>
                                <button
                                  onClick={() => handleEditClick(loan)}
                                  className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                  title="Edit Request"
                                >
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  onClick={() => handleCloseLoan(loan._id)}
                                  className="p-2 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive transition-all cursor-pointer"
                                  title="Close Request"
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Lender Content Panel */}
        {activeTab === 'offers' && isLender && (
          <motion.div
            variants={itemVariants}
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">Your Offers Sent</h2>
              <span className="text-xs text-muted-foreground font-semibold">{myOffers.length} total offers</span>
            </div>

            {offersLoading ? (
              <div className="flex justify-center py-16 text-muted-foreground">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : myOffers.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-border border-dashed bg-card">
                <PlusCircle size={40} className="mx-auto text-muted-foreground/60 mb-3" />
                <p className="text-base font-bold text-foreground">No offers sent yet</p>
                <p className="text-sm text-muted-foreground mt-1">Browse the Marketplace page to send investment offers to borrowers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myOffers.map((offer) => {
                  const CategoryIcon = CATEGORY_ICONS[offer.category] || HelpCircle;
                  return (
                    <div
                      key={offer.offerId}
                      className="rounded-2xl border border-primary/20 bg-card p-5 shadow-xs hover:shadow-md hover:border-primary hover:bg-primary/[0.01] transition-all duration-300 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                              <CategoryIcon size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-extrabold text-foreground tracking-tight">
                                ₹{offer.amount.toLocaleString()}
                              </h3>
                              <p className="text-xs text-muted-foreground font-semibold">
                                {CATEGORY_LABELS[offer.category] || offer.category} request
                              </p>
                            </div>
                          </div>
                          <OfferStatusBadge status={offer.status} />
                        </div>

                        {/* Bid Details */}
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 mb-4">
                          <div className="flex justify-between items-center text-sm font-semibold text-foreground mb-1.5">
                            <span>Offered Interest Rate</span>
                            <span className="text-primary font-bold text-base">{offer.offeredRate}%</span>
                          </div>
                          {offer.message && (
                            <p className="text-xs text-muted-foreground italic line-clamp-2 mt-1">
                              "{offer.message}"
                            </p>
                          )}
                        </div>

                        <Separator className="my-4" />

                        {/* Request Context info */}
                        <div className="text-xs text-muted-foreground font-semibold space-y-1">
                          <p>
                            Borrower:{' '}
                            <span className="text-foreground font-bold">
                              {offer.borrower?.fullName || 'Anonymous User'}
                            </span>
                          </p>
                          <p>
                            Status:{' '}
                            <span className="text-foreground capitalize font-bold">
                              {offer.loanRequestStatus?.replace('_', ' ')}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Offer Action Row */}
                      <div>
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">
                            Sent {new Date(offer.createdAt).toLocaleDateString()}
                          </span>

                          {offer.status === 'pending' && (
                            <button
                              onClick={() => handleWithdrawOffer(offer.loanRequestId, offer.offerId)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-all cursor-pointer"
                            >
                              <Undo size={13} />
                              <span>Withdraw Offer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* CREATE LOAN REQUEST MODAL */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-lg max-h-[90vh] rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50 bg-card shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Banknote size={18} />
                  </div>
                  <h3 className="font-extrabold text-foreground text-base sm:text-lg">Create Loan Request</h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                <LoanRequestForm
                  accessToken={accessToken}
                  onCreated={handleLoanCreated}
                  onCancel={() => setCreateModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT LOAN REQUEST MODAL */}
      <AnimatePresence>
        {editModalOpen && selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-lg max-h-[90vh] rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50 bg-card shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Edit2 size={18} />
                  </div>
                  <h3 className="font-extrabold text-foreground text-base sm:text-lg">Edit Loan Request</h3>
                </div>
                <button
                  onClick={() => { setEditModalOpen(false); setSelectedLoan(null); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                <LoanRequestForm
                  accessToken={accessToken}
                  loan={selectedLoan}
                  onCreated={handleLoanUpdated}
                  onCancel={() => { setEditModalOpen(false); setSelectedLoan(null); }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Status Badges helpers
function LoanStatusBadge({ status }) {
  const map = {
    open:        'text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20',
    in_progress: 'text-primary bg-primary/10 dark:bg-primary/20',
    closed:      'text-muted-foreground bg-muted dark:bg-muted/20',
    cancelled:   'text-destructive bg-destructive/10 dark:bg-destructive/20',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${map[status] || 'bg-muted text-muted-foreground'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function OfferStatusBadge({ status }) {
  const map = {
    pending:   'text-amber-600 bg-amber-500/10 dark:bg-amber-500/20',
    accepted:  'text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20',
    rejected:  'text-destructive bg-destructive/10 dark:bg-destructive/20',
    withdrawn: 'text-muted-foreground bg-muted dark:bg-muted/20',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${map[status] || 'bg-muted text-muted-foreground'}`}>
      {status}
    </span>
  );
}

// Loan request creation and editing form component
function LoanRequestForm({ accessToken, loan, onCreated, onCancel }) {
  const isEditing = !!loan;
  
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
  const { showVerificationBanner, verificationBannerProps } = useVerificationBanner();

  useEffect(() => {
    if (loan) {
      setForm({
        amount:           loan.amount || '',
        category:         loan.category || 'personal',
        description:      loan.description || '',
        interestRateHint: loan.interestRateHint || '',
        durationDays:     loan.durationDays || '',
        city:              loan.city || '',
        state:             loan.state || '',
      });
    }
  }, [loan]);

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
        interestRateHint: form.interestRateHint ? Number(form.interestRateHint) : undefined,
        durationDays:     form.durationDays ? Number(form.durationDays) : undefined,
        city:             form.city.trim() || undefined,
        state:            form.state.trim() || undefined,
      };
      
      let result;
      if (isEditing) {
        result = await api.updateLoanRequest(loan._id, payload, accessToken);
      } else {
        result = await api.createLoanRequest(payload, accessToken);
      }
      onCreated(result);
    } catch (err) {
      if (err.requiresFullVerification) {
        showVerificationBanner(err.verificationStatus);
        return;
      }
      setError(err.message || 'Submission failed — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const LOAN_CATEGORIES = [
    { value: 'medical',   label: 'Medical',   icon: Hospital },
    { value: 'education', label: 'Education', icon: GraduationCap },
    { value: 'business',  label: 'Business',  icon: Briefcase },
    { value: 'personal',  label: 'Personal',  icon: UserIcon },
    { value: 'other',     label: 'Other',     icon: Lightbulb },
  ];

  const inputCls = "w-full rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-text";
  const labelCls = "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block";

  return (
    <>
      <VerificationBanner {...verificationBannerProps} />
      <form onSubmit={submit} className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
      {/* 🔵 Step 5 Disclaimer — one-time borrower alert */}
      <InfoBanner variant="info" dismissible={true} storageKey="mt_borrower_disclaimer_seen">
        MT Pocket never handles your money — all payment happens directly between you and the lender.
      </InfoBanner>

      {/* Amount */}
      <div>
        <label className={labelCls}>Amount (₹) *</label>
        <input
          type="number"
          min="1"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          placeholder="Enter loan amount in ₹"
          className={inputCls}
        />
      </div>

      {/* Category Selection */}
      <div>
        <label className={labelCls}>Category *</label>
        <div className="flex flex-wrap gap-2">
          {LOAN_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = form.category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => set('category', cat.value)}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <CatIcon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description *</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Enter description and purpose of loan…"
          maxLength={2000}
          className={`${inputCls} resize-none`}
        />
        <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.description.length}/2000</p>
      </div>

      {/* Interest rate & duration */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Interest hint (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.interestRateHint}
            onChange={(e) => set('interestRateHint', e.target.value)}
            placeholder="Enter proposed rate %"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Duration (days)</label>
          <input
            type="number"
            min="1"
            value={form.durationDays}
            onChange={(e) => set('durationDays', e.target.value)}
            placeholder="Enter duration in days"
            className={inputCls}
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Enter your city"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="Enter your state"
            className={inputCls}
          />
        </div>
      </div>


      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-xl border border-border text-foreground hover:bg-muted font-bold text-sm transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-5 py-3 rounded-xl hover:bg-primary/95 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          <span>{isEditing ? 'Save Changes' : 'Post Request'}</span>
        </button>
      </div>
    </form>
    </>
  );
}