"use client";

import { useState } from "react";
import {
  QUICK_CHAT_EMOJIS,
  summarizeChatReactions,
  type ChatMessageReaction,
} from "@/lib/chat-utils";

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
  const [showPicker, setShowPicker] = useState(false);
  const summary = summarizeChatReactions(reactions, currentUserId);

  return (
    <div className={`${compact ? "mt-1" : "mt-2"} flex flex-wrap items-center gap-1`}>
      {summary.map((entry) => (
        <button
          key={entry.emoji}
          type="button"
          title={entry.label}
          onClick={() => onToggle(entry.emoji)}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition ${
            entry.reactedByMe
              ? "bg-[#e7f3ff] text-[#00376b] ring-1 ring-[#3797f0]/35"
              : "bg-white text-[#262626] ring-1 ring-[#dbdbdb] hover:bg-[#fafafa]"
          }`}
        >
          <span>{entry.emoji}</span>
          <span>{entry.count}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => setShowPicker((current) => !current)}
        className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#8e8e8e] ring-1 ring-[#dbdbdb] hover:bg-[#fafafa]"
        aria-label="Add reaction"
      >
        +
      </button>

      {showPicker && (
        <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-[#dbdbdb]">
          {QUICK_CHAT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onToggle(emoji);
                setShowPicker(false);
              }}
              className="rounded-lg px-1.5 py-0.5 text-base hover:bg-[#fafafa]"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
