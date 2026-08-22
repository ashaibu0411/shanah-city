"use client";

import { useState } from "react";
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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full rounded-2xl border border-dashed border-night-900/15 bg-sand-50/80 text-left transition hover:bg-sand-100 ${
          compact ? "px-3.5 py-3" : "px-4 py-4"
        }`}
      >
        <p className="text-sm font-semibold text-night-900">Start a poll</p>
        <p className="mt-1 text-xs text-night-500">
          Ask {scopeLabel} to weigh in on a decision.
        </p>
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl bg-white ring-1 ring-night-900/8 ${compact ? "p-3.5" : "p-4"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold text-night-900">New poll</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-night-500 underline"
        >
          Cancel
        </button>
      </div>

      <label className="mt-3 block text-sm">
        <span className="font-semibold text-night-800">Question</span>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Which service time works best?"
          required
          className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
      </label>

      <label className="mt-3 block text-sm">
        <span className="font-semibold text-night-800">Details (optional)</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Add context for voters..."
          className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
      </label>

      <div className="mt-3 space-y-2">
        <p className="text-sm font-semibold text-night-800">Options</p>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={option}
              onChange={(event) => updateOption(index, event.target.value)}
              placeholder={`Option ${index + 1}`}
              required
              className="min-w-0 flex-1 rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
            {options.length > 2 ? (
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="shrink-0 rounded-xl px-3 text-xs font-semibold text-night-500 hover:bg-sand-100"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
        {options.length < 8 ? (
          <button
            type="button"
            onClick={addOption}
            className="text-xs font-semibold text-night-700 underline"
          >
            Add option
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex items-center gap-2 text-sm text-night-700">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(event) => setAllowMultiple(event.target.checked)}
          />
          Allow multiple choices
        </label>
        <label className="block text-sm sm:ml-auto">
          <span className="font-semibold text-night-800">Close at (optional)</span>
          <input
            type="datetime-local"
            value={closesAt}
            onChange={(event) => setClosesAt(event.target.value)}
            className="mt-1 w-full rounded-xl border border-night-900/10 bg-sand-50 px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Publishing..." : "Publish poll"}
        </Button>
      </div>
    </form>
  );
}
