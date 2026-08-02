import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, 
  Mail, 
  Smartphone, 
  MapPin, 
  Loader2, 
  Camera, 
  Check, 
  AlertCircle,
  Fingerprint,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function Profile() {
  const { user, accessToken, updateUser } = useAuth();

  // Profile forms
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail]         = useState(user?.email || '');
  const [address, setAddress]     = useState(user?.address || '');
  const [latitude, setLatitude]   = useState(user?.location?.coordinates?.[1] || '28.6139'); // Default Delhi lat
  const [longitude, setLongitude] = useState(user?.location?.coordinates?.[0] || '77.2090'); // Default Delhi lon

  // States for actions
  const [isSaving, setIsSaving]   = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setError('');
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setSuccess('Real GPS coordinates detected successfully! Remember to Save Details.');
        setIsDetecting(false);
      },
      (err) => {
        setError(`Failed to retrieve coordinates: ${err.message}`);
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Email verification flow states
  const [emailStep, setEmailStep] = useState('idle'); // 'idle' | 'otp'
  const [emailOtp, setEmailOtp]   = useState('');
  const [emailVerifying, setEmailVerifying] = useState(false);

  if (!user) return null;

  // ── Handle Profile Details Save ─────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      const updated = await api.updateProfile({
        fullName,
        email,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      }, accessToken);

      updateUser({
        fullName: updated.fullName,
        email: updated.email,
        emailVerified: updated.emailVerified,
        address: updated.address,
        location: updated.location
      });
      setSuccess('Profile updated successfully!');
      
      // If email was modified, reset local verification UI
      if (email !== user.email) {
        setEmailStep('idle');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handle Avatar Image Choice ──────────────────────────────────────
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
        const base64 = reader.result;
        const updated = await api.updateProfile({ avatar: base64 }, accessToken);
        updateUser({ avatarUrl: updated.avatarUrl });
        setSuccess('Profile photo updated successfully!');
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

  // ── Send Email OTP Code ──────────────────────────────────────────────
  const handleRequestEmailVerification = async () => {
    if (!email) {
      setError('Please add an email address first.');
      return;
    }
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

  // ── Verify Email OTP Code ────────────────────────────────────────────
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col space-y-8 min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* Title Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-600 to-primary/80">
          Profile & Trust Centre
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Manage your personal details, location configurations, and monitor your verified security badges.
        </p>
      </motion.div>

      {/* Full-Page Grid Split columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 items-start">
        
        {/* Left Column: Avatar halo & Trust Checklist */}
        <div className="space-y-6 lg:sticky lg:top-8">
          
          {/* Avatar Panel with rotating gradient halo */}
          <motion.div 
            variants={itemVariants} 
            className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm relative overflow-hidden"
          >
            {/* Rotating Ring Container */}
            <div className="relative w-36 h-36 mx-auto mb-6">
              {/* Simple Premium Border */}
              <div className="absolute inset-0 rounded-full border-2 border-primary/45 shadow-sm" />
              
              {/* Inner core */}
              <div className="absolute inset-[3.5px] bg-card rounded-full overflow-hidden flex items-center justify-center group">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center text-4xl">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                )}
                {/* Upload Overlay */}
                <label 
                  htmlFor="avatar-upload-input" 
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-white text-xs gap-1 font-semibold"
                >
                  <Camera size={20} />
                  <span>Update Photo</span>
                </label>
                <input 
                  id="avatar-upload-input" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                />
              </div>
            </div>

            <h3 className="font-extrabold text-lg text-foreground tracking-tight">{user.fullName || 'User Name'}</h3>
            <span className="inline-block text-[10px] text-primary bg-primary/15 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5">
              {user.role} Account
            </span>

            {isSaving && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}
          </motion.div>

          {/* Badges Panel */}
          <motion.div 
            variants={itemVariants} 
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="font-bold text-foreground mb-4 text-xs tracking-wider uppercase">
              Trust Checklist Badges
            </h3>
            
            <ul className="space-y-4">
              
              {/* Phone Verified */}
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Smartphone size={15} />
                  </div>
                  <span className="text-foreground font-semibold text-xs tracking-wide">Phone verification</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full shadow-sm">
                  <CheckCircle2 size={12} /> Verified
                </span>
              </li>

              {/* Email Verified */}
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${
                    user.emailVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    <Mail size={15} />
                  </div>
                  <span className="text-foreground font-semibold text-xs tracking-wide">Email verification</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                  user.emailVerified 
                    ? 'text-emerald-600 bg-emerald-500/10' 
                    : 'text-amber-600 bg-amber-500/10'
                }`}>
                  {user.emailVerified ? (
                    <><CheckCircle2 size={12} /> Verified</>
                  ) : (
                    <><AlertCircle size={12} /> Unverified</>
                  )}
                </span>
              </li>

              {/* Identity Verified */}
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner ${
                    user.identityVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Fingerprint size={15} />
                  </div>
                  <span className="text-foreground font-semibold text-xs tracking-wide">Identity Verification</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                  user.identityVerified 
                    ? 'text-emerald-600 bg-emerald-500/10' 
                    : 'text-muted-500 bg-muted text-muted-foreground/80'
                }`}>
                  {user.identityVerified ? (
                    <><CheckCircle2 size={12} /> Verified</>
                  ) : (
                    <><Clock size={12} /> Pending</>
                  )}
                </span>
              </li>

            </ul>
          </motion.div>

        </div>

        {/* Right Column: settings edit form sheets */}
        <div className="lg:col-span-2 space-y-6">
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl bg-destructive/10 border border-destructive/30 px-5 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-5 py-3 text-sm text-emerald-600 font-medium"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Form Card */}
          <motion.div 
            variants={itemVariants} 
            className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between"
          >
            <h3 className="font-extrabold text-foreground mb-6 text-base tracking-tight">Core Profile Settings</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="Annanya Tiwary"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input text-sm px-4 py-2.5 focus:shadow-[0_0_12px_rgba(15,122,83,0.15)] focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input text-sm px-4 py-2.5 focus:shadow-[0_0_12px_rgba(15,122,83,0.15)] focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geographical Address</label>
                <div className="relative">
                  <input
                    id="address"
                    type="text"
                    placeholder="Delhi, India"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input text-sm pl-11 pr-4 py-2.5 focus:shadow-[0_0_12px_rgba(15,122,83,0.15)] focus:border-primary"
                  />
                  <MapPin className="absolute left-4 top-3 text-muted-foreground" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Verified Mobile Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={user.phone}
                      className="form-input text-sm px-4 py-2.5 bg-muted/40 border-muted text-muted-foreground cursor-not-allowed select-none"
                    />
                    <span className="absolute right-3.5 top-3 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Device Location (GPS)</label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 text-primary text-sm font-semibold py-2.5 hover:bg-primary/10 transition-colors disabled:opacity-65"
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Detecting Location...
                      </>
                    ) : (
                      <>
                        <MapPin size={15} />
                        Detect GPS Coordinates
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-3 hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10 disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={15} className="animate-spin" />}
                  Save Details
                </button>
              </div>

            </form>
          </motion.div>

          {/* Email verification card */}
          {user.email && !user.emailVerified && (
            <motion.div 
              variants={itemVariants}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] p-8 shadow-sm flex flex-col justify-between"
            >
              <h3 className="font-extrabold text-foreground mb-1.5 text-base flex items-center gap-2">
                <AlertCircle className="text-amber-600" size={20} />
                Email Verification Required
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                Verify ownership of the email address <strong>{user.email}</strong> to unlock your verified status trust badge.
              </p>

              {emailStep === 'idle' ? (
                <div>
                  <button
                    onClick={handleRequestEmailVerification}
                    disabled={emailVerifying}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white font-semibold px-6 py-2.5 hover:bg-amber-700 transition-all text-xs disabled:opacity-60"
                  >
                    {emailVerifying && <Loader2 size={12} className="animate-spin" />}
                    Verify email address
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label htmlFor="email-otp-code" className="text-xs font-semibold text-foreground uppercase tracking-wider">6-digit verification code</label>
                    <input
                      id="email-otp-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1rem' }}
                      className="form-input py-2.5 focus:shadow-[0_0_12px_rgba(15,122,83,0.15)] focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={emailVerifying}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-3 hover:bg-primary/95 transition-all text-xs shadow-md shadow-primary/10 disabled:opacity-60"
                  >
                    {emailVerifying && <Loader2 size={12} className="animate-spin" />}
                    Confirm Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailStep('idle')}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold py-3 px-2"
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
