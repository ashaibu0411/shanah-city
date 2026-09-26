"use client";

import Link from "next/link";
import type { WorshipChatAction } from "@/lib/worship-chat-links";

export function ChatWorshipActionButton({
  action,
  mine,
  hub,
}: {
  action: WorshipChatAction;
  mine?: boolean;
  hub?: boolean;
}) {
  return (
    <Link
      href={action.href}
      onClick={(event) => event.stopPropagation()}
      className={`mt-2 inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition active:scale-[0.98] ${
        hub
          ? mine
            ? "bg-white/95 text-violet-800 ring-1 ring-white/60"
            : "bg-violet-600 text-white ring-1 ring-violet-700/30"
          : mine
            ? "bg-white text-violet-800 ring-1 ring-violet-200/80 dark:bg-[var(--color-surface)] dark:text-violet-200 dark:ring-violet-800/40"
            : "bg-violet-600 text-white ring-1 ring-violet-700/40 hover:bg-violet-700"
      }`}
    >
      {action.label}
    </Link>
  );
}
