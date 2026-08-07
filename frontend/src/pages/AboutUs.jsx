import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";
import PolicyList from "../components/Policy/PolicyList";

const sections = [
  {
    eyebrow: "Who We Are",
    title: "A local connection platform for lending — not a lender",
    body: (
      <>
        <p>
          Think of MT Pocket the way you'd think of a classifieds site: we
          help people who want to borrow money and people who want to lend
          money find each other nearby, verify who they're dealing with, and
          talk directly. Nothing more.
        </p>
        <p>
          We are not a bank, an NBFC, or a licensed financial institution,
          and we don't provide financial advice. Our job is discovery and
          connection — the agreement itself is always yours.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Our Mission",
    title: "Get two people to a trustworthy conversation, safely",
    body: (
      <p>
        Our goal is simple to state and hard to build well: take a verified
        borrower and a verified lender from discovery to a chat with agreed
        terms as safely and frictionlessly as possible — without MT Pocket
        ever touching or holding anyone's money.
      </p>
    ),
  },
  {
    eyebrow: "Why MT Pocket Exists",
    title: "Local lending happens anyway — we make it safer to find",
    body: (
      <p>
        Personal loans between people who live near each other already
        happen, often through word of mouth with little way to verify who
        you're really dealing with. MT Pocket brings that same, familiar
        arrangement online, with identity verification, ratings, and
        reporting tools so both sides can size each other up before any
        money changes hands.
      </p>
    ),
  },
  {
    eyebrow: "What Makes Us Different",
    title: "We stay out of the loan itself, on purpose",
    body: (
      <>
        <p>What we do:</p>
        <PolicyList
          items={[
            "Help verified borrowers and lenders discover each other based on location, loan category, and trust score.",
            "Provide identity verification, ratings, and reporting tools so you know who you're talking to.",
            "Give you a secure space to chat and work out details directly with the other person.",
          ]}
        />
        <p>What we don't do:</p>
        <PolicyList
          items={[
            "We never handle, hold, or transfer money. All payments and repayments happen directly between you and the other party, entirely outside MT Pocket.",
            "We never set, suggest, or approve interest rates, loan amounts, or repayment terms. Every term is negotiated and agreed to by the borrower and lender alone.",
          ]}
        />
      </>
    ),
  },
  {
    eyebrow: "Trust & Transparency",
    title: "Verification helps. It's a signal, not a guarantee",
    body: (
      <p>
        We verify user-submitted identity documents as a trust and safety
        measure — but we're upfront that this reduces risk rather than
        eliminating it. It doesn't guarantee anyone's honesty, intentions,
        or ability to repay. Any loan you enter into through a connection
        made on MT Pocket is a private agreement between you and the other
        person; MT Pocket is not a party to it.
      </p>
    ),
  },
  {
    eyebrow: "Security",
    title: "Built the way a lending-adjacent trust layer should be",
    body: (
      <>
        <p>
          Because both sides rely on us as the trust layer, we treat
          identity verification and account security as core infrastructure,
          not an add-on feature.
        </p>
        <PolicyList
          items={[
            "Encryption in transit and at rest across documents and account data.",
            "Least-privilege access for every admin role, with an audit trail on every trust- or safety-related decision.",
            "Rate limiting and abuse protection on logins, verification, and messaging.",
            "Session controls that let an account be remotely locked down the moment something looks wrong.",
          ]}
        />
      </>
    ),
  },
  {
    eyebrow: "Community",
    title: "Block, report, and moderation that actually gets used",
    body: (
      <p>
        Every profile can be blocked or reported, and every report reaches a
        real moderation queue — not a black hole. A platform that connects
        strangers around money only works if bad actors get found and
        removed quickly, so trust and safety tooling is treated as
        launch-critical, not a later polish pass.
      </p>
    ),
  },
  {
    eyebrow: "Our Vision",
    title: "Hyperlocal lending, made a little more trustworthy",
    body: (
      <p>
        We're building toward a platform where finding a genuine local
        borrower or lender doesn't depend on luck or a friend of a friend —
        where verification, ratings, and a secure chat do the work that
        used to rest entirely on personal trust.
      </p>
    ),
  },
  {
    eyebrow: "Contact",
    title: "Questions about MT Pocket",
    body: (
      <p>
        Reach out any time at{" "}
        <span className="text-foreground">contact us</span> — we're
        happy to walk through how discovery, verification, or reporting
        works before you use any of it.
      </p>
    ),
  },
];

export default function AboutUs() {
  return (
    <PolicyLayout>
      <PolicyHero
        title="About Us"
        subtitle="A local connection platform for people who want to lend and borrow — built to stay out of the way of the loan itself."
      />
      {sections.map((section, i) => (
        <div key={section.title}>
          {i > 0 && <PolicyDivider />}
          <PolicySection eyebrow={section.eyebrow} title={section.title}>
            {section.body}
          </PolicySection>
        </div>
      ))}
    </PolicyLayout>
  );
}
