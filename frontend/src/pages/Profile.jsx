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
} from 'lucide-react';

// ── Reverse geocode via Nominatim (OpenStreetMap, free, no key needed) ──────
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
  'w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-shadow';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function Profile() {
  const { user, accessToken, updateUser } = useAuth();

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

// Hydrate the form from `user` the first time it becomes available.
  // Only fires once (hasHydrated flag) so it doesn't stomp on whatever
  // the person is mid-typing if `user` object identity changes later
  // for an unrelated reason (e.g. Dashboard calling updateUser()).
  const hasHydrated = useRef(false);
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

  // ── GPS Detection + Reverse Geocode ──────────────────────────────────
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
          // Geocoding failed — coords are still set, address just won't auto-fill
        }

        setGpsDetected(true);
        setIsDetecting(false);
      },
      (err) => {
        setError(`Could not detect location: ${err.message}`);
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // ── Save Profile ──────────────────────────────────────────────────────
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

  // ── Avatar ────────────────────────────────────────────────────────────
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

  // ── Email Verification ────────────────────────────────────────────────
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

  return (
    <motion.div
      className="flex-1 flex flex-col space-y-8 min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-600 to-primary/80">
          Profile & Trust Centre
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal details, location, and verification badges.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="space-y-5 lg:sticky lg:top-8">

          {/* Avatar card */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card p-7 text-center shadow-sm relative overflow-hidden"
          >
            <div className="relative w-32 h-32 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-2 border-primary/40" />
              <div className="absolute inset-[3px] bg-card rounded-full overflow-hidden flex items-center justify-center group">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary font-bold flex items-center justify-center text-4xl">
                    {user.fullName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload-input"
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs gap-1 font-semibold"
                >
                  <Camera size={18} />
                  <span>Change</span>
                </label>
                <input id="avatar-upload-input" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
            </div>

            <h3 className="font-extrabold text-base text-foreground tracking-tight">{user.fullName || 'Your Name'}</h3>
            <span className="inline-block text-[10px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5 capitalize">
              {user.role} account
            </span>

            {isSaving && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={22} />
              </div>
            )}
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-bold text-foreground mb-4 text-[10px] tracking-widest uppercase text-muted-foreground">
              Trust checklist
            </h3>
            <ul className="space-y-3.5">
              <BadgeRow icon={Smartphone} label="Phone" verified={true} />
              <BadgeRow icon={Mail} label="Email" verified={user.emailVerified} pendingLabel="Unverified" />
              <BadgeRow icon={Fingerprint} label="Identity" verified={user.identityVerified} pendingLabel="Pending" pendingIcon={Clock} />
            </ul>
          </motion.div>

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Flash messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-600 font-medium">
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile form */}
          <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-7 shadow-sm">
            <h3 className="font-extrabold text-foreground mb-5 text-base tracking-tight">Core profile settings</h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Full name</label>
                  <input
                    id="fullName" type="text" required placeholder="Vijay Kumar"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email address</label>
                  <div className="relative">
                    <input
                      id="email" type="email" placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      className={`${inputClass} ${user.emailVerified ? 'pr-24' : ''}`}
                    />
                    {user.emailVerified && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full pointer-events-none">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Address + GPS row */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Location
                </label>
                <div className="flex items-center gap-2">
                  {/* Input with pin icon left, GPS badge right when detected */}
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={15} />
                    <input
                      id="address" type="text" placeholder="Vijayawada, Andhra Pradesh, India"
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      className={`${inputClass} pl-10 ${gpsDetected ? 'pr-24' : ''}`}
                    />
                    <AnimatePresence>
                      {gpsDetected && (
                        <motion.span
                          key="gps-badge"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full pointer-events-none"
                        >
                          <CheckCircle2 size={10} /> GPS set
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* GPS button — same height as input, always aligned */}
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetecting}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 text-primary text-xs font-semibold px-3 h-[42px] hover:bg-primary/10 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {isDetecting
                      ? <><Loader2 size={13} className="animate-spin" /> Detecting…</>
                      : <><MapPin size={13} /> Use GPS</>
                    }
                  </button>
                </div>
              </div>

              {/* Phone (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Verified mobile</label>
                <div className="relative">
                  <input
                    type="text" readOnly disabled value={user.phone}
                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed pr-28"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} /> Verified
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit" disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-6 py-2.5 text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  Save details
                </button>
              </div>
            </form>
          </motion.div>

          {/* Email verification card */}
          {user.email && !user.emailVerified && (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] p-7 shadow-sm"
            >
              <h3 className="font-extrabold text-foreground mb-1 text-base flex items-center gap-2">
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                Email verification required
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                Verify <strong>{user.email}</strong> to unlock your email verified trust badge.
              </p>

              {emailStep === 'idle' ? (
                <button
                  onClick={handleRequestEmailVerification} disabled={emailVerifying}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 text-white font-semibold px-5 py-2.5 text-xs hover:bg-amber-700 transition-colors disabled:opacity-60"
                >
                  {emailVerifying && <Loader2 size={12} className="animate-spin" />}
                  Send verification code
                </button>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label htmlFor="email-otp" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      6-digit code
                    </label>
                    <input
                      id="email-otp" type="text" inputMode="numeric" maxLength={6} required
                      placeholder="123456" value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-center text-base tracking-[0.3em] text-foreground placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    type="submit" disabled={emailVerifying}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-xs hover:bg-primary/90 transition-colors disabled:opacity-60 h-[42px]"
                  >
                    {emailVerifying && <Loader2 size={12} className="animate-spin" />}
                    Confirm
                  </button>
                  <button
                    type="button" onClick={() => setEmailStep('idle')}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium h-[42px] px-2"
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

// ── Reusable badge row ──────────────────────────────────────────────────────
function BadgeRow({ icon: Icon, label, verified, pendingLabel = 'Unverified', pendingIcon: PendingIcon = AlertCircle }) {
  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${verified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
          <Icon size={13} />
        </div>
        <span className="text-foreground font-semibold text-xs">{label}</span>
      </div>
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${verified ? 'text-emerald-600 bg-emerald-500/10' : 'text-muted-foreground bg-muted'}`}>
        {verified ? <><CheckCircle2 size={10} /> Verified</> : <><PendingIcon size={10} /> {pendingLabel}</>}
      </span>
    </li>
  );
}