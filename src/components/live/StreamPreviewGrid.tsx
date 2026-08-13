"use client";

import { useState } from "react";
import type { StreamPreview } from "@/lib/types";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { ExternalLink } from "@/components/ui";
import { canPlayInApp } from "@/lib/live-config";

type StreamPreviewGridProps = {
  previews: StreamPreview[];
  compact?: boolean;
  onSelect?: (preview: StreamPreview) => void;
  activeId?: string;
};

function PreviewCard({
  preview,
  compact,
  active,
  onClick,
}: {
  preview: StreamPreview;
  compact?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl text-left ring-2 transition hover:-translate-y-0.5 hover:shadow-lg ${
        active ? "ring-night-900" : "ring-night-900/10"
      } ${compact ? "w-full" : ""}`}
    >
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className={`relative ${compact ? "aspect-[21/9]" : "aspect-video"} bg-night-900`}>
          <StreamPreviewImage
            preview={preview}
            alt={`${preview.platform} · ${preview.label}`}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-night-950/25 transition hover:bg-night-950/40">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-2xl text-night-900 shadow-lg">
              ▶
            </span>
          </div>
          <span className="absolute left-3 top-3 rounded-full bg-night-950/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            {preview.platform}
          </span>
        </div>
      </button>
      {!compact && (
        <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
          <div>
            <p className="font-semibold text-night-900">{preview.label}</p>
            <p className="text-xs text-night-500">
              {canPlayInApp(preview) ? "Plays in app above" : "Opens on platform"}
            </p>
          </div>
          <ExternalLink
            href={preview.url}
            className="shrink-0 rounded-lg bg-night-900 px-3 py-1.5 text-xs font-semibold text-sand-50 hover:bg-night-800"
          >
            Open ↗
          </ExternalLink>
        </div>
      )}
    </div>
  );
}

export function StreamPreviewGrid({
  previews,
  compact,
  onSelect,
  activeId,
}: StreamPreviewGridProps) {
  return (
    <div className={`grid gap-4 ${compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {previews.map((preview) => (
        <PreviewCard
          key={preview.id}
          preview={preview}
          compact={compact}
          active={activeId === preview.id}
          onClick={() => onSelect?.(preview)}
        />
      ))}
    </div>
  );
}

export function StreamPlayer({
  preview,
  onClose,
}: {
  preview: StreamPreview | null;
  onClose?: () => void;
}) {
  if (!preview) return null;

  return (
    <div className="overflow-hidden rounded-2xl bg-night-950 ring-1 ring-night-900/10">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
        <p className="text-sm font-semibold">
          {preview.platform} · {preview.label}
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-white/70 hover:bg-white/10"
          >
            Close
          </button>
        )}
      </div>
      <LiveStreamPlayer preview={preview} compact />
    </div>
  );
}

export function StreamPreviewSection({
  previews,
  title = "Watch on these platforms",
}: {
  previews: StreamPreview[];
  title?: string;
}) {
  const [active, setActive] = useState<StreamPreview | null>(null);

  return (
    <section className="mb-6">
      <h3 className="mb-3 font-display text-lg font-semibold text-night-900">{title}</h3>
      {active && (
        <div className="mb-4">
          <StreamPlayer preview={active} onClose={() => setActive(null)} />
        </div>
      )}
      <StreamPreviewGrid
        previews={previews}
        activeId={active?.id}
        onSelect={setActive}
      />
    </section>
  );
}
