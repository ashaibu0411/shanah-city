"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PollView } from "@/lib/poll-types";
import { groupPollDeepLink } from "@/lib/poll-chat-links";
import { PollCard } from "@/components/polls/PollCard";

export function ChatPollEmbed({
  pollId,
  groupId,
  mine,
}: {
  pollId: string;
  groupId: string;
  mine?: boolean;
}) {
  const [poll, setPoll] = useState<PollView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/polls?groupId=${encodeURIComponent(groupId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load poll.");
        const match = (data.polls as PollView[] | undefined)?.find((entry) => entry.id === pollId);
        if (!cancelled) {
          if (match) setPoll(match);
          else setError("This poll is no longer available.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load poll.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pollId, groupId]);

  if (error) {
    return (
      <p className={`mt-2 text-xs ${mine ? "text-white/85" : "text-night-600 dark:text-sand-300"}`}>
        {error}
      </p>
    );
  }

  if (!poll) {
    return (
      <p className={`mt-2 text-xs ${mine ? "text-white/75" : "text-night-500 dark:text-sand-400"}`}>
        Loading poll…
      </p>
    );
  }

  return (
    <div className="mt-2 w-full min-w-[min(100%,18rem)] max-w-sm">
      <PollCard poll={poll} compact variant="chat" onUpdate={setPoll} />
      <Link
        href={groupPollDeepLink(groupId, pollId)}
        className={`mt-2 inline-flex text-[11px] font-semibold underline-offset-2 hover:underline ${
          mine ? "text-white/90" : "text-teal-700 dark:text-teal-300"
        }`}
      >
        Open in Polls tab
      </Link>
    </div>
  );
}
