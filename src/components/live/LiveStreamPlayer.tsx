"use client";

import type { StreamPreview } from "@/lib/types";
import { LiveVideoPlayer } from "@/components/live/LiveVideoPlayer";
import { StreamPreviewImage } from "@/components/live/StreamPreviewImage";
import { canPlayInApp } from "@/lib/live-config";
import { ExternalLink } from "@/components/ui";

type LiveStreamPlayerProps = {
  preview: StreamPreview;
  subtitle?: string;
  compact?: boolean;
};

export function LiveStreamPlayer({ preview, subtitle, compact }: LiveStreamPlayerProps) {
  const player = canPlayInApp(preview) ? (
    <LiveVideoPlayer preview={preview} />
  ) : (
    <div className="relative aspect-video bg-night-900">
      <StreamPreviewImage preview={preview} alt={preview.label} />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/55 px-6 text-center text-white">
        <p className={`font-display font-semibold ${compact ? "text-xl" : "text-2xl"}`}>
          {preview.label}
        </p>
        <p className="mt-2 max-w-sm text-sm text-white/80">
          {preview.platform === "Facebook"
            ? "On phones, Facebook live often works best in the Facebook app. You can also paste the live video link in .env.local."
            : "Add NEXT_PUBLIC_YOUTUBE_CHANNEL_ID to .env.local to play YouTube here."}
        </p>
        <ExternalLink
          href={preview.url}
          className="mt-5 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-night-900 transition hover:bg-sand-100"
        >
          Watch on {preview.platform}
        </ExternalLink>
      </div>
    </div>
  );

  if (compact) {
    return player;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-night-950 ring-1 ring-night-900/10">
      {player}
      <div className="border-t border-white/10 px-4 py-3 text-white">
        <p className="text-sm font-semibold">
          {preview.platform} · {preview.label}
        </p>
        {subtitle && <p className="mt-1 text-xs text-white/70">{subtitle}</p>}
      </div>
    </div>
  );
}
