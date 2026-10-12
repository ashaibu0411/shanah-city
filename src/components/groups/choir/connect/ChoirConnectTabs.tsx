"use client";

import Link from "next/link";
import { choirConnectHref } from "@/lib/choir-connect-links";
import type { ChoirConnectTabId } from "@/lib/choir-connect-types";

type ChoirConnectTabsProps = {
  groupId: string;
  active: ChoirConnectTabId;
};

const TABS: { id: ChoirConnectTabId; label: string }[] = [
  { id: "home", label: "Team Connect" },
  { id: "chat", label: "Group Chat" },
  { id: "announcements", label: "Announcements" },
  { id: "polls", label: "Polls" },
];

export function ChoirConnectTabs({ groupId, active }: ChoirConnectTabsProps) {
  return (
    <div className="choir-connect-tabs" role="tablist" aria-label="Team connect">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={choirConnectHref(groupId, tab.id)}
            role="tab"
            aria-selected={isActive}
            className={`choir-connect-tab ${isActive ? "choir-connect-tab-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
