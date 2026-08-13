"use client";

import { useState } from "react";
import { useApp } from "@/components/app/AppProvider";
import { MediaClipsGrid } from "@/components/media/MediaClipsGrid";
import {
  StreamPreviewGrid,
} from "@/components/live/StreamPreviewGrid";
import { LiveStreamPlayer } from "@/components/live/LiveStreamPlayer";
import { getCampus, liveStream, site } from "@/lib/site";
import { streamPreviews } from "@/lib/streams";
import type { MediaClip, MediaTab, StreamPreview } from "@/lib/types";
import { Badge, Button, ExternalLink, PageHeader } from "@/components/ui";

type MediaHubProps = {
  clips: MediaClip[];
  browseLinks: Array<{
    id: string;
    label: string;
    url: string;
    platform: string;
  }>;
};

export function MediaHub({ clips, browseLinks }: MediaHubProps) {
  const { campus } = useApp();
  const streamCampus = getCampus(liveStream.campusId);
  const [tab, setTab] = useState<MediaTab>("live");
  const [active, setActive] = useState<StreamPreview | null>(streamPreviews[0]);

  const anyLive =
    liveStream.isLive ||
    liveStream.youtube.isLive ||
    liveStream.facebook.isLive;

  return (
    <>
      <PageHeader
        eyebrow="Media"
        title="Media & Live"
        description="Watch live services, browse short clips, and follow Shanah City on YouTube and Instagram."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["live", "Live"],
            ["clips", "Clips"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-night-900 text-sand-50"
                : "bg-sand-100 text-night-700 hover:bg-sand-200"
            }`}
          >
            {label}
            {key === "clips" && clips.length > 0 ? (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px]">
                {clips.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "live" ? (
        <>
          <div className="overflow-hidden rounded-2xl bg-night-950 shadow-xl ring-1 ring-night-900/10">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                {anyLive ? (
                  <Badge variant="live">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    Live now
                  </Badge>
                ) : (
                  <Badge variant="outline">Next service</Badge>
                )}
              </div>
              <p className="text-sm text-white/70">
                {streamCampus.name} · {campus.city}
              </p>
            </div>

            <div className="aspect-video w-full bg-night-900">
              {active ? <LiveStreamPlayer preview={active} compact /> : null}
            </div>

            <div className="p-5 text-white">
              <h2 className="font-display text-2xl font-semibold">{liveStream.title}</h2>
              <p className="mt-2 text-sm text-white/70">{liveStream.scheduledAt}</p>
            </div>
          </div>

          <section className="mt-6">
            <h3 className="mb-3 font-display text-lg font-semibold text-night-900">
              Choose where to watch
            </h3>
            <div className="mb-4 flex flex-wrap gap-3">
              {streamPreviews.map((preview) => (
                <ExternalLink
                  key={preview.id}
                  href={preview.url}
                  className="inline-flex rounded-xl bg-night-900 px-4 py-2.5 text-sm font-semibold text-sand-50 hover:bg-night-800"
                >
                  {preview.platform} · {preview.label} ↗
                </ExternalLink>
              ))}
            </div>
            <StreamPreviewGrid
              previews={streamPreviews}
              activeId={active?.id}
              onSelect={setActive}
            />
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/community" variant="secondary">
              Live chat & prayer
            </Button>
            <Button href="/give" variant="secondary">
              Give
            </Button>
            <Button variant="secondary" onClick={() => setTab("clips")}>
              Short clips
            </Button>
          </div>
        </>
      ) : (
        <section>
          <h3 className="mb-1 font-display text-lg font-semibold text-night-900">
            Short clips
          </h3>
          <p className="mb-4 text-sm text-night-600">
            Quick worship moments, highlights, and encouragement from Shanah City.
          </p>
          <MediaClipsGrid clips={clips} browseLinks={browseLinks} />
        </section>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-night-900/5">
          <h3 className="font-semibold text-night-900">Facebook</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {site.social.facebook.map((account) => (
              <li key={account.url}>
                <ExternalLink
                  href={account.url}
                  className="font-medium text-night-800 hover:underline"
                >
                  {account.name} →
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-night-900/5">
          <h3 className="font-semibold text-night-900">Instagram</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {site.social.instagram.map((account) => (
              <li key={account.url}>
                <ExternalLink
                  href={account.url}
                  className="font-medium text-night-800 hover:underline"
                >
                  @{account.handle} · {account.name} →
                </ExternalLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
