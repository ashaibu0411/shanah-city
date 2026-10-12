"use client";

import Link from "next/link";
import { choirAvailabilityHref } from "@/lib/choir-availability-links";
import type { ChoirAvailabilityTabId } from "@/lib/choir-availability-types";

type AvailabilityTabsProps = {
  groupId: string;
  active: ChoirAvailabilityTabId;
};

const TABS: { id: ChoirAvailabilityTabId; label: string }[] = [
  { id: "home", label: "Availability" },
  { id: "my-schedule", label: "My Schedule" },
  { id: "upcoming", label: "Upcoming Dates" },
  { id: "past", label: "Past Dates" },
  { id: "guidelines", label: "Guidelines" },
];

export function AvailabilityTabs({ groupId, active }: AvailabilityTabsProps) {
  return (
    <div className="choir-availability-tabs" role="tablist" aria-label="Availability">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={choirAvailabilityHref(groupId, tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`choir-availability-tab ${isActive ? "choir-availability-tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
