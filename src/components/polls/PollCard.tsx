"use client";

import { useState } from "react";
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
};

export function PollCard({ poll, onUpdate, compact = false }: PollCardProps) {
  const [selected, setSelected] = useState<string[]>(poll.viewerOptionIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hasVoted = poll.viewerOptionIds.length > 0;
  const showResults = hasVoted || poll.isClosed;

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

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white ring-1 ring-night-900/8 ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-800">
              Poll
            </span>
            {poll.targetGroupName ? (
              <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-night-600">
                {poll.targetGroupName}
              </span>
            ) : (
              <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-night-600">
                Church-wide
              </span>
            )}
            {poll.isClosed ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-night-400">
                Closed
              </span>
            ) : null}
          </div>
          <h3 className={`mt-2 font-display font-bold tracking-tight text-night-900 ${compact ? "text-base" : "text-lg"}`}>
            {poll.question}
          </h3>
          {poll.description ? (
            <p className="mt-1 text-sm leading-relaxed text-night-600">{poll.description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isViewerChoice = poll.viewerOptionIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={busy || showResults || !poll.canVote}
              onClick={() => toggleOption(option.id)}
              className={`relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition ${
                showResults
                  ? "border-night-900/8 bg-sand-50"
                  : isSelected
                    ? "border-night-900 bg-night-900 text-white"
                    : "border-night-900/10 bg-white hover:bg-sand-50"
              }`}
            >
              {showResults ? (
                <div
                  className="absolute inset-y-0 left-0 bg-indigo-100/80 transition-all"
                  style={{ width: `${option.percent}%` }}
                  aria-hidden
                />
              ) : null}
              <div className="relative flex items-center justify-between gap-3">
                <span
                  className={`text-sm font-medium ${
                    showResults ? "text-night-900" : isSelected ? "text-white" : "text-night-800"
                  }`}
                >
                  {option.label}
                  {isViewerChoice ? (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      Your vote
                    </span>
                  ) : null}
                </span>
                {showResults ? (
                  <span className="shrink-0 text-xs font-semibold text-night-600">
                    {option.percent}% · {option.voteCount}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-night-500">
          {poll.voterCount} voter{poll.voterCount === 1 ? "" : "s"}
          {poll.closesAt && !poll.isClosed
            ? ` · Closes ${formatClosesAt(poll.closesAt)}`
            : ""}
          {poll.allowMultiple ? " · Multiple choices" : ""}
        </p>
        <p className="text-xs text-night-400">
          {poll.creatorName} · {new Date(poll.createdAt).toLocaleDateString()}
        </p>
      </div>

      {!showResults && poll.canVote ? (
        <div className="mt-3">
          <Button
            type="button"
            disabled={busy || selected.length === 0}
            onClick={submitVote}
            className="w-full sm:w-auto"
          >
            {busy ? "Submitting..." : "Submit vote"}
          </Button>
        </div>
      ) : null}

      {poll.canManage && !poll.isClosed ? (
        <div className="mt-3 border-t border-night-900/5 pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={closePoll}
            className="text-xs font-semibold text-red-700 underline"
          >
            Close poll
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </article>
  );
}
