"use client";

import Link from "next/link";
import { getGroupArtwork } from "@/lib/group-artwork";
import type { GroupDetail } from "@/lib/group-types";

type GroupBandHeaderProps = {
  group: GroupDetail;
  showChatAction?: boolean;
  onMembersClick?: () => void;
  onInviteClick?: () => void;
  onChatClick?: () => void;
  joinSlot?: React.ReactNode;
};

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2h.5A1.5 1.5 0 0 1 12.5 8.5v5A1.5 1.5 0 0 1 11 15H5a1.5 1.5 0 0 1-1.5-1.5v-5A1.5 1.5 0 0 1 5 6.5h.5Zm1.5 0h2V5a1 1 0 0 0-2 0v2Z"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6.5 6.75a4.75 4.75 0 0 1 9.5 0h-1.5a3.25 3.25 0 0 0-6.5 0h-1.5Zm8.5-6.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Zm3.25 6.75a4 4 0 0 0-3.8-2.75h-1.47a5.74 5.74 0 0 1 2.27 2.75h3Z"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9A2.5 2.5 0 0 1 17 4.5v6A2.5 2.5 0 0 1 14.5 13H8l-3.5 3v-3H5.5A2.5 2.5 0 0 1 3 10.5v-6Z"
      />
    </svg>
  );
}

export function GroupBandHeader({
  group,
  showChatAction = false,
  onMembersClick,
  onInviteClick,
  onChatClick,
  joinSlot,
}: GroupBandHeaderProps) {
  const artworkUrl = getGroupArtwork(group, "square");
  const leaderName =
    group.members.find((member) => member.isAdmin)?.name ?? group.creatorName;
  const memberLabel = `${group.members.length} Member${group.members.length === 1 ? "" : "s"}`;

  return (
    <header className="border-b border-night-900/8 bg-white px-4 pb-4 pt-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          href="/groups"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-night-700 transition hover:bg-sand-100"
          aria-label="Back to groups"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M11.78 4.22a.75.75 0 0 1 0 1.06L8.06 9l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            />
          </svg>
        </Link>
        <div className="flex items-center gap-1">
          {showChatAction ? (
            <button
              type="button"
              onClick={onChatClick}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-night-700 transition hover:bg-sand-100"
              aria-label="Open group chat"
            >
              <ChatIcon />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artworkUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-night-900/10"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-lg font-bold leading-tight text-night-900">{group.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-night-500">
            <LockIcon />
            <span>{group.visibility === "public" ? "Public" : "Private"}</span>
            <span aria-hidden>·</span>
            <span>Admin {leaderName}</span>
          </p>
        </div>
      </div>

      {joinSlot ? (
        <div className="mt-4">{joinSlot}</div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onMembersClick}
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-sand-100 px-3 py-2.5 text-sm font-semibold text-night-800 transition hover:bg-sand-200/80"
          >
            <PeopleIcon />
            <span className="truncate">{memberLabel}</span>
          </button>
          {onInviteClick ? (
            <button
              type="button"
              onClick={onInviteClick}
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-sand-100 px-3 py-2.5 text-sm font-semibold text-night-800 transition hover:bg-sand-200/80"
            >
              Invite
            </button>
          ) : null}
          {showChatAction ? (
            <button
              type="button"
              onClick={onChatClick}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-night-800 transition hover:bg-sand-200/80"
              aria-label="Open group chat"
            >
              <ChatIcon />
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
}
