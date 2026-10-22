"use client";

import Link from "next/link";
import { messagingUi } from "@/lib/messaging-ui";

export type ChatGroupSubnavTab = "chat" | "files" | "events" | "members";

type ChatGroupSubnavProps = {
  groupId: string;
  active: ChatGroupSubnavTab;
  onMembers?: () => void;
};

export function ChatGroupSubnav({ groupId, active, onMembers }: ChatGroupSubnavProps) {
  const tabs: Array<{ id: ChatGroupSubnavTab; label: string; href?: string; action?: () => void }> = [
    { id: "chat", label: "Chat" },
    { id: "files", label: "Files", href: `/groups/${groupId}/resources` },
    { id: "events", label: "Events", href: `/groups/${groupId}/events` },
    { id: "members", label: "Members", action: onMembers },
  ];

  return (
    <nav className={messagingUi.subnav} aria-label="Group sections">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const className = isActive ? messagingUi.subnavTabActive : messagingUi.subnavTab;
        if (tab.href && tab.id !== "chat") {
          return (
            <Link key={tab.id} href={tab.href} className={className}>
              {tab.label}
            </Link>
          );
        }
        if (tab.action) {
          return (
            <button key={tab.id} type="button" className={className} onClick={tab.action}>
              {tab.label}
            </button>
          );
        }
        return (
          <span key={tab.id} className={className} aria-current={isActive ? "page" : undefined}>
            {tab.label}
          </span>
        );
      })}
    </nav>
  );
}
