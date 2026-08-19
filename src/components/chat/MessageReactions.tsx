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
              ? "bg-violet-200 text-violet-900 ring-1 ring-violet-300"
              : "bg-white/80 text-night-700 ring-1 ring-night-900/10 hover:bg-sand-100"
          }`}
        >
          <span>{entry.emoji}</span>
          <span>{entry.count}</span>
        </button>
      ))}

      <button
        type="button"
        onClick={() => setShowPicker((current) => !current)}
        className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-night-600 ring-1 ring-night-900/10 hover:bg-sand-100"
        aria-label="Add reaction"
      >
        +
      </button>

      {showPicker && (
        <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-night-900/10">
          {QUICK_CHAT_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onToggle(emoji);
                setShowPicker(false);
              }}
              className="rounded-lg px-1.5 py-0.5 text-base hover:bg-sand-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
