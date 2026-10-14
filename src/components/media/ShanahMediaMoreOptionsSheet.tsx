"use client";

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
  castBusy?: boolean;
};

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
  castBusy,
}: ShanahMediaMoreOptionsSheetProps) {
  if (!open) return null;

  const caps = getShanahMediaCapabilities(item, playbackMode);

  return (
    <div className="fixed inset-0 z-[210] flex flex-col justify-end bg-black/50" role="dialog" aria-modal="true">
      <button type="button" className="min-h-[30vh] flex-1" aria-label="Close menu" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-3xl bg-night-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-white ring-1 ring-white/10">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />
        <h2 className="font-display text-lg font-semibold">More options</h2>
        <ul className="mt-4 space-y-1">
          {caps.switchToAudio ? (
            <li>
              <button
                type="button"
                className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold hover:bg-white/10"
                onClick={() => {
                  onSwitchToAudio();
                  onClose();
                }}
              >
                Switch to audio
              </button>
            </li>
          ) : playbackMode === "video" ? (
            <li className="px-3 py-2 text-xs leading-relaxed text-sand-400">
              {switchToAudioUnavailableMessage(item)}
            </li>
          ) : null}

          {caps.switchToVideo ? (
            <li>
              <button
                type="button"
                className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold hover:bg-white/10"
                onClick={() => {
                  onSwitchToVideo();
                  onClose();
                }}
              >
                Switch to video
              </button>
            </li>
          ) : null}

          {caps.playbackSpeed ? (
            <li className="px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-sand-500">Playback speed</p>
              <select
                value={playbackRate}
                onChange={(event) => onSetPlaybackRate(Number(event.target.value) as ShanahMediaSpeed)}
                className="mt-2 w-full min-h-[44px] rounded-xl border border-white/15 bg-night-900 px-3 text-sm"
              >
                {SHANAH_MEDIA_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed}x
                  </option>
                ))}
              </select>
            </li>
          ) : null}

          {caps.cast ? (
            <li>
              <button
                type="button"
                disabled={castBusy}
                className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
                onClick={() => {
                  onCast();
                  onClose();
                }}
              >
                {castBusy ? "Connecting to TV…" : "Cast to device"}
              </button>
            </li>
          ) : null}

          {caps.pictureInPicture ? (
            <li>
              <button
                type="button"
                className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold hover:bg-white/10"
                onClick={() => {
                  onPictureInPicture();
                  onClose();
                }}
              >
                Picture-in-Picture
              </button>
            </li>
          ) : null}

          {caps.share ? (
            <li>
              <button
                type="button"
                className="flex min-h-[48px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold hover:bg-white/10"
                onClick={() => {
                  onShare();
                  onClose();
                }}
              >
                Share
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
