"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { GalleryDownloadRecord } from "@/lib/gallery-types";
import { Card } from "@/components/ui";

export function PhotoDownloadLog() {
  const { user, loading } = useAuth();
  const [downloads, setDownloads] = useState<GalleryDownloadRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const canView = user?.role === "team" || user?.role === "leader";

  useEffect(() => {
    if (loading || !canView) return;

    async function load() {
      setFetching(true);
      setError(null);
      const response = await fetch("/api/gallery/downloads");
      const data = await response.json();
      setFetching(false);

      if (!response.ok) {
        setError(data.error ?? "Could not load download log.");
        return;
      }

      setDownloads(data.downloads ?? []);
    }

    load();
  }, [loading, canView]);

  if (loading || !canView) {
    return null;
  }

  return (
    <Card className="mt-8">
      <h2 className="font-display text-xl font-semibold text-night-900">
        Download activity
      </h2>
      <p className="mt-2 text-sm text-night-600">
        Backend team view — who downloaded which photo and when.
      </p>

      {fetching && (
        <p className="mt-4 text-sm text-night-500">Loading download log...</p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!fetching && !error && downloads.length === 0 && (
        <p className="mt-4 text-sm text-night-500">No downloads recorded yet.</p>
      )}

      {!fetching && downloads.length > 0 && (
        <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {downloads.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl bg-sand-50 px-4 py-3 text-sm ring-1 ring-night-900/5"
            >
              <p className="font-semibold text-night-900">{entry.photoTitle}</p>
              <p className="mt-1 text-night-600">
                {entry.userName} · {entry.userEmail}
              </p>
              <p className="mt-1 text-xs text-night-500">
                {new Date(entry.downloadedAt).toLocaleString()}
                {entry.acceptedPolicy ? " · policy accepted" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
