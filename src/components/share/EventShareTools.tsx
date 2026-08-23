"use client";

import { ContentArtworkPanel } from "@/components/share/ContentArtworkPanel";
import { ShareActions } from "@/components/share/ShareActions";
import type { ArtworkFields } from "@/lib/content-artwork";
import { eventShareUrl, eventViewUrl } from "@/lib/share-urls";
import type { ChurchEvent } from "@/lib/types";

type EventShareToolsProps = {
  event: ChurchEvent;
  onArtworkChange: (artwork: ArtworkFields) => void;
};

export function EventShareTools({ event, onArtworkChange }: EventShareToolsProps) {
  const artwork: ArtworkFields = {
    artworkSquareUrl: event.artworkSquareUrl,
    artworkWideUrl: event.artworkWideUrl,
    artworkBannerUrl: event.artworkBannerUrl,
  };

  return (
    <div className="mt-4 space-y-4 border-t border-night-900/10 pt-4">
      <ContentArtworkPanel
        contentKind="event"
        contentId={event.id}
        artwork={artwork}
        onChange={onArtworkChange}
      />
      <div className="rounded-2xl border border-night-900/10 bg-white p-4">
        <ShareActions
          shareUrl={eventShareUrl(event.id)}
          viewUrl={eventViewUrl(event.id)}
          notifyEnabled
          compact
          onNotify={async () => {
            const response = await fetch("/api/events/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: event.id }),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error ?? "Could not send notification.");
            }
          }}
        />
      </div>
    </div>
  );
}
