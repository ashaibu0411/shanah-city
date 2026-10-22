"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GroupResourcesPanel } from "@/components/groups/GroupResourcesPanel";
import { chatPremium } from "@/components/chat/chat-premium";
import {
  type ChatParticipantEntry,
  privateMessageHref,
  sortChatParticipants,
} from "@/lib/chat-participants-utils";
import { chatInitials } from "@/lib/chat-ui-utils";
import type { ChurchEvent } from "@/lib/types";

type ChatGroupMembersPanelProps = {
  participants: ChatParticipantEntry[];
  currentUserId: string;
};

export function ChatGroupMembersPanel({ participants, currentUserId }: ChatGroupMembersPanelProps) {
  const [query, setQuery] = useState("");
  const sorted = useMemo(
    () => sortChatParticipants(participants, currentUserId),
    [participants, currentUserId],
  );
  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sorted;
    return sorted.filter((entry) => entry.name.toLowerCase().includes(trimmed));
  }, [query, sorted]);

  return (
    <div className="px-3 py-3">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search members"
        className={chatPremium.sheetSearch}
      />
      <ul className="mt-3 space-y-1">
        {filtered.map((entry) => {
          const isSelf = entry.id === currentUserId;
          return (
            <li key={entry.id} className={chatPremium.sheetRow}>
              <div className={chatPremium.participantAvatar}>{chatInitials(entry.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-night-900 dark:text-sand-100">
                  {entry.name}
                  {isSelf ? (
                    <span className="ml-1.5 text-xs font-medium text-night-500 dark:text-sand-400">
                      (you)
                    </span>
                  ) : null}
                </p>
                {entry.subtitle ? (
                  <p className="truncate text-xs font-medium text-violet-700 dark:text-violet-300">
                    {entry.subtitle}
                  </p>
                ) : null}
              </div>
              {!isSelf ? (
                <Link href={privateMessageHref(entry.id, entry.name)} className={chatPremium.sheetMessageBtn}>
                  Message
                </Link>
              ) : null}
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="px-2 py-8 text-center text-sm text-night-500 dark:text-sand-400">
            No one matches that search.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

type ChatGroupEventsPanelProps = {
  groupId: string;
};

export function ChatGroupEventsPanel({ groupId }: ChatGroupEventsPanelProps) {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/events?groupId=${encodeURIComponent(groupId)}`);
      const data = await response.json();
      if (cancelled) return;
      setLoading(false);
      if (!response.ok) {
        setError(data.error ?? "Could not load events.");
        setEvents([]);
        return;
      }
      setEvents(data.events ?? []);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  if (loading) {
    return <p className="px-4 py-8 text-center text-sm text-night-500 dark:text-sand-400">Loading events…</p>;
  }

  if (error) {
    return <p className="px-4 py-8 text-center text-sm text-red-700 dark:text-red-300">{error}</p>;
  }

  if (events.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-night-500 dark:text-sand-400">
        No upcoming group events yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#E8E2DA] px-3 dark:divide-white/10">
      {events.map((event) => (
        <li key={event.id} className="py-3">
          <p className="text-sm font-semibold text-night-900 dark:text-sand-100">{event.title}</p>
          <p className="mt-0.5 text-xs text-night-600 dark:text-sand-400">
            {[event.date, event.time].filter(Boolean).join(" · ")}
          </p>
          {event.location ? (
            <p className="mt-0.5 text-xs text-night-500 dark:text-sand-500">{event.location}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type ChatGroupFilesPanelProps = {
  groupId: string;
  isLeader: boolean;
};

export function ChatGroupFilesPanel({ groupId, isLeader }: ChatGroupFilesPanelProps) {
  return (
    <div className="px-1 py-2">
      <GroupResourcesPanel groupId={groupId} isLeader={isLeader} />
    </div>
  );
}
