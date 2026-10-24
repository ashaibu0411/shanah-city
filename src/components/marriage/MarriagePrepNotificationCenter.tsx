"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { MarriagePrepNotificationListView } from "@/lib/marriage-prep-notification-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";
import { readJsonResponse } from "@/lib/read-json-response";

type Props = {
  initialUnreadCount?: number;
  panelLabel?: string;
  buttonLabel?: string;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function MarriagePrepNotificationCenter({
  initialUnreadCount = 0,
  panelLabel = "Your updates",
  buttonLabel = "Updates",
}: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MarriagePrepNotificationListView | null>(null);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await fetch("/api/marriage/notifications", { cache: "no-store" });
    const body = await readJsonResponse<{ notifications?: MarriagePrepNotificationListView; error?: string }>(
      res,
    );
    if (!res.ok) {
      setError(body.error ?? "Could not load updates.");
      return;
    }
    setData(body.notifications ?? null);
    setUnread(body.notifications?.unreadCount ?? 0);
  }, []);

  useEffect(() => {
    setUnread(initialUnreadCount);
  }, [initialUnreadCount]);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await load();
  }

  async function markRead(id: string) {
    setBusy(true);
    const res = await fetch("/api/marriage/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", notificationId: id }),
    });
    setBusy(false);
    if (res.ok) await load();
  }

  async function markAllRead() {
    setBusy(true);
    const res = await fetch("/api/marriage/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setBusy(false);
    if (res.ok) await load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void toggleOpen()}
        className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-stone-200 bg-white px-3 text-sm font-semibold text-clay-900 shadow-sm dark:border-white/10 dark:bg-night-900 dark:text-sand-100"
        aria-expanded={open}
        aria-controls="marriage-prep-notifications-panel"
        aria-label={
          unread > 0
            ? `${buttonLabel}, ${unread} unread`
            : buttonLabel
        }
      >
        {buttonLabel}
        {unread > 0 ? (
          <span className="ml-2 rounded-full bg-clay-700 px-2 py-0.5 text-xs font-bold text-white dark:bg-clay-400 dark:text-night-950">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="marriage-prep-notifications-panel"
          role="region"
          aria-label="Marriage Prep notification center"
          className={`${marriagePremium.card} absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] shadow-lg`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className={marriagePremium.sectionLabel}>{panelLabel}</p>
            <button
              type="button"
              disabled={busy || unread === 0}
              onClick={() => void markAllRead()}
              className="min-h-[44px] text-xs font-bold text-clay-700 underline disabled:opacity-40 dark:text-clay-300"
            >
              Mark all read
            </button>
          </div>
          {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {(data?.items ?? []).length === 0 ? (
              <li className={`${marriagePremium.cardMuted} text-sm`}>No updates yet.</li>
            ) : (
              data!.items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    item.readAt
                      ? "border-stone-200 opacity-80 dark:border-white/10"
                      : "border-clay-200 bg-clay-50/60 dark:border-clay-800 dark:bg-clay-950/30"
                  }`}
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-night-600 dark:text-sand-400">{item.body}</p>
                  <p className="mt-1 text-[11px] text-night-500">{formatWhen(item.createdAt)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={item.actionPath}
                      className="min-h-[44px] text-xs font-bold text-clay-800 underline dark:text-clay-300"
                      onClick={() => {
                        if (!item.readAt) void markRead(item.id);
                      }}
                    >
                      Open
                    </Link>
                    {!item.readAt ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void markRead(item.id)}
                        className="min-h-[44px] text-xs font-bold text-night-600 underline dark:text-sand-400"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
