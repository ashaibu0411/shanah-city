"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PollsSection } from "@/components/polls/PollsSection";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { ChoirAnnouncementComposer } from "@/components/groups/choir/announcements/ChoirAnnouncementComposer";
import type { ChoirAnnouncementFeedItem, ChoirAnnouncementsPagePayload } from "@/lib/choir-announcements-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import "../choir-premium.css";

type ChoirAnnouncementsPageProps = {
  groupId: string;
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChoirAnnouncementsPage({ groupId }: ChoirAnnouncementsPageProps) {
  const [payload, setPayload] = useState<ChoirAnnouncementsPagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-announcements?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load announcements.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load announcements.");
        setLoading(false);
      });
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeAnnouncement(id: string) {
    if (!window.confirm("Remove this announcement?")) return;
    const response = await fetch("/api/groups/choir-announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", groupId: SHANAH_WORSHIP_GROUP_ID, id }),
    });
    if (response.ok) {
      setPayload((current) =>
        current
          ? {
              ...current,
              announcements: current.announcements.filter((row) => row.id !== id),
            }
          : current,
      );
      load();
    }
  }

  function onCreated(item: ChoirAnnouncementFeedItem) {
    setPayload((current) =>
      current
        ? {
            ...current,
            announcements: [item, ...current.announcements.filter((row) => !row.isSample)],
          }
        : current,
    );
  }

  const chatHref = `/groups/${encodeURIComponent(groupId)}?chat=1`;

  if (loading) {
    return (
      <div className="choir-group-home choir-announcements-page px-4 py-6">
        <p className="text-sm text-[var(--choir-muted)]">Loading announcements…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-announcements-page px-4 py-6">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="choir-group-home choir-announcements-page choir-page-shell space-y-5 pb-8">
      <ChoirSetlistHeader groupId={groupId} chatHref={chatHref} />

      <div>
        <h2 className="font-display text-[1.35rem] font-bold text-[var(--choir-heading)]">
          Ministry announcements
        </h2>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">
          Updates and polls for the worship team.
        </p>
      </div>

      {payload.canManage ? <ChoirAnnouncementComposer onCreated={onCreated} /> : null}

      <section aria-label="Announcements">
        {payload.announcements.length === 0 ? (
          <div className="choir-card p-4">
            <p className="text-sm text-[var(--choir-muted)]">No announcements yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {payload.announcements.map((item) => (
              <li key={item.id} id={`announcement-${item.id}`} className="choir-card p-4 scroll-mt-24">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--choir-gold-dark)]">
                      {item.authorName}
                      {item.isSample ? " · Sample" : ""}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-[var(--choir-heading)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--choir-muted)]">{formatWhen(item.createdAt)}</p>
                  </div>
                  {payload.canManage && !item.isSample ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-700"
                      onClick={() => removeAnnouncement(item.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--choir-body)]">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="choir-card p-4">
        <PollsSection
          groupId={groupId}
          groupName={payload.groupName}
          title="Team polls"
          compact
          showComposer={payload.canManage}
        />
      </section>

      <Link href={chatHref} className="choir-setlist-manage-link block text-center">
        Open team chat →
      </Link>
    </div>
  );
}
