"use client";

import { useEffect, useState } from "react";
import { useAppShell } from "@/components/app/AppShellContext";
import type { PollView } from "@/lib/poll-types";
import { Button } from "@/components/ui";

function formatClosesAt(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type PollCardProps = {
  poll: PollView;
  onUpdate: (poll: PollView) => void;
  compact?: boolean;
  variant?: "default" | "chat";
};

export function PollCard({ poll, onUpdate, compact = false, variant = "default" }: PollCardProps) {
  const { isMobileApp } = useAppShell();
  const [selected, setSelected] = useState<string[]>(poll.viewerOptionIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hasVoted = poll.viewerOptionIds.length > 0;
  const showResults = hasVoted || poll.isClosed;
  const isChat = variant === "chat";

  useEffect(() => {
    setSelected(poll.viewerOptionIds);
  }, [poll.id, poll.viewerOptionIds.join(",")]);

  function toggleOption(optionId: string) {
    if (showResults || !poll.canVote) return;
    if (poll.allowMultiple) {
      setSelected((current) =>
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      );
      return;
    }
    setSelected([optionId]);
  }

  async function submitVote() {
    if (!selected.length) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "vote",
        pollId: poll.id,
        optionIds: selected,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not submit vote.");
      return;
    }
    onUpdate(data.poll);
  }

  async function shareInGroupChat() {
    if (!poll.targetGroupId) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ensureChatAnnouncements",
        groupId: poll.targetGroupId,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not share in group chat.");
    }
  }

  async function closePoll() {
    if (!window.confirm("Close this poll? Members will no longer be able to vote.")) return;
    setBusy(true);
    setError("");
    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", pollId: poll.id }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not close poll.");
      return;
    }
    onUpdate(data.poll);
  }

  const shellClass = isChat
    ? "rounded-2xl border border-night-900/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[var(--color-surface)]"
    : `overflow-hidden rounded-2xl ring-1 ring-night-900/8 dark:ring-white/10 ${
        isMobileApp ? "mobile-card mobile-premium-surface" : "bg-white dark:bg-[var(--color-surface)]"
      } ${compact ? "p-3.5" : "p-4"}`;

  return (
    <article className={shellClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {!isChat ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-800 dark:bg-violet-950/60 dark:text-violet-200">
                Poll
              </span>
              {poll.targetGroupName ? (
                <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-night-600 dark:bg-night-800 dark:text-sand-300">
                  {poll.targetGroupName}
                </span>
              ) : (
                <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-night-600 dark:bg-night-800 dark:text-sand-300">
                  Church-wide
                </span>
              )}
              {poll.isClosed ? (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-night-400">Closed</span>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Open
                </span>
              )}
            </div>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Group poll
            </p>
          )}
          <h3
            className={`font-display font-bold tracking-tight text-night-900 dark:text-sand-100 ${
              isChat ? "mt-1 text-[0.95rem] leading-snug" : `mt-2 ${compact ? "text-base" : "text-lg"}`
            }`}
          >
            {poll.question}
          </h3>
          {poll.description ? (
            <p className="mt-1.5 text-sm leading-relaxed text-night-600 dark:text-sand-300">{poll.description}</p>
          ) : null}
        </div>
      </div>

      <div className={`${isChat ? "mt-2.5" : "mt-4"} space-y-2`}>
        {poll.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isViewerChoice = poll.viewerOptionIds.includes(option.id);
          const selectable = !showResults && poll.canVote && !busy;

          return (
            <button
              key={option.id}
              type="button"
              disabled={busy || !selectable}
              onClick={() => toggleOption(option.id)}
              className={`relative w-full overflow-hidden rounded-xl border px-3 py-3 text-left transition ${
                showResults
                  ? "border-night-900/8 bg-sand-50/90 dark:border-white/10 dark:bg-night-900/40"
                  : isSelected
                    ? "border-teal-600 bg-teal-50 shadow-sm ring-2 ring-teal-500/30 dark:border-teal-500 dark:bg-teal-950/40"
                    : "border-night-900/10 bg-white hover:border-teal-200 hover:bg-teal-50/40 dark:border-white/10 dark:bg-night-900/20 dark:hover:border-teal-800"
              }`}
            >
              {showResults ? (
                <div
                  className="absolute inset-y-0 left-0 bg-teal-200/70 transition-all dark:bg-teal-800/50"
                  style={{ width: `${option.percent}%` }}
                  aria-hidden
                />
              ) : null}
              <div className="relative flex items-start gap-3">
                {!showResults ? (
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-teal-600 bg-teal-600 text-white dark:border-teal-400 dark:bg-teal-500"
                        : "border-night-300 bg-white dark:border-night-500 dark:bg-night-900"
                    }`}
                    aria-hidden
                  >
                    {isSelected ? (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    ) : poll.allowMultiple ? (
                      <span className="text-[9px] font-bold text-night-400">+</span>
                    ) : null}
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium leading-snug text-night-900 dark:text-sand-100">
                    {option.label}
                  </span>
                  {isViewerChoice ? (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Your vote
                    </span>
                  ) : null}
                </div>
                {showResults ? (
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-night-600 dark:text-sand-300">
                    {option.percent}%
                    <span className="ml-1 font-normal text-night-400">({option.voteCount})</span>
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className={`${isChat ? "mt-2" : "mt-3"} flex flex-wrap items-center justify-between gap-2 text-xs text-night-500 dark:text-sand-400`}>
        <p>
          {poll.voterCount} participant{poll.voterCount === 1 ? "" : "s"}
          {poll.closesAt && !poll.isClosed ? ` · Ends ${formatClosesAt(poll.closesAt)}` : ""}
          {poll.allowMultiple ? " · Pick any that apply" : ""}
        </p>
        {!isChat ? (
          <p className="text-night-400">
            {poll.creatorName} · {new Date(poll.createdAt).toLocaleDateString()}
          </p>
        ) : null}
      </div>

      {!showResults && poll.canVote ? (
        <div className={isChat ? "mt-2" : "mt-3"}>
          <Button
            type="button"
            disabled={busy || selected.length === 0}
            onClick={submitVote}
            className="w-full sm:w-auto"
          >
            {busy ? "Submitting…" : selected.length ? "Submit vote" : "Select an option"}
          </Button>
        </div>
      ) : null}

      {showResults && hasVoted ? (
        <p className="mt-2 text-xs font-medium text-teal-800 dark:text-teal-300">Thanks — your vote is recorded.</p>
      ) : null}

      {poll.canManage && !poll.isClosed && !isChat ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-night-900/5 pt-3 dark:border-white/10">
          {poll.targetGroupId ? (
            <button
              type="button"
              disabled={busy}
              onClick={shareInGroupChat}
              className="text-xs font-semibold text-teal-800 underline dark:text-teal-300"
            >
              Share in group chat
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={closePoll}
            className="text-xs font-semibold text-red-700 underline dark:text-red-300"
          >
            Close poll
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p> : null}
    </article>
  );
}
