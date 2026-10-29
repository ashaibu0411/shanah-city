"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoryMusicDiscoveryCandidate } from "@/lib/story-music/story-music-discovery-types";

type DiscoveryPayload = {
  writeEnabled: boolean;
  candidates: StoryMusicDiscoveryCandidate[];
  stats: {
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    licenseAllowed: number;
    licenseRejected: number;
  };
};

const STATUS_FLOW = [
  "discovered",
  "needs_review",
  "rights_verified",
  "audio_tested",
  "approved",
  "published",
] as const;

export function AdminStoryMusicDiscoveryPanel() {
  const [data, setData] = useState<DiscoveryPayload | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("needs_review");

  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/story-music/discovery");
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Could not load discovery queue.");
      return;
    }
    setData(json as DiscoveryPayload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/story-music/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const rows = (data?.candidates ?? []).filter((c) =>
    filter === "all" ? true : c.reviewStatus === filter,
  );

  return (
    <section className="rounded-xl border border-night-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-night-900/40">
      <h2 className="text-sm font-semibold text-night-900 dark:text-sand-100">Free worship discovery queue</h2>
      <p className="mt-1 text-xs text-night-600 dark:text-sand-400">
        Candidates from Openverse, Wikimedia Commons, and Internet Archive (FMA). Metadata only until rights
        verification and audio ingest. Run <code className="text-[10px]">node scripts/story-music-discover-sources.mjs</code>{" "}
        locally to refresh.
      </p>

      {error ? <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}

      {data?.stats ? (
        <p className="mt-2 text-xs text-night-500">
          Total {data.stats.total} · license-ok {data.stats.licenseAllowed} · rejected{" "}
          {data.stats.licenseRejected} · Openverse requires{" "}
          <code className="text-[10px]">OPENVERSE_CLIENT_ID/SECRET</code>
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {["all", ...STATUS_FLOW, "rejected"].map((status) => (
          <button
            key={status}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              filter === status ? "bg-clay-600 text-white" : "bg-sand-100 text-night-700 dark:bg-night-800 dark:text-sand-200"
            }`}
            onClick={() => setFilter(status)}
          >
            {status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
        {rows.slice(0, 80).map((row) => (
          <li key={row.id} className="rounded-lg border border-night-900/8 bg-sand-50/80 p-2 text-xs dark:border-white/10 dark:bg-night-950">
            <p className="font-semibold text-night-900 dark:text-sand-100">
              {row.title} · {row.artist}
            </p>
            <p className="text-night-600 dark:text-sand-400">
              {row.source} · {row.licenseSlug} · {row.reviewStatus}
            </p>
            <a href={row.sourcePageUrl} target="_blank" rel="noopener noreferrer" className="text-clay-800 underline">
              Source page
            </a>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUS_FLOW.filter((s) => s !== row.reviewStatus).slice(0, 3).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busy || !data?.writeEnabled}
                  className="font-semibold text-clay-800 underline disabled:opacity-50"
                  onClick={() =>
                    void postAction({ action: "set_status", candidateId: row.id, status })
                  }
                >
                  → {status.replace(/_/g, " ")}
                </button>
              ))}
              {row.reviewStatus === "approved" ? (
                <button
                  type="button"
                  disabled={busy || !data?.writeEnabled}
                  className="font-semibold text-emerald-800 underline disabled:opacity-50"
                  onClick={() => void postAction({ action: "promote_intake", candidateId: row.id })}
                >
                  Promote to intake draft
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
