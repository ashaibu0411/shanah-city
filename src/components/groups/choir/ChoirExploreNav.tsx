"use client";

import Link from "next/link";
import type { ChoirExploreNavItem } from "@/lib/choir-home-links";

type ChoirExploreNavProps = {
  items: ChoirExploreNavItem[];
};

export function ChoirExploreNav({ items }: ChoirExploreNavProps) {
  if (items.length === 0) return null;

  return (
    <section className="choir-explore-section" aria-labelledby="choir-explore-heading">
      <h2 id="choir-explore-heading" className="choir-explore-heading">
        Explore Shanah Worship
      </h2>
      <ul className="choir-explore-list">
        {items.map((item) => {
          const content = (
            <>
              <span className="choir-explore-icon" aria-hidden>
                {item.iconLabel}
              </span>
              <span className="choir-explore-copy">
                <span className="choir-explore-title">{item.title}</span>
                <span className="choir-explore-desc">{item.description}</span>
              </span>
              {item.comingSoon ? (
                <span className="choir-explore-badge">Coming soon</span>
              ) : (
                <span className="choir-explore-chevron" aria-hidden>
                  ›
                </span>
              )}
            </>
          );

          if (item.href && !item.comingSoon) {
            return (
              <li key={item.id}>
                <Link href={item.href} className="choir-explore-row">
                  {content}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <div className="choir-explore-row choir-explore-row-disabled" aria-disabled="true">
                {content}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
