"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { CoupleEnrichmentModuleView } from "@/lib/couple-enrichment-types";

type EnrichmentPanelData = {
  canManage: boolean;
  canTrack: boolean;
  modules: CoupleEnrichmentModuleView[];
  completedCount: number;
  totalCount: number;
};

type CoupleEnrichmentPanelProps = {
  groupId: string;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function CoupleEnrichmentPanel({ groupId }: CoupleEnrichmentPanelProps) {
  const [data, setData] = useState<EnrichmentPanelData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function loadPanel() {
    const response = await fetch(
      `/api/groups/couple-enrichment?groupId=${encodeURIComponent(groupId)}`,
    );
    const payload = await response.json();
    if (response.ok) {
      setData(payload as EnrichmentPanelData);
    } else {
      setMessage(payload.error ?? "Could not load growth track.");
    }
  }

  useEffect(() => {
    void loadPanel();
  }, [groupId]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/groups/couple-enrichment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, ...body }),
    });
    const payload = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Could not save.");
      return;
    }
    setData(payload as EnrichmentPanelData);
    if (body.action === "create") {
      setTitle("");
      setDescription("");
    }
    setMessage("Saved.");
  }

  if (!data) {
    return <p className="mt-4 text-sm text-night-600">Loading growth track…</p>;
  }

  const progressPercent =
    data.totalCount > 0 ? Math.round((data.completedCount / data.totalCount) * 100) : 0;

  return (
    <div className="mt-4">
      <p className="text-sm text-night-700">
        Work through enrichment sessions together. Check off each module when your couple completes
        it — progress is shared with your linked spouse.
      </p>

      {data.totalCount > 0 ? (
        <div className="mt-4 rounded-2xl border border-teal-200/80 bg-teal-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-night-900">Your progress</p>
            <p className="text-sm text-night-600">
              {data.completedCount} of {data.totalCount} complete
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {!data.canTrack ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-night-700">
          Link your spouse on{" "}
          <Link href="/profile" className="font-semibold text-night-900 underline-offset-2 hover:underline">
            your profile
          </Link>{" "}
          to track sessions together.
        </div>
      ) : null}

      {data.modules.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-600">
          No growth sessions yet.{data.canManage ? " Add your first module below." : ""}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.modules.map((module) => (
            <li
              key={module.id}
              className="rounded-2xl border border-night-900/10 bg-white p-4 shadow-sm"
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={module.completed}
                  disabled={!data.canTrack || busy}
                  onChange={(event) =>
                    post({
                      action: "toggle",
                      moduleId: module.id,
                      completed: event.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-night-900/20 text-teal-700 focus:ring-teal-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-night-900">{module.title}</span>
                  {module.description ? (
                    <span className="mt-1 block text-sm text-night-600">{module.description}</span>
                  ) : null}
                  {module.completed && module.completedAt ? (
                    <span className="mt-2 block text-xs text-night-500">
                      Completed {formatWhen(module.completedAt)}
                    </span>
                  ) : null}
                </span>
              </label>
              {data.canManage ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => post({ action: "delete", moduleId: module.id })}
                  className="mt-3 text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                >
                  Remove module
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {data.canManage ? (
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
          <p className="text-sm font-semibold text-night-900">Add a growth session</p>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-night-600">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Communication foundations"
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-night-600">Description (optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2 text-sm outline-none ring-night-900/5 focus:ring-2"
            />
          </label>
          <Button
            className="mt-3"
            disabled={busy || !title.trim()}
            onClick={() => post({ action: "create", title, description })}
          >
            {busy ? "Saving…" : "Add session"}
          </Button>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-night-600">{message}</p> : null}
    </div>
  );
}
