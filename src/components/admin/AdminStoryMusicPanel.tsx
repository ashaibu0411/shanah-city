"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoryMusicRightsRecord } from "@/lib/story-music/story-music-rights-types";

type AdminPayload = {
  writeEnabled: boolean;
  records: StoryMusicRightsRecord[];
  catalog: unknown[];
  migrationMappings: unknown[];
  audit: { at: string; action: string; summary: string; actorName?: string }[];
};

export function AdminStoryMusicPanel() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    artist: "",
    title: "",
    recordingOwner: "",
    compositionPublishing: "",
    documentReference: "",
    territory: "Worldwide",
    catalogTrackId: "",
    audioPath: "/story-music/",
  });

  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/story-music");
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Could not load story music admin.");
      return;
    }
    setData(json as AdminPayload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/story-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "Request failed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-night-600 dark:text-sand-400">
        Music rights intake and authorized catalog (pilot). No copyrighted audio without verified intake.
        Writes require <code className="text-xs">STORY_MUSIC_ADMIN_WRITE_ENABLED=1</code> locally.
      </p>

      {error ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      {data ? (
        <p className="text-xs text-night-500">
          Admin write: {data.writeEnabled ? "enabled" : "disabled"} · Catalog tracks: {data.catalog.length} ·
          Intake records: {data.records.length}
        </p>
      ) : null}

      <section className="rounded-xl border border-night-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-night-900/40">
        <h2 className="text-sm font-semibold text-night-900 dark:text-sand-100">New intake (draft)</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["artist", "Artist"],
              ["title", "Song title"],
              ["recordingOwner", "Recording owner"],
              ["compositionPublishing", "Composition / publishing"],
              ["documentReference", "Document reference"],
              ["territory", "Territory"],
              ["catalogTrackId", "Catalog track id (optional)"],
              ["audioPath", "Audio path (/story-music/…)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-xs font-medium text-night-700 dark:text-sand-300">
              {label}
              <input
                className="mt-1 w-full rounded-lg border border-night-900/15 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-night-950"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={busy || !data?.writeEnabled}
          className="mt-3 rounded-lg bg-clay-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() =>
            void postAction("create", {
              ...form,
              streamingPermitted: true,
              storagePermitted: true,
              authorizedUses: "In-app user-generated story background audio",
            })
          }
        >
          Create draft
        </button>
      </section>

      <section className="rounded-xl border border-night-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-night-900/40">
        <h2 className="text-sm font-semibold text-night-900 dark:text-sand-100">Intake queue</h2>
        <ul className="mt-2 space-y-2">
          {(data?.records ?? []).map((record) => (
            <li
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand-50 px-3 py-2 text-sm dark:bg-night-950"
            >
              <span>
                <span className="font-semibold">{record.title}</span> · {record.artist}{" "}
                <span className="text-xs uppercase text-night-500">({record.status})</span>
              </span>
              <span className="flex flex-wrap gap-2">
                {record.status === "draft" ? (
                  <button
                    type="button"
                    disabled={busy || !data?.writeEnabled}
                    className="text-xs font-semibold text-clay-800 underline disabled:opacity-50"
                    onClick={() => void postAction("propose", { recordId: record.id })}
                  >
                    Propose for review
                  </button>
                ) : null}
                {record.status === "proposed" ? (
                  <button
                    type="button"
                    disabled={busy || !data?.writeEnabled}
                    className="text-xs font-semibold text-clay-800 underline disabled:opacity-50"
                    onClick={() => void postAction("verify", { recordId: record.id })}
                  >
                    Mark rights verified
                  </button>
                ) : null}
                {record.status === "rights_verified" ? (
                  <button
                    type="button"
                    disabled={busy || !data?.writeEnabled}
                    className="text-xs font-semibold text-emerald-800 underline disabled:opacity-50"
                    onClick={() => void postAction("publish", { recordId: record.id })}
                  >
                    Publish to catalog
                  </button>
                ) : null}
                {record.status === "published" ? (
                  <button
                    type="button"
                    disabled={busy || !data?.writeEnabled}
                    className="text-xs font-semibold text-red-800 underline disabled:opacity-50"
                    onClick={() => void postAction("revoke", { recordId: record.id, reason: "Admin revoke" })}
                  >
                    Revoke
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-night-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-night-900/40">
        <h2 className="text-sm font-semibold text-night-900 dark:text-sand-100">Recent audit</h2>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-night-600 dark:text-sand-400">
          {(data?.audit ?? []).map((entry, index) => (
            <li key={`${entry.at}-${index}`}>
              {entry.at.slice(0, 19)} · {entry.action} · {entry.summary}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
