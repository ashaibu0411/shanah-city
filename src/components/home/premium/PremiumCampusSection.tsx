import Link from "next/link";
import { campuses } from "@/lib/site";
import { PremiumQuickActionIcon } from "@/components/home/premium/PremiumHomeIcons";

const campusIcons: Record<string, "campuses" | "groups" | "live"> = {
  colorado: "campuses",
  accra: "groups",
  online: "live",
};

export function PremiumCampusSection() {
  return (
    <section className="premium-section" aria-labelledby="premium-campus-heading">
      <div className="premium-section__head">
        <div>
          <p className="premium-section__eyebrow">One church, three locations</p>
          <h2 id="premium-campus-heading" className="premium-section__title">
            Where we gather
          </h2>
        </div>
        <Link href="/campuses" className="premium-section__link">
          All campuses →
        </Link>
      </div>

      <div className="premium-campus-grid">
        {campuses.map((campus) => (
          <Link key={campus.id} href="/campuses" className="premium-campus-card">
            <span className="premium-icon-well premium-icon-well--compact premium-icon-well--groups">
              <AppNavIconCompat id={campusIcons[campus.id] ?? "campuses"} />
            </span>
            <div>
              <p className="premium-campus-card__city">{campus.city}</p>
              <p className="premium-campus-card__name">{campus.name}</p>
              <p className="premium-campus-card__meta">
                {campus.address ?? `${campus.city}, ${campus.country}`}
              </p>
              <p className="premium-campus-card__times">{campus.serviceTimes.join(" · ")}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AppNavIconCompat({ id }: { id: "campuses" | "groups" | "live" }) {
  if (id === "live") return <PremiumQuickActionIcon id="live" className="h-5 w-5" />;
  if (id === "groups") return <PremiumQuickActionIcon id="groups" className="h-5 w-5" />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z" />
    </svg>
  );
}
