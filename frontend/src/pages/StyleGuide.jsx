/**
 * MT POCKET — STYLE GUIDE (interactive)
 * -----------------------------------------------------------------
 * Built entirely on real shadcn/ui components + the tokens defined in
 * index.css. Nothing here is faked with raw divs pretending to be a
 * button — every control is the actual component your app will ship.
 *
 * INSTALL THE COMPONENTS THIS FILE USES (run once):
 *   npx shadcn@latest add button card badge input label textarea select
 *   npx shadcn@latest add checkbox switch separator avatar progress
 *   npx shadcn@latest add tabs alert dialog tooltip popover accordion
 *   npx shadcn@latest add skeleton
 *
 * Also needs lucide-react (shadcn peer dep, likely already installed):
 *   npm i lucide-react
 *
 * DROP IN AS A ROUTE:
 *   import StyleGuide from "./StyleGuide";
 *   <Route path="/styleguide" element={<StyleGuide />} />
 *
 * Animations use tw-animate-css (already imported in index.css) for
 * entrance transitions, plus a couple of small interactive bits
 * (scrollspy nav, live dark-mode toggle, copy-to-clipboard swatches,
 * a fake "submit offer" loading state) so it behaves like a real page
 * instead of a static screenshot.
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  TrendingDown,
  Bell,
  Search,
  Copy,
  Check,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sun,
  Moon,
  MapPin,
  MessageCircle,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Section registry — drives both the anchors and the scrollspy nav   */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "brand", label: "Brand" },
  { id: "colors", label: "Color" },
  { id: "type", label: "Typography" },
  { id: "buttons", label: "Buttons" },
  { id: "forms", label: "Forms" },
  { id: "badges", label: "Badges & alerts" },
  { id: "cards", label: "Cards" },
  { id: "overlays", label: "Dialogs & popovers" },
  { id: "spacing", label: "Spacing & radius" },
];

/* ------------------------------------------------------------------ */
/* Scrollspy hook                                                      */
/* ------------------------------------------------------------------ */

function useScrollSpy(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/* ------------------------------------------------------------------ */
/* Reveal-on-mount wrapper (staggered entrance via tw-animate-css)     */
/* ------------------------------------------------------------------ */

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-3 fill-mode-both ${className}`}
      style={{ animationDelay: `${delay}ms`, animationDuration: "500ms" }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small shared bits                                                    */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-2xl mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function Swatch({ name, varName, hex, className = "" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  };
  return (
    <button
      onClick={copy}
      className={`group relative h-28 w-full overflow-hidden rounded-xl border border-border text-left shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md ${className}`}
    >
      <div className="absolute inset-0" style={{ backgroundColor: `var(${varName})` }} />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <span className="text-sm font-semibold text-white drop-shadow-sm mix-blend-difference">
            {name}
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/15 text-white transition-transform duration-200 group-hover:scale-110">
            {copied ? <Check size={13} /> : <Copy size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
          </span>
        </div>
        <p className="font-mono text-xs text-white/90 mix-blend-difference">{hex}</p>
      </div>
    </button>
  );
}

function CodeChip({ children }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground">
      {children}
    </code>
  );
}

function BrandMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="shrink-0">
      <rect width="40" height="40" rx="10" className="fill-primary" />
      <path d="M8 27L15.5 15L20 21L24 14L32 27H8Z" className="fill-primary-foreground" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Interactive demo pieces                                             */
/* ------------------------------------------------------------------ */

function SubmitOfferDemo() {
  const [state, setState] = useState("idle"); // idle | loading | done
  const run = () => {
    setState("loading");
    setTimeout(() => setState("done"), 1400);
    setTimeout(() => setState("idle"), 3200);
  };
  return (
    <Button onClick={run} disabled={state === "loading"} className="min-w-[150px]">
      {state === "loading" && <Loader2 className="animate-spin" size={16} />}
      {state === "done" && <Check size={16} />}
      {state === "idle" && "Send offer"}
      {state === "loading" && "Sending…"}
      {state === "done" && "Offer sent"}
    </Button>
  );
}

function TrustScoreDemo() {
  const [score, setScore] = useState(72);
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">Trust score</span>
        <span className="font-mono text-sm font-semibold text-primary">{score}/100</span>
      </div>
      <Progress value={score} className="mb-3 transition-all duration-700" />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setScore((s) => Math.max(0, s - 8))}>
          −
        </Button>
        <Button size="sm" variant="outline" onClick={() => setScore((s) => Math.min(100, s + 8))}>
          +
        </Button>
        <span className="text-xs text-muted-foreground self-center ml-1">
          drag the score around
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function StyleGuide() {
  const ids = SECTIONS.map((s) => s.id);
  const active = useScrollSpy(ids);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------------------------------------------------------- */}
      {/* Top bar with scrollspy nav                                 */}
      {/* ---------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} />
            <span className="font-bold tracking-tight">Mt Pocket</span>
            <Badge variant="secondary" className="ml-1">Styleguide</Badge>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`relative px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                  active === s.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
                {active === s.id && (
                  <span className="absolute inset-x-2 -bottom-[15px] h-[2px] rounded-full bg-primary animate-in fade-in zoom-in-50 duration-300" />
                )}
              </a>
            ))}
          </nav>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDark((d) => !d)}
                  aria-label="Toggle dark mode preview"
                >
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview {dark ? "light" : "dark"} mode</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Hero                                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="border-b border-border/70 bg-gradient-to-b from-secondary/40 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Design system — v1.0
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="max-w-3xl text-[42px] sm:text-[54px] font-bold leading-[1.05] tracking-tight">
              Every component, live — not a screenshot.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted-foreground">
              This page renders real shadcn/ui components on top of Mt
              Pocket's tokens. Click a swatch to copy it, flip the theme
              toggle top-right, drag the trust score below — it all
              actually works.
            </p>
          </Reveal>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-16 space-y-24">
        {/* ============================================================ */}
        {/* BRAND                                                        */}
        {/* ============================================================ */}
        <section id="brand" className="scroll-mt-24">
          <SectionHeading
            eyebrow="01 · Brand"
            title="Mark & voice"
            description="One mark, used small — a stamped, angular fold rather than a literal mountain icon, echoing the trust-seal idea without being a cartoon peak."
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <Reveal>
              <Card className="h-full">
                <CardContent className="pt-6 flex flex-col items-start gap-3">
                  <BrandMark size={52} />
                  <div>
                    <p className="font-semibold text-sm">Mark</p>
                    <p className="text-sm text-muted-foreground">
                      24–56px. Never stretched or recolored off-token.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={80}>
              <Card className="h-full">
                <CardContent className="pt-6 flex flex-col gap-2">
                  <span className="text-2xl font-bold tracking-tight">Mt Pocket</span>
                  <p className="text-sm text-muted-foreground">
                    Wordmark in Roboto Flex, bold + widened. "Mt" and
                    "Pocket" never separate into two lines.
                  </p>
                </CardContent>
              </Card>
            </Reveal>
            <Reveal delay={160}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <p className="font-semibold text-sm mb-2">Voice</p>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>Direct, unambiguous, never apologetic in errors</li>
                    <li>Numbers are always exact — never silently rounded</li>
                    <li>Never implies MT Pocket holds or moves money</li>
                  </ul>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </section>

        {/* ============================================================ */}
        {/* COLOR                                                        */}
        {/* ============================================================ */}
        <section id="colors" className="scroll-mt-24">
          <SectionHeading
            eyebrow="02 · Tokens"
            title="Color"
            description="Click any swatch to copy its value. The brand row is the raw palette; the token row is what shadcn components actually consume."
          />

          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Brand palette
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <Swatch name="Forest" varName="--forest" hex="#04724D" />
            <Swatch name="Sage" varName="--sage" hex="#8DB38B" />
            <Swatch name="Mist" varName="--mist" hex="#CDDFD6" />
            <Swatch name="Stone" varName="--stone-brand" hex="#BDBEA9" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Semantic tokens (what components use)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Swatch name="Primary" varName="--primary" hex="oklch(0.488 0.106 162)" />
            <Swatch name="Secondary" varName="--secondary" hex="oklch(0.888 0.023 164.5)" />
            <Swatch name="Accent" varName="--accent" hex="oklch(0.728 0.070 143.5)" />
            <Swatch name="Muted" varName="--muted" hex="oklch(0.955 0.01 150)" />
          </div>

          <Card className="mt-8">
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-sm mb-2">Usage</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li><CodeChip>primary</CodeChip> — CTAs, links, active nav, focus ring</li>
                  <li><CodeChip>secondary</CodeChip> — soft surfaces, mist-toned panels</li>
                  <li><CodeChip>accent</CodeChip> — hover fills, sage highlights</li>
                  <li><CodeChip>muted</CodeChip> — quiet backgrounds, disabled states</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">Rule</p>
                <p className="text-sm text-muted-foreground">
                  Always reach for the semantic class (<CodeChip>bg-primary</CodeChip>) over
                  the raw brand one (<CodeChip>bg-forest</CodeChip>) inside components —
                  raw tokens are for one-off brand moments only, so re-theming
                  only touches <CodeChip>index.css</CodeChip>.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================ */}
        {/* TYPOGRAPHY                                                   */}
        {/* ============================================================ */}
        <section id="type" className="scroll-mt-24">
          <SectionHeading
            eyebrow="03 · Tokens"
            title="Typography"
            description="Roboto Flex, variable — the full hierarchy comes from moving weight and width, not from a second typeface."
          />
          <Card>
            <CardContent className="pt-6 space-y-6">
              <TypeRow tag="h1" className="text-5xl font-extrabold tracking-tight" label="H1 / display · 800" sample="Base camp for your money" />
              <TypeRow tag="h2" className="text-3xl font-bold tracking-tight" label="H2 · 700" sample="Find a verified lender nearby" />
              <TypeRow tag="h3" className="text-2xl font-semibold" label="H3 · 600" sample="Loan request #4021" />
              <TypeRow tag="h4" className="text-lg font-semibold" label="H4 · 600" sample="Offer received" />
              <TypeRow tag="p" className="text-lg text-muted-foreground" label="Body large · 400" sample="Post a request, compare offers, agree terms — money never passes through us." />
              <TypeRow tag="p" className="text-base" label="Body · 400" sample="Every action on your ledger is timestamped and can't be edited after the fact." />
              <TypeRow tag="p" className="text-xs uppercase tracking-wide text-muted-foreground font-medium" label="Caption / meta · 500" sample="Verified 14 Jul" />
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Tabular figures
                </p>
                <p className="font-mono text-2xl font-semibold tabular-nums">₹ 20,000.00</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================ */}
        {/* BUTTONS                                                      */}
        {/* ============================================================ */}
        <section id="buttons" className="scroll-mt-24">
          <SectionHeading
            eyebrow="04 · Components"
            title="Buttons"
            description="Real <Button> variants from shadcn/ui, plus a working loading-state demo — click it."
          />
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
                <Button disabled>Disabled</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" variant="outline" aria-label="Verify">
                  <ShieldCheck size={16} />
                </Button>
                <Button>
                  Continue <ArrowRight size={15} />
                </Button>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Interactive — actually click this
                </p>
                <SubmitOfferDemo />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================ */}
        {/* FORMS                                                        */}
        {/* ============================================================ */}
        <section id="forms" className="scroll-mt-24">
          <SectionHeading
            eyebrow="05 · Components"
            title="Forms"
            description="Input, Select, Textarea, Checkbox, Switch — all live and typeable."
          />
          <Card>
            <CardContent className="pt-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" placeholder="98765 43210" />
                <p className="text-xs text-muted-foreground">We'll send an OTP to confirm.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amt" className="text-destructive">Loan amount</Label>
                <Input id="amt" defaultValue="-2000" className="border-destructive focus-visible:ring-destructive/30" />
                <p className="text-xs text-destructive">Amount can't be negative.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tenure">Repayment tenure</Label>
                <Select defaultValue="6">
                  <SelectTrigger id="tenure">
                    <SelectValue placeholder="Select tenure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                  <Input id="city" placeholder="Search your city…" className="pl-8" />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="note">Purpose of loan</Label>
                <Textarea id="note" placeholder="Tell us what this is for…" />
              </div>

              <div className="flex items-start gap-2 sm:col-span-2">
                <Checkbox id="consent" defaultChecked className="mt-0.5" />
                <Label htmlFor="consent" className="text-sm font-normal leading-snug">
                  I agree to the repayment schedule and understand late fees apply after the due date.
                </Label>
              </div>

              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch id="notify" defaultChecked />
                <Label htmlFor="notify" className="font-normal">Weekly summary notifications</Label>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================ */}
        {/* BADGES & ALERTS                                              */}
        {/* ============================================================ */}
        <section id="badges" className="scroll-mt-24">
          <SectionHeading
            eyebrow="06 · Components"
            title="Badges & alerts"
            description="Status language borrowers/lenders see constantly — verification, offer, and repayment states."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Badges</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2.5">
                <Badge className="gap-1"><CheckCircle2 size={12} /> Verified</Badge>
                <Badge variant="secondary">Pending review</Badge>
                <Badge variant="outline">Draft</Badge>
                <Badge variant="destructive" className="gap-1"><XCircle size={12} /> Rejected</Badge>
                <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent"><TrendingDown size={12} /> Overdue</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Alerts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <Info size={16} />
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>Your monthly summary is ready to view.</AlertDescription>
                </Alert>
                <Alert className="border-destructive/40 text-destructive [&>svg]:text-destructive">
                  <AlertTriangle size={16} />
                  <AlertTitle>Payment failed</AlertTitle>
                  <AlertDescription>Your bank declined the auto-debit. Retry manually.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CARDS                                                        */}
        {/* ============================================================ */}
        <section id="cards" className="scroll-mt-24">
          <SectionHeading
            eyebrow="07 · Components"
            title="Cards"
            description="Composed cards — the actual pieces (Avatar, Progress, Badge, Button) working together, including a live trust-score slider."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Loan request #4021</CardTitle>
                  <Badge variant="secondary" className="gap-1"><MapPin size={11} /> Pune</Badge>
                </div>
                <CardDescription>Posted 3 days ago · 6 month tenure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requested</span>
                  <span className="font-mono font-semibold">₹ 20,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offers so far</span>
                  <span className="font-mono font-semibold">3</span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" className="w-full">View offers</Button>
              </CardFooter>
            </Card>

            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <Avatar>
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">RS</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">Riya Sharma</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <ShieldCheck size={12} className="text-primary" /> Verified lender
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <TrustScoreDemo />
              </CardContent>
            </Card>

            <Card className="bg-secondary/40 border-secondary transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardDescription>This month</CardDescription>
                <CardTitle className="text-3xl font-bold">₹ 1,240</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingDown size={14} /> 12% less than last month
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============================================================ */}
        {/* DIALOGS & POPOVERS                                           */}
        {/* ============================================================ */}
        <section id="overlays" className="scroll-mt-24">
          <SectionHeading
            eyebrow="08 · Components"
            title="Dialogs, popovers & disclosure"
            description="Open these — they're the real Dialog/Popover/Accordion, not screenshots."
          />
          <Card>
            <CardContent className="pt-6 flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Accept offer</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Accept this offer?</DialogTitle>
                    <DialogDescription>
                      You're agreeing to ₹20,000 at the terms proposed by the
                      lender. Repayment happens directly between you two —
                      Mt Pocket never holds the funds.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Confirm</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-1.5">
                    <MessageCircle size={15} /> Quick reply
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-sm">
                  Message the lender directly once an offer is accepted —
                  chat unlocks after mutual interest, never before.
                </PopoverContent>
              </Popover>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Notifications">
                      <Bell size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>3 new notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className="mt-5">
            <CardHeader><CardTitle className="text-base">FAQ accordion</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1">
                  <AccordionTrigger>Does Mt Pocket hold my money?</AccordionTrigger>
                  <AccordionContent>
                    No — repayment happens entirely off-platform, directly
                    between borrower and lender.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>How is trust score calculated?</AccordionTrigger>
                  <AccordionContent>
                    From verification status, repayment history, and
                    platform activity — shown transparently on every profile.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* ============================================================ */}
        {/* SPACING & RADIUS                                             */}
        {/* ============================================================ */}
        <section id="spacing" className="scroll-mt-24">
          <SectionHeading
            eyebrow="09 · Tokens"
            title="Spacing & radius"
            description="Radius scale is derived from a single --radius variable — bump one number in index.css and every component updates."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="font-semibold text-sm mb-3">Spacing scale</p>
                <div className="space-y-2">
                  {[
                    ["4px", "gap-1"],
                    ["8px", "gap-2"],
                    ["12px", "gap-3"],
                    ["16px", "gap-4"],
                    ["24px", "gap-6"],
                    ["32px", "gap-8"],
                  ].map(([px, cls]) => (
                    <div key={cls} className="flex items-center gap-3">
                      <div className="h-2.5 rounded bg-primary transition-all" style={{ width: px }} />
                      <span className="text-xs text-muted-foreground">{px} · <CodeChip>{cls}</CodeChip></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="font-semibold text-sm mb-3">Radius steps</p>
                <div className="flex items-end gap-4">
                  {[
                    ["rounded-sm", "sm"],
                    ["rounded-md", "md"],
                    ["rounded-lg", "lg"],
                    ["rounded-xl", "xl"],
                    ["rounded-2xl", "2xl"],
                  ].map(([cls, label]) => (
                    <div key={cls} className="text-center">
                      <Skeleton className={`h-14 w-14 ${cls}`} />
                      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-8 text-center text-xs text-muted-foreground">
        Mt Pocket Styleguide — internal reference, built on real shadcn/ui components.
      </footer>
    </div>
  );
}

function TypeRow({ tag: Tag, className, label, sample }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-6 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between">
      <Tag className={`m-0 ${className}`}>{sample}</Tag>
      <span className="shrink-0 text-xs text-muted-foreground sm:pl-6">{label}</span>
    </div>
  );
}