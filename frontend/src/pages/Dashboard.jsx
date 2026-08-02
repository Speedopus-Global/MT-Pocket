import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Fingerprint, 
  ArrowUpRight, 
  Coins, 
  Handshake, 
  PlusCircle, 
  Info 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const isLender = user.role === 'lender' || user.role === 'both';
  const isBorrower = user.role === 'borrower' || user.role === 'both';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {user.fullName || 'Member'}!
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here is an overview of your peer-to-peer lending status.
        </p>
      </div>

      {/* Trust Status Widget */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary h-5 w-5" />
            <h2 className="font-semibold text-foreground">Your Profile Trust Score</h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            Trust Badges
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Phone Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-[#FDF6ED]/10">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Smartphone size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Phone Verified
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{user.phone}</p>
            </div>
          </div>

          {/* Email Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-[#FDF6ED]/10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              user.emailVerified 
                ? 'bg-emerald-500/10 text-emerald-600' 
                : 'bg-amber-500/10 text-amber-600'
            }`}>
              <Mail size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Email Status
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.emailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              {user.email ? (
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              ) : (
                <Link to="/dashboard/profile" className="text-[11px] text-primary hover:underline block font-medium">
                  Add email
                </Link>
              )}
            </div>
          </div>

          {/* Identity Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-[#FDF6ED]/10">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              user.identityVerified 
                ? 'bg-emerald-500/10 text-emerald-600' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Fingerprint size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Identity Status
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.identityVerified ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {user.identityVerified ? 'KYC Verified' : 'KYC Pending'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Borrower Card */}
        {isBorrower && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Coins size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Need a Loan?</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Create a loan request detailing the amount, interest rate, and term you need. Connect with local lenders on your terms.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60">
              <button 
                onClick={() => alert('Loan request creation is coming in Phase 3!')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Create loan request <PlusCircle size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Lender Card */}
        {isLender && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#A1BC98]/20 text-primary flex items-center justify-center mb-4">
                <Handshake size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Explore Requests</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Browse peer-to-peer loan requests from verified people in your area. Fund loans safely and monitor your active repayments.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60">
              <Link 
                to="/" 
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Browse marketplace <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Placeholder Details Section */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="text-muted-foreground flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-foreground text-sm">Security Advisory</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Always negotiate loan terms transparently within the application. MT Pocket handles connection, trust metrics, and matching logic. Remember to verify each other's identity metrics on-site during deal finalize.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
