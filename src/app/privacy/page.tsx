import { PageHeader } from "@/components/ui";
import { privacyPolicyMeta, privacyPolicySections } from "@/lib/privacy-policy";
import { site } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for the ${site.name} app and website.`,
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description={`How ${site.name} collects, uses, and protects information in our app and website.`}
      />

      <div className="mb-8 rounded-2xl bg-sand-100 px-5 py-4 text-sm text-night-700 ring-1 ring-night-900/5">
        <p>
          <span className="font-semibold text-night-900">Effective date:</span>{" "}
          {privacyPolicyMeta.effectiveDate}
        </p>
        <p className="mt-1">
          <span className="font-semibold text-night-900">Last updated:</span>{" "}
          {privacyPolicyMeta.lastUpdated}
        </p>
        <p className="mt-3 text-night-600">
          Questions? Email{" "}
          <a href={`mailto:${privacyPolicyMeta.contactEmail}`} className="font-semibold underline">
            {privacyPolicyMeta.contactEmail}
          </a>
        </p>
      </div>

      <div className="space-y-6">
        {privacyPolicySections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="rounded-2xl bg-white p-6 ring-1 ring-night-900/5"
          >
            <h2 className="font-display text-xl font-semibold text-night-900">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-night-700">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul className="list-disc space-y-2 pl-5">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
