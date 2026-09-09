"use client";

import Link from "next/link";
import { getGroupArtwork } from "@/lib/group-artwork";
import { groupsPremium } from "@/components/groups/groups-premium";
import type { GroupDetail } from "@/lib/group-types";

type GroupBandHeaderProps = {
  group: GroupDetail;
  showChatAction?: boolean;
  onMembersClick?: () => void;
  onInviteClick?: () => void;
  onChatClick?: () => void;
  joinSlot?: React.ReactNode;
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

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9A2.5 2.5 0 0 1 17 4.5v6A2.5 2.5 0 0 1 14.5 13H8l-3.5 3v-3H5.5A2.5 2.5 0 0 1 3 10.5v-6Z"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      <path
        fill="currentColor"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-11.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-1.25 3.5a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5Z"
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
  const memberLabel = `${group.members.length} member${group.members.length === 1 ? "" : "s"}`;

  return (
    <header className="px-4 pb-2 pt-2">
      <div className="relative flex items-center justify-center py-1">
        <Link
          href="/groups"
          className={`${groupsPremium.headerIconButton} absolute left-0`}
          aria-label="Back to groups"
        >
          <BackIcon />
        </Link>
        <h1 className={`${groupsPremium.headerTitle} max-w-[60%]`}>{group.name}</h1>
        <div className="absolute right-0 flex items-center gap-1">
          {showChatAction ? (
            <button
              type="button"
              onClick={onChatClick}
              className={groupsPremium.headerIconButton}
              aria-label="Open group chat"
            >
              <ChatIcon />
            </button>
          ) : (
            <button
              type="button"
              onClick={onMembersClick}
              className={groupsPremium.headerIconButton}
              aria-label="Group info"
            >
              <InfoIcon />
            </button>
          )}
        </div>
      </div>

      {joinSlot ? (
        <div className="mt-3">{joinSlot}</div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onMembersClick} className={groupsPremium.quickAction}>
            {memberLabel}
          </button>
          {onInviteClick ? (
            <button type="button" onClick={onInviteClick} className={groupsPremium.quickAction}>
              Invite
            </button>
          ) : null}
          {showChatAction ? (
            <button
              type="button"
              onClick={onChatClick}
              className={`${groupsPremium.quickAction} max-w-[5.5rem]`}
            >
              Chat
            </button>
          ) : null}
        </div>
      )}

      <div className="sr-only">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artworkUrl} alt="" />
      </div>
    </header>
  );
}
