"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GroupChatPanel } from "@/components/groups/GroupChatPanel";
import { PollsSection } from "@/components/polls/PollsSection";
import { ChoirAnnouncementComposer } from "@/components/groups/choir/announcements/ChoirAnnouncementComposer";
import { ChoirSetlistHeader } from "@/components/groups/choir/setlist/ChoirSetlistHeader";
import { ChoirConnectTabs } from "@/components/groups/choir/connect/ChoirConnectTabs";
import { PollCard } from "@/components/polls/PollCard";
import { CHOIR_HERO_IMAGE_PATH, SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { choirConnectHref } from "@/lib/choir-connect-links";
import type { ChoirConnectHomePayload, ChoirConnectTabId } from "@/lib/choir-connect-types";
import type { ChoirAnnouncementFeedItem } from "@/lib/choir-announcements-types";
import "../choir-premium.css";

type ChoirTeamConnectPageProps = {
  groupId: string;
};

function parseTab(value: string | null): ChoirConnectTabId {
  if (value === "chat" || value === "announcements" || value === "polls") return value;
  return "home";
}

const CATEGORY_LABEL: Record<string, string> = {
  general: "General",
  urgent: "Urgent",
  rehearsal: "Rehearsal",
  service: "Service",
  training: "Training",
};

function formatRelative(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function ChoirTeamConnectPage({ groupId }: ChoirTeamConnectPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [payload, setPayload] = useState<ChoirConnectHomePayload | null>(null);
  const [announcements, setAnnouncements] = useState<ChoirAnnouncementFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/groups/choir-connect?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.payload) {
          setError(data.error ?? "Could not load Team Connect.");
          setPayload(null);
        } else {
          setPayload(data.payload);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load Team Connect.");
        setLoading(false);
      });
  }, [groupId]);

  const loadAnnouncements = useCallback(() => {
    fetch(`/api/groups/choir-announcements?groupId=${encodeURIComponent(groupId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.payload?.announcements) {
          setAnnouncements(data.payload.announcements.filter((row: ChoirAnnouncementFeedItem) => !row.isSample));
        }
      })
      .catch(() => undefined);
  }, [groupId]);

  useEffect(() => {
    load();
    if (tab === "announcements") loadAnnouncements();
    window.scrollTo(0, 0);
  }, [load, loadAnnouncements, tab]);

  const chatHref = payload?.groupChatHref ?? `/groups/${encodeURIComponent(groupId)}?chat=1`;

  if (loading && !payload) {
    return (
      <div className="choir-group-home choir-connect-page px-4 py-3">
        <p className="text-sm text-[var(--choir-muted)]">Loading Team Connect…</p>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="choir-group-home choir-connect-page px-4 py-3">
        <p className="text-sm text-red-700">{error ?? "Unavailable."}</p>
        <button type="button" className="choir-setlist-manage-link mt-3" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (tab === "chat") {
    const ctx = payload.chatContext;
    return (
      <GroupChatPanel
        groupId={ctx.groupId}
        groupName={ctx.groupName}
        groupCategory={ctx.groupCategory}
        groupIconUrl={ctx.groupIconUrl}
        groupUpdatedAt={ctx.groupUpdatedAt}
        userId={ctx.userId}
        memberCount={ctx.memberCount}
        participants={ctx.participants}
        onBack={() => router.push(choirConnectHref(groupId, "home"))}
      />
    );
  }

  return (
    <div className="choir-group-home choir-connect-page choir-calendar-page choir-page-shell space-y-[18px] pb-10">
      <ChoirSetlistHeader groupId={groupId} chatHref={chatHref} />
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--choir-heading)]">Team connect</h1>
        <p className="mt-1 text-sm text-[var(--choir-muted)]">Stay connected with your worship family.</p>
      </div>
      <ChoirConnectTabs groupId={groupId} active={tab} />

      {tab === "home" ? (
        <TeamConnectHomeView payload={payload} groupId={groupId} onPollUpdate={load} />
      ) : null}

      {tab === "announcements" ? (
        <TeamConnectAnnouncementsView
          groupId={groupId}
          announcements={announcements.length > 0 ? announcements : payload.announcements}
          canManage={payload.canManageCommunication}
          onReload={() => {
            loadAnnouncements();
            load();
          }}
        />
      ) : null}

      {tab === "polls" ? (
        <div className="space-y-4">
          <PollsSection
            groupId={groupId}
            groupName={payload.groupName}
            title="Team polls"
            compact={false}
            showComposer={payload.canManageCommunication}
          />
        </div>
      ) : null}

      {tab === "home" ? (
        <Link
          href={choirConnectHref(groupId, payload.canManageCommunication ? "announcements" : "chat")}
          className="choir-connect-create-btn"
        >
          <span aria-hidden>+</span> Create a post <span aria-hidden>→</span>
        </Link>
      ) : null}

      {payload.canManageCommunication ? (
        <Link href={payload.manageAnnouncementsHref} className="choir-setlist-manage-link block text-center">
          Manage team communication →
        </Link>
      ) : null}
    </div>
  );
}

function TeamConnectHomeView({
  payload,
  groupId,
  onPollUpdate,
}: {
  payload: ChoirConnectHomePayload;
  groupId: string;
  onPollUpdate: () => void;
}) {
  const tiles = [
    {
      key: "chat",
      title: "Group chat",
      subtitle: "Chat with the team",
      href: choirConnectHref(groupId, "chat"),
      icon: "💬",
      badge: payload.chatPreview?.unreadCount,
    },
    {
      key: "announcements",
      title: "Announcements",
      subtitle: "Latest updates",
      href: choirConnectHref(groupId, "announcements"),
      icon: "📣",
    },
    {
      key: "polls",
      title: "Polls",
      subtitle: "Share your input",
      href: choirConnectHref(groupId, "polls"),
      icon: "📊",
    },
    {
      key: "pinned",
      title: "Pinned messages",
      subtitle: "Important info",
      href: choirConnectHref(groupId, "announcements"),
      icon: "📌",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="choir-calendar-hero choir-page-bleed">
        <Image src={CHOIR_HERO_IMAGE_PATH} alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="choir-calendar-hero-overlay" />
        <div className="choir-calendar-hero-copy">
          <p className="choir-calendar-hero-kicker">Team connect</p>
          <h2 className="choir-calendar-hero-title font-display">Together We Build.</h2>
          <p className="choir-calendar-hero-sub">Stay connected. Share. Encourage. Grow together.</p>
        </div>
      </div>

      <div className="choir-connect-quick-grid">
        {tiles.map((tile) => (
          <Link key={tile.key} href={tile.href} className="choir-connect-quick-tile">
            <span className="choir-connect-quick-icon" aria-hidden>{tile.icon}</span>
            <p className="choir-connect-quick-title">{tile.title}</p>
            <p className="choir-connect-quick-sub">{tile.subtitle}</p>
            {tile.badge && tile.badge > 0 ? (
              <span className="choir-connect-quick-badge">{tile.badge}</span>
            ) : null}
            <span className="choir-connect-quick-chevron" aria-hidden>›</span>
          </Link>
        ))}
      </div>

      <section aria-labelledby="choir-connect-activity">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="choir-connect-activity" className="choir-section-heading text-base">Latest activity</h2>
        </div>
        {payload.chatPreview ? (
          <div className="choir-card p-4">
            <p className="text-xs font-bold text-[var(--choir-gold-dark)]">Choir group chat</p>
            <p className="mt-1 font-bold text-[var(--choir-heading)]">{payload.chatPreview.senderName}</p>
            <p className="mt-1 text-sm text-[var(--choir-body)]">{payload.chatPreview.body}</p>
            <p className="mt-1 text-xs text-[var(--choir-muted)]">
              {formatRelative(payload.chatPreview.createdAt)}
              {payload.chatPreview.unreadCount > 0
                ? ` · ${payload.chatPreview.unreadCount} new message${payload.chatPreview.unreadCount === 1 ? "" : "s"}`
                : ""}
            </p>
            <Link href={choirConnectHref(groupId, "chat")} className="choir-connect-open-chat-btn mt-3 inline-flex">
              Open chat <span aria-hidden>›</span>
            </Link>
          </div>
        ) : (
          <div className="choir-card p-4 text-sm text-[var(--choir-muted)]">
            No messages yet. Be the first to encourage the team in group chat.
            <Link href={choirConnectHref(groupId, "chat")} className="choir-setlist-manage-link mt-2 block">
              Open group chat →
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="choir-connect-pinned">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="choir-connect-pinned" className="choir-section-heading text-base">Pinned for the team</h2>
          <Link href={payload.announcementsHref} className="text-xs font-bold text-[var(--choir-gold-dark)]">
            See all
          </Link>
        </div>
        <div className="choir-connect-pinned-row">
          {payload.pinned.map((item) => (
            <Link key={item.id} href={item.href} className="choir-connect-pinned-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imagePath ?? CHOIR_HERO_IMAGE_PATH} alt="" className="choir-connect-pinned-thumb" />
              <p className="choir-connect-pinned-title">{item.title}</p>
              <p className="choir-connect-pinned-sub">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="choir-connect-announcements">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="choir-connect-announcements" className="choir-section-heading text-base">Latest announcements</h2>
          <Link href={payload.announcementsHref} className="text-xs font-bold text-[var(--choir-gold-dark)]">
            See all
          </Link>
        </div>
        {payload.announcements.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No official announcements yet.</p>
        ) : (
          <ul className="space-y-2">
            {payload.announcements.map((item) => (
              <li key={item.id}>
                <AnnouncementPreviewCard item={item} href={payload.announcementsHref} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="choir-connect-polls">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 id="choir-connect-polls" className="choir-section-heading text-base">Active polls</h2>
          <Link href={payload.pollsHref} className="text-xs font-bold text-[var(--choir-gold-dark)]">
            See all
          </Link>
        </div>
        {payload.polls.length === 0 ? (
          <p className="text-sm text-[var(--choir-muted)]">No active polls right now.</p>
        ) : (
          <ul className="space-y-3">
            {payload.polls.map((poll) => (
              <li key={poll.id}>
                <PollCard poll={poll} compact onUpdate={() => onPollUpdate()} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AnnouncementPreviewCard({ item, href }: { item: ChoirAnnouncementFeedItem; href: string }) {
  return (
    <Link href={`${href}#announcement-${item.id}`} className="choir-connect-announcement-card">
      {item.imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imagePath} alt="" className="choir-connect-announcement-thumb" />
      ) : null}
      <div className="min-w-0 flex-1">
        <span className={`choir-connect-category choir-connect-category-${item.category}`}>
          {CATEGORY_LABEL[item.category] ?? item.category}
        </span>
        <p className="choir-connect-announcement-title">{item.title}</p>
        <p className="choir-connect-announcement-meta">
          {item.authorName} · {formatRelative(item.createdAt)}
        </p>
        <p className="choir-connect-announcement-excerpt">{item.excerpt}</p>
      </div>
    </Link>
  );
}

function TeamConnectAnnouncementsView({
  groupId,
  announcements,
  canManage,
  onReload,
}: {
  groupId: string;
  announcements: ChoirAnnouncementFeedItem[];
  canManage: boolean;
  onReload: () => void;
}) {
  async function togglePin(id: string, pinned: boolean) {
    await fetch("/api/groups/choir-announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pin", groupId: SHANAH_WORSHIP_GROUP_ID, id, pinned }),
    });
    onReload();
  }

  return (
    <div className="space-y-4">
      {canManage ? <ChoirAnnouncementComposer onCreated={() => onReload()} /> : null}
      {announcements.length === 0 ? (
        <div className="choir-card p-4 text-sm text-[var(--choir-muted)]">No announcements yet.</div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((item) => (
            <li key={item.id} id={`announcement-${item.id}`} className="choir-card scroll-mt-24 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className={`choir-connect-category choir-connect-category-${item.category}`}>
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </span>
                  <h3 className="mt-1 font-display text-lg font-bold text-[var(--choir-heading)]">{item.title}</h3>
                  <p className="text-xs text-[var(--choir-muted)]">
                    {item.authorName} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                {canManage ? (
                  <button
                    type="button"
                    className="text-xs font-bold text-[var(--choir-gold-dark)]"
                    onClick={() => togglePin(item.id, !item.pinned)}
                  >
                    {item.pinned ? "Unpin" : "Pin"}
                  </button>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--choir-body)]">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
