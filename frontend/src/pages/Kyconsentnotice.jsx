import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";
import PolicyList from "../components/Policy/PolicyList";

const sections = [
  {
    eyebrow: "Why We Ask",
    title: "Identity verification, nothing else",
    body: (
      <p>
        Before you can send or receive loan requests on MT Pocket, we
        verify your identity using a government-issued ID. This exists
        solely to confirm you're a real person and to reduce fraud between
        users — it is not used for credit scoring, marketing, or shared
        with anyone outside the verification process described below.
      </p>
    ),
  },
  {
    eyebrow: "What We Collect",
    title: "Document and a verification selfie",
    body: (
      <PolicyList
        items={[
          "A government-issued photo ID (e.g., Aadhaar, PAN, Passport, Driving Licence).",
          "A live selfie, to confirm the ID belongs to you.",
          "The extracted details needed for verification (name, date of birth, ID number) — not the full document image, once verification is complete. See retention below.",
        ]}
      />
    ),
  },
  {
    eyebrow: "How It's Stored",
    title: "Restricted access, encrypted, never public",
    body: (
      <PolicyList
        items={[
          "Documents are encrypted at rest and served only through authenticated, signed URLs — never a public link.",
          "Access is limited to the automated verification process and a small number of authorized reviewers, logged to an audit trail.",
          "Other users never see your document — only a 'Verified' badge on your profile.",
        ]}
      />
    ),
  },
  {
    eyebrow: "Who Sees It",
    title: "You, our verification system, and no one else",
    body: (
      <p>
        Your document is shared only with our identity-verification
        provider (
        <span className="text-foreground">[NAME PROVIDER, e.g., IDfy/Signzy]</span>
        ) to perform the check, and internal reviewers if a manual review is
        needed. We do not share it with other users, advertisers, or any
        party outside this verification process, except where legally
        required.
      </p>
    ),
  },
  {
    eyebrow: "How Long We Keep It",
    title: "Retention specific to ID documents",
    body: (
      <p>
        Your raw document image is retained for{" "}
        <span className="text-foreground">[X — e.g., 90 days]</span> after
        verification, then deleted. We retain a record that you were
        verified (not the document itself) for as long as your account is
        active, plus <span className="text-foreground">[X]</span> for
        fraud-prevention and legal record-keeping.
      </p>
    ),
  },
  {
    eyebrow: "Your Consent",
    title: "What uploading means",
    body: (
      <p>
        By uploading your document, you consent to MT Pocket and its
        verification provider processing it for the sole purpose of
        identity verification, as described above and in our full{" "}
        <span className="text-foreground">Privacy Policy</span>. You can
        withdraw this consent at any time by contacting us — doing so
        means you won't be able to use parts of the Platform that require
        verification.
      </p>
    ),
  },
];

export default function KYCConsentNotice() {
  return (
    <PolicyLayout>
      <PolicyHero
        title="Identity Verification & Data Notice"
        subtitle={
          <>
            What happens to your document when you upload it — read this
            before you continue.
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