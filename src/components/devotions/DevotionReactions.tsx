"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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

  const loadReactions = useCallback(async () => {
    const response = await fetch(
      `/api/devotions/reactions?devotionId=${encodeURIComponent(devotionId)}`,
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devotionId, emoji }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not save reaction.");
      return;
    }

    setReactions(data.reactions ?? []);
  }

  return (
    <div className={busy ? "opacity-70" : ""}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-night-500 dark:text-sand-400">
        React
      </p>
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
