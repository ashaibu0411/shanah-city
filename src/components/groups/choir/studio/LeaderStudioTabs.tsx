"use client";

import Link from "next/link";
import { choirLeaderStudioHref } from "@/lib/choir-leader-studio-links";
import type { LeaderStudioTabId } from "@/lib/choir-leader-studio-types";

const TABS: { id: LeaderStudioTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "planning", label: "Planning" },
  { id: "team", label: "Team & Availability" },
  { id: "events", label: "Events" },
  { id: "resources", label: "Resources" },
  { id: "reports", label: "Reports" },
];

type LeaderStudioTabsProps = {
  groupId: string;
  active: LeaderStudioTabId;
};

export function LeaderStudioTabs({ groupId, active }: LeaderStudioTabsProps) {
  return (
    <div className="choir-wls-tabs" role="tablist" aria-label="Worship leader studio">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={choirLeaderStudioHref(groupId, tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`choir-wls-tab ${isActive ? "choir-wls-tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
