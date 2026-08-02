/**
 * AdminDashboard.jsx
 * Suggested path: src/pages/admin/AdminDashboard.jsx
 *
 * Three tabs: Verification Queue | User Management | Reports
 * Accessible only via RequireAdmin guard (systemRole === 'admin').
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Users, Flag, Loader2, CheckCircle2,
  XCircle, Ban, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, FileText,
} from 'lucide-react';

const TABS = [
  { key: 'docs',    label: 'Verification Queue', icon: ShieldCheck },
  { key: 'users',   label: 'Users',              icon: Users },
  { key: 'reports', label: 'Reports',            icon: Flag },
];

const STATUS_COLOR = {
  active:    'text-emerald-600 bg-emerald-500/10',
  suspended: 'text-amber-600  bg-amber-500/10',
  banned:    'text-destructive bg-destructive/10',
};

const itemVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState('docs');

  return (
    <div className="flex-1 flex flex-col space-y-6 min-h-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Verification queue, user management, and reports.</p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'docs'    && <DocsTab    key="docs"    accessToken={accessToken} />}
        {tab === 'users'   && <UsersTab   key="users"   accessToken={accessToken} />}
        {tab === 'reports' && <ReportsTab key="reports" accessToken={accessToken} />}
      </AnimatePresence>
    </div>
  );
}

// ── DOCS TAB ──────────────────────────────────────────────────────────────────
function DocsTab({ accessToken }) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState({});
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
  if (!docs.length) return <EmptyState icon={ShieldCheck} label="No pending documents" />;

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-3">
      {docs.map((doc) => (
        <div key={doc._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">{doc.fullName || '—'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{doc.phone} · {doc.email || 'No email'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {doc.idDocumentType?.replace('_', ' ') || 'Unknown type'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Submitted {doc.idDocumentSubmittedAt ? new Date(doc.idDocumentSubmittedAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {doc.idDocumentUrl && (
                <a
                  href={doc.idDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <FileText size={13} /> View doc
                </a>
              )}
              <button
                onClick={() => approve(doc._id)}
                disabled={!!busy[doc._id]}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                {busy[doc._id] === 'approving' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Approve
              </button>
              <button
                onClick={() => setRejectId(rejectId === doc._id ? null : doc._id)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          </div>

          {/* Inline rejection reason form */}
          <AnimatePresence>
            {rejectId === doc._id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex gap-2 items-end overflow-hidden"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Rejection reason (required)
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Document is blurry or doesn't match name"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={() => reject(doc._id)}
                  disabled={!rejectReason.trim() || !!busy[doc._id]}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-destructive text-destructive-foreground px-3 py-2 rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50 h-[38px]"
                >
                  {busy[doc._id] === 'rejecting' ? <Loader2 size={13} className="animate-spin" /> : null}
                  Confirm
                </button>
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
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState({});
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

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const suspend = async (id) => {
    if (!suspendReason.trim()) return;
    setBusy((b) => ({ ...b, [id]: 'suspending' }));
    try {
      await api.adminSuspendUser(id, suspendReason, accessToken);
      setSuspendId(null);
      setSuspendReason('');
      load();
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
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email…"
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </form>

      {loading ? <TabLoader /> : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{total} users</p>
          {users.map((u) => (
            <div key={u._id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
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
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      ID verified
                    </span>
                  )}
                  {expandedId === u._id ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === u._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border px-4 pb-4 pt-3 space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <Info label="Email"   value={u.email || '—'} />
                      <Info label="Role"    value={u.role} />
                      <Info label="Reports" value={u.reportCount ?? 0} />
                      <Info label="Doc status" value={u.idDocumentStatus} />
                      {u.suspensionReason && <Info label="Suspension reason" value={u.suspensionReason} />}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {u.accountStatus === 'active' && (
                        <button
                          onClick={() => setSuspendId(suspendId === u._id ? null : u._id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                        >
                          <AlertTriangle size={12} /> Suspend
                        </button>
                      )}
                      {u.accountStatus === 'suspended' && (
                        <button
                          onClick={() => unsuspend(u._id)}
                          disabled={!!busy[u._id]}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                        >
                          {busy[u._id] ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          Unsuspend
                        </button>
                      )}
                      {u.accountStatus !== 'banned' && (
                        <button
                          onClick={() => ban(u._id)}
                          disabled={!!busy[u._id]}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive border border-destructive/30 bg-destructive/5 px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        >
                          {busy[u._id] === 'banning' ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                          Ban permanently
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {suspendId === u._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-2 items-end overflow-hidden"
                        >
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Suspension reason (required)
                            </label>
                            <input
                              type="text"
                              value={suspendReason}
                              onChange={(e) => setSuspendReason(e.target.value)}
                              placeholder="Reason shown to the user…"
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <button
                            onClick={() => suspend(u._id)}
                            disabled={!suspendReason.trim() || !!busy[u._id]}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-600 text-white px-3 py-2 rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 h-[38px]"
                          >
                            {busy[u._id] === 'suspending' ? <Loader2 size={12} className="animate-spin" /> : null}
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
              <span className="text-xs text-muted-foreground">Page {page}</span>
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
  const [status, setStatus] = useState('open');
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
    const adminNotes = notes[id] || '';
    setBusy((b) => ({ ...b, [id]: 'reviewing' }));
    try {
      await api.adminReviewReport(id, adminNotes, accessToken);
      load();
    } finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  const dismiss = async (id) => {
    setBusy((b) => ({ ...b, [id]: 'dismissing' }));
    try { await api.adminDismissReport(id, accessToken); load(); }
    finally { setBusy((b) => ({ ...b, [id]: null })); }
  };

  const STATUS_TABS = ['open', 'reviewed', 'dismissed'];

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              status === s ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <TabLoader /> : !reports.length ? <EmptyState icon={Flag} label={`No ${status} reports`} /> : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.reason}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By <strong>{r.reporterId?.fullName || r.reporterId?.phone || '—'}</strong>
                    {' '}against{' '}
                    <strong>{r.reportedUserId?.fullName || r.reportedUserId?.phone || '—'}</strong>
                    {' · '}
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  {r.details && <p className="text-xs text-muted-foreground mt-1 italic">"{r.details}"</p>}
                  {r.adminNotes && (
                    <p className="text-xs text-primary mt-1">Admin notes: {r.adminNotes}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  r.status === 'open' ? 'text-amber-600 bg-amber-500/10' :
                  r.status === 'reviewed' ? 'text-primary bg-primary/10' :
                  'text-muted-foreground bg-muted'
                }`}>
                  {r.status}
                </span>
              </div>

              {r.status === 'open' && (
                <div className="flex flex-col sm:flex-row gap-2 items-end pt-1 border-t border-border">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Admin notes (optional)
                    </label>
                    <input
                      type="text"
                      value={notes[r._id] || ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [r._id]: e.target.value }))}
                      placeholder="Internal notes…"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => review(r._id)}
                      disabled={!!busy[r._id]}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {busy[r._id] === 'reviewing' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Mark reviewed
                    </button>
                    <button
                      onClick={() => dismiss(r._id)}
                      disabled={!!busy[r._id]}
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

// ── Small helpers ─────────────────────────────────────────────────────────────
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 size={22} className="animate-spin" />
    </div>
  );
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <Icon size={28} strokeWidth={1.5} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground capitalize mt-0.5">{String(value)}</p>
    </div>
  );
}