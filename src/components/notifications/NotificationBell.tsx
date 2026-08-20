"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppNotificationItemType } from "@/lib/notification-types";
import { useNotifications } from "@/lib/use-notifications";

type NotificationBellProps = {
  variant?: "light" | "dark";
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 86_400_000) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  if (diffMs < 604_800_000) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function notificationIcon(type: AppNotificationItemType) {
  switch (type) {
    case "group_chat":
      return "👥";
    case "community":
      return "🙏";
    case "devotion":
      return "📖";
    case "media":
      return "▶";
    case "worship":
      return "🎵";
    case "meeting":
      return "📅";
    case "kids":
      return "🧒";
    default:
      return "✉";
  }
}

function notificationTone(type: AppNotificationItemType) {
  switch (type) {
    case "group_chat":
      return "bg-violet-500/15 text-violet-500";
    case "community":
      return "bg-amber-500/15 text-amber-600";
    case "devotion":
      return "bg-sky-500/15 text-sky-600";
    case "media":
      return "bg-rose-500/15 text-rose-600";
    case "worship":
      return "bg-indigo-500/15 text-indigo-600";
    case "meeting":
      return "bg-emerald-500/15 text-emerald-600";
    case "kids":
      return "bg-orange-500/15 text-orange-600";
    default:
      return "bg-fuchsia-500/15 text-fuchsia-500";
  }
}

export function NotificationBell({ variant = "dark" }: NotificationBellProps) {
  const { total, items } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isLight = variant === "light";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const badgeLabel = total > 99 ? "99+" : String(total);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative rounded-xl p-2 transition ${
          isLight
            ? "text-white hover:bg-white/10"
            : "text-night-700 hover:bg-white"
        }`}
        aria-label={total > 0 ? `${total} unread notifications` : "Notifications"}
        aria-expanded={open}
      >
        <span className="text-lg" aria-hidden>
          🔔
        </span>
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border shadow-xl ${
            isLight
              ? "border-white/10 bg-night-950 text-white shadow-indigo-950/40"
              : "border-night-900/10 bg-white text-night-900 shadow-night-900/10"
          }`}
        >
          <div
            className={`border-b px-4 py-3 ${
              isLight ? "border-white/10" : "border-night-900/8"
            }`}
          >
            <p className="text-sm font-semibold">Notifications</p>
            <p className={`mt-0.5 text-xs ${isLight ? "text-white/60" : "text-night-500"}`}>
              {total > 0
                ? `${total} update${total === 1 ? "" : "s"} to review`
                : "You're all caught up"}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className={`px-4 py-8 text-center text-sm ${isLight ? "text-white/60" : "text-night-500"}`}>
                No new updates to review.
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 border-b px-4 py-3 transition last:border-b-0 ${
                    isLight
                      ? "border-white/5 hover:bg-white/5"
                      : "border-night-900/5 hover:bg-sand-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${notificationTone(item.type)}`}
                    aria-hidden
                  >
                    {notificationIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <span className={`shrink-0 text-[10px] ${isLight ? "text-white/45" : "text-night-400"}`}>
                        {formatWhen(item.at)}
                      </span>
                    </div>
                    <p className={`mt-0.5 line-clamp-2 text-xs ${isLight ? "text-white/65" : "text-night-600"}`}>
                      {item.body}
                    </p>
                  </div>
                  {item.count > 1 && (
                    <span className="mt-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>

          {total > 0 && (
            <div className={`border-t px-4 py-2.5 ${isLight ? "border-white/10" : "border-night-900/8"}`}>
              <p className={`text-[11px] ${isLight ? "text-white/50" : "text-night-400"}`}>
                Open a section to clear its badge.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
