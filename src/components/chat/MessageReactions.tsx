"use client";

import { useState } from "react";
import { ChatMessageReactionsSheet } from "@/components/chat/ChatMessageReactionsSheet";
import { summarizeChatReactions, type ChatMessageReaction } from "@/lib/chat-utils";

type MessageReactionsProps = {
  reactions?: ChatMessageReaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
  compact?: boolean;
};

export function MessageReactions({
  reactions,
  currentUserId,
  onToggle,
  compact = false,
}: MessageReactionsProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusEmoji, setFocusEmoji] = useState<string | null>(null);

  const summary = summarizeChatReactions(reactions, currentUserId);
  if (summary.length === 0) return null;

  function openSheet(emoji: string) {
    setFocusEmoji(emoji);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setFocusEmoji(null);
  }

  return (
    <>
      <div className={`${compact ? "mt-1" : "mt-2"} flex flex-wrap items-center gap-1`}>
        {summary.map((entry) => (
          <button
            key={entry.emoji}
            type="button"
            title={entry.label}
            onClick={(event) => {
              event.stopPropagation();
              openSheet(entry.emoji);
            }}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition ${
              entry.reactedByMe
                ? "bg-violet-200 text-violet-900 ring-1 ring-violet-300 dark:bg-violet-500/25 dark:text-violet-100 dark:ring-violet-400/40"
                : "bg-white/80 text-night-700 ring-1 ring-night-900/10 hover:bg-sand-100 dark:bg-[var(--color-bg-muted)] dark:text-sand-200 dark:ring-white/10"
            }`}
            aria-label={`See who reacted with ${entry.emoji}, ${entry.count}`}
          >
            <span>{entry.emoji}</span>
            <span>{entry.count}</span>
          </button>
        ))}
      </div>

      <ChatMessageReactionsSheet
        open={sheetOpen}
        reactions={reactions}
        currentUserId={currentUserId}
        focusEmoji={focusEmoji}
        onClose={closeSheet}
        onToggleReaction={(emoji) => {
          onToggle(emoji);
        }}
      />
    </>
  );
}
