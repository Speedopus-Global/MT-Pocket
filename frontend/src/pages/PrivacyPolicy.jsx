import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";
import PolicyList from "../components/Policy/PolicyList";

const sections = [
  {
    eyebrow: "Introduction",
    title: "What this policy covers",
    body: (
      <p>
        This Privacy Policy explains what information MT Pocket collects
        when you use the Platform to discover and connect with local
        borrowers or lenders, why we collect it, and what control you have
        over it. It sits alongside our Terms & Conditions — using MT Pocket
        means you've agreed to both.
      </p>
    ),
  },
  {
    eyebrow: "Information We Collect",
    title: "Only what verification, discovery, and safety require",
    body: (
      <>
        <PolicyList
          items={[
            "Account details — phone number, email address, and the credentials used to verify each.",
            "Identity documents — the ID you submit for verification, stored with restricted, signed access rather than public delivery.",
            "Profile information — your name, photo, and location, used to show other users who you are.",
            "Location — city-level location is shown on public profiles; precise location is used only to power nearby search and is never shown to other users.",
            "Loan request and offer details — the category, amount, and terms you or another user submit.",
            "Messages — the content of chats between matched borrowers and lenders.",
            "Device and usage data — basic technical information used for security, fraud prevention, and diagnosing issues.",
          ]}
        />
      </>
    ),
  },
  {
    eyebrow: "How Information Is Used",
    title: "Verification, matching, safety, and support — nothing more",
    body: (
      <PolicyList
        items={[
          "Verifying your identity and reviewing documents before your account is approved.",
          "Connecting you with borrowers or lenders nearby, based on location, category, and trust score.",
          "Powering in-app chat once two users are matched.",
          "Sending notifications about offers, messages, and verification updates.",
          "Investigating reports, disputes, or suspected fraud, and enforcing our Terms.",
          "Improving matching quality and platform safety over time.",
        ]}
      />
    ),
  },
  {
    eyebrow: "Sharing Information",
    title: "We don't sell your data, and we limit who touches it",
    body: (
      <>
        <p>
          We never sell your personal information. It's shared only where
          the Platform genuinely needs a service provider to function, or
          where the law requires it:
        </p>
        <PolicyList
          items={[
            "OTP and identity-verification providers, to confirm your phone number and documents.",
            "Email delivery providers, to send verification and account emails.",
            "Cloud storage providers, to hold documents and media behind authenticated, signed URLs — never public links.",
            "Mapping providers, to power location-based discovery.",
            "AI service providers, for features like draft assistance or match scoring — phone numbers, ID numbers, and exact addresses are stripped out before any text reaches a third-party model.",
            "Law enforcement or regulators, only where legally required.",
          ]}
        />
        <p>
          Other users never see your documents, exact location, or contact
          details directly — only what your profile is designed to show.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Data Security",
    title: "Encrypted in transit, encrypted at rest, access on a need basis",
    body: (
      <PolicyList
        items={[
          "All traffic is encrypted in transit; documents and account data are encrypted at rest.",
          "Identity documents are served only through authenticated, signed URLs — never public delivery.",
          "Admin access follows least-privilege roles, and every verification or account action is logged to an audit trail.",
          "Login and verification requests are rate-limited to reduce abuse such as OTP flooding.",
          "Sessions use short-lived access tokens with rotating refresh tokens, so an account can be locked down quickly if something looks wrong.",
        ]}
      />
    ),
  },
  {
    eyebrow: "Cookies",
    title: "Used to keep you signed in, not to track you around the web",
    body: (
      <p>
        MT Pocket uses cookies and similar local storage only for essential
        purposes — keeping you signed in, remembering your session, and
        basic security checks. We don't use third-party advertising
        cookies.
      </p>
    ),
  },
  {
    eyebrow: "User Rights",
    title: "Access, correction, and deletion are yours to request",
    body: (
      <p>
        You can request access to the personal information we hold about
        you, ask us to correct it, or ask us to delete your account and
        associated data, subject to what we're required to retain for
        legal, fraud-prevention, or dispute purposes. Reach out at{" "}
        <span className="text-foreground">[support email]</span> to make
        any of these requests.
      </p>
    ),
  },
  {
    eyebrow: "Data Retention",
    title: "Kept only as long as it serves verification, safety, or law",
    body: (
      <p>
        We retain account and verification data for as long as your account
        is active, and for a limited period afterward where needed to
        investigate disputes, prevent fraud, or meet legal record-keeping
        obligations. Once that need passes, data is deleted or anonymized.
      </p>
    ),
  },
  {
    eyebrow: "Third-Party Services",
    title: "The providers that help run the Platform",
    body: (
      <p>
        MT Pocket relies on a small set of infrastructure and service
        providers to operate — for phone verification, email delivery,
        document storage, mapping, and error monitoring. Each is bound to
        use your information only to provide their specific service to us,
        not for their own purposes.
      </p>
    ),
  },
  {
    eyebrow: "Contact",
    title: "Questions about your data",
    body: (
      <p>
        For anything about this policy or your information, reach us at{" "}
        <span className="text-foreground">[support email]</span>.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <PolicyLayout>
      <PolicyHero
        title="Privacy Policy"
        subtitle={
          <>
            Last updated <span className="text-foreground">[DATE]</span> —
            what we collect, why, and the control you have over it.
          </>
        }
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
