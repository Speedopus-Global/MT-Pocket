import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  Search, ChevronDown, CheckCircle2, Mail, ShieldAlert, FileText, Database,
  ArrowRight, ThumbsUp, ThumbsDown, Copy, Check,
  LifeBuoy, Send, BookOpen, AlertCircle, Clock,
  ShieldCheck, RefreshCw
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const FAQ_GROUPS = [
  {
    id: "account",
    group: "Account & Verification",
    icon: ShieldCheck,
    items: [
      {
        id: "faq-acc-1",
        q: "How does identity verification work on MT Pocket?",
        a: "Before creating or funding loans, members upload a government-issued ID and verification photo. This confirms real identities and protects all participants. Raw ID files are retained for 90 days then securely deleted, as outlined in our KYC Consent Notice.",
      },
      {
        id: "faq-acc-2",
        q: "Why was my identity verification rejected?",
        a: "Common reasons include blurry photos, glare, cropped edges, or a name mismatch with your profile. You can check the specific note in Settings → Identity Verification and upload a clear document.",
      },
      {
        id: "faq-acc-3",
        q: "How do I request account deletion or withdraw KYC consent?",
        a: "Submit a support ticket below selecting 'Account & KYC Inquiry' or email support@mtpocket.com. Our compliance team will process your data removal within standard regulatory timelines.",
      },
    ],
  },
  {
    id: "lending",
    group: "Borrowing & Lending",
    icon: BookOpen,
    items: [
      {
        id: "faq-lending-1",
        q: "Does MT Pocket handle or escrow loan funds?",
        a: "No. MT Pocket is a peer-to-peer facilitator platform. We never hold, touch, or process your money. All payments occur directly between borrower and lender via UPI, IMPS, or bank transfer.",
      },
      {
        id: "faq-lending-2",
        q: "Who determines interest rates and repayment schedules?",
        a: "Borrowers propose desired amounts and terms, and lenders accept or counter-offer. Both parties negotiate directly in chat without platform commission fees.",
      },
      {
        id: "faq-lending-3",
        q: "What happens if a repayment is delayed?",
        a: "Loan terms are private peer contracts between users. We advise reviewing member verification proofs before agreeing. You can report defaults or bad-faith actors directly to our moderation team.",
      },
    ],
  },
  {
    id: "safety",
    group: "Safety & Reporting",
    icon: LifeBuoy,
    items: [
      {
        id: "faq-safety-1",
        q: "How do I report a suspicious user or scam?",
        a: "Click 'Report' on any loan request, user profile, or chat conversation. Select the issue category (Fraud, Fake Profile, Harassment) and submit details for swift review.",
      },
      {
        id: "faq-safety-2",
        q: "What happens when I block another user?",
        a: "Blocking immediately hides that member's loan requests, offers, and chat messages from your view, preventing further contact.",
      },
    ],
  },
  {
    id: "privacy",
    group: "Privacy & Data",
    icon: Database,
    items: [
      {
        id: "faq-priv-1",
        q: "Who can see my uploaded documents and personal information?",
        a: "Other users only see your verified status badge — never your raw document files or identity numbers. Documents are encrypted and restricted to authorized compliance reviews.",
      },
      {
        id: "faq-priv-2",
        q: "Why is email verification required when updating contact info?",
        a: "To prevent unauthorized account takeovers, any updated email requires a one-time OTP verification before it becomes active.",
      },
    ],
  },
];

const QUICK_LINKS = [
  {
    title: "KYC Consent Notice",
    description: "ID storage rules, 90-day retention & data protection.",
    href: "/kyc-consent",
    icon: ShieldCheck,
    tag: "Notice",
  },
  {
    title: "Community Guidelines",
    description: "Rules for safe borrowing, respectful conduct & fraud safety.",
    href: "/community-guidelines",
    icon: ShieldAlert,
    tag: "Safety",
  },
  {
    title: "Terms & Conditions",
    description: "Facilitator platform policies & peer agreement terms.",
    href: "/terms",
    icon: FileText,
    tag: "Legal",
  },
  {
    title: "Privacy Policy",
    description: "Information collection, cookie usage & user data rights.",
    href: "/privacy",
    icon: Database,
    tag: "Privacy",
  },
];

export default function HelpAndSupport() {
  const { user, accessToken } = useAuth();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState(null);
  const [copiedFaqId, setCopiedFaqId] = useState(null);
  const [feedback, setFeedback] = useState({});

  // Ticket Form
  const [category, setCategory] = useState("General Inquiry");
  const [guestEmail, setGuestEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTicket, setSentTicket] = useState(null);
  const [error, setError] = useState(null);

  // Tickets List
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const fetchMyTickets = () => {
    if (!accessToken) return;
    setLoadingTickets(true);
    api.getMySupportTickets(accessToken)
      .then((res) => setMyTickets(Array.isArray(res) ? res : res?.tickets || []))
      .catch(() => {})
      .finally(() => setLoadingTickets(false));
  };

  useEffect(() => {
    fetchMyTickets();
  }, [accessToken]);

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "account", label: "Account & KYC" },
    { id: "lending", label: "Borrowing & Lending" },
    { id: "safety", label: "Safety & Reports" },
    { id: "privacy", label: "Privacy & Data" },
  ];

  const filteredGroups = useMemo(() => {
    let groups = FAQ_GROUPS;
    if (selectedCategory !== "all") {
      groups = groups.filter((g) => g.id === selectedCategory);
    }

    if (!query.trim()) return groups;

    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, selectedCategory]);

  const handleCopyFaq = (id, text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedFaqId(id);
    setTimeout(() => setCopiedFaqId(null), 2000);
  };

  const handleFeedback = (id, isHelpful, e) => {
    e.stopPropagation();
    setFeedback((prev) => ({ ...prev, [id]: isHelpful }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = user?.email || guestEmail.trim();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const ticketData = {
        userId: user?.id,
        senderEmail: email,
        senderName: user?.fullName || "MT Pocket Member",
        category,
        subject: subject.trim() || category,
        message: message.trim(),
      };

      const result = await api.createSupportTicket(ticketData, accessToken);
      setSentTicket(result);
      setSubject("");
      setMessage("");
      fetchMyTickets();
    } catch (err) {
      setError(err.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 px-4 py-8">
      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Help &amp; Support
          </h1>
          <p className="text-sm text-muted-foreground">
            Find answers to common questions about peer lending, KYC verification, and platform safety.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl pt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles (e.g. KYC verification, repayment, report user)..."
            className="w-full rounded-xl bg-background border border-border pl-10 pr-16 py-2.5 text-sm focus:ring-1 focus:ring-primary"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── QUICK RESOURCE LINKS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.href}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── MY TICKETS (LOGGED IN ONLY) ──────────────────────────────── */}
      {user && myTickets.length > 0 && (
        <div className="border border-border rounded-xl bg-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Your Support Tickets ({myTickets.length})
              </h2>
            </div>
            <button
              onClick={fetchMyTickets}
              disabled={loadingTickets}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-medium transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className={loadingTickets ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {myTickets.map((t) => (
              <div key={t._id || t.ticketId} className="border border-border/80 rounded-lg bg-background/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">{t.ticketId}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    t.status === "resolved" ? "bg-success/15 text-success" :
                    t.status === "in_progress" ? "bg-info/15 text-info" :
                    "bg-warning/15 text-warning"
                  }`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{t.subject}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  <span>{t.category}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FREQUENTLY ASKED QUESTIONS ───────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Select a category to filter common questions</p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border text-muted-foreground text-xs">
            <AlertCircle size={22} className="mx-auto mb-1.5 opacity-50" />
            <p>No questions found matching "{query}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <GroupIcon size={14} className="text-primary" />
                    <span>{group.group}</span>
                  </div>

                  <div className="divide-y divide-border border border-border rounded-xl bg-card overflow-hidden">
                    {group.items.map((item) => {
                      const isOpen = openFaqId === item.id;
                      const userFeedback = feedback[item.id];
                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                            className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer hover:bg-muted/20 transition-colors"
                          >
                            <span className="text-xs sm:text-sm font-medium text-foreground">
                              {item.q}
                            </span>
                            <ChevronDown
                              size={15}
                              className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                                isOpen ? "rotate-180 text-primary" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed space-y-2.5"
                              >
                                <p>{item.a}</p>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyFaq(item.id, `${item.q}\n\n${item.a}`, e)}
                                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                                  >
                                    {copiedFaqId === item.id ? (
                                      <>
                                        <Check size={12} className="text-primary" />
                                        <span className="text-primary">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    <span>Helpful?</span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleFeedback(item.id, true, e)}
                                      className={`p-1 rounded transition-colors cursor-pointer ${
                                        userFeedback === true ? "text-success font-bold" : "text-muted-foreground hover:text-foreground"
                                      }`}
                                      title="Yes"
                                    >
                                      <ThumbsUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleFeedback(item.id, false, e)}
                                      className={`p-1 rounded transition-colors cursor-pointer ${
                                        userFeedback === false ? "text-destructive font-bold" : "text-muted-foreground hover:text-foreground"
                                      }`}
                                      title="No"
                                    >
                                      <ThumbsDown size={12} />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SUPPORT TICKET FORM ──────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-card p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Open a Support Ticket</h2>
            <p className="text-xs text-muted-foreground">
              Have a specific account question or need moderation assistance? Our team replies within 24 hours.
            </p>
          </div>
        </div>

        {sentTicket ? (
          <div className="border border-success/30 bg-success/10 rounded-xl p-5 text-center space-y-2">
            <CheckCircle2 size={32} className="text-success mx-auto" />
            <h3 className="font-semibold text-sm text-foreground">Support Ticket Submitted</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Reference: <span className="font-mono font-bold text-primary">{sentTicket.ticketId || sentTicket.id}</span>. A confirmation has been sent to <strong>{sentTicket.senderEmail || user?.email}</strong>.
            </p>
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSentTicket(null)}
                className="text-xs rounded-lg cursor-pointer h-8"
              >
                Submit another inquiry
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Topic
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer h-9"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Account & KYC Inquiry">Account &amp; KYC Inquiry</option>
                  <option value="Borrowing & Lending Issue">Borrowing &amp; Lending Issue</option>
                  <option value="Report User or Scam">Report User or Scam</option>
                  <option value="Data & Privacy Request">Data &amp; Privacy Request</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Subject (Optional)
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of inquiry"
                  className="rounded-lg bg-background border-border text-xs h-9"
                />
              </div>
            </div>

            {!user && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Your Email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="rounded-lg bg-background border-border text-xs h-9"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Message <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{message.length} / 1000</span>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                rows={3}
                required
                placeholder="Please describe your question or issue in detail..."
                className="rounded-lg bg-background border-border text-xs leading-relaxed"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-between pt-1">
              <Button
                type="submit"
                disabled={submitting || !message.trim()}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer h-9"
              >
                {submitting ? "Submitting..." : (
                  <>
                    <Send size={12} className="mr-1" />
                    Submit Ticket
                  </>
                )}
              </Button>

              <span className="text-[11px] text-muted-foreground">
                or email <a href="mailto:support@mtpocket.com" className="text-primary font-medium hover:underline">support@mtpocket.com</a>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
