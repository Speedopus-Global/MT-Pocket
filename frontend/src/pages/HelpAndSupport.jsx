import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronDown, CheckCircle2, Mail, ShieldAlert, FileText, Database, ArrowRight } from "lucide-react";

/**
 * Settings → Help & Support / Dashboard → Help & Support
 *
 * Structure:
 *   1. Search — filters FAQs live as you type
 *   2. Quick actions — Report a Problem / Legal & Policies / Manage My Data
 *   3. FAQ accordion — grouped by topic, collapsed by default
 *   4. Contact form — "Didn't find your answer?" always visible at the bottom
 */

const FAQ_GROUPS = [
  {
    group: "Account & Verification",
    items: [
      {
        q: "How do I get verified?",
        a: "Upload a government-issued ID and a live selfie from Settings → Identity Verification. Most reviews complete within 1–2 business days.",
      },
      {
        q: "Why was my document rejected?",
        a: "The rejection reason is shown on your identity badge on the Dashboard. Common causes are a blurry photo or a mismatch between your selfie and ID. You can resubmit once you've fixed the issue.",
      },
      {
        q: "Why do I need to verify my email again after changing it?",
        a: "Any change to your registered email requires re-verification, so we can confirm the new address actually belongs to you before it shows as verified.",
      },
    ],
  },
  {
    group: "Borrowing & Lending",
    items: [
      {
        q: "Does MT Pocket handle the money?",
        a: "No. MT Pocket never processes, holds, or transfers money. Every payment happens directly between the borrower and lender, outside the app.",
      },
      {
        q: "Who decides the interest rate and repayment terms?",
        a: "The borrower and lender agree on this directly. MT Pocket doesn't set, cap, or recommend any loan terms.",
      },
      {
        q: "What happens if the other person doesn't repay?",
        a: "Any loan made through a connection on MT Pocket is a private agreement between the two of you. We're not a party to it and can't enforce repayment — see our Terms & Conditions for details.",
      },
    ],
  },
  {
    group: "Safety & Reports",
    items: [
      {
        q: "How do I report a user?",
        a: "Open their profile or your chat with them and tap Report. Be specific about what happened — reports are reviewed by our team.",
      },
      {
        q: "What happens if I file a false report?",
        a: "Reports found to be false or made in bad faith may result in action against your own account.",
      },
      {
        q: "How do I block someone?",
        a: "From their profile or your chat, tap Block. They won't be able to contact you or see your listings after that.",
      },
    ],
  },
];

const QUICK_ACTIONS = [
  {
    title: "Report a Problem",
    description: "Report a user, a bug, or something that doesn't look right.",
    action: "report",
    icon: ShieldAlert,
  },
  {
    title: "Legal & Policies",
    description: "Terms, Privacy Policy, Community Guidelines, and more.",
    action: "legal",
    icon: FileText,
  },
  {
    title: "Manage My Data",
    description: "Request access, correction, or deletion of your data.",
    action: "data",
    icon: Database,
  },
];

async function submitContactForm({ subject, message }) {
  await new Promise((r) => setTimeout(r, 700)); // simulated latency
  return { id: `MSG-${Math.floor(Math.random() * 900000 + 100000)}`, status: "received" };
}

function ChevronIcon({ open }) {
  return (
    <ChevronDown
      size={18}
      className={`transition-transform duration-200 ${open ? "rotate-180 text-primary" : ""}`}
    />
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer group"
      >
        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{q}</span>
        <span className="text-muted-foreground shrink-0 group-hover:text-foreground transition-colors">
          <ChevronIcon open={open} />
        </span>
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pb-4 text-sm text-muted-foreground leading-relaxed pr-6"
        >
          {a}
        </motion.p>
      )}
    </div>
  );
}

export default function HelpAndSupport({ onNavigate }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return FAQ_GROUPS;
    const q = query.toLowerCase();
    return FAQ_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const noResults = query.trim() && filteredGroups.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitContactForm({ subject, message });
      setSent(result);
      setSubject("");
      setMessage("");
    } catch {
      setError("Something went wrong sending your message. Try again, or email support@mtpocket.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuickAction(action) {
    if (onNavigate) {
      onNavigate(action);
      return;
    }
    if (action === "report") {
      navigate("/community-guidelines");
    } else if (action === "legal") {
      navigate("/terms");
    } else if (action === "data") {
      navigate("/privacy");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto w-full px-2 sm:px-4 py-4 sm:py-8 space-y-8"
    >
      {/* Header + search */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-emerald-600 to-primary/80">
            Help &amp; Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            Find an answer below, or reach our team directly at the bottom of this page.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an answer (e.g. verification, money, report)..."
            className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.action}
              onClick={() => handleQuickAction(a.action)}
              className="text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Icon size={18} />
                </div>
                <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{a.title}</span>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                </div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {a.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="space-y-6">
        {noResults && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No results for <span className="font-semibold text-foreground">"{query}"</span> — try a different term, or send us a message below.
            </p>
          </div>
        )}
        {filteredGroups.map((group) => (
          <div key={group.group} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              {group.group}
            </h2>
            <div className="rounded-2xl border border-border bg-card px-5 shadow-xs">
              {group.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Didn't find your answer / mail us */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Didn't find your answer?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Send us a message and we'll get back to you at your registered email — usually within 1–2 business days. For account safety issues, please mention that in your subject line.
            </p>
          </div>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 px-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-3"
          >
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
            <p className="text-base font-bold text-foreground">
              Message sent successfully!
            </p>
            <p className="text-xs text-muted-foreground">
              Support ticket reference: <span className="font-mono font-bold text-primary">{sent.id}</span>
            </p>
            <button
              onClick={() => setSent(null)}
              className="text-xs font-semibold underline text-muted-foreground hover:text-foreground pt-2 cursor-pointer inline-block"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="support-subject" className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Subject (optional)
              </label>
              <input
                id="support-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question about verification status"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="support-message" className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Message <span className="text-destructive">*</span>
              </label>
              <textarea
                id="support-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Describe your question or issue in detail..."
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />
            </div>
            {error && (
              <p className="text-xs font-semibold text-destructive">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className={`w-full rounded-xl py-3.5 text-sm font-bold transition-all shadow-sm ${
                submitting || !message.trim()
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20 cursor-pointer"
              }`}
            >
              {submitting ? "Sending..." : "Send Message to Support"}
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-border/70 text-center">
          <p className="text-xs text-muted-foreground">
            Prefer direct email? Reach us at{" "}
            <a
              href="mailto:support@mtpocket.com"
              className="text-primary font-semibold hover:underline"
            >
              support@mtpocket.com
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
