"use client";

import { useState } from "react";
import {
  ARTWORK_VARIANTS,
  devotionArtworkField,
  type ArtworkVariant,
} from "@/lib/devotion-artwork";
import type { Devotion } from "@/lib/types";

type ContentArtworkPanelProps = {
  devotionId: string;
  artwork: Pick<Devotion, "artworkSquareUrl" | "artworkWideUrl" | "artworkBannerUrl">;
  onChange: (artwork: Pick<Devotion, "artworkSquareUrl" | "artworkWideUrl" | "artworkBannerUrl">) => void;
  disabled?: boolean;
};

export function ContentArtworkPanel({
  devotionId,
  artwork,
  onChange,
  disabled = false,
}: ContentArtworkPanelProps) {
  const [busyVariant, setBusyVariant] = useState<ArtworkVariant | null>(null);
  const [error, setError] = useState("");

  async function uploadArtwork(variant: ArtworkVariant, file: File | null) {
    if (!file || !devotionId) return;
    setBusyVariant(variant);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("devotionId", devotionId);
    formData.append("variant", variant);

    const response = await fetch("/api/devotions/artwork", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setBusyVariant(null);

    if (!response.ok) {
      setError(data.error ?? "Could not upload artwork.");
      return;
    }

    onChange({
      ...artwork,
      [devotionArtworkField(variant)]: data.url,
    });
  }

  async function removeArtwork(variant: ArtworkVariant) {
    if (!devotionId) return;
    setBusyVariant(variant);
    setError("");

    const response = await fetch("/api/devotions/artwork", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devotionId, variant }),
    });
    const data = await response.json();
    setBusyVariant(null);

    if (!response.ok) {
      setError(data.error ?? "Could not remove artwork.");
      return;
    }

    onChange({
      ...artwork,
      [devotionArtworkField(variant)]: undefined,
    });
  }

  return (
    <div className="rounded-2xl border border-night-900/10 bg-sand-50/70 p-4">
      <p className="text-sm font-semibold text-night-900">Artwork</p>
      <p className="mt-1 text-xs text-night-600">
        Upload square, wide, and banner images for home tiles, devotion cards, and headers.
      </p>

      {!devotionId ? (
        <p className="mt-3 text-xs text-amber-800">
          Save the devotion first, then upload artwork.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {ARTWORK_VARIANTS.map(({ variant, label, hint }) => {
            const field = devotionArtworkField(variant);
            const url = artwork[field];
            return (
              <div
                key={variant}
                className="flex flex-col gap-3 rounded-xl bg-white p-3 ring-1 ring-night-900/8 sm:flex-row sm:items-center"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand-100 ring-1 ring-night-900/8">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-night-400">
                      {label.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-night-900">{label}</p>
                  <p className="text-xs text-night-500">{hint}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-lg bg-night-900 px-3 py-1.5 text-xs font-semibold text-white">
                    {busyVariant === variant ? "Uploading…" : url ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={disabled || busyVariant !== null}
                      onChange={(event) => uploadArtwork(variant, event.target.files?.[0] ?? null)}
                    />
                  </label>
                  {url ? (
                    <button
                      type="button"
                      disabled={disabled || busyVariant !== null}
                      onClick={() => removeArtwork(variant)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error ? <p className="mt-3 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
