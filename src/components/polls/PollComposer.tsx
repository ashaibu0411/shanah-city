"use client";

import { useState } from "react";
import { useAppShell } from "@/components/app/AppShellContext";
import type { PollView } from "@/lib/poll-types";
import { Button } from "@/components/ui";

type PollComposerProps = {
  scopeLabel: string;
  targetGroupId?: string;
  targetGroupName?: string;
  onCreated: (poll: PollView) => void;
  compact?: boolean;
};

export function PollComposer({
  scopeLabel,
  targetGroupId,
  targetGroupName,
  onCreated,
  compact = false,
}: PollComposerProps) {
  const { isMobileApp } = useAppShell();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function updateOption(index: number, value: string) {
    setOptions((current) => current.map((entry, i) => (i === index ? value : entry)));
  }

  function addOption() {
    setOptions((current) => (current.length >= 8 ? current : [...current, ""]));
  }

  function removeOption(index: number) {
    setOptions((current) => (current.length <= 2 ? current : current.filter((_, i) => i !== index)));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        question,
        description,
        options,
        allowMultiple,
        closesAt: closesAt || undefined,
        targetGroupId,
        targetGroupName,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not create poll.");
      return;
    }

    onCreated(data.poll);
    setQuestion("");
    setDescription("");
    setOptions(["", ""]);
    setAllowMultiple(false);
    setClosesAt("");
    setOpen(false);
  }

  const filledOptions = options.filter((entry) => entry.trim()).length;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group w-full rounded-2xl border border-dashed text-left transition ${
          isMobileApp
            ? "mobile-card mobile-premium-surface border-violet-200/70 hover:border-violet-300"
            : "border-violet-200/80 bg-gradient-to-br from-violet-50/80 to-white hover:border-violet-300 hover:from-violet-50 dark:border-violet-800/50 dark:from-violet-950/30 dark:to-[var(--color-surface)]"
        } ${compact ? "px-3.5 py-3" : "px-4 py-4"}`}
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-night-900 dark:text-sand-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-base dark:bg-violet-900/50">
            📊
          </span>
          Create a poll
        </p>
        <p className="mt-1.5 pl-10 text-xs leading-relaxed text-night-600 dark:text-sand-400">
          Ask {scopeLabel} to weigh in. Members get a group chat alert and can vote here or in chat.
        </p>
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl ring-1 ring-night-900/8 dark:ring-white/10 ${
        isMobileApp ? "mobile-card mobile-premium-surface" : "bg-white dark:bg-[var(--color-surface)]"
      } ${compact ? "p-3.5" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold text-night-900 dark:text-sand-100">New poll</h3>
          <p className="mt-0.5 text-xs text-night-500 dark:text-sand-400">
            {targetGroupName ? `For ${targetGroupName}` : "Church-wide"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-2 py-1 text-xs font-semibold text-night-500 hover:bg-sand-100 dark:hover:bg-night-800"
        >
          Cancel
        </button>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-bold uppercase tracking-wide text-night-500 dark:text-sand-400">
          Question
        </span>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Which service time works best for the team?"
          required
          className="mt-1.5 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-3 text-sm text-night-900 outline-none ring-night-900/5 focus:ring-2 dark:border-white/10 dark:bg-night-900/40 dark:text-sand-100"
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-wide text-night-500 dark:text-sand-400">
          Context (optional)
        </span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Share why you are asking or what you will do with the results."
          className="mt-1.5 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-3 text-sm text-night-900 outline-none ring-night-900/5 focus:ring-2 dark:border-white/10 dark:bg-night-900/40 dark:text-sand-100"
        />
      </label>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-night-500 dark:text-sand-400">Choices</p>
          <p className="text-[11px] text-night-400">{filledOptions} of {options.length}</p>
        </div>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <span
              className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200"
              aria-hidden
            >
              {index + 1}
            </span>
            <input
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
              required
              className="min-w-0 flex-1 rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-night-900/40 dark:text-sand-100"
            />
            {options.length > 2 ? (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="shrink-0 rounded-xl px-2 text-xs font-semibold text-night-500 hover:bg-sand-100 dark:hover:bg-night-800"
                aria-label={`Remove option ${index + 1}`}
              >
                ✕
              </button>
            ) : null}
          </div>
        ))}
        {options.length < 8 ? (
          <button
            type="button"
            onClick={addOption}
            className="ml-8 text-xs font-semibold text-violet-800 underline dark:text-violet-300"
          >
            + Add another option
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-2 rounded-xl bg-sand-50 px-3 py-2.5 text-sm text-night-700 dark:bg-night-900/30 dark:text-sand-200">
          <input
            type="checkbox"
            className="mt-1"
            checked={allowMultiple}
            onChange={(event) => setAllowMultiple(event.target.checked)}
          />
          <span>
            <span className="font-semibold">Allow multiple answers</span>
            <span className="mt-0.5 block text-xs text-night-500 dark:text-sand-400">
              Good for availability or &quot;select all that apply&quot;
            </span>
          </span>
        </label>
        <label className="block text-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-night-500 dark:text-sand-400">
            Auto-close (optional)
          </span>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(event) => setClosesAt(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-night-900/40 dark:text-sand-100"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy
            ? "Publishing…"
            : targetGroupId
              ? "Publish & notify group"
              : "Publish poll"}
        </Button>
        {targetGroupId ? (
          <p className="text-xs text-night-500 dark:text-sand-400">
            Appears in Polls and group chat for members.
          </p>
        ) : null}
      </div>
    </form>
  );
}
