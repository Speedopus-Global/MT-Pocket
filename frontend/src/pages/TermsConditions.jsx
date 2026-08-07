import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";
import PolicyList from "../components/Policy/PolicyList";

const sections = [
  {
    eyebrow: "3.1",
    title: "Acceptance of Terms",
    body: (
      <p>
        By creating an account or using MT Pocket in any way, you agree to
        be bound by these Terms and Conditions and our Privacy Policy. If
        you do not agree, do not use the Platform.
      </p>
    ),
  },
  {
    eyebrow: "3.2",
    title: "Nature of the Platform",
    body: (
      <p>
        MT Pocket is a technology platform that helps individuals discover
        and connect with other individuals interested in personal lending
        or borrowing within their local area, based on location, category,
        and mutual interest — comparable in role to a classifieds or
        listings platform. MT Pocket is not a lender, borrower, broker,
        agent, guarantor, or party to any loan arrangement made between
        users.
      </p>
    ),
  },
  {
    eyebrow: "3.3",
    title: "No Financial Services Provided",
    body: (
      <>
        <p>
          MT Pocket is not a bank, non-banking financial company (NBFC), or
          licensed financial institution. We do not:
        </p>
        <PolicyList
          items={[
            "Originate, underwrite, approve, or guarantee any loan.",
            "Process, hold, transmit, or have custody of any funds exchanged between users.",
            "Provide credit assessments, financial advice, or investment recommendations.",
          ]}
        />
        <p>
          All money exchanged in connection with any arrangement made via
          the Platform is transferred directly between users, through
          channels entirely outside MT Pocket, at the users' own
          arrangement and risk.
        </p>
      </>
    ),
  },
  {
    eyebrow: "3.4",
    title: "No Control Over Loan Terms",
    body: (
      <p>
        Loan amount, interest rate, repayment schedule, and all other terms
        are determined solely by negotiation and mutual agreement between
        the borrower and lender. MT Pocket does not set, cap, recommend,
        review, or approve any such terms, and any interest rate or amount
        displayed on the Platform is user-submitted information only, not a
        Platform-endorsed rate.
      </p>
    ),
  },
  {
    eyebrow: "3.5",
    title: "Verification Is Not a Guarantee",
    body: (
      <p>
        MT Pocket may verify user-submitted identity documents as a trust
        and safety measure. This verification process is intended to
        reduce — not eliminate — risk, and does not constitute a guarantee
        of any user's identity, honesty, creditworthiness, solvency, or
        intent. Users are solely responsible for conducting their own due
        diligence before entering into any arrangement with another user.
      </p>
    ),
  },
  {
    eyebrow: "3.6",
    title: "User Responsibility & Assumption of Risk",
    body: (
      <>
        <p>You acknowledge and agree that:</p>
        <PolicyList
          items={[
            "Any decision to lend or borrow money through a connection made on the Platform is made entirely at your own discretion and risk.",
            "MT Pocket has no visibility into, and no responsibility for, what happens between users after a connection is made, including repayment, default, or any dispute.",
            "You are solely responsible for complying with any applicable law regarding personal lending or borrowing in your jurisdiction.",
          ]}
        />
      </>
    ),
  },
  {
    eyebrow: "3.7",
    title: "Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, MT Pocket and its officers,
        employees, and affiliates shall not be liable for any direct,
        indirect, incidental, or consequential loss or damage arising from:
        (a) any loan or financial arrangement between users; (b) any user's
        default, fraud, or misrepresentation; (c) any dispute between
        users; or (d) reliance on any verification, rating, or trust score
        displayed on the Platform.
      </p>
    ),
  },
  {
    eyebrow: "3.8",
    title: "Prohibited Conduct",
    body: (
      <>
        <p>Users agree not to:</p>
        <PolicyList
          items={[
            "Misrepresent their identity or documents.",
            "Use the Platform for any purpose other than genuine personal lending/borrowing discovery.",
            "Harass, defraud, or threaten other users.",
            "Attempt to circumvent the Platform's verification or safety features.",
          ]}
        />
      </>
    ),
  },
  {
    eyebrow: "3.9",
    title: "Indemnification",
    body: (
      <p>
        You agree to indemnify and hold MT Pocket harmless from any claim,
        loss, or demand arising from your use of the Platform, your
        violation of these Terms, or any arrangement you enter into with
        another user.
      </p>
    ),
  },
  {
    eyebrow: "3.10",
    title: "Account Suspension & Termination",
    body: (
      <p>
        MT Pocket may suspend or terminate any account, at its discretion,
        for violation of these Terms, suspected fraud, or conduct that
        endangers other users — with or without prior notice where safety
        is a concern.
      </p>
    ),
  },
  {
    eyebrow: "3.11",
    title: "Disputes Between Users",
    body: (
      <p>
        MT Pocket is not responsible for resolving disputes between users
        arising from their private lending arrangements. Users are
        encouraged to resolve such disputes directly or through appropriate
        legal channels; MT Pocket may, at its discretion, suspend accounts
        involved in reported disputes pending review, but is under no
        obligation to mediate, adjudicate, or compensate for outcomes.
      </p>
    ),
  },
  {
    eyebrow: "3.12",
    title: "Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. Continued use of the
        Platform after changes take effect constitutes acceptance of the
        updated Terms. Material changes will be highlighted at next login.
      </p>
    ),
  },
  {
    eyebrow: "3.13",
    title: "Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of India, and any disputes
        shall be subject to the exclusive jurisdiction of the courts of{" "}
        <span className="text-foreground">[YOUR CITY]</span>, India.
      </p>
    ),
  },
  {
    eyebrow: "3.14",
    title: "Contact",
    body: (
      <p>
        Questions about these Terms:{" "}
        <span className="text-foreground">[support email]</span>
      </p>
    ),
  },
];

export default function TermsConditions() {
  return (
    <PolicyLayout>
      <PolicyHero
        title="Terms & Conditions"
        subtitle={
          <>Last updated <span className="text-foreground">[DATE]</span> — please read this before you use MT Pocket.</>
        }
      />
      <div className="pb-4 text-center text-sm text-muted-foreground">
        MT Pocket is a technology platform that helps borrowers and lenders
        discover each other locally. We are not a lender, broker, or party
        to any loan — see section 3.2 below.
      </div>
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
