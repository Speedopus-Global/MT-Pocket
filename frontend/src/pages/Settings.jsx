import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Smartphone,
  MapPin,
  Loader2,
  Camera,
  AlertCircle,
  Fingerprint,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  XCircle,
  HelpCircle,
  CreditCard,
  Globe,
  Car,
  Check,
  FileCheck,
  RotateCcw,
  Video,
} from 'lucide-react';
import { Separator } from '../components/ui/separator';
import InfoBanner from '../components/ui/InfoBanner';
import { Link } from 'react-router-dom';

const DOCUMENT_OPTIONS = [
  { value: 'aadhaar',         label: 'Aadhaar Card',    icon: Fingerprint },
  { value: 'pan',             label: 'PAN Card',        icon: CreditCard },
  { value: 'passport',        label: 'Passport',        icon: Globe },
  { value: 'driving_license', label: 'Driving Licence', icon: Car },
];

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  );
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  const { city, town, village, state_district, state, country } = data.address || {};
  const locality = city || town || village || state_district || '';
  return [locality, state, country].filter(Boolean).join(', ');
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow cursor-text';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};
const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring', stiffness: 380, damping: 26 } },
  exit:    { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};
const pageVariants = {
  initial: (dir) => ({ opacity: 0, x: dir === 'in' ? 24 : -24 }),
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    (dir) => ({ opacity: 0, x: dir === 'in' ? -24 : 24, transition: { duration: 0.15 } }),
};

export default function Settings() {
  const { user, accessToken, updateUser } = useAuth();

  // Which settings screen is active. 'general' is the default account screen;
  // 'kyc' is a dedicated sub-page, entered only via the Identity Verification row.
  const [page, setPage] = useState('general');

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [address, setAddress]     = useState('');
  const [latitude, setLatitude]   = useState('');
  const [longitude, setLongitude] = useState('');

  const [isSaving, setIsSaving]     = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);

  const [emailStep, setEmailStep]       = useState('idle');
  const [emailOtp, setEmailOtp]         = useState('');
  const [emailVerifying, setEmailVerifying] = useState(false);

  // KYC Status live states
  const [kycStatus, setKycStatus]         = useState(null);
  const [kycLoading, setKycLoading]       = useState(true);
  const [kycModalOpen, setKycModalOpen]   = useState(false);
  const [kycHistory, setKycHistory]       = useState([]);
  const [kycHistoryLoading, setKycHistoryLoading] = useState(true);

  const hasHydrated = useRef(false);

  const fetchKycHistory = async () => {
    if (!accessToken) return;
    setKycHistoryLoading(true);
    try {
      const res = await api.getVerificationHistory(accessToken);
      setKycHistory(res || []);
    } catch (err) {
      console.error('Error fetching KYC history:', err);
    } finally {
      setKycHistoryLoading(false);
    }
  };

  // Fetch KYC status on mount
  useEffect(() => {
    if (!accessToken) return;
    api.getVerificationStatus(accessToken)
      .then((res) => setKycStatus(res))
      .catch(() => setKycStatus(null))
      .finally(() => setKycLoading(false));

    fetchKycHistory();
  }, [accessToken]);

  // Hydrate form inputs from user
  useEffect(() => {
    if (!user || hasHydrated.current) return;
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setAddress(user.address || '');
    setLatitude(user.location?.coordinates?.[1] ?? '');
    setLongitude(user.location?.coordinates?.[0] ?? '');
    hasHydrated.current = true;
  }, [user]);

  if (!user) return null;

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setError('');
    setGpsDetected(false);
    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));

        try {
          const placeName = await reverseGeocode(lat, lng);
          if (placeName) setAddress(placeName);
        } catch {
          // ignore geocode fail
        }

        setGpsDetected(true);
        setIsDetecting(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied — you can still type your address manually.');
        } else {
          setError(`Could not detect location: ${err.message}`);
        }
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      const updated = await api.updateProfile(
        {
          fullName,
          email,
          address,
          ...(latitude && longitude
            ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
            : {}),
        },
        accessToken
      );
      updateUser({
        fullName: updated.fullName,
        email: updated.email,
        emailVerified: updated.emailVerified,
        address: updated.address,
        location: updated.location,
      });
      setSuccess('Profile updated successfully!');
      if (email !== user.email) setEmailStep('idle');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setIsSaving(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const updated = await api.updateProfile({ avatar: reader.result }, accessToken);
        updateUser({ avatarUrl: updated.avatarUrl });
        setSuccess('Profile photo updated!');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSaving(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setIsSaving(false);
    };
  };

  const handleRequestEmailVerification = async () => {
    if (!email) { setError('Please add an email address first.'); return; }
    setError('');
    setEmailVerifying(true);
    try {
      await api.requestEmailVerification(email, accessToken);
      setEmailStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');
    setEmailVerifying(true);
    try {
      const result = await api.verifyEmail(emailOtp, accessToken);
      updateUser({ emailVerified: result.emailVerified, email: result.email });
      setSuccess('Email verified successfully!');
      setEmailStep('idle');
      setEmailOtp('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEmailVerifying(false);
    }
  };

  const onKycSubmitted = (newStatus) => {
    setKycStatus(newStatus);
    updateUser({ idDocumentStatus: newStatus?.status, idDocumentRejectionReason: null });
    setKycModalOpen(false);
    fetchKycHistory();
  };

  // Determine KYC status and badges
  const status = kycStatus?.status ?? user.idDocumentStatus ?? 'none';
  const isApproved = status === 'approved' || user.identityVerified;
  const isPending = !isApproved && status === 'pending';
  const isRejected = !isApproved && status === 'rejected';

  const badgeLabel = isApproved ? 'Verified' : isPending ? 'Under Review' : isRejected ? 'Rejected' : 'Not Started';
  const badgeColor = isApproved
    ? 'text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20'
    : isRejected ? 'text-destructive bg-destructive/10 dark:bg-destructive/20'
    : isPending  ? 'text-amber-600 bg-amber-500/10 dark:bg-amber-500/20'
    : 'text-muted-foreground bg-muted dark:bg-muted/20';

  const borderClass = isApproved
    ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
    : isRejected
    ? 'border-destructive/20 bg-destructive/[0.02]'
    : 'border-border bg-muted/20';

  return (
    <div className="flex-1 flex flex-col min-h-full">
      <AnimatePresence mode="wait" custom={page === 'kyc' ? 'in' : 'out'}>
        {page === 'general' ? (
          <motion.div
            key="general"
            custom="in"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col space-y-8"
          >
            <GeneralSettingsPage
              user={user}
              fullName={fullName} setFullName={setFullName}
              email={email} setEmail={setEmail}
              address={address} setAddress={setAddress}
              isSaving={isSaving} error={error} success={success}
              isDetecting={isDetecting} gpsDetected={gpsDetected}
              handleDetectLocation={handleDetectLocation}
              handleSaveProfile={handleSaveProfile}
              handleAvatarChange={handleAvatarChange}
              emailStep={emailStep} emailOtp={emailOtp} setEmailOtp={setEmailOtp}
              emailVerifying={emailVerifying}
              handleRequestEmailVerification={handleRequestEmailVerification}
              handleVerifyEmailOtp={handleVerifyEmailOtp}
              setEmailStep={setEmailStep}
              isApproved={isApproved} isPending={isPending}
              badgeLabel={badgeLabel} badgeColor={badgeColor}
              onOpenKyc={() => setPage('kyc')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="kyc"
            custom="out"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col space-y-8"
          >
            <IdentityVerificationPage
              onBack={() => setPage('general')}
              status={status}
              isApproved={isApproved} isPending={isPending} isRejected={isRejected}
              badgeLabel={badgeLabel} badgeColor={badgeColor} borderClass={borderClass}
              kycStatus={kycStatus} user={user}
              kycHistory={kycHistory} kycHistoryLoading={kycHistoryLoading}
              onOpenUpload={() => setKycModalOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Upload Modal — reachable only from the Identity Verification page */}
      <AnimatePresence>
        {kycModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-3xl sm:max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col my-auto"
            >
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-muted/20 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-2xs shrink-0">
                    <Fingerprint size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-foreground text-sm sm:text-base leading-tight">Identity Verification (KYC)</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Upload a valid government-issued ID & verification selfie</p>
                  </div>
                </div>
                <button
                  onClick={() => setKycModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <IdentityUploadForm
                  accessToken={accessToken}
                  onSubmitted={onKycSubmitted}
                  onCancel={() => setKycModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* General account settings — the default screen. No KYC document     */
/* detail lives here; Identity Verification is just a status row that */
/* hands off to its own page.                                         */
/* ------------------------------------------------------------------ */
function GeneralSettingsPage({
  user, fullName, setFullName, email, setEmail, address, setAddress,
  isSaving, error, success, isDetecting, gpsDetected,
  handleDetectLocation, handleSaveProfile, handleAvatarChange,
  emailStep, emailOtp, setEmailOtp, emailVerifying,
  handleRequestEmailVerification, handleVerifyEmailOtp, setEmailStep,
  isApproved, isPending, badgeLabel, badgeColor, onOpenKyc,
}) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-600 to-primary/80">
          Account Settings
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Manage your personal details and account security.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Avatar and Trust Badges Checklist */}
        <div className="space-y-6 lg:sticky lg:top-8">
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card p-8 text-center shadow-md relative overflow-hidden"
          >
            <div className="relative w-36 h-36 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
              <div className="absolute inset-[4px] bg-card rounded-full overflow-hidden flex items-center justify-center group">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center text-5xl">
                    {user.fullName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload-input-settings"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs gap-1.5 font-bold"
                >
                  <Camera size={20} />
                  <span>Change Photo</span>
                </label>
                <input
                  id="avatar-upload-input-settings"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
            </div>

            <h3 className="font-extrabold text-xl text-foreground tracking-tight">{fullName || user.fullName || 'Member Name'}</h3>
            <span className="inline-block text-xs text-primary bg-primary/10 px-3.5 py-1 rounded-full font-bold uppercase tracking-wider mt-3.5 capitalize">
              {user.role} account
            </span>

            {isSaving && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}
          </motion.div>

          {/* Trust badges checklist — Identity row now links out to its own page */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-md">
            <h3 className="font-extrabold text-muted-foreground text-xs tracking-wider uppercase mb-5">
              Trust Checklist Badges
            </h3>
            <ul className="space-y-1">
              <BadgeRow icon={Smartphone} label="Phone Number" verified={true} />
              <BadgeRow icon={Mail} label="Email Address" verified={user.emailVerified} pendingLabel="Unverified" />
              <BadgeRowLink
                icon={Fingerprint}
                label="Identity Verification"
                verified={isApproved}
                badgeLabel={badgeLabel}
                badgeColor={badgeColor}
                onClick={onOpenKyc}
              />
            </ul>
          </motion.div>

          {/* Help & Support Card */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-md">
            <h3 className="font-extrabold text-muted-foreground text-xs tracking-wider uppercase mb-3">
              Need Assistance?
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Have questions about verification, loan safety, or platform policies?
            </p>
            <Link
              to="/dashboard/support"
              className="inline-flex items-center justify-between w-full p-3 rounded-xl bg-muted/40 hover:bg-muted text-foreground text-xs font-bold transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={16} className="text-primary" />
                <span>Help &amp; Support Center</span>
              </div>
              <ChevronRight size={15} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Right Side: core details form & email OTP verification only */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-base text-destructive flex items-center gap-2.5 font-medium"
              >
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-base text-emerald-600 flex items-center gap-2.5 font-medium"
              >
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Core Profile Edit Settings Form */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-8 shadow-md">
            <h3 className="font-extrabold text-xl text-foreground tracking-tight mb-2">Core Profile Details</h3>
            <p className="text-sm text-muted-foreground mb-6">Modify your registration details, GPS location and email addresses.</p>

            <Separator className="mb-6" />

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="fullName" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="Vijay Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} ${user.emailVerified ? 'pr-28' : ''}`}
                    />
                    {user.emailVerified && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full pointer-events-none">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    )}
                  </div>
                  {email && email !== user.email && (
                    <InfoBanner variant="info" dismissible={false} className="mt-2 !py-2 !px-3 !text-xs">
                      We'll need to verify your new email before it shows as verified again.
                    </InfoBanner>
                  )}
                </div>
              </div>

              {/* Address / GPS row */}
              <div className="flex flex-col gap-2">
                <label htmlFor="address" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Location (GPS Address)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                    <input
                      id="address"
                      type="text"
                      placeholder="Vijayawada, Andhra Pradesh, India"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={`${inputClass} pl-11 ${gpsDetected ? 'pr-28' : ''}`}
                    />
                    <AnimatePresence>
                      {gpsDetected && (
                        <motion.span
                          key="gps-badge-settings"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full pointer-events-none"
                        >
                          <CheckCircle2 size={12} /> GPS Set
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 text-primary text-sm font-bold px-4 h-[48px] hover:bg-primary/10 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Detecting…</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={16} />
                        <span>Use GPS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Phone (read-only) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Verified Mobile Number</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={user.phone}
                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-base text-muted-foreground cursor-not-allowed pr-32"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold px-6 py-3.5 text-base hover:bg-primary/95 transition-all shadow-md shadow-primary/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  Save Details
                </button>
              </div>
            </form>
          </motion.div>

          {/* Email verification card */}
          {user.email && !user.emailVerified && (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-8 shadow-md"
            >
              <h3 className="font-extrabold text-foreground text-xl flex items-center gap-2 mb-2">
                <AlertCircle className="text-amber-600 shrink-0" size={22} />
                Email Verification Required
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Please verify your email address <strong>{user.email}</strong> to secure your account and show verified tags on offers.
              </p>

              {emailStep === 'idle' ? (
                <button
                  onClick={handleRequestEmailVerification}
                  disabled={emailVerifying}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white font-bold px-5 py-3.5 text-sm hover:bg-amber-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {emailVerifying && <Loader2 size={14} className="animate-spin" />}
                  Send Verification OTP
                </button>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex flex-col gap-2 flex-1">
                    <label htmlFor="email-otp-settings" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      id="email-otp-settings"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-xl tracking-[0.3em] text-foreground placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={emailVerifying}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold px-6 py-3.5 text-sm hover:bg-primary/95 transition-colors disabled:opacity-60 h-[48px] cursor-pointer"
                  >
                    {emailVerifying && <Loader2 size={14} className="animate-spin" />}
                    Confirm Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailStep('idle')}
                    className="text-sm text-muted-foreground hover:text-foreground font-semibold h-[48px] px-3 cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Dedicated Identity Verification (KYC) page. Everything document-   */
/* related lives here and only here — status, upload trigger, and the */
/* full submission history.                                           */
/* ------------------------------------------------------------------ */
function IdentityVerificationPage({
  onBack, status, isApproved, isPending, isRejected,
  badgeLabel, badgeColor, borderClass, kycStatus, user,
  kycHistory, kycHistoryLoading, onOpenUpload,
}) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-3xl">
      {/* Sub-page header with breadcrumb-style back navigation */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit cursor-pointer group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Settings
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={26} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Identity Verification</h1>
              <span className={`inline-block text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${badgeColor}`}>
                {badgeLabel}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Verify a government ID to unlock the Verified badge and build buyer trust.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Status hero banner */}
      <motion.div
        variants={itemVariants}
        className={`rounded-2xl border p-6 shadow-md flex flex-col justify-between md:flex-row md:items-center gap-6 ${borderClass}`}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isApproved
              ? 'Identity document verified successfully. You have unlocked the Verified trust badge and green verification logo.'
              : isPending
              ? 'Your identity documents have been submitted and are awaiting administrator review. This normally takes up to 24 hours.'
              : isRejected
              ? 'Your previous verification was rejected. Please review the reason below and submit a new document.'
              : 'Submit a government-issued photo ID (Aadhaar, PAN, Passport, or DL) to verify your credentials.'}
          </p>
          {isApproved && (
            <p className="text-xs text-emerald-600 font-semibold mt-2">
              ✓ Your account is verified. You can update your verification document at any time by uploading a new file.
            </p>
          )}
          {isPending && (
            <p className="text-xs text-amber-600 font-semibold mt-2">
              ⚠ You currently have a document under review, but you can still upload an updated file if needed.
            </p>
          )}
          {isRejected && (kycStatus?.rejectionReason || user.idDocumentRejectionReason) && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10 text-xs text-destructive flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Rejection Reason: {kycStatus?.rejectionReason || user.idDocumentRejectionReason}</span>
            </div>
          )}
        </div>

        <button
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer"
        >
          <UploadCloud size={16} />
          <span>{isApproved ? 'Update ID Document' : isPending ? 'Update / Resubmit ID' : isRejected ? 'Resubmit Verification' : 'Verify ID Now'}</span>
        </button>
      </motion.div>

      {/* 🔵 KYC upload disclaimer — shown once before first upload */}
      <InfoBanner variant="info" dismissible={true} storageKey="mt_kyc_disclaimer_seen">
        Your document is stored securely and used only for identity verification. See our{' '}
        <Link to="/kyc-consent" className="text-primary underline underline-offset-2 font-semibold hover:text-primary/80">Identity Verification & Data Notice</Link>.
      </InfoBanner>

      {/* Uploaded Verification Records & History */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-md">
        <h3 className="font-extrabold text-xl text-foreground tracking-tight mb-2">Uploaded Document Records</h3>
        <p className="text-sm text-muted-foreground mb-4">A complete archive of all submitted KYC credentials and their current status.</p>

        <Separator className="mb-5" />

        {kycHistoryLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : kycHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No document submissions found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {kycHistory.map((doc) => {
              const docLabel = DOCUMENT_OPTIONS.find(o => o.value === doc.documentType)?.label || doc.documentType;

              const hStatus = doc.status;
              const hBadgeLabel = hStatus === 'approved' ? 'Approved'
                : hStatus === 'pending' ? 'Pending Approval'
                : hStatus === 'under_review' ? 'Under Review'
                : hStatus === 'rejected' ? 'Rejected'
                : hStatus === 'reupload_required' ? 'Reupload Required'
                : hStatus === 'archived' ? 'Archived Record'
                : hStatus;

              const hBadgeColor = hStatus === 'approved' ? 'text-emerald-600 bg-emerald-500/10'
                : hStatus === 'rejected' || hStatus === 'reupload_required' ? 'text-destructive bg-destructive/10'
                : hStatus === 'pending' || hStatus === 'under_review' ? 'text-amber-600 bg-amber-500/10'
                : 'text-muted-foreground bg-muted';

              const formatSize = (bytes) => {
                if (!bytes) return '';
                const kb = bytes / 1024;
                if (kb < 1024) return `${kb.toFixed(1)} KB`;
                return `${(kb / 1024).toFixed(2)} MB`;
              };

              return (
                <div
                  key={doc._id}
                  className="rounded-xl border border-border/80 bg-background/30 p-4 hover:bg-background/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-foreground capitalize">
                        {docLabel}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground/80 bg-muted px-2 py-0.5 rounded-md">
                        Version {doc.version}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1 max-w-xs sm:max-w-sm md:max-w-md">
                      File: <span className="font-semibold text-foreground/80">{doc.originalFilename || 'document_file'}</span>
                      {doc.fileSize && ` (${formatSize(doc.fileSize)})`}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Uploaded on {new Date(doc.uploadedAt).toLocaleString()}
                    </p>

                    {(doc.rejectionReason || doc.reuploadReason) && (
                      <div className="mt-2.5 p-2.5 rounded bg-destructive/5 border border-destructive/10 text-xs text-destructive flex items-start gap-1.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span>
                          Reason: {doc.rejectionReason || doc.reuploadReason}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 self-start sm:self-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${hBadgeColor}`}>
                      {hStatus === 'approved' && <CheckCircle2 size={11} />}
                      {hStatus === 'rejected' && <XCircle size={11} />}
                      {(hStatus === 'pending' || hStatus === 'under_review') && <Clock size={11} />}
                      {hStatus === 'archived' && <FileText size={11} />}
                      <span>{hBadgeLabel}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Static badge row (phone / email) — no navigation
function BadgeRow({ icon: Icon, label, verified, pendingLabel = 'Unverified', pendingIcon: PendingIcon = AlertCircle }) {
  return (
    <li className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${verified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
          <Icon size={16} />
        </div>
        <span className="text-foreground font-semibold text-sm">{label}</span>
      </div>
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${verified ? 'text-emerald-600 bg-emerald-500/10' : 'text-muted-foreground bg-muted'}`}>
        {verified ? <><CheckCircle2 size={11} /> Verified</> : <><PendingIcon size={11} /> {pendingLabel}</>}
      </span>
    </li>
  );
}

// Clickable row that hands off to the dedicated Identity Verification page
function BadgeRowLink({ icon: Icon, label, verified, badgeLabel, badgeColor, onClick }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-2.5 -mx-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${verified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
            <Icon size={16} />
          </div>
          <span className="text-foreground font-semibold text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badgeColor}`}>
            {verified && <CheckCircle2 size={11} />} {badgeLabel}
          </span>
          <ChevronRight size={15} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </li>
  );
}

// Identity upload form within modal (Square shadcn UI styled)
function IdentityUploadForm({ accessToken, onSubmitted, onCancel }) {
  const [documentType, setDocumentType] = useState(DOCUMENT_OPTIONS[0].value);
  const [file,         setFile]         = useState(null);
  const [previewUrl,   setPreviewUrl]   = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [dragOver,     setDragOver]     = useState(false);

  // ── Selfie capture state ────────────────────────────────────────────────
  const [selfieFile,    setSelfieFile]    = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [cameraOn,      setCameraOn]      = useState(false);
  const [cameraError,   setCameraError]   = useState('');

  const fileInputRef   = useRef(null);
  const selfieInputRef = useRef(null);
  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const streamRef        = useRef(null);

  const handleFileChange = (newFile) => {
    if (!newFile) return;
    if (newFile.size > 8 * 1024 * 1024) {
      setError('File exceeds 8MB limit. Please compress or select another file.');
      return;
    }
    setFile(newFile);
    setError('');
    if (newFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(newFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select or drop a document file to upload'); return; }
    if (!selfieFile) { setError('Please take or upload a selfie to continue'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await api.uploadVerificationDocument({ file, selfie: selfieFile, documentType }, accessToken);
      onSubmitted(result);
    } catch (err) {
      setError(err.message || 'Upload failed — please check file size and format');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileChange(dropped);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Selfie: live camera capture ─────────────────────────────────────────
  const [videoReady, setVideoReady] = useState(false);

  const startCamera = async () => {
    setCameraError('');
    setVideoReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true); // triggers the effect below, which attaches the stream once <video> is mounted
    } catch (err) {
      setCameraError('Could not access camera. You can upload a selfie photo instead.');
    }
  };

  // Runs AFTER the <video> element has committed to the DOM (unlike a
  // setTimeout(0) right after setCameraOn, which can fire before the
  // element exists and silently leave srcObject unset).
  useEffect(() => {
    if (cameraOn && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.play?.().catch(() => {});
    }
  }, [cameraOn]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
    setVideoReady(false);
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // videoWidth/videoHeight are 0 until the stream's first frame has
    // actually loaded — capturing before that gives a 0×0 canvas and
    // toBlob() silently returns null. Guard against it explicitly.
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('Camera is still starting up — give it a second and try again.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError('Could not capture the photo — please try again.');
        return;
      }
      const selfie = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelfieFile(selfie);
      setSelfiePreview(URL.createObjectURL(selfie));
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleSelfieFileChange = (newFile) => {
    if (!newFile) return;
    if (newFile.size > 5 * 1024 * 1024) {
      setError('Selfie exceeds 5MB limit. Please select another photo.');
      return;
    }
    setError('');
    setSelfieFile(newFile);
    setSelfiePreview(URL.createObjectURL(newFile));
  };

  const retakeSelfie = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    if (selfieInputRef.current) selfieInputRef.current.value = '';
  };

  // Stop the camera if the form unmounts (e.g. modal closed) while it's on
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        {/* ── Left Column: ID Document Type & File Upload ──────── */}
        <div className="space-y-4">
          
          {/* 1. Document Type Grid */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              1. Select ID Document Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DOCUMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = documentType === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setDocumentType(opt.value)}
                    className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-2xs font-semibold'
                        : 'border-border/80 bg-background/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-xs truncate">{opt.label}</span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px]">
                        <Check size={9} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Drag & Drop File Zone */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              2. Upload ID Document Photo / PDF
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-all p-5 text-center cursor-pointer min-h-[140px] flex flex-col items-center justify-center ${
                dragOver
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border/80 hover:border-primary/50 bg-background/40 hover:bg-muted/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />

              {file ? (
                <div className="w-full flex items-center gap-3 p-2 bg-card rounded-lg border border-border/80 text-left">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-11 h-11 object-cover rounded-lg border border-border shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="py-1">
                  <UploadCloud size={28} className={`mx-auto mb-1.5 transition-colors ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-xs font-bold text-foreground">Click to browse or drop ID document</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WEBP or PDF (Max 8MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Selfie Capture & Guidelines ──────── */}
        <div className="space-y-4">
          
          {/* 3. Selfie Capture */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              3. Verification Selfie (Face Match)
            </label>

            <input
              ref={selfieInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              onChange={(e) => handleSelfieFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {selfieFile ? (
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/80 text-left">
                <img src={selfiePreview} alt="Selfie preview" className="w-12 h-12 object-cover rounded-full border-2 border-primary/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{selfieFile.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{(selfieFile.size / (1024 * 1024)).toFixed(2)} MB • Ready</p>
                </div>
                <button
                  type="button"
                  onClick={retakeSelfie}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs font-semibold"
                  title="Retake selfie"
                >
                  <RotateCcw size={12} /> Retake
                </button>
              </div>
            ) : cameraOn ? (
              <div className="rounded-xl border border-border/80 bg-background/50 p-3.5 flex flex-col items-center gap-3">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-2 border-primary shadow-inner bg-muted">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => setVideoReady(true)}
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {!videoReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-muted-foreground gap-1">
                      <Loader2 size={18} className="animate-spin text-primary" />
                      <p className="text-[10px] font-semibold">Starting camera…</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={captureSelfie}
                    disabled={!videoReady}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Camera size={13} /> Capture
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-border/80 bg-background/40 p-4 text-center min-h-[140px] flex flex-col items-center justify-center">
                <Camera size={26} className="mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-bold text-foreground">Take a quick selfie</p>
                <p className="text-[10px] text-muted-foreground mb-3">Ensure your face is well-lit and unobstructed</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Video size={13} /> Use Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => selfieInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <UploadCloud size={13} /> Upload
                  </button>
                </div>
                {cameraError && (
                  <p className="text-[10px] text-destructive mt-1.5 font-medium">{cameraError}</p>
                )}
              </div>
            )}
          </div>

          {/* Verification Guidelines Box */}
          <div className="rounded-xl bg-muted/30 border border-border/60 p-3 text-[10px] text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">Document Checklist:</p>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 list-disc list-inside">
              <li>Official government ID</li>
              <li>All 4 corners visible</li>
              <li>Clear, no blur or glare</li>
              <li>Face matches ID photo</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3.5 py-2.5">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/70">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-border/80 bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !file || !selfieFile}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <FileCheck size={13} />}
          <span>{submitting ? 'Submitting ID...' : 'Submit Verification ID'}</span>
        </button>
      </div>
    </form>
  );
}