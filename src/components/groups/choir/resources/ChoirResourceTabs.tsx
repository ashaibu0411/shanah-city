"use client";

import Link from "next/link";
import { choirResourcesHref } from "@/lib/choir-resource-links";
import type { ChoirResourceTabId } from "@/lib/choir-resource-types";

const TABS: { id: ChoirResourceTabId; label: string }[] = [
  { id: "resources", label: "Resources" },
  { id: "guides", label: "Ministry Guides" },
  { id: "onboarding", label: "Onboarding" },
  { id: "forms", label: "Forms" },
  { id: "links", label: "Helpful Links" },
];

type ChoirResourceTabsProps = {
  groupId: string;
  active: ChoirResourceTabId;
};

export function ChoirResourceTabs({ groupId, active }: ChoirResourceTabsProps) {
  return (
    <div className="choir-resource-tabs" role="tablist" aria-label="Ministry resources">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={choirResourcesHref(groupId, tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`choir-resource-tab ${isActive ? "choir-resource-tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
