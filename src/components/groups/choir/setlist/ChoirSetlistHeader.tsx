"use client";

import Link from "next/link";
import { ChoirBrandTitle } from "@/components/groups/choir/ChoirBrandTitle";

type ChoirSetlistHeaderProps = {
  groupId: string;
  chatHref: string;
  onSearchClick?: () => void;
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M8.5 3a5.5 5.5 0 1 0 3.48 9.79l3.1 3.1a.75.75 0 1 0 1.06-1.06l-3.1-3.1A5.5 5.5 0 0 0 8.5 3Zm0 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
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

export function ChoirSetlistHeader({ groupId, chatHref, onSearchClick }: ChoirSetlistHeaderProps) {
  return (
    <header className="choir-group-header">
      <Link
        href={`/groups/${encodeURIComponent(groupId)}`}
        className="choir-header-icon-btn"
        aria-label="Back to worship home"
      >
        <BackIcon />
      </Link>
      <ChoirBrandTitle />
      <div className="flex shrink-0 items-center gap-1.5">
        {onSearchClick ? (
          <button type="button" className="choir-header-icon-btn" aria-label="Search song library" onClick={onSearchClick}>
            <SearchIcon />
          </button>
        ) : null}
        <Link href={chatHref} className="choir-header-icon-btn" aria-label="Team menu">
          <MenuIcon />
        </Link>
      </div>
    </header>
  );
}
