import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
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
      className="flex-1 flex flex-col space-y-8 min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Profile Header Details Card */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-border bg-card p-8 shadow-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              {/* Profile Ring: Green for verified, Grey/Border for unverified */}
              <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex items-center justify-center ${user.identityVerified ? 'border-emerald-500' : 'border-muted'}`}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary font-extrabold flex items-center justify-center text-3xl">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                  {user.fullName || 'Member Profile'}
                </h1>
                {/* Verified Shield Badge: Green for verified, Grey for unverified */}
                {user.identityVerified ? (
                  <ShieldCheck size={22} className="text-emerald-500 shrink-0" title="Verified Identity" />
                ) : (
                  <Shield size={22} className="text-muted-foreground/60 shrink-0" title="Unverified Identity" />
                )}
              </div>
              <p className="text-sm font-bold text-primary uppercase tracking-wider mt-1 capitalize">
                {user.role} Account
              </p>
              <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-muted-foreground font-medium">
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
            </div>
          </div>

          <div className="flex gap-3">
            {/* If borrower, show Create Loan Request */}
            {isBorrower && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                <PlusCircle size={16} />
                <span>Create Loan Request</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

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

      {/* Tab Selectors (Only shown if user has BOTH role) */}
      {user.role === 'both' && (
        <motion.div variants={itemVariants} className="flex border-b border-border gap-6">
          <button
            onClick={() => setActiveTab('loans')}
            className={`pb-3 font-bold text-base transition-colors relative cursor-pointer ${
              activeTab === 'loans' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>My Loan Requests</span>
            {activeTab === 'loans' && (
              <motion.div
                layoutId="profile-tab-bar"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-primary"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`pb-3 font-bold text-base transition-colors relative cursor-pointer ${
              activeTab === 'offers' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>My Offers Sent</span>
            {activeTab === 'offers' && (
              <motion.div
                layoutId="profile-tab-bar"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-primary"
              />
            )}
          </button>
        </motion.div>
      )}

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myLoans.map((loan) => {
                  const CategoryIcon = CATEGORY_ICONS[loan.category] || HelpCircle;
                  return (
                    <div
                      key={loan._id}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myOffers.map((offer) => {
                  const CategoryIcon = CATEGORY_ICONS[offer.category] || HelpCircle;
                  return (
                    <div
                      key={offer.offerId}
                      className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Banknote size={20} className="text-primary" />
                  <h3 className="font-extrabold text-foreground text-lg">Create Loan Request</h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Edit2 size={18} className="text-primary" />
                  <h3 className="font-extrabold text-foreground text-lg">Edit Loan Request</h3>
                </div>
                <button
                  onClick={() => { setEditModalOpen(false); setSelectedLoan(null); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
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

  const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary cursor-text";
  const labelCls = "text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
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
          placeholder="e.g. 50000"
          className={inputCls}
        />
      </div>

      {/* Category Selection */}
      <div>
        <label className={labelCls}>Category *</label>
        <div className="grid grid-cols-5 gap-2">
          {LOAN_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => set('category', cat.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-[10px] font-bold border transition-all cursor-pointer ${
                  form.category === cat.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <CatIcon size={18} />
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
          placeholder="Briefly describe your need…"
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
            placeholder="e.g. 12"
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
            placeholder="e.g. 30"
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
            placeholder="e.g. Mumbai"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <input
            type="text"
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            placeholder="e.g. Maharashtra"
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
  );
}