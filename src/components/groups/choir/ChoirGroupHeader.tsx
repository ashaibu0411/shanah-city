"use client";

import Link from "next/link";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ChoirBrandTitle } from "@/components/groups/choir/ChoirBrandTitle";

type ChoirGroupHeaderProps = {
  onChatClick: () => void;
};

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M11.78 4.22a.75.75 0 0 1 0 1.06L8.06 9l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M10 5.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM10 11.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM10 17a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"
      />
    </svg>
  );
}

export function ChoirGroupHeader({ onChatClick }: ChoirGroupHeaderProps) {
  return (
    <header className="choir-group-header">
      <Link href="/groups" className="choir-header-icon-btn" aria-label="Back to groups">
        <BackIcon />
      </Link>
      <ChoirBrandTitle />
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="choir-header-icon-btn !border-0 !bg-transparent">
          <NotificationBell variant="light" />
        </div>
        <button type="button" onClick={onChatClick} className="choir-header-icon-btn" aria-label="Team menu">
          <MenuIcon />
        </button>
      </div>
    </header>
  );
}
