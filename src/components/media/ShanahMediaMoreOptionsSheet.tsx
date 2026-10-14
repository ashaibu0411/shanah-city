"use client";

import { useEffect, useRef } from "react";
import { SHANAH_MEDIA_SPEEDS } from "@/lib/shanah-media-types";
import {
  getShanahMediaCapabilities,
  switchToAudioUnavailableMessage,
} from "@/lib/shanah-media-capabilities";
import type { ShanahMediaItem, ShanahMediaPlaybackMode, ShanahMediaSpeed } from "@/lib/shanah-media-types";

type ShanahMediaMoreOptionsSheetProps = {
  open: boolean;
  onClose: () => void;
  item: ShanahMediaItem;
  playbackMode: ShanahMediaPlaybackMode;
  playbackRate: ShanahMediaSpeed;
  onSetPlaybackRate: (rate: ShanahMediaSpeed) => void;
  onSwitchToAudio: () => void;
  onSwitchToVideo: () => void;
  onCast: () => void;
  onPictureInPicture: () => void;
  onShare: () => void;
  onStop: () => void;
  queue: ShanahMediaItem[];
  onNextInQueue: () => void;
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
  castBusy?: boolean;
};

function IconHeadphones() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shanah-media-more-sheet__row-icon">
      <path
        d="M4 14v4a2 2 0 0 0 2 2h1v-8H5a1 1 0 0 0-1 1zm15-1h-1v8h1a2 2 0 0 0 2-2v-4a1 1 0 0 0-1-1zM7 10a5 5 0 0 1 10 0v8a3 3 0 0 1-3 3h-1v-8h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shanah-media-more-sheet__row-icon">
      <path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShanahMediaMoreOptionsSheet({
  open,
  onClose,
  item,
  playbackMode,
  playbackRate,
  onSetPlaybackRate,
  onSwitchToAudio,
  onSwitchToVideo,
  onCast,
  onPictureInPicture,
  onShare,
  onStop,
  queue,
  onNextInQueue,
  onRemoveFromQueue,
  onClearQueue,
  castBusy,
}: ShanahMediaMoreOptionsSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const caps = getShanahMediaCapabilities(item, playbackMode);
  const hasSecondary =
    caps.switchToVideo ||
    caps.cast ||
    caps.pictureInPicture ||
    caps.playbackSpeed ||
    queue.length > 0;

  return (
    <div className="shanah-media-more-sheet__backdrop" role="dialog" aria-modal="true" aria-label="More options">
      <button type="button" className="min-h-[25vh] flex-1" aria-label="Close menu" onClick={onClose} />
      <div
        ref={panelRef}
        className="shanah-media-more-sheet__panel"
        onTouchStart={(event) => {
          touchStartY.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartY.current;
          const end = event.changedTouches[0]?.clientY;
          touchStartY.current = null;
          if (start != null && end != null && end - start > 48) onClose();
        }}
      >
        <div className="shanah-media-more-sheet__grab" aria-hidden />

        {caps.switchToAudio ? (
          <button
            type="button"
            className="shanah-media-more-sheet__row"
            onClick={() => {
              onSwitchToAudio();
              onClose();
            }}
          >
            <IconHeadphones />
            Switch to audio
          </button>
        ) : playbackMode === "video" ? (
          <p className="px-5 py-3 text-sm leading-relaxed text-neutral-500">
            {switchToAudioUnavailableMessage(item)}
          </p>
        ) : null}

        {caps.share ? (
          <button
            type="button"
            className="shanah-media-more-sheet__row"
            onClick={() => {
              onShare();
              onClose();
            }}
          >
            <IconShare />
            Share
          </button>
        ) : null}

        {hasSecondary ? <div className="shanah-media-more-sheet__divider" /> : null}

        {caps.switchToVideo ? (
          <button
            type="button"
            className="shanah-media-more-sheet__row shanah-media-more-sheet__secondary"
            onClick={() => {
              onSwitchToVideo();
              onClose();
            }}
          >
            Return to video
          </button>
        ) : null}

        {caps.playbackSpeed ? (
          <div className="px-5 py-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Playback speed
              <select
                value={playbackRate}
                onChange={(event) => onSetPlaybackRate(Number(event.target.value) as ShanahMediaSpeed)}
                className="mt-2 block w-full min-h-[44px] rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              >
                {SHANAH_MEDIA_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {caps.cast ? (
          <button
            type="button"
            disabled={castBusy}
            className="shanah-media-more-sheet__row shanah-media-more-sheet__secondary disabled:opacity-50"
            onClick={() => {
              onCast();
              onClose();
            }}
          >
            {castBusy ? "Connecting to TV…" : "Cast to device"}
          </button>
        ) : null}

        {caps.pictureInPicture ? (
          <button
            type="button"
            className="shanah-media-more-sheet__row shanah-media-more-sheet__secondary"
            onClick={() => {
              onPictureInPicture();
              onClose();
            }}
          >
            Picture-in-Picture
          </button>
        ) : null}

        {queue.length > 0 ? (
          <div className="px-5 py-2 text-sm text-neutral-700">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">Up next</span>
              <button type="button" className="text-xs font-semibold text-neutral-600" onClick={onClearQueue}>
                Clear
              </button>
            </div>
            <ul className="space-y-1">
              {queue.slice(0, 5).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{entry.title}</span>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-neutral-500"
                    onClick={() => onRemoveFromQueue(entry.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-2 text-sm font-semibold text-neutral-800" onClick={onNextInQueue}>
              Play next
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="shanah-media-more-sheet__row shanah-media-more-sheet__secondary text-red-700"
          onClick={() => {
            onStop();
            onClose();
          }}
        >
          Stop playback
        </button>
      </div>
    </div>
  );
}
