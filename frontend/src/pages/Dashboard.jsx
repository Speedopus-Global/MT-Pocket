import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Fingerprint, 
  PlusCircle, 
  ArrowUpRight, 
  Coins, 
  Handshake, 
  Info,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const isLender = user.role === 'lender' || user.role === 'both';
  const isBorrower = user.role === 'borrower' || user.role === 'both';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col space-y-8 min-h-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* Interactive Title Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
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
          Here is your MT Pocket peer-to-peer trust dashboard and metrics overview.
        </p>
      </motion.div>

      {/* Spaced out Card: Trust score + badges */}
      <motion.div 
        variants={itemVariants} 
        className="rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between flex-1 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div>
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="text-primary h-6 w-6" />
              <h2 className="font-bold text-lg text-foreground tracking-tight">Profile Verifications Status</h2>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold tracking-wider uppercase">
              Trust Score Badges
            </span>
          </div>

          {/* Glowing Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Phone Badge */}
            <div className="relative group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]">
              {/* Static Status Badge */}
              <span className="absolute top-4 right-4 text-[9px] font-bold tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                Verified
              </span>

              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Phone Indicator</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.phone}</p>
                </div>
              </div>
            </div>

            {/* Email Badge */}
            <div className={`relative group rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
              user.emailVerified 
                ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]' 
                : 'border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40 hover:bg-amber-500/[0.04]'
            }`}>
              {/* Static Status Badge */}
              <span className={`absolute top-4 right-4 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${
                user.emailVerified 
                  ? 'text-emerald-600 bg-emerald-500/10' 
                  : 'text-amber-600 bg-amber-500/10'
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
                  <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Email Indicator</h4>
                  {user.email ? (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.email}</p>
                  ) : (
                    <Link to="/dashboard/profile" className="text-[11px] text-primary hover:underline block font-semibold mt-1">
                      Set Email
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Identity Badge */}
            <div className={`relative group rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
              user.identityVerified 
                ? 'border-emerald-500/20 bg-emerald-500/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]' 
                : 'border-border bg-muted/40 hover:border-border/80'
            }`}>
              {/* Static Status Badge */}
              <span className={`absolute top-4 right-4 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase ${
                user.identityVerified 
                  ? 'text-emerald-600 bg-emerald-500/10' 
                  : 'text-muted-500 bg-muted'
              }`}>
                {user.identityVerified ? 'Verified' : 'Pending'}
              </span>

              <div className="flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                  user.identityVerified ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
                }`}>
                  <Fingerprint size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground tracking-wide uppercase">Identity Verification</h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {user.identityVerified ? 'KYC Complete' : 'KYC Pending'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Grid Expansion (occupying full-height card segments) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        
        {/* Borrower Section */}
        {isBorrower && (
          <div className="group rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/30">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105">
                <Coins size={24} />
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight">Borrow Funds</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Post borrowing request listings, configure interest payback rates, matching periods, and request funds from nearby lenders.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <button 
                onClick={() => alert('Borrowing request submissions are coming in Phase 3!')}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-emerald-600 transition-colors"
              >
                Create loan request <PlusCircle size={18} />
              </button>
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
              <h3 className="text-xl font-bold text-foreground tracking-tight">Active Offers</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Scan active loan demands in your city, analyze trust metrics, offer custom deals, and coordinate face-to-face repayment contracts.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/60">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-emerald-600 transition-colors"
              >
                Browse marketplace <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        )}

      </motion.div>

      {/* Advisory Message */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
            <Info size={16} />
          </span>
          <div>
            <h4 className="font-bold text-foreground text-sm">Security Advisory Notice</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Always negotiate loan terms transparently within the application. MT Pocket handles connection, trust metrics, and matching logic. Remember to verify each other's identity metrics on-site during deal finalize.
            </p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
