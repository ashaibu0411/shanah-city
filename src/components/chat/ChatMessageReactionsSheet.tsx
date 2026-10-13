"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  currentUserReactedWithEmoji,
  groupChatReactionsByEmoji,
  type ChatMessageReaction,
} from "@/lib/chat-utils";

type ChatMessageReactionsSheetProps = {
  open: boolean;
  reactions?: ChatMessageReaction[];
  currentUserId: string;
  focusEmoji?: string | null;
  onClose: () => void;
  onToggleReaction?: (emoji: string) => void;
};

export function ChatMessageReactionsSheet({
  open,
  reactions,
  currentUserId,
  focusEmoji,
  onClose,
  onToggleReaction,
}: ChatMessageReactionsSheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const groups = groupChatReactionsByEmoji(reactions);
  const entries = [...groups.entries()].sort((a, b) => {
    if (focusEmoji && a[0] === focusEmoji) return -1;
    if (focusEmoji && b[0] === focusEmoji) return 1;
    return b[1].length - a[1].length;
  });

  return createPortal(
    <div className="community-post-reactions-overlay" role="presentation" onClick={onClose}>
      <div
        className="community-story-insights-sheet"
        role="dialog"
        aria-labelledby="message-reactions-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="community-story-insights-header">
          <h2 id="message-reactions-title" className="community-story-insights-title">
            Reactions
          </h2>
          <button type="button" onClick={onClose} className="community-story-insights-close">
            Close
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="community-story-insights-status">No reactions yet.</p>
        ) : (
          <div className="community-story-insights-body">
            {entries.map(([emoji, rows]) => {
              const reactedByMe = currentUserReactedWithEmoji(reactions, currentUserId, emoji);
              return (
                <section key={emoji} className="community-story-insights-section">
                  <h3 className="community-story-insights-section-title">
                    <span aria-hidden>{emoji}</span>
                    <span className="community-story-insights-section-count">{rows.length}</span>
                  </h3>
                  <ul className="community-story-insights-list">
                    {rows.map((row) => (
                      <li key={`${row.userId}-${row.emoji}`}>
                        <span className="community-story-insights-name">{row.userName}</span>
                      </li>
                    ))}
                  </ul>
                  {onToggleReaction && currentUserId ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-clay-700 underline dark:text-clay-300"
                      onClick={() => onToggleReaction(emoji)}
                    >
                      {reactedByMe ? `Remove your ${emoji} reaction` : `React with ${emoji}`}
                    </button>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
