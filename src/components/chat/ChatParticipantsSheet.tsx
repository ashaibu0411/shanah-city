"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  type ChatParticipantEntry,
  privateMessageHref,
  sortChatParticipants,
} from "@/lib/chat-participants-utils";
import { chatInitials } from "@/lib/chat-ui-utils";
import { chatPremium } from "@/components/chat/chat-premium";

type ChatParticipantsSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  participants: ChatParticipantEntry[];
  currentUserId: string;
};

export function ChatParticipantsSheet({
  open,
  onClose,
  title,
  participants,
  currentUserId,
}: ChatParticipantsSheetProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const sorted = useMemo(
    () => sortChatParticipants(participants, currentUserId),
    [participants, currentUserId],
  );

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sorted;
    return sorted.filter((entry) => entry.name.toLowerCase().includes(trimmed));
  }, [query, sorted]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button type="button" className={chatPremium.sheetBackdrop} aria-label="Close participants" onClick={onClose} />
      <div role="dialog" aria-labelledby="chat-participants-title" className={chatPremium.sheetPanel}>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-night-900/15 sm:hidden dark:bg-white/20" />
        <div className={chatPremium.sheetHeader}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="chat-participants-title" className="font-display text-lg font-semibold tracking-tight text-night-950 dark:text-sand-50">
                {title}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-night-500 dark:text-sand-400">
                {participants.length} people · Message privately anytime
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2.5 py-1 text-sm font-semibold text-night-500 hover:bg-sand-100 dark:text-sand-400 dark:hover:bg-white/5"
            >
              Done
            </button>
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name"
            className={chatPremium.sheetSearch}
          />
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2 pb-6">
          {filtered.map((entry) => {
            const isSelf = entry.id === currentUserId;
            return (
              <li key={entry.id} className={chatPremium.sheetRow}>
                <div className={chatPremium.participantAvatar}>{chatInitials(entry.name)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-night-900 dark:text-sand-100">
                    {entry.name}
                    {isSelf ? (
                      <span className="ml-1.5 text-xs font-medium text-night-500 dark:text-sand-400">(you)</span>
                    ) : null}
                  </p>
                  {entry.subtitle ? (
                    <p className="truncate text-xs font-medium text-violet-700 dark:text-violet-300">{entry.subtitle}</p>
                  ) : null}
                </div>
                {!isSelf ? (
                  <Link href={privateMessageHref(entry.id, entry.name)} onClick={onClose} className={chatPremium.sheetMessageBtn}>
                    Message
                  </Link>
                ) : null}
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-night-500 dark:text-sand-400">No one matches that search.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
