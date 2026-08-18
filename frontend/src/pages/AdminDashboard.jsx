/**
 * AdminDashboard.jsx — fully wired to backend
 * Verification queue (/admin/verification/queue), user management, reports,
 * support tickets, admin-only notifications (?adminOnly=true), audit trail,
 * selfie inspection, and claim/reupload workflows.
 */
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, Flag, Loader2, CheckCircle2,
  XCircle, Ban, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, Bell, LogOut, Menu, X,
  Clock, Eye, Download, History, RotateCcw,
  Search, Camera, MessageSquare, Check,
} from 'lucide-react';
import { Separator } from '../components/ui/separator';

// ── MT Pocket Custom Pocket Logo Component ──────────────────────────────────
export function MtPocketLogo({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M5 4.5C5 3.67157 5.67157 3 6.5 3H17.5C18.3284 3 19 3.67157 19 4.5V11.5C19 16.2 15.87 20 12 20C8.13 20 5 16.2 5 11.5V4.5Z"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10L12 13.5L15.5 10"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'docs',    label: 'Verification Queue', icon: ShieldCheck,   desc: 'Review KYC documents & selfies' },
  { key: 'users',   label: 'User Management',    icon: Users,         desc: 'Manage accounts, bans & access' },
  { key: 'reports', label: 'Reports',            icon: Flag,          desc: 'Moderation & dispute cases' },
  { key: 'tickets', label: 'Support Tickets',    icon: MessageSquare, desc: 'Customer support inquiries' },
];

const STATUS_COLOR = {
  active:    'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  suspended: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  banned:    'text-destructive bg-destructive/10 border-destructive/20',
};

const KYC_STATUS_COLOR = {
  pending:           'text-amber-600 bg-amber-500/10 border-amber-500/20',
  under_review:      'text-primary bg-primary/10 border-primary/20',
  approved:          'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  rejected:          'text-destructive bg-destructive/10 border-destructive/20',
  reupload_required: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
};

const NOTIF_ICON = {
  admin_doc_submitted:      ShieldCheck,
  admin_doc_resubmitted:    RefreshCw,
  admin_report_filed:       Flag,
  admin_duplicate_detected: AlertTriangle,
  admin_quality_flagged:    AlertTriangle,
};

const itemVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

// ── Root component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { accessToken, user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]                 = useState('docs');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifs, setNotifs]           = useState([]);
  const [unread, setUnread]           = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  // Load admin notification count (adminOnly=true)
  useEffect(() => {
    if (!accessToken) return;
    api.getAdminUnreadCount(accessToken)
      .then((count) => setUnread(count ?? 0))
      .catch(() => {});
    const timer = setInterval(() => {
      api.getAdminUnreadCount(accessToken)
        .then((count) => setUnread(count ?? 0))
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(timer);
  }, [accessToken]);

  // Load admin notifications when panel opens
  useEffect(() => {
    if (!notifOpen || !accessToken) return;
    setNotifLoading(true);
    api.getAdminNotifications(accessToken)
      .then(setNotifs)
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [notifOpen, accessToken]);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.markAdminAllNotificationsRead(accessToken).catch(() => {});
    setUnread(0);
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-sidebar text-foreground flex flex-col font-sans">

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-sidebar/95 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-4 md:px-6">

          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                <MtPocketLogo className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-primary leading-none">MT Pocket</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Admin Console</p>
              </div>
            </div>
          </div>

          {/* Right: notification bell + user chip */}
          <div className="flex items-center gap-2">

            {/* Admin notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Bell size={16} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-11 w-80 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Bell size={13} className="text-primary" />
                        <p className="text-xs font-bold text-foreground">Admin Alerts</p>
                      </div>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-primary hover:underline font-semibold cursor-pointer">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {notifLoading ? (
                        <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
                      ) : notifs.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No admin notifications</p>
                      ) : notifs.map((n) => {
                        const Icon = NOTIF_ICON[n.type] || Bell;
                        return (
                          <div key={n._id} className={`flex items-start gap-2.5 px-3 py-2.5 ${n.read ? 'opacity-60' : 'bg-primary/[0.03]'}`}>
                            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                              <Icon size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                                {n.message}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
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

            {/* User chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">{user?.fullName || 'Admin'}</p>
                <p className="text-[9px] text-primary font-bold uppercase tracking-wider leading-none mt-0.5">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="ml-0.5 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <>
          {/* Mobile overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-30 bg-background/60 backdrop-blur-xs md:hidden"
              />
            )}
          </AnimatePresence>

          <aside className={`
            fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)]
            w-56 bg-sidebar border-r border-border flex flex-col
            transition-transform duration-200 md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-2">
                Navigation
              </p>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    tab === t.key
                      ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <t.icon size={15} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-tight truncate">{t.label}</p>
                  </div>
                </button>
              ))}
            </nav>
            
            <div className="p-3 border-t border-border">
              <div className="rounded-lg bg-card border border-border p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Admin Account</p>
                <p className="text-xs font-semibold text-foreground truncate">{user?.fullName || 'Administrator'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.phone || user?.email}</p>
              </div>
            </div>
          </aside>
        </>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-sidebar">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">

            {/* Page header */}
            <div className="flex items-center gap-2.5 border-b border-border pb-3">
              {(() => {
                const T = TABS.find((t) => t.key === tab);
                if (!T) return null;
                return (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <T.icon size={16} />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold tracking-tight text-foreground">{T.label}</h1>
                      <p className="text-xs text-muted-foreground">{T.desc}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tab === 'docs'    && <VerifQueueTab key="docs"    accessToken={accessToken} />}
              {tab === 'users'   && <UsersTab      key="users"   accessToken={accessToken} />}
              {tab === 'reports' && <ReportsTab    key="reports" accessToken={accessToken} />}
              {tab === 'tickets' && <SupportTicketsTab key="tickets" accessToken={accessToken} />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── VERIFICATION QUEUE TAB ────────────────────────────────────────────────────
function VerifQueueTab({ accessToken }) {
  const [queueStatus, setQueueStatus] = useState('pending');
  const [docs, setDocs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [busy, setBusy]               = useState({});
  const [rejectId, setRejectId]       = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reuploadId, setReuploadId]   = useState(null);
  const [reuploadReason, setReuploadReason] = useState('');
  const [auditDoc, setAuditDoc]       = useState(null);

  const load = async (status = queueStatus) => {
    setLoading(true);
    try {
      const res = await api.adminVerifQueue({ status, page: 1, limit: 50 }, accessToken);
      setDocs(res.docs ?? []);
    } catch { setDocs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = (s) => { setQueueStatus(s); load(s); };

  const claim = async (docId) => {
    setBusy((b) => ({ ...b, [docId]: 'claiming' }));
    try { await api.adminVerifClaim(docId, accessToken); load(); }
    catch (e) { alert(e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const viewFile = async (docId) => {
    setBusy((b) => ({ ...b, [docId]: 'viewing' }));
    try {
      const blob = await api.adminVerifFile(docId, accessToken);
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) { alert('Could not load document: ' + e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const downloadFile = async (docId) => {
    setBusy((b) => ({ ...b, [docId]: 'downloading' }));
    try {
      const blob = await api.adminVerifFile(docId, accessToken, true);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `kyc-${docId}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch (e) { alert('Download failed: ' + e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const viewSelfie = async (docId) => {
    setBusy((b) => ({ ...b, [docId]: 'viewingSelfie' }));
    try {
      const blob = await api.adminVerifSelfie(docId, accessToken);
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) { alert('Could not load selfie: ' + e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const downloadSelfie = async (docId) => {
    setBusy((b) => ({ ...b, [docId]: 'downloadingSelfie' }));
    try {
      const blob = await api.adminVerifSelfie(docId, accessToken, true);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `selfie-${docId}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch (e) { alert('Selfie download failed: ' + e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const approve = async (docId) => {
    setBusy((b) => ({ ...b, [docId]: 'approving' }));
    try { await api.adminVerifApprove(docId, accessToken); load(); }
    catch (e) { alert(e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const reject = async (docId) => {
    if (!rejectReason.trim()) return;
    setBusy((b) => ({ ...b, [docId]: 'rejecting' }));
    try {
      await api.adminVerifReject(docId, rejectReason, accessToken);
      setRejectId(null); setRejectReason(''); load();
    } catch (e) { alert(e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const reupload = async (docId) => {
    if (!reuploadReason.trim()) return;
    setBusy((b) => ({ ...b, [docId]: 'reuploading' }));
    try {
      await api.adminVerifReupload(docId, reuploadReason, accessToken);
      setReuploadId(null); setReuploadReason(''); load();
    } catch (e) { alert(e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  const loadAudit = async (docId) => {
    if (auditDoc?.id === docId) { setAuditDoc(null); return; }
    setBusy((b) => ({ ...b, [docId]: 'auditing' }));
    try {
      const trail = await api.adminVerifAudit(docId, accessToken);
      setAuditDoc({ id: docId, trail });
    } catch (e) { alert('Could not load audit: ' + e.message); }
    finally { setBusy((b) => ({ ...b, [docId]: null })); }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-3">
      {/* Status filter */}
      <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-card border border-border w-fit">
        {['pending', 'under_review', 'approved', 'rejected', 'reupload_required'].map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            className={`px-2.5 py-1 rounded text-xs font-semibold capitalize transition-colors cursor-pointer ${
              queueStatus === s ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? <TabLoader /> : !docs.length ? (
        <EmptyState icon={ShieldCheck} label={`No ${queueStatus.replace(/_/g, ' ')} documents`} sub="All submissions have been reviewed." />
      ) : (
        <div className="space-y-2.5">
          <SectionMeta count={docs.length} label={`${queueStatus.replace(/_/g, ' ')} document`} />
          
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {docs.map((doc) => (
              <div key={doc._id} className="p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {doc.userId?.fullName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-foreground">{doc.userId?.fullName || doc.userId || '—'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {doc.documentType?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${KYC_STATUS_COLOR[doc.status] || 'bg-muted text-muted-foreground'}`}>
                          {doc.status?.replace(/_/g, ' ')}
                        </span>
                        {doc.qualityFlagged && (
                          <span className="text-[9px] font-bold text-orange-600 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded">⚠ Quality</span>
                        )}
                        {doc.hasSelfie ? (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">📷 Selfie</span>
                        ) : (
                          <span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">No selfie</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          · v{doc.version} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => viewFile(doc._id)}
                      disabled={!!busy[doc._id]}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary border border-primary/30 bg-primary/5 px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {busy[doc._id] === 'viewing' ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
                      View Doc
                    </button>
                    <button
                      onClick={() => downloadFile(doc._id)}
                      disabled={!!busy[doc._id]}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground border border-border bg-muted/20 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {busy[doc._id] === 'downloading' ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                      DL
                    </button>

                    {doc.hasSelfie && (
                      <>
                        <button
                          onClick={() => viewSelfie(doc._id)}
                          disabled={!!busy[doc._id]}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 border border-violet-500/30 bg-violet-500/5 px-2.5 py-1.5 rounded-lg hover:bg-violet-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {busy[doc._id] === 'viewingSelfie' ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                          Selfie
                        </button>
                        <button
                          onClick={() => downloadSelfie(doc._id)}
                          disabled={!!busy[doc._id]}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground border border-border bg-muted/20 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                          title="Download selfie"
                        >
                          {busy[doc._id] === 'downloadingSelfie' ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                        </button>
                      </>
                    )}

                    {doc.status === 'pending' && (
                      <button
                        onClick={() => claim(doc._id)}
                        disabled={!!busy[doc._id]}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {busy[doc._id] === 'claiming' ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} />}
                        Claim
                      </button>
                    )}

                    {(doc.status === 'under_review' || doc.status === 'pending') && (
                      <>
                        <button
                          onClick={() => approve(doc._id)}
                          disabled={!!busy[doc._id]}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {busy[doc._id] === 'approving' ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectId(rejectId === doc._id ? null : doc._id); setRejectReason(''); }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                        >
                          <XCircle size={11} /> Reject
                        </button>
                        <button
                          onClick={() => { setReuploadId(reuploadId === doc._id ? null : doc._id); setReuploadReason(''); }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 border border-orange-500/30 bg-orange-500/5 px-2.5 py-1.5 rounded-lg hover:bg-orange-500/10 transition-colors cursor-pointer"
                        >
                          <RotateCcw size={11} /> Reupload
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => loadAudit(doc._id)}
                      disabled={busy[doc._id] === 'auditing'}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {busy[doc._id] === 'auditing' ? <Loader2 size={11} className="animate-spin" /> : <History size={11} />}
                      Audit
                    </button>
                  </div>
                </div>

                {/* Reject reason input */}
                <AnimatePresence>
                  {rejectId === doc._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border pt-2.5 overflow-hidden"
                    >
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Rejection reason (required)</label>
                          <input
                            autoFocus type="text" value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Document is blurry or does not match profile name"
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8"
                          />
                        </div>
                        <button
                          onClick={() => reject(doc._id)}
                          disabled={!rejectReason.trim() || !!busy[doc._id]}
                          className="inline-flex items-center gap-1 text-xs font-semibold bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 h-8 shrink-0 cursor-pointer"
                        >
                          {busy[doc._id] === 'rejecting' && <Loader2 size={11} className="animate-spin" />}
                          Confirm reject
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reupload reason input */}
                <AnimatePresence>
                  {reuploadId === doc._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border pt-2.5 overflow-hidden"
                    >
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Reupload reason (required)</label>
                          <input
                            autoFocus type="text" value={reuploadReason}
                            onChange={(e) => setReuploadReason(e.target.value)}
                            placeholder="e.g. Photo corners are cut off — please upload full page"
                            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8"
                          />
                        </div>
                        <button
                          onClick={() => reupload(doc._id)}
                          disabled={!reuploadReason.trim() || !!busy[doc._id]}
                          className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 h-8 shrink-0 cursor-pointer"
                        >
                          {busy[doc._id] === 'reuploading' && <Loader2 size={11} className="animate-spin" />}
                          Request reupload
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Audit trail panel */}
                <AnimatePresence>
                  {auditDoc?.id === doc._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border bg-muted/20 -mx-3.5 -mb-3.5 p-3.5 space-y-1.5 overflow-hidden"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audit Trail</p>
                      {(!auditDoc.trail || auditDoc.trail.length === 0) ? (
                        <p className="text-xs text-muted-foreground">No audit events logged yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {auditDoc.trail.map((event, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground capitalize">{event.action?.replace(/_/g, ' ')}</span>
                                {event.performedByRole && event.performedByRole !== 'user' && (
                                  <span className="text-muted-foreground"> · by {event.performedByRole.replace('_', ' ')}</span>
                                )}
                                {event.reason && <span className="text-muted-foreground italic"> "{event.reason}"</span>}
                                <span className="text-[10px] text-muted-foreground ml-1.5">({event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── USERS TAB ──────────────────────────────────────────────────────────────────
function UsersTab({ accessToken }) {
  const [users, setUsers]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [busy, setBusy]               = useState({});
  const [expandedId, setExpandedId]   = useState(null);
  const [suspendId, setSuspendId]     = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [reportId, setReportId]       = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [banTarget, setBanTarget]       = useState(null);

  const load = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await api.adminGetUsers({ page: p, limit: 15, search: s }, accessToken);
      setUsers(res.users ?? []);
      setTotal(res.total ?? 0);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(1, search); };

  const suspend = async (id) => {
    if (!suspendReason.trim()) return;
    setBusy((b) => ({ ...b, [id]: 'suspending' }));
    try {
      await api.adminSuspendUser(id, suspendReason, accessToken);
      setSuspendId(null); setSuspendReason(''); load();
    } finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  const unsuspend = async (id) => {
    setBusy((b) => ({ ...b, [id]: 'unsuspending' }));
    try { await api.adminUnsuspendUser(id, accessToken); load(); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  const ban = async (id) => {
    setBusy((b) => ({ ...b, [id]: 'banning' }));
    try { await api.adminBanUser(id, accessToken); setBanTarget(null); load(); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  const fileReport = async (id) => {
    if (!reportReason.trim()) return;
    setBusy((b) => ({ ...b, [id]: 'reporting' }));
    try {
      await api.fileReport(
        { reportedUserId: id, reason: 'other', details: reportReason, reportContext: 'admin_action' },
        accessToken,
      );
      setReportId(null); setReportReason('');
    } catch (e) { alert(e.message); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, phone or email…"
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-9"
          />
        </div>
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 hover:bg-primary/90 transition-colors cursor-pointer h-9 shadow-2xs">
          Search
        </button>
      </form>

      {loading ? <TabLoader /> : (
        <div className="space-y-2">
          <SectionMeta count={total} label="user" />
          
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {users.map((u) => (
              <div key={u._id}>
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === u._id ? null : u._id)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {u.fullName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-foreground">{u.fullName || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{u.phone || u.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLOR[u.accountStatus] || 'border-border text-muted-foreground bg-muted'}`}>
                      {u.accountStatus}
                    </span>
                    {u.identityVerified && (
                      <span className="hidden sm:inline-flex text-[9px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded items-center gap-1">
                        <CheckCircle2 size={10} /> KYC
                      </span>
                    )}
                    {expandedId === u._id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === u._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border bg-muted/10 p-3 space-y-3 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <InfoCell label="Email"      value={u.email || '—'} />
                        <InfoCell label="Role"       value={u.role} />
                        <InfoCell label="Reports"    value={u.reportCount ?? 0} />
                        <InfoCell label="Doc status" value={u.idDocumentStatus || 'none'} />
                        {u.suspensionReason && <InfoCell label="Suspension reason" value={u.suspensionReason} />}
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {u.accountStatus === 'active' && (
                          <button
                            onClick={() => setSuspendId(suspendId === u._id ? null : u._id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 border border-amber-500/30 bg-amber-500/5 px-2.5 py-1 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                          >
                            <AlertTriangle size={11} /> Suspend
                          </button>
                        )}
                        {u.accountStatus === 'suspended' && (
                          <button
                            onClick={() => unsuspend(u._id)} disabled={!!busy[u._id]}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {busy[u._id] ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            Unsuspend
                          </button>
                        )}
                        {u.accountStatus !== 'banned' && (
                          <button
                            onClick={() => setBanTarget({ id: u._id, name: u.fullName || 'User' })} disabled={!!busy[u._id]}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive border border-destructive/30 bg-destructive/5 px-2.5 py-1 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {busy[u._id] === 'banning' ? <Loader2 size={11} className="animate-spin" /> : <Ban size={11} />}
                            Ban permanently
                          </button>
                        )}
                        <button
                          onClick={() => setReportId(reportId === u._id ? null : u._id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground border border-border px-2.5 py-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        >
                          <Flag size={11} /> File report
                        </button>
                      </div>

                      {/* Suspend form */}
                      <AnimatePresence>
                        {suspendId === u._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} className="flex gap-2 items-end pt-2 border-t border-border overflow-hidden"
                          >
                            <div className="flex-1">
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Suspension reason (required)</label>
                              <input
                                autoFocus type="text" value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                placeholder="Reason shown to the user…"
                                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8"
                              />
                            </div>
                            <button
                              onClick={() => suspend(u._id)}
                              disabled={!suspendReason.trim() || !!busy[u._id]}
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 h-8 shrink-0 cursor-pointer"
                            >
                              {busy[u._id] === 'suspending' && <Loader2 size={11} className="animate-spin" />}
                              Confirm
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Report form */}
                      <AnimatePresence>
                        {reportId === u._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} className="flex gap-2 items-end pt-2 border-t border-border overflow-hidden"
                          >
                            <div className="flex-1">
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Report details</label>
                              <input
                                autoFocus type="text" value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Describe the issue…"
                                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8"
                              />
                            </div>
                            <button
                              onClick={() => fileReport(u._id)}
                              disabled={!reportReason.trim() || !!busy[u._id]}
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 h-8 shrink-0 cursor-pointer"
                            >
                              {busy[u._id] === 'reporting' && <Loader2 size={11} className="animate-spin" />}
                              File report
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {total > 15 && (
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={page === 1}
                onClick={() => { const p = page - 1; setPage(p); load(p); }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
              >
                ← Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / 15)}</span>
              <button
                disabled={page * 15 >= total}
                onClick={() => { const p = page + 1; setPage(p); load(p); }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ban confirmation modal */}
      <AnimatePresence>
        {banTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-5 shadow-xl space-y-3"
            >
              <div className="flex items-center gap-2.5 text-destructive">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
                  <Ban size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Ban User Permanently</h3>
                  <p className="text-xs text-muted-foreground">{banTarget.name}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently ban this user? Their account access will be revoked immediately.
              </p>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setBanTarget(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => ban(banTarget.id)}
                  disabled={busy[banTarget.id] === 'banning'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {busy[banTarget.id] === 'banning' && <Loader2 size={11} className="animate-spin" />}
                  Confirm Ban
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── REPORTS TAB ───────────────────────────────────────────────────────────────
function ReportsTab({ accessToken }) {
  const [status, setStatus]   = useState('open');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState({});
  const [notes, setNotes]     = useState({});

  const load = async (s = status) => {
    setLoading(true);
    try {
      const res = await api.adminGetReports({ status: s }, accessToken);
      setReports(res.reports ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = (s) => { setStatus(s); load(s); };

  const review = async (id) => {
    setBusy((b) => ({ ...b, [id]: 'reviewing' }));
    try { await api.adminReviewReport(id, notes[id] || '', accessToken); load(); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  const dismiss = async (id) => {
    setBusy((b) => ({ ...b, [id]: 'dismissing' }));
    try { await api.adminDismissReport(id, notes[id] || undefined, accessToken); load(); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-3">
      <div className="flex gap-1 p-1 rounded-lg bg-card border border-border w-fit">
        {['open', 'reviewed', 'dismissed'].map((s) => (
          <button
            key={s} onClick={() => changeStatus(s)}
            className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors cursor-pointer ${
              status === s ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <TabLoader /> : !reports.length ? (
        <EmptyState icon={Flag} label={`No ${status} reports`} sub="All moderation cases are resolved." />
      ) : (
        <div className="space-y-2">
          <SectionMeta count={reports.length} label={`${status} report`} />
          
          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {reports.map((r) => (
              <div key={r._id} className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{r.reason?.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      By <strong>{r.reporterId?.fullName || r.reporterId?.phone || '—'}</strong>
                      {' '}against <strong>{r.reportedUserId?.fullName || r.reportedUserId?.phone || '—'}</strong>
                      {' · '}{new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    {r.details    && <p className="text-xs text-foreground mt-1 italic">"{r.details}"</p>}
                    {r.adminNotes && <p className="text-xs text-primary mt-1 font-medium">Notes: {r.adminNotes}</p>}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                    r.status === 'open'     ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' :
                    r.status === 'reviewed' ? 'text-primary bg-primary/10 border-primary/20' :
                                              'text-muted-foreground bg-muted border-border'
                  }`}>
                    {r.status}
                  </span>
                </div>

                {r.status === 'open' && (
                  <div className="flex flex-col sm:flex-row gap-2 items-end pt-2 border-t border-border">
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Admin notes (optional)</label>
                      <input
                        type="text" value={notes[r._id] || ''}
                        onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))}
                        placeholder="Internal notes…"
                        className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8"
                      />
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => review(r._id)} disabled={!!busy[r._id]}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer h-8 shadow-2xs"
                      >
                        {busy[r._id] === 'reviewing' ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        Mark reviewed
                      </button>
                      <button
                        onClick={() => dismiss(r._id)} disabled={!!busy[r._id]}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer h-8"
                      >
                        {busy[r._id] === 'dismissing' ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── SUPPORT TICKETS TAB ───────────────────────────────────────────────────────
function SupportTicketsTab({ accessToken }) {
  const [status, setStatus]     = useState('all');
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState({});
  const [adminNotes, setAdminNotes] = useState({});

  const load = async (s = status) => {
    setLoading(true);
    try {
      const res = await api.getAdminSupportTickets({ status: s === 'all' ? undefined : s }, accessToken);
      setTickets(res.tickets ?? []);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeStatusFilter = (s) => { setStatus(s); load(s); };

  const updateTicket = async (id, nextStatus) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await api.updateSupportTicketStatus(id, nextStatus, adminNotes[id] || undefined, accessToken);
      load();
    } catch (e) { alert(e.message); }
    finally { setBusy((b) => ({ ...b, [id]: false })); }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-3">
      <div className="flex gap-1 p-1 rounded-lg bg-card border border-border w-fit">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
          <button
            key={s} onClick={() => changeStatusFilter(s)}
            className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors cursor-pointer ${
              status === s ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <TabLoader /> : !tickets.length ? (
        <EmptyState icon={MessageSquare} label="No support tickets found" sub="All inquiries have been answered." />
      ) : (
        <div className="space-y-2">
          <SectionMeta count={tickets.length} label="ticket" />

          <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {tickets.map((t) => (
              <div key={t._id || t.ticketId} className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{t.ticketId}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground mt-1">{t.subject}</p>
                    <p className="text-[11px] text-muted-foreground">
                      From: <strong>{t.senderName}</strong> ({t.senderEmail}) · {new Date(t.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-foreground bg-muted/20 p-2 rounded-lg border border-border/60 mt-1.5 leading-relaxed">
                      {t.message}
                    </p>
                    {t.adminNotes && (
                      <p className="text-xs text-primary font-medium mt-1">Resolution note: {t.adminNotes}</p>
                    )}
                  </div>

                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                    t.status === 'resolved' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' :
                    t.status === 'in_progress' ? 'text-sky-600 bg-sky-500/10 border-sky-500/20' :
                    'text-amber-600 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {t.status?.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-end pt-2 border-t border-border">
                  <div className="flex-1">
                    <input
                      type="text" value={adminNotes[t._id] || ''}
                      onChange={(e) => setAdminNotes((n) => ({ ...n, [t._id]: e.target.value }))}
                      placeholder="Add admin resolution notes…"
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-8"
                    />
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {t.status !== 'in_progress' && t.status !== 'resolved' && (
                      <button
                        onClick={() => updateTicket(t._id, 'in_progress')}
                        disabled={busy[t._id]}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 border border-sky-500/30 bg-sky-500/5 px-2.5 py-1.5 rounded-lg hover:bg-sky-500/10 transition-colors disabled:opacity-50 cursor-pointer h-8"
                      >
                        In Progress
                      </button>
                    )}
                    {t.status !== 'resolved' && (
                      <button
                        onClick={() => updateTicket(t._id, 'resolved')}
                        disabled={busy[t._id]}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer h-8 shadow-2xs"
                      >
                        <Check size={11} /> Mark Resolved
                      </button>
                    )}
                    {t.status !== 'closed' && (
                      <button
                        onClick={() => updateTicket(t._id, 'closed')}
                        disabled={busy[t._id]}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer h-8"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );
}

function EmptyState({ icon: Icon, label, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground rounded-xl border border-dashed border-border">
      <Icon size={26} strokeWidth={1.5} />
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {sub && <p className="text-[11px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function InfoCell({ label, value }) {
  return (
    <div className="rounded-lg bg-card border border-border/80 px-2.5 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground capitalize mt-0.5 truncate">{String(value)}</p>
    </div>
  );
}

function SectionMeta({ count, label }) {
  return (
    <p className="text-xs text-muted-foreground font-medium">
      {count} {label}{count !== 1 ? 's' : ''}
    </p>
  );
}