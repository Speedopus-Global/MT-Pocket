import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";

const sections = [
  {
    eyebrow: "Short Answer",
    title: "There's nothing to refund",
    body: (
      <p>
        MT Pocket does not process, hold, or transmit any payment between
        users — every rupee involved in a loan moves directly between the
        borrower and lender, entirely outside the Platform. Because no
        money ever passes through MT Pocket, we have no payment flow to
        reverse and no refund process to offer.
      </p>
    ),
  },
  {
    eyebrow: "If a Repayment Dispute Comes Up",
    title: "That's between the two users",
    body: (
      <p>
        Disagreements about repayment, missed payments, or loan terms are
        private matters between the borrower and lender — see section 13
        of our Terms & Conditions. MT Pocket isn't a party to the
        agreement and can't reverse, refund, or enforce a repayment on
        either user's behalf.
      </p>
    ),
  },
  {
    eyebrow: "What We Can Help With",
    title: "Account and platform issues only",
    body: (
      <p>
        If MT Pocket itself charges you directly for something in the
        future — a subscription or premium feature, for example — that
        would be covered by a separate, specific refund policy at the time
        we introduce it. Nothing on the Platform today involves a direct
        charge from MT Pocket to you.
      </p>
    ),
  },
];

export default function RefundPolicy() {
  return (
    <PolicyLayout>
      <PolicyHero
        title="Refund & Cancellation Policy"
        subtitle={<>Last updated <span className="text-foreground">12/08/2026</span></>}
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