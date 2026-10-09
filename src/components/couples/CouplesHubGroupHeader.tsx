"use client";

import Link from "next/link";
import { couplesHubPremium } from "@/components/couples/couples-hub-premium";

export function CouplesHubGroupHeader({
  onChatClick,
  onInfoClick,
  onManageClick,
  onHubClick,
  hubIsActive,
  showChat,
  showManage,
}: {
  onChatClick?: () => void;
  onInfoClick?: () => void;
  onManageClick?: () => void;
  onHubClick?: () => void;
  hubIsActive?: boolean;
  showChat?: boolean;
  showManage?: boolean;
}) {
  return (
    <header className="couples-hub-group-header sticky top-0 z-30 border-b border-white/10 bg-[var(--couples-midnight)]/95 px-[var(--couples-page-padding)] py-3 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <Link href="/groups" className={couplesHubPremium.backLink}>
          <span aria-hidden>←</span> Groups
        </Link>
        {onHubClick ? (
          <button
            type="button"
            onClick={onHubClick}
            className={`font-display text-sm font-semibold tracking-tight ${
              hubIsActive ? "text-white" : "text-rose-200 underline-offset-2 hover:underline"
            }`}
          >
            Couples Hub
          </button>
        ) : (
          <p className="font-display text-sm font-semibold tracking-tight text-[var(--couples-text)]">
            Couples Hub
          </p>
        )}
        <div className="flex items-center gap-2">
          {showManage && onManageClick ? (
            <button
              type="button"
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--couples-text-muted)] ring-1 ring-white/15"
              onClick={onManageClick}
            >
              Manage
            </button>
          ) : null}
          {onInfoClick ? (
            <button
              type="button"
              aria-label="Group info"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--couples-surface)] text-[var(--couples-text)]"
              onClick={onInfoClick}
            >
              i
            </button>
          ) : null}
          {showChat && onChatClick ? (
            <button
              type="button"
              aria-label="Group chat"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--couples-surface)] text-[var(--couples-text)]"
              onClick={onChatClick}
            >
              💬
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
