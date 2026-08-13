import Link from "next/link";
import { campuses } from "@/lib/site";

const campusIcons: Record<string, string> = {
  colorado: "🏔",
  accra: "🌍",
  online: "📡",
};

export function CampusStrip() {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-600">
            One church, three locations
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-night-900">
            Where we gather
          </h2>
        </div>
        <Link
          href="/campuses"
          className="shrink-0 text-sm font-semibold text-night-600 hover:text-night-900"
        >
          All campuses →
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {campuses.map((campus) => (
          <Link
            key={campus.id}
            href="/campuses"
            className="group rounded-2xl bg-white p-4 ring-1 ring-night-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-2xl">{campusIcons[campus.id] ?? "◎"}</span>
            <h3 className="mt-3 font-display text-lg font-semibold text-night-900 group-hover:text-night-700">
              {campus.name}
            </h3>
            <p className="mt-1 text-sm text-night-600">
              {campus.city}, {campus.country}
            </p>
            <p className="mt-3 text-xs font-medium text-sand-700">
              {campus.serviceTimes.join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
