import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";
import PolicyList from "../components/Policy/PolicyList";

const sections = [
  {
    eyebrow: "1",
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
    eyebrow: "2",
    title: "Eligibility",
    body: (
      <p>
        You must be at least 18 years old and capable of entering into a
        legally binding agreement under applicable law to use MT Pocket.
        By creating an account, you confirm that you meet these
        requirements and that all information you provide, including your
        identity documents, is accurate and belongs to you.
      </p>
    ),
  },
  {
    eyebrow: "3",
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
    eyebrow: "4",
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
    eyebrow: "5",
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
    eyebrow: "6",
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
    eyebrow: "7",
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
    eyebrow: "8",
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
    eyebrow: "9",
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
    eyebrow: "10",
    title: "Intellectual Property",
    body: (
      <p>
        The MT Pocket name, logo, app, and platform design belong to us and
        are protected by applicable intellectual property law. Using the
        Platform doesn't give you any ownership over it — just a limited,
        personal, non-transferable right to use it for its intended
        purpose. Content you post — profile details, messages, listing
        information — remains yours, but you grant us the right to display
        and process it as needed to operate the Platform.
      </p>
    ),
  },
  {
    eyebrow: "11",
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
    eyebrow: "12",
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
    eyebrow: "13",
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
    eyebrow: "14",
    title: "Changes to These Terms",
    body: (
      <p>
        We may update these Terms from time to time. Continued use of the
        Platform after changes take effect constitutes acceptance of the
        updated Terms. Material changes will be highlighted at next login,
        and where legally required, we'll ask you to re-confirm your
        acceptance before you continue.
      </p>
    ),
  },
  {
    eyebrow: "15",
    title: "Severability",
    body: (
      <p>
        If any provision of these Terms is found unenforceable by a court
        or regulator, that provision will be limited or removed to the
        minimum extent necessary, and the rest of these Terms will remain
        in full effect.
      </p>
    ),
  },
  {
    eyebrow: "16",
    title: "Entire Agreement",
    body: (
      <p>
        These Terms, together with our Privacy Policy, make up the entire
        agreement between you and MT Pocket regarding use of the Platform,
        and supersede any prior agreement or understanding on the subject.
      </p>
    ),
  },
  {
    eyebrow: "17",
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
    eyebrow: "18",
    title: "Contact",
    body: (
      <p>
        Questions about these Terms:{" "}
        <span className="text-foreground">support@mtpocket.com</span>
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
          <>Last updated <span className="text-foreground">12/08/2026</span> — please read this before you use MT Pocket.</>
        }
      />
      <div className="pb-4 text-center text-sm text-muted-foreground">
        MT Pocket is a technology platform that helps borrowers and lenders
        discover each other locally. We are not a lender, broker, or party
        to any loan — see section 3 below.
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