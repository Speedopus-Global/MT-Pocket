import PolicyLayout from "../components/Policy/PolicyLayout";
import PolicyHero from "../components/Policy/PolicyHero";
import PolicySection from "../components/Policy/PolicySection";
import PolicyDivider from "../components/Policy/PolicyDivider";
import PolicyList from "../components/Policy/PolicyList";

const sections = [
  {
    eyebrow: "What Are Cookies",
    title: "Small files that help the Platform work",
    body: (
      <p>
        Cookies are small text files stored on your device when you visit
        a website. MT Pocket's web app uses them only for essential
        functions — we don't use cookies to track you across other sites
        or to serve ads.
      </p>
    ),
  },
  {
    eyebrow: "Cookies We Use",
    title: "Strictly essential and functional only",
    body: (
      <PolicyList
        items={[
          "Session cookies — keep you signed in as you navigate the site.",
          "Security cookies — help detect and prevent fraudulent login attempts.",
          "Preference cookies — remember basic settings like your last-used view or theme.",
        ]}
      />
    ),
  },
  {
    eyebrow: "Analytics",
    title: "[Fill in based on your actual stack]",
    body: (
      <p>
        {/* Delete this whole section if you don't use analytics.
           If you do (e.g. Google Analytics, Mixpanel, PostHog), name the
           provider here and disclose what it tracks — this needs to match
           whatever's actually running in production. */}
        MT Pocket [does / does not] use analytics cookies to understand how
        the web app is used, provided by{" "}
        <span className="text-foreground">[PROVIDER NAME]</span>. These are
        not used for advertising and do not identify you personally beyond
        what's needed for aggregate usage statistics.
      </p>
    ),
  },
  {
    eyebrow: "Managing Cookies",
    title: "Your browser controls",
    body: (
      <p>
        Most browsers let you block or delete cookies through their
        settings. Since MT Pocket's cookies are largely essential, blocking
        them may prevent you from staying signed in or using some features
        of the web app.
      </p>
    ),
  },
  {
    eyebrow: "Changes to This Policy",
    title: "We'll update this if our cookie use changes",
    body: (
      <p>
        If we add any new cookie category — particularly anything used for
        advertising or third-party tracking — we'll update this page and,
        where legally required, ask for your consent first.
      </p>
    ),
  },
  {
    eyebrow: "Contact",
    title: "Questions about cookies",
    body: (
      <p>
        Reach us at <span className="text-foreground">support@mtpocket.com</span>.
      </p>
    ),
  },
];

export default function CookiePolicy() {
  return (
    <PolicyLayout>
      <PolicyHero
        title="Cookie Policy"
        subtitle={
          <>
            Last updated <span className="text-foreground">12/08/2026</span> —
            applies to the MT Pocket web app only.
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