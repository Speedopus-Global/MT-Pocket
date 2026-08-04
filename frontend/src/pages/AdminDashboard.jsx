/**
 * AdminDashboard.jsx — enhanced with top bar, sidebar, notifications
 * Suggested path: src/pages/admin/AdminDashboard.jsx
 */
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, Flag, Loader2, CheckCircle2,
  XCircle, Ban, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, FileText, Bell, LogOut, Menu, X,
  LayoutDashboard, Shield, TrendingUp,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'docs',    label: 'Verification Queue', icon: ShieldCheck,     desc: 'Review pending ID documents' },
  { key: 'users',   label: 'User Management',    icon: Users,           desc: 'Manage accounts and access' },
  { key: 'reports', label: 'Reports',            icon: Flag,            desc: 'Handle user-filed reports' },
];

const STATUS_COLOR = {
  active:    'text-emerald-600 bg-emerald-500/10',
  suspended: 'text-amber-600 bg-amber-500/10',
  banned:    'text-destructive bg-destructive/10',
};

const itemVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

// ── Root component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { accessToken, user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]               = useState('docs');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const [notifs, setNotifs]         = useState([]);
  const [unread, setUnread]         = useState(0);
  const notifRef = useRef(null);

  // Load notification count
  useEffect(() => {
    if (!accessToken) return;
    api.getUnreadCount(accessToken)
      .then((res) => setUnread(res.count ?? 0))
      .catch(() => {});
  }, [accessToken]);

  // Load notifications when panel opens
  useEffect(() => {
    if (!notifOpen || !accessToken) return;
    api.getNotifications(accessToken)
      .then(setNotifs)
      .catch(() => {});
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
    await api.markAllNotificationsRead(accessToken).catch(() => {});
    setUnread(0);
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">

          {/* Left: hamburger (mobile) + logo + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="flex items-center gap-2.5">
              {/* Logo mark */}
              <div className="w-8 h-8 rounded-full border-2 border-primary/60 bg-primary/10 flex items-center justify-center shrink-0">
                <Shield size={15} className="text-primary" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary leading-none">MT Pocket</p>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">Admin Dashboard</p>
              </div>
            </div>
          </div>

          {/* Right: notifications + user chip */}
          <div className="flex items-center gap-2">

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 rounded-2xl border border-border bg-card shadow-lg shadow-foreground/5 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="text-sm font-bold text-foreground">Notifications</p>
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-[11px] text-primary hover:underline font-semibold">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {notifs.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">No notifications</p>
                      ) : notifs.map((n) => (
                        <div key={n._id} className={`px-4 py-3 text-xs ${n.read ? 'text-muted-foreground' : 'text-foreground font-medium bg-primary/[0.03]'}`}>
                          <p>{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-none">{user?.fullName || 'Admin'}</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider leading-none mt-0.5">Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        <>
          {/* Mobile overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
              />
            )}
          </AnimatePresence>

          <aside className={`
            fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)]
            w-60 bg-card border-r border-border flex flex-col
            transition-transform duration-300 md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 mb-3">
                Admin Panels
              </p>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group ${
                    tab === t.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <t.icon size={16} className="shrink-0" />
                  <div>
                    <p className={`text-sm font-semibold leading-none ${tab === t.key ? 'text-primary-foreground' : ''}`}>
                      {t.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 leading-none ${tab === t.key ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {t.desc}
                    </p>
                  </div>
                </button>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-border">
              <div className="rounded-xl bg-muted/40 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Signed in as</p>
                <p className="text-xs font-semibold text-foreground truncate">{user?.fullName || 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.phone}</p>
              </div>
            </div>
          </aside>
        </>

        {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">

            {/* Page header */}
            <div className="flex items-center gap-3">
              {TABS.find((t) => t.key === tab) && (() => {
                const T = TABS.find((t2) => t2.key === tab);
                return (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <T.icon size={20} />
                    </div>
                    <div>
                      <h1 className="text-xl font-extrabold tracking-tight text-foreground">{T.label}</h1>
                      <p className="text-xs text-muted-foreground mt-0.5">{T.desc}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tab === 'docs'    && <DocsTab    key="docs"    accessToken={accessToken} />}
              {tab === 'users'   && <UsersTab   key="users"   accessToken={accessToken} />}
              {tab === 'reports' && <ReportsTab key="reports" accessToken={accessToken} />}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── DOCS TAB ──────────────────────────────────────────────────────────────────
function DocsTab({ accessToken }) {
  const [docs, setDocs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [busy, setBusy]             = useState({});
  const [rejectId, setRejectId]     = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try { setDocs(await api.adminGetPendingDocuments(accessToken)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (userId) => {
    setBusy((b) => ({ ...b, [userId]: 'approving' }));
    try {
      await api.adminApproveDocument(userId, accessToken);
      setDocs((d) => d.filter((u) => u._id !== userId));
    } finally { setBusy((b) => ({ ...b, [userId]: null })); }
  };

  const reject = async (userId) => {
    if (!rejectReason.trim()) return;
    setBusy((b) => ({ ...b, [userId]: 'rejecting' }));
    try {
      await api.adminRejectDocument(userId, rejectReason, accessToken);
      setDocs((d) => d.filter((u) => u._id !== userId));
      setRejectId(null);
      setRejectReason('');
    } finally { setBusy((b) => ({ ...b, [userId]: null })); }
  };

  if (loading) return <TabLoader />;
  if (!docs.length) return <EmptyState icon={ShieldCheck} label="No pending documents" sub="All submissions have been reviewed." />;

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-3">
      <SectionMeta count={docs.length} label="pending submission" />
      {docs.map((doc) => (
        <div key={doc._id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-base flex items-center justify-center shrink-0">
                {doc.fullName?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{doc.fullName || '—'}</p>
                <p className="text-xs text-muted-foreground">{doc.phone} · {doc.email || 'No email'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {doc.idDocumentType?.replace(/_/g, ' ') || 'Unknown type'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {doc.idDocumentSubmittedAt ? new Date(doc.idDocumentSubmittedAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {doc.idDocumentUrl && (
                <a
                  href={doc.idDocumentUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 px-3 py-2 rounded-xl hover:bg-primary/10 transition-colors"
                >
                  <FileText size={13} /> View
                </a>
              )}
              <button
                onClick={() => approve(doc._id)} disabled={!!busy[doc._id]}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 rounded-xl hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                {busy[doc._id] === 'approving' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Approve
              </button>
              <button
                onClick={() => { setRejectId(rejectId === doc._id ? null : doc._id); setRejectReason(''); }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2 rounded-xl hover:bg-destructive/10 transition-colors"
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          </div>

          <AnimatePresence>
            {rejectId === doc._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border px-5 pb-4 pt-3 overflow-hidden"
              >
                <div className="flex gap-2 items-end">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Rejection reason (required)
                    </label>
                    <input
                      autoFocus type="text" value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Document is blurry or doesn't match name"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    onClick={() => reject(doc._id)}
                    disabled={!rejectReason.trim() || !!busy[doc._id]}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-destructive text-destructive-foreground px-3 py-2 rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50 h-[38px] shrink-0"
                  >
                    {busy[doc._id] === 'rejecting' && <Loader2 size={13} className="animate-spin" />}
                    Confirm reject
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </motion.div>
  );
}

// ── USERS TAB ─────────────────────────────────────────────────────────────────
function UsersTab({ accessToken }) {
  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [busy, setBusy]             = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [suspendId, setSuspendId]   = useState(null);
  const [suspendReason, setSuspendReason] = useState('');

  const load = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await api.adminGetUsers({ page: p, limit: 15, search: s }, accessToken);
      setUsers(res.users);
      setTotal(res.total);
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
    if (!confirm('Permanently ban this user? This cannot be undone.')) return;
    setBusy((b) => ({ ...b, [id]: 'banning' }));
    try { await api.adminBanUser(id, accessToken); load(); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:bg-primary/90 transition-colors">
          Search
        </button>
      </form>

      {loading ? <TabLoader /> : (
        <div className="space-y-2">
          <SectionMeta count={total} label="user" />
          {users.map((u) => (
            <div key={u._id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(expandedId === u._id ? null : u._id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                    {u.fullName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{u.fullName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{u.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLOR[u.accountStatus] || ''}`}>
                    {u.accountStatus}
                  </span>
                  {u.identityVerified && (
                    <span className="hidden sm:inline-flex text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full items-center gap-1">
                      <CheckCircle2 size={10} /> ID verified
                    </span>
                  )}
                  {expandedId === u._id ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === u._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border px-4 pb-5 pt-4 space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Info label="Email"      value={u.email || '—'} />
                      <Info label="Role"       value={u.role} />
                      <Info label="Reports"    value={u.reportCount ?? 0} />
                      <Info label="Doc status" value={u.idDocumentStatus} />
                      {u.suspensionReason && <Info label="Suspension reason" value={u.suspensionReason} />}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {u.accountStatus === 'active' && (
                        <button
                          onClick={() => setSuspendId(suspendId === u._id ? null : u._id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 rounded-xl hover:bg-amber-500/10 transition-colors"
                        >
                          <AlertTriangle size={12} /> Suspend
                        </button>
                      )}
                      {u.accountStatus === 'suspended' && (
                        <button
                          onClick={() => unsuspend(u._id)} disabled={!!busy[u._id]}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 rounded-xl hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                        >
                          {busy[u._id] ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          Unsuspend
                        </button>
                      )}
                      {u.accountStatus !== 'banned' && (
                        <button
                          onClick={() => ban(u._id)} disabled={!!busy[u._id]}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 bg-destructive/5 px-3 py-1.5 rounded-xl hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          {busy[u._id] === 'banning' ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                          Ban permanently
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {suspendId === u._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }} className="flex gap-2 items-end overflow-hidden"
                        >
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Suspension reason (required)
                            </label>
                            <input
                              autoFocus type="text" value={suspendReason}
                              onChange={(e) => setSuspendReason(e.target.value)}
                              placeholder="Reason shown to the user…"
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <button
                            onClick={() => suspend(u._id)}
                            disabled={!suspendReason.trim() || !!busy[u._id]}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 text-white px-3 py-2 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 h-[38px] shrink-0"
                          >
                            {busy[u._id] === 'suspending' && <Loader2 size={12} className="animate-spin" />}
                            Confirm
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {total > 15 && (
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={page === 1}
                onClick={() => { const p = page - 1; setPage(p); load(p); }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / 15)}</span>
              <button
                disabled={page * 15 >= total}
                onClick={() => { const p = page + 1; setPage(p); load(p); }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
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
    try { setReports(await api.adminGetReports(s, accessToken)); }
    finally { setLoading(false); }
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
    try { await api.adminDismissReport(id, accessToken); load(); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {['open', 'reviewed', 'dismissed'].map((s) => (
          <button
            key={s} onClick={() => changeStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              status === s ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <TabLoader /> : !reports.length ? (
        <EmptyState icon={Flag} label={`No ${status} reports`} sub="Nothing to action here." />
      ) : (
        <div className="space-y-3">
          <SectionMeta count={reports.length} label={`${status} report`} />
          {reports.map((r) => (
            <div key={r._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By <strong>{r.reporterId?.fullName || r.reporterId?.phone || '—'}</strong>
                    {' '}against <strong>{r.reportedUserId?.fullName || r.reportedUserId?.phone || '—'}</strong>
                    {' · '}{new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  {r.details && <p className="text-xs text-muted-foreground mt-1 italic">"{r.details}"</p>}
                  {r.adminNotes && <p className="text-xs text-primary mt-1 font-medium">Notes: {r.adminNotes}</p>}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  r.status === 'open'     ? 'text-amber-600 bg-amber-500/10' :
                  r.status === 'reviewed' ? 'text-primary bg-primary/10' :
                                            'text-muted-foreground bg-muted'
                }`}>
                  {r.status}
                </span>
              </div>

              {r.status === 'open' && (
                <div className="flex flex-col sm:flex-row gap-2 items-end pt-2 border-t border-border">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Admin notes (optional)
                    </label>
                    <input
                      type="text" value={notes[r._id] || ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))}
                      placeholder="Internal notes…"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => review(r._id)} disabled={!!busy[r._id]}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {busy[r._id] === 'reviewing' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Mark reviewed
                    </button>
                    <button
                      onClick={() => dismiss(r._id)} disabled={!!busy[r._id]}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border px-3 py-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {busy[r._id] === 'dismissing' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 size={24} className="animate-spin" />
    </div>
  );
}

function EmptyState({ icon: Icon, label, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground rounded-2xl border border-dashed border-border">
      <Icon size={30} strokeWidth={1.4} />
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sub && <p className="text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
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