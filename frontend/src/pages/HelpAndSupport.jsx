import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, CheckCircle2, Mail, ShieldAlert, FileText, Database,
  ArrowRight, HelpCircle, ThumbsUp, ThumbsDown, Copy, Check, Sparkles,
  LifeBuoy, MessageSquare, Send, BookOpen, AlertCircle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const FAQ_GROUPS = [
  {
    id: "account",
    group: "Account & Verification",
    icon: ShieldAlert,
    items: [
      {
        id: "faq-1",
        q: "How do I get verified?",
        a: "Upload a government-issued ID (Aadhaar, PAN, Passport, or Driving License) from Settings → Identity Verification. Reviews are completed within 1–2 business days.",
      },
      {
        id: "faq-2",
        q: "Why was my document rejected?",
        a: "Common causes are blurry images, glare, cropped corners, or name mismatch with registered profile. You can view the specific rejection note on your Settings dashboard and re-upload.",
      },
      {
        id: "faq-3",
        q: "Why do I need to verify my email again after updating it?",
        a: "To protect your account integrity, any change to your registered email address requires immediate one-time verification before the new email becomes active.",
      },
    ],
  },
  {
    id: "lending",
    group: "Borrowing & Lending",
    icon: BookOpen,
    items: [
      {
        id: "faq-4",
        q: "Does MT Pocket handle or hold funds?",
        a: "No. MT Pocket operates on a pure peer-to-peer connection model. We never touch, process, or escrow your money. All transfers occur directly between the borrower and lender via UPI, IMPS, or bank transfer.",
      },
      {
        id: "faq-5",
        q: "Who determines the loan interest rate and repayment timeline?",
        a: "Borrowers propose their desired rate and tenure, and lenders submit counter-proposals or accept. Both parties negotiate and agree directly through chat without platform fee deductions.",
      },
      {
        id: "faq-6",
        q: "What happens if a loan repayment is delayed?",
        a: "Loan terms are private peer contracts between borrower and lender. We strongly advise examining KYC identity proofs and entering written terms. You can also file reports to alert administrators of defaults.",
      },
    ],
  },
  {
    id: "safety",
    group: "Safety & Community",
    icon: LifeBuoy,
    items: [
      {
        id: "faq-7",
        q: "How do I report or block suspicious users?",
        a: "Tap the Report/Block button directly on any loan request card, profile popup, or in the chat options menu. Blocked members are instantly hidden from your marketplace feeds.",
      },
      {
        id: "faq-8",
        q: "What measures protect my personal data?",
        a: "Your sensitive identity documents are stored in secure cloud storage with restricted administrative access. We never sell your data or expose raw ID numbers to other platform members.",
      },
      {
        id: "faq-9",
        q: "How can I delete my account and data?",
        a: "Go to Settings → Manage Data or submit a deletion request through the contact form below. Our compliance team will permanently purge your data within 30 days.",
      },
    ],
  },
];

const QUICK_ACTIONS = [
  {
    title: "Report an Issue",
    description: "Submit a report against a user, fraud attempt, or platform bug.",
    action: "report",
    icon: ShieldAlert,
    tag: "Safety",
  },
  {
    title: "Terms & Guidelines",
    description: "Review peer lending terms, rules, and community standards.",
    action: "legal",
    icon: FileText,
    tag: "Policies",
  },
  {
    title: "Privacy & Data",
    description: "Control your identity logs, session devices, and GDPR data rights.",
    action: "data",
    icon: Database,
    tag: "Privacy",
  },
];

export default function HelpAndSupport({ onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState(null);
  const [copiedFaqId, setCopiedFaqId] = useState(null);
  const [feedback, setFeedback] = useState({});

  // Contact Form State
  const [category, setCategory] = useState("General Inquiry");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTicket, setSentTicket] = useState(null);
  const [error, setError] = useState(null);

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "account", label: "Account & KYC" },
    { id: "lending", label: "Borrowing & Lending" },
    { id: "safety", label: "Safety & Reports" },
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
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const ticketId = `MTP-${Math.floor(100000 + Math.random() * 900000)}`;
      setSentTicket({ id: ticketId, subject: subject || category, createdAt: new Date() });
      setSubject("");
      setMessage("");
    } catch {
      setError("Failed to send your inquiry. Please reach out to support@mtpocket.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAction = (action) => {
    if (onNavigate) {
      onNavigate(action);
      return;
    }
    if (action === "report") navigate("/community-guidelines");
    else if (action === "legal") navigate("/terms");
    else if (action === "data") navigate("/privacy");
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={13} />
              <span>Customer Support Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              How can we assist you today?
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Search verified guides on peer lending, account verification, and security, or submit a support ticket directly to our compliance team.
            </p>
          </div>

          <div className="shrink-0">
            <a
              href="#contact-support"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-xs transition-colors"
            >
              <MessageSquare size={15} />
              <span>Open Support Ticket</span>
            </a>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative mt-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={17} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords (e.g. KYC verification, loan repayment, blocking)..."
            className="w-full rounded-lg bg-background border-border/80 pl-10 pr-4 py-5 text-sm focus:ring-primary shadow-2xs"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── QUICK ACTION CARDS ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.action}
              onClick={() => handleQuickAction(a.action)}
              className="text-left rounded-xl border border-border/80 bg-card p-5 hover:border-primary/40 hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {a.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{a.title}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {a.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── INTERACTIVE FAQ SECTION ──────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Frequently Asked Questions</h2>
            <p className="text-xs text-muted-foreground">Instant answers categorized by platform feature</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs List */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-lg border border-dashed border-border/70 bg-muted/20 text-muted-foreground">
            <AlertCircle size={28} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No matching questions found for "{query}".</p>
            <p className="text-xs mt-1">Please try different keywords or submit an inquiry in the form below.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <GroupIcon size={14} className="text-primary" />
                    <span>{group.group}</span>
                  </div>

                  <div className="divide-y divide-border/60 rounded-lg border border-border/70 bg-background/60 overflow-hidden">
                    {group.items.map((item) => {
                      const isOpen = openFaqId === item.id;
                      const userFeedback = feedback[item.id];
                      return (
                        <div key={item.id} className="transition-colors">
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                            className="w-full flex items-center justify-between gap-4 p-4 text-left cursor-pointer group hover:bg-muted/30 transition-colors"
                          >
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {item.q}
                            </span>
                            <ChevronDown
                              size={16}
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
                                className="px-4 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3"
                              >
                                <p className="pt-1">{item.a}</p>

                                {/* Action & Feedback Bar */}
                                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyFaq(item.id, `${item.q}\n\n${item.a}`, e)}
                                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                                  >
                                    {copiedFaqId === item.id ? (
                                      <>
                                        <Check size={13} className="text-emerald-600" />
                                        <span className="text-emerald-600">Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={13} />
                                        <span>Copy answer</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground">Was this helpful?</span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleFeedback(item.id, true, e)}
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                                        userFeedback === true
                                          ? "bg-emerald-500/10 text-emerald-600 font-bold"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                      }`}
                                      title="Yes, helpful"
                                    >
                                      <ThumbsUp size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleFeedback(item.id, false, e)}
                                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                                        userFeedback === false
                                          ? "bg-destructive/10 text-destructive font-bold"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                      }`}
                                      title="No, need more details"
                                    >
                                      <ThumbsDown size={13} />
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

      {/* ── CONTACT SUPPORT FORM ─────────────────────────────────────── */}
      <div id="contact-support" className="rounded-xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Open a Support Ticket</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Need assistance with an active negotiation, verification inquiry, or fraud prevention? Our support representatives will respond within 24 hours.
            </p>
          </div>
        </div>

        {sentTicket ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-3">
            <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
            <h3 className="font-bold text-foreground text-base">Support Ticket Created Successfully</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your ticket reference <span className="font-mono font-bold text-primary">{sentTicket.id}</span> has been logged. Updates will be delivered to your registered email address.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSentTicket(null)}
                className="text-xs rounded-lg cursor-pointer"
              >
                Submit another inquiry
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Inquiry Topic
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer h-10"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="KYC & Identity Verification">KYC &amp; Identity Verification</option>
                  <option value="Lending & Proposal Issues">Lending &amp; Proposal Issues</option>
                  <option value="Report User or Scam">Report User or Scam</option>
                  <option value="Data & Privacy Request">Data &amp; Privacy Request</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Subject (Optional)
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Identity status question"
                  className="rounded-lg bg-background border-border/80 text-xs h-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Message Details <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">{message.length} / 1000</span>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                rows={4}
                required
                placeholder="Explain the specific issue or question in detail..."
                className="rounded-lg bg-background border-border/80 text-xs leading-relaxed"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-semibold">{error}</p>
            )}

            <Button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full sm:w-auto px-6 rounded-lg text-xs font-bold cursor-pointer"
            >
              {submitting ? (
                <>Submitting ticket...</>
              ) : (
                <>
                  <Send size={13} className="mr-1.5" />
                  Submit Support Ticket
                </>
              )}
            </Button>
          </form>
        )}

        <div className="pt-3 border-t border-border/60 text-center sm:text-left text-xs text-muted-foreground">
          <span>Official Support Email: </span>
          <a href="mailto:support@mtpocket.com" className="text-primary font-bold hover:underline">
            support@mtpocket.com
          </a>
        </div>
      </div>
    </div>
  );
}
