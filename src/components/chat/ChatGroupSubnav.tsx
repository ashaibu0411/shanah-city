"use client";

import { messagingUi } from "@/lib/messaging-ui";

export type ChatGroupSubnavTab = "chat" | "files" | "events" | "members";

type ChatGroupSubnavProps = {
  active: ChatGroupSubnavTab;
  onTabChange: (tab: ChatGroupSubnavTab) => void;
};

const TABS: Array<{ id: ChatGroupSubnavTab; label: string }> = [
  { id: "chat", label: "Chat" },
  { id: "files", label: "Files" },
  { id: "events", label: "Events" },
  { id: "members", label: "Members" },
];

export function ChatGroupSubnav({ active, onTabChange }: ChatGroupSubnavProps) {
  return (
    <nav className={`${messagingUi.subnav} shrink-0`} aria-label="Group sections">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const className = isActive ? messagingUi.subnavTabActive : messagingUi.subnavTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={className}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
