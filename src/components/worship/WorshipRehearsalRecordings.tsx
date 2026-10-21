"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { WorshipAudioPlayer } from "@/components/worship/WorshipAudioPlayer";
import { choirRecordingsLibraryHref } from "@/lib/choir-recordings-links";
import type { WorshipRehearsalRecording } from "@/lib/worship-types";

type WorshipRehearsalRecordingsProps = {
  serviceDate: string;
  serviceTime: string;
  canManage: boolean;
  userId?: string;
};

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function WorshipRehearsalRecordings({
  serviceDate,
  serviceTime,
  canManage,
  userId,
}: WorshipRehearsalRecordingsProps) {
  const [recordings, setRecordings] = useState<WorshipRehearsalRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRecordings() {
    setLoading(true);
    const response = await fetch(
      `/api/worship/rehearsals?serviceDate=${encodeURIComponent(serviceDate)}&serviceTime=${encodeURIComponent(serviceTime)}`,
    );
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setRecordings(data.recordings ?? []);
      setError(null);
      return;
    }

    setError(data.error ?? "Could not load recordings.");
  }

  useEffect(() => {
    void loadRecordings();
  }, [serviceDate, serviceTime]);

  async function deleteRecording(id: string) {
    const confirmed = window.confirm("Delete this rehearsal recording?");
    if (!confirmed) return;

    const response = await fetch(`/api/worship/rehearsals?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (response.ok) {
      setRecordings((current) => current.filter((entry) => entry.id !== id));
      return;
    }

    setError(data.error ?? "Could not delete recording.");
  }

  const libraryHref = choirRecordingsLibraryHref();
  const recordHref = choirRecordingsLibraryHref(undefined, { tab: "record" });

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-display text-lg font-semibold text-night-900">Recording library</h3>
        <p className="mt-2 text-sm text-night-600">
          Record, upload, and play back rehearsal audio in one place for the whole worship team.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={libraryHref}
            className="inline-flex min-h-[44px] items-center rounded-full bg-night-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Open recordings
          </Link>
          <Link
            href={recordHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-night-900/15 bg-white px-5 py-2 text-sm font-semibold text-night-900"
          >
            Record rehearsal
          </Link>
        </div>
      </Card>

      {recordings.length > 0 ? (
        <Card>
          <h4 className="font-semibold text-night-900">Earlier service uploads</h4>
          <p className="mt-1 text-sm text-night-500">
            These clips were saved to this service before the unified library. New recordings belong
            in the team library above.
          </p>
          {loading ? (
            <p className="mt-3 text-sm text-night-500">Loading…</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {recordings.map((entry) => {
                const canDelete = canManage || entry.recordedBy === userId;
                return (
                  <li key={entry.id} className="rounded-xl border border-night-900/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-night-900">{entry.title}</p>
                        <p className="mt-1 text-xs text-night-500">
                          {entry.recordedByName}
                          {entry.durationSeconds ? ` · ${formatDuration(entry.durationSeconds)}` : ""}
                          {" · "}
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {canDelete ? (
                        <Button variant="secondary" onClick={() => void deleteRecording(entry.id)}>
                          Delete
                        </Button>
                      ) : null}
                    </div>
                    <WorshipAudioPlayer
                      className="mt-3 w-full"
                      src={entry.audioUrl}
                      fileName={entry.fileName}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </Card>
      ) : loading ? (
        <p className="text-sm text-night-500">Loading earlier uploads…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
