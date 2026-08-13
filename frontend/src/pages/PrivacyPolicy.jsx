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
    eyebrow: "Who We Are",
    title: "The entity responsible for your data",
    body: (
      <p>
        This Platform is operated by{" "}
        <span className="text-foreground">[LEGAL ENTITY NAME]</span>,
        registered at{" "}
        <span className="text-foreground">[REGISTERED ADDRESS]</span>. For
        the purposes of India's Digital Personal Data Protection Act,
        2023 ("DPDP Act"), MT Pocket acts as the Data Fiduciary in relation
        to the personal data described in this policy.
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
        <p>
          We do not collect or process payment card, bank account, or UPI
          transaction data. MT Pocket never handles money between users, so
          we have no reason to collect payment credentials and do not ask
          for them.
        </p>
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
    eyebrow: "Where Data Is Stored",
    title: "Storage location and cross-border transfer",
    body: (
      <p>
        Your data is stored on servers located in{" "}
        <span className="text-foreground">[COUNTRY / REGION]</span>. Where
        any service provider processes data outside India,{" "}
        <span className="text-foreground">[NAME PROVIDER + COUNTRY]</span>,
        we require that provider to protect your information under terms
        at least as protective as this policy and applicable law.
      </p>
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
    eyebrow: "Your Rights",
    title: "Access, correction, erasure, and consent are yours to control",
    body: (
      <>
        <p>
          Under the DPDP Act and applicable law, you have the right to:
        </p>
        <PolicyList
          items={[
            "Access a summary of the personal data we hold about you.",
            "Correct inaccurate or outdated data.",
            "Erase your data, subject to what we're legally required to retain for fraud-prevention, dispute, or record-keeping purposes.",
            "Withdraw consent at any time — note that withdrawing consent for identity verification means you may no longer be able to use parts of the Platform that depend on it.",
            "Nominate another individual to exercise these rights on your behalf in the event of your death or incapacity.",
            "File a complaint with the Data Protection Board of India if you believe your rights have been violated and we haven't resolved your concern.",
          ]}
        />
        <p>
          To exercise any of these rights, contact us at{" "}
          <span className="text-foreground">support@mtpocket.com</span> or our
          Grievance Officer below. We aim to respond within{" "}
          <span className="text-foreground">[X]</span> days.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Data Retention",
    title: "Kept only as long as it serves verification, safety, or law",
    body: (
      <>
        <PolicyList
          items={[
            "Account and profile data — retained while your account is active, and for [X] after deletion for legal or dispute purposes.",
            "Identity documents — retained for [X] following verification, then deleted or irreversibly anonymized unless a longer period is required by law.",
            "Chat messages — retained for [X] in case a trust & safety investigation requires them.",
          ]}
        />
        <p>
          Once none of these needs apply, your data is deleted or
          anonymized.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Children's Privacy",
    title: "MT Pocket is not for users under 18",
    body: (
      <p>
        MT Pocket is intended for users who are 18 or older. We do not
        knowingly collect personal data from anyone under 18. If we learn
        that we've collected data from a minor, we will delete it promptly.
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
    eyebrow: "Changes to This Policy",
    title: "We'll tell you when something material changes",
    body: (
      <p>
        We may update this Privacy Policy from time to time. Where a change
        is material — for example, a new category of data we collect, or a
        new type of third party we share it with — we'll notify you in-app
        and, where legally required, ask you to re-confirm your consent
        before you continue using the Platform.
      </p>
    ),
  },
  {
    eyebrow: "Complaints & Grievances",
    title: "How to raise a complaint",
    body: (
      <>
        <p>
          If you have a complaint about how your data is handled, an
          account or verification decision, or anything else related to
          this policy, email us at{" "}
          <span className="text-foreground">support@mtpocket.com</span>{" "}
          with your registered account details and a description of the
          issue. This is separate from the in-app Report feature, which
          handles complaints about other users directly.
        </p>
        <PolicyList
          items={[
            "Acknowledgement — within 24–48 hours of receiving your complaint.",
            "Resolution — within 15 days for most complaints.",
            "If you're not satisfied with the outcome, you may escalate a data-related complaint to the Data Protection Board of India under the DPDP Act.",
          ]}
        />
      </>
    ),
  },
  {
    eyebrow: "Contact",
    title: "Questions about your data",
    body: (
      <p>
        For anything about this policy or your information, reach us at{" "}
        <span className="text-foreground">support@mtpocket.com</span>.
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
            Last updated <span className="text-foreground">12/08/2026</span> —
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