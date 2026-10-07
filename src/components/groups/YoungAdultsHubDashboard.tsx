"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { GroupDashboardPanel } from "@/components/groups/GroupDashboardPanel";
import { groupsPremium } from "@/components/groups/groups-premium";
import { GroupPremiumSectionLabel, GroupPremiumStackCard } from "@/components/groups/GroupPremiumUI";
import type { GroupDashboardQuickAction } from "@/lib/group-dashboard-types";
import type {
  GroupPinnedAnnouncement,
  MinistryHubDevotionPreview,
  MinistryHubEventPreview,
} from "@/lib/group-ministry-hub-types";

type YoungAdultsHubDashboardProps = {
  groupId: string;
  groupName: string;
  memberCount: number;
  leaderNames: string[];
  onQuickAction?: (action: GroupDashboardQuickAction) => void;
  onSetupRoster?: () => void;
};

export function YoungAdultsHubDashboard({
  groupId,
  groupName,
  memberCount,
  leaderNames,
  onQuickAction,
  onSetupRoster,
}: YoungAdultsHubDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<GroupPinnedAnnouncement | null>(null);
  const [nextEvent, setNextEvent] = useState<MinistryHubEventPreview | null>(null);
  const [devotion, setDevotion] = useState<MinistryHubDevotionPreview | null>(null);
  const [canManageAnnouncement, setCanManageAnnouncement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadHub() {
    setLoading(true);
    const response = await fetch(
      `/api/groups/ministry-hub?groupId=${encodeURIComponent(groupId)}`,
    );
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not load hub.");
      return;
    }
    setAnnouncement(data.announcement ?? null);
    setNextEvent(data.nextEvent ?? null);
    setDevotion(data.devotion ?? null);
    setCanManageAnnouncement(Boolean(data.canManageAnnouncement));
    if (!editingAnnouncement) {
      setTitle(data.announcement?.title ?? "");
      setBody(data.announcement?.body ?? "");
    }
  }

  useEffect(() => {
    void loadHub();
  }, [groupId]);

  async function saveAnnouncement() {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/groups/ministry-hub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId,
        action: "announcement",
        title,
        body,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not save announcement.");
      return;
    }
    setAnnouncement(data.announcement ?? null);
    setEditingAnnouncement(false);
    setMessage("Announcement updated for the group.");
  }

  const hubTiles = [
    { label: "Chat", action: () => onQuickAction?.({ id: "chat", label: "Chat", action: "chat" }) },
    {
      label: "Events",
      action: () => onQuickAction?.({ id: "calendar", label: "Events", action: "calendar" }),
    },
    {
      label: "Prayer",
      action: () => onQuickAction?.({ id: "prayer", label: "Prayer", action: "prayer" }),
    },
    { label: "Community", href: "/community" },
  ];

  return (
    <div className="space-y-4">
      <GroupPremiumStackCard className="overflow-hidden border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-violet-50/40 p-0">
        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-900/80">
            Young adults hub
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-night-900">{groupName}</h2>
          <p className="mt-1 text-sm text-night-600">
            Stay connected between gatherings — announcements, Community prayer, events, and devotion.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-night-900/6 bg-white/60 p-3 sm:grid-cols-4">
          {hubTiles.map((tile) =>
            tile.href ? (
              <Link
                key={tile.label}
                href={tile.href}
                className={`${groupsPremium.quickAction} justify-center text-center`}
              >
                {tile.label}
              </Link>
            ) : (
              <button
                key={tile.label}
                type="button"
                onClick={tile.action}
                className={`${groupsPremium.quickAction} justify-center text-center`}
              >
                {tile.label}
              </button>
            ),
          )}
        </div>
      </GroupPremiumStackCard>

      {loading ? (
        <GroupPremiumStackCard>
          <p className="text-sm text-night-500">Loading…</p>
        </GroupPremiumStackCard>
      ) : null}

      {!loading && (
        <>
          <div>
            <GroupPremiumSectionLabel className="mb-2 px-0.5">Pinned announcement</GroupPremiumSectionLabel>
            <GroupPremiumStackCard>
              {canManageAnnouncement && editingAnnouncement ? (
                <div className="space-y-3">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Title"
                    className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm font-semibold"
                  />
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={4}
                    placeholder="What should the group know this week?"
                    className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={saving || !title.trim() || !body.trim()} onClick={() => void saveAnnouncement()}>
                      {saving ? "Saving…" : "Save pin"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingAnnouncement(false);
                        setTitle(announcement?.title ?? "");
                        setBody(announcement?.body ?? "");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : announcement ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className={groupsPremium.cardTitle}>{announcement.title}</p>
                    {canManageAnnouncement ? (
                      <button
                        type="button"
                        onClick={() => setEditingAnnouncement(true)}
                        className="text-xs font-semibold text-violet-700 underline"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 text-sm text-night-800">
                    <RichTextContent text={announcement.body} />
                  </div>
                  <p className="mt-2 text-xs text-night-500">
                    Updated{" "}
                    {new Date(announcement.updatedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {announcement.updatedByName ? ` · ${announcement.updatedByName}` : ""}
                  </p>
                </>
              ) : canManageAnnouncement ? (
                <div>
                  <p className={groupsPremium.cardMeta}>
                    Pin a weekly heads-up (uniforms, meeting spot, guest speaker, etc.).
                  </p>
                  <Button className="mt-3" variant="secondary" onClick={() => setEditingAnnouncement(true)}>
                    Add announcement
                  </Button>
                </div>
              ) : (
                <p className={groupsPremium.cardMeta}>No announcement yet. Check back soon.</p>
              )}
            </GroupPremiumStackCard>
          </div>

          {nextEvent ? (
            <div>
              <GroupPremiumSectionLabel className="mb-2 px-0.5">Next up</GroupPremiumSectionLabel>
              <GroupPremiumStackCard>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className={groupsPremium.cardTitle}>{nextEvent.title}</p>
                    <p className={`${groupsPremium.cardMeta} mt-1`}>{nextEvent.subtitle}</p>
                  </div>
                  <Link href={nextEvent.href} className="text-xs font-semibold text-night-700 underline">
                    Calendar
                  </Link>
                </div>
              </GroupPremiumStackCard>
            </div>
          ) : null}

          {devotion ? (
            <div>
              <GroupPremiumSectionLabel className="mb-2 px-0.5">Verse of the day</GroupPremiumSectionLabel>
              <Link href={devotion.href} className="block">
                <GroupPremiumStackCard className="transition hover:ring-2 hover:ring-violet-200">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Devotion</p>
                  <p className="mt-1 font-display text-lg font-semibold text-night-900">{devotion.title}</p>
                  {devotion.verse ? (
                    <p className="mt-2 line-clamp-3 text-sm italic text-night-700">{devotion.verse}</p>
                  ) : null}
                  <p className="mt-2 text-xs font-semibold text-violet-700">Read today&apos;s devotion →</p>
                </GroupPremiumStackCard>
              </Link>
            </div>
          ) : null}
        </>
      )}

      <GroupDashboardPanel
        groupId={groupId}
        groupName={groupName}
        memberCount={memberCount}
        leaderNames={leaderNames}
        onQuickAction={onQuickAction}
        onSetupRoster={onSetupRoster}
      />

      {message ? <p className="text-sm text-night-600">{message}</p> : null}
    </div>
  );
}
