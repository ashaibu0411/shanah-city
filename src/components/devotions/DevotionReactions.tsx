"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChatReactionEmojiPicker } from "@/components/chat/ChatReactionEmojiPicker";
import { MessageReactions } from "@/components/chat/MessageReactions";
import type { ChatMessageReaction } from "@/lib/chat-utils";

type DevotionReactionsProps = {
  devotionId: string;
};

export function DevotionReactions({ devotionId }: DevotionReactionsProps) {
  const { user, loading } = useAuth();
  const [reactions, setReactions] = useState<ChatMessageReaction[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadReactions = useCallback(async () => {
    const response = await fetch(
      `/api/devotions/reactions?devotionId=${encodeURIComponent(devotionId)}`,
      { credentials: "include" },
    );
    const data = await response.json();
    if (response.ok) {
      setReactions(data.reactions ?? []);
    }
  }, [devotionId]);

  useEffect(() => {
    void loadReactions();
  }, [loadReactions]);

  async function toggleReaction(emoji: string) {
    if (!user) {
      setStatus("Sign in to react.");
      return;
    }

    setBusy(true);
    setStatus("");
    const response = await fetch("/api/devotions/reactions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devotionId, emoji }),
    });
    const data = await response.json();
    setBusy(false);
    setPickerOpen(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not save reaction.");
      return;
    }

    setReactions(data.reactions ?? []);
  }

  return (
    <div className={`relative ${busy ? "opacity-70" : ""}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-night-500 dark:text-sand-400">
        React
      </p>
      <div className="relative inline-block">
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => {
            if (!user) {
              setStatus("Sign in to react.");
              return;
            }
            setStatus("");
            setPickerOpen((open) => !open);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-sand-100 px-3 py-1.5 text-sm font-semibold text-night-800 ring-1 ring-night-900/10 transition hover:bg-sand-200 dark:bg-[var(--color-bg-muted)] dark:text-sand-100 dark:ring-white/10"
        >
          <span aria-hidden>😊</span>
          {user ? "Add reaction" : "Sign in to react"}
        </button>
        <ChatReactionEmojiPicker
          open={pickerOpen && Boolean(user)}
          onClose={() => setPickerOpen(false)}
          onSelect={(emoji) => void toggleReaction(emoji)}
          align="start"
        />
      </div>
      <MessageReactions
        reactions={reactions}
        currentUserId={user?.id ?? ""}
        onToggle={toggleReaction}
        compact
      />
      {!loading && !user ? (
        <p className="mt-2 text-xs text-night-500 dark:text-sand-400">
          Sign in to add your reaction.
        </p>
      ) : null}
      {status ? (
        <p className="mt-2 text-xs font-medium text-clay-700 dark:text-clay-300">{status}</p>
      ) : null}
    </div>
  );
}
