"use client";

import Link from "next/link";
import { choirWorshipEventsHref } from "@/lib/choir-events-links";
import type { ChoirWorshipEventsTabId } from "@/lib/choir-events-types";

type WorshipEventsTabsProps = {
  groupId: string;
  active: ChoirWorshipEventsTabId;
};

const TABS: { id: ChoirWorshipEventsTabId; label: string }[] = [
  { id: "events", label: "Events" },
  { id: "registrations", label: "My Registrations" },
  { id: "teams", label: "Event Teams" },
  { id: "past", label: "Past Events" },
  { id: "guidelines", label: "Guidelines" },
];

export function WorshipEventsTabs({ groupId, active }: WorshipEventsTabsProps) {
  return (
    <div className="choir-worship-events-tabs" role="tablist" aria-label="Worship events">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={choirWorshipEventsHref(groupId, { tab: tab.id === "events" ? undefined : tab.id })}
            role="tab"
            aria-selected={isActive}
            className={`choir-worship-events-tab ${isActive ? "choir-worship-events-tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
