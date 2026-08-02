import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { 
  User as UserIcon, 
  Mail, 
  Smartphone, 
  MapPin, 
  Loader2, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Fingerprint
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile & Trust</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your personal details, location metrics, and verification badges.
        </p>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Avatar & Trust Checklist */}
        <div className="space-y-6">
          
          {/* Avatar Panel */}
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm relative">
            <div className="relative inline-block mx-auto mb-4 group">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-32 h-32 rounded-full object-cover border-2 border-primary" 
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-4xl border-2 border-dashed border-primary/20">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
              )}
              {/* Photo Upload Overlay */}
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-white"
              >
                <Camera size={24} />
              </label>
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </div>
            <h3 className="font-bold text-lg text-foreground">{user.fullName || 'User Name'}</h3>
            <p className="text-xs text-muted-foreground capitalize mt-1">{user.role} Account</p>
            {isSaving && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            )}
          </div>

          {/* Badges Panel */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-1.5 text-sm">
              Trust Badges Checklist
            </h3>
            <ul className="space-y-3.5">
              
              {/* Phone Verified */}
              <li className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <Smartphone size={16} className="text-emerald-500" />
                  <span className="text-foreground font-medium text-xs">Phone Verification</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Verified
                </span>
              </li>

              {/* Email Verified */}
              <li className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <Mail size={16} className={user.emailVerified ? 'text-emerald-500' : 'text-muted-foreground'} />
                  <span className="text-foreground font-medium text-xs">Email Verification</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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

              {/* KYC Verified */}
              <li className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <Fingerprint size={16} className={user.identityVerified ? 'text-emerald-500' : 'text-muted-foreground'} />
                  <span className="text-foreground font-medium text-xs">Identity Verification</span>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  user.identityVerified 
                    ? 'text-emerald-600 bg-emerald-500/10' 
                    : 'text-muted-500 bg-muted'
                }`}>
                  {user.identityVerified ? (
                    <><CheckCircle2 size={12} /> Verified</>
                  ) : (
                    'Pending'
                  )}
                </span>
              </li>

            </ul>
          </div>

        </div>

        {/* Right Side: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Alerts */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-600">
              {success}
            </div>
          )}

          {/* Core profile edit form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4 text-sm">Update Profile Details</h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="Annanya Tiwary"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-sm font-medium text-foreground">Geographical Address</label>
                <div className="relative">
                  <input
                    id="address"
                    type="text"
                    placeholder="Delhi, India"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="form-input text-sm pl-9"
                  />
                  <MapPin className="absolute left-3 top-3 text-muted-foreground" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="latitude" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Latitude</label>
                  <input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="longitude" className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Longitude</label>
                  <input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="form-input text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-medium px-6 py-2 hover:bg-primary/90 transition-all text-sm disabled:opacity-60"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  Save Details
                </button>
              </div>

            </form>
          </div>

          {/* Email verification card */}
          {user.email && !user.emailVerified && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm">
              <h3 className="font-semibold text-foreground mb-1 text-sm flex items-center gap-2">
                <AlertCircle className="text-amber-600" size={18} />
                Email Verification Required
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Verify your email address <strong>{user.email}</strong> to unlock your verified status trust badge.
              </p>

              {emailStep === 'idle' ? (
                <button
                  onClick={handleRequestEmailVerification}
                  disabled={emailVerifying}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-white font-medium px-5 py-2 hover:bg-amber-700 transition-all text-xs disabled:opacity-60"
                >
                  {emailVerifying && <Loader2 size={12} className="animate-spin" />}
                  Verify email address
                </button>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex flex-col gap-1 flex-1">
                    <label htmlFor="email-otp" className="text-xs font-semibold text-foreground">6-digit code sent to email</label>
                    <input
                      id="email-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                      style={{ textAlign: 'center', letterSpacing: '0.3em' }}
                      className="form-input text-sm py-2"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={emailVerifying}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground font-medium px-5 py-2.5 hover:bg-primary/90 transition-all text-xs disabled:opacity-60"
                  >
                    {emailVerifying && <Loader2 size={12} className="animate-spin" />}
                    Confirm Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailStep('idle')}
                    className="text-xs text-muted-foreground hover:text-foreground py-2"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
