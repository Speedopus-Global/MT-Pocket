import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";
import PolicyList from "../components/Policy/PolicyList";

const sections = [
  {
    eyebrow: "Why This Exists",
    title: "The short version of our Terms",
    body: (
      <p>
        MT Pocket only works if people can trust who they're talking to.
        These guidelines are the plain-language version of section 9 of
        our Terms & Conditions — breaking them is grounds for a warning,
        suspension, or permanent ban, depending on severity.
      </p>
    ),
  },
  {
    eyebrow: "Be Who You Say You Are",
    title: "Identity",
    body: (
      <PolicyList
        items={[
          "Use your real name and your own identity documents. Never submit someone else's ID, or a fake one.",
          "One account per person. Don't create multiple accounts to get around a suspension or ban.",
          "Keep your profile photo current and recognizable — it's part of how other users verify you.",
        ]}
      />
    ),
  },
  {
    eyebrow: "Use MT Pocket for Its Actual Purpose",
    title: "Genuine lending & borrowing only",
    body: (
      <PolicyList
        items={[
          "Only post loan requests or offers you genuinely intend to follow through on.",
          "Don't use MT Pocket to advertise unrelated products, services, or other platforms.",
          "Don't use the chat feature for anything other than coordinating a lending/borrowing arrangement.",
        ]}
      />
    ),
  },
  {
    eyebrow: "Treat Other Users Fairly",
    title: "Conduct",
    body: (
      <PolicyList
        items={[
          "No harassment, threats, hate speech, or abusive language — in chat, in reports, or anywhere else on the Platform.",
          "No pressuring another user into terms they haven't agreed to, or misrepresenting a loan's terms once it's underway.",
          "No attempting to extract money, fees, or 'processing charges' from another user outside your agreed loan terms.",
        ]}
      />
    ),
  },
  {
    eyebrow: "Don't Work Around Our Safety Features",
    title: "Verification & reporting integrity",
    body: (
      <PolicyList
        items={[
          "Don't try to bypass identity verification, ratings, or the reporting system.",
          "Don't file false reports against another user to harass them or gain an advantage.",
          "Don't share your login credentials or let someone else use your verified account.",
        ]}
      />
    ),
  },
  {
    eyebrow: "What Happens If You Break These",
    title: "Enforcement",
    body: (
      <p>
        Depending on severity, we may warn you, remove content, temporarily
        suspend your account, or permanently ban it — see section 12 of
        our Terms & Conditions. Serious issues (fraud, threats, fake
        documents) typically go straight to suspension while we review.
      </p>
    ),
  },
];

export default function CommunityGuidelines() {
  return (
    <PolicyLayout>
      <PolicyHero
        title="Community Guidelines"
        subtitle={
          <>
            The plain-language rules for using MT Pocket — see our{" "}
            <span className="text-foreground">Terms & Conditions</span> for
            the full legal version.
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