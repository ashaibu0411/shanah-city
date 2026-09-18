"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_REACTION_EMOJI_CATEGORIES } from "@/lib/chat-reaction-emoji-data";

type ChatReactionEmojiPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  align?: "start" | "end";
};

export function ChatReactionEmojiPicker({
  open,
  onClose,
  onSelect,
  align = "start",
}: ChatReactionEmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [categoryId, setCategoryId] = useState(CHAT_REACTION_EMOJI_CATEGORIES[0]?.id ?? "smileys");

  const activeCategory =
    CHAT_REACTION_EMOJI_CATEGORIES.find((entry) => entry.id === categoryId) ??
    CHAT_REACTION_EMOJI_CATEGORIES[0];

  const visibleEmojis = activeCategory?.emojis ?? [];

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (panelRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={`absolute z-20 mb-1 w-[min(100vw-2rem,18rem)] rounded-2xl border border-night-900/10 bg-white shadow-xl dark:border-white/10 dark:bg-[var(--color-surface)] ${
        align === "end" ? "bottom-full right-0" : "bottom-full left-0"
      }`}
      role="dialog"
      aria-label="Choose a reaction"
    >
      <div className="flex gap-1 overflow-x-auto border-b border-night-900/8 px-2 py-1.5 dark:border-white/10">
        {CHAT_REACTION_EMOJI_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setCategoryId(category.id)}
            className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
              category.id === categoryId
                ? "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200"
                : "text-night-600 hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-white/5"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid max-h-52 grid-cols-8 gap-0.5 overflow-y-auto p-2">
        {visibleEmojis.map((emoji) => (
          <button
            key={`${categoryId}-${emoji}`}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-sand-100 dark:hover:bg-white/10"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
