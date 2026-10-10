"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CouplesLoadingSkeleton } from "@/components/couples/design-system";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import { groupResourcesByCategory } from "@/lib/couple-community-ui";
import type { GroupResourceRecord } from "@/lib/group-resource-types";

const CURATED_RESOURCES = [
  {
    title: "Daily marriage devotionals",
    description: "Scripture-centered readings in your private Our Marriage space.",
    href: "/couples/marriage/devotionals",
    category: "Devotional",
  },
  {
    title: "Couples games",
    description: "Playful prompts to know each other better — private to you and your spouse.",
    href: "/couples/marriage/games",
    category: "Discussion guide",
  },
] as const;

export function CouplesCommunityResourcesTab() {
  const [resources, setResources] = useState<GroupResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/groups/resources?groupId=${encodeURIComponent(SHANAH_POWER_COUPLES_GROUP_ID)}`)
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setResources(data.resources ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupResourcesByCategory(resources);

  return (
    <div>
      <p className="text-sm leading-relaxed text-[var(--couples-muted)]">
        Teachings, videos, devotionals, and discussion guides curated for Power Couples.
      </p>

      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--couples-gold)]">
          From Shanah City
        </h2>
        <ul className="mt-3 space-y-3">
          {CURATED_RESOURCES.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-[1.125rem] bg-white p-4 shadow-sm ring-1 ring-[var(--couples-border)] transition hover:ring-[var(--couples-gold)]/40"
              >
                <span className="rounded-full bg-[var(--couples-gold-light)]/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--couples-mocha)]">
                  {item.category}
                </span>
                <p className="mt-2 font-semibold text-[var(--couples-text)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--couples-muted)]">{item.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {loading ? (
        <div className="mt-6">
          <CouplesLoadingSkeleton rows={3} />
        </div>
      ) : grouped.length === 0 ? (
        <p className="mt-6 rounded-[1.125rem] bg-white px-4 py-6 text-sm text-[var(--couples-muted)] ring-1 ring-[var(--couples-border)]">
          Group leaders can add books, videos, and worksheets here. Check back as the shelf grows.
        </p>
      ) : (
        grouped.map(([category, items]) => (
          <section key={category} className="mt-8">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--couples-gold)]">
              {category}
            </h2>
            <ul className="mt-3 space-y-3">
              {items.map((resource) => (
                <li key={resource.id}>
                  <div className="rounded-[1.125rem] bg-white p-4 shadow-sm ring-1 ring-[var(--couples-border)]">
                    <p className="font-semibold text-[var(--couples-text)]">{resource.title}</p>
                    {resource.description ? (
                      <p className="mt-1 text-sm text-[var(--couples-muted)]">{resource.description}</p>
                    ) : null}
                    {resource.url ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-[var(--couples-gold)] underline-offset-2 hover:underline"
                      >
                        Open resource
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
