"use client";

import type { Devotion } from "@/lib/types";
import { devotionHasAudio } from "@/lib/devotion-utils";
import { DEVOTION_TTS_SPEED_OPTIONS } from "@/lib/devotion-tts-utils";
import { useDevotionPlayer } from "@/components/devotions/DevotionPlayerProvider";
import { Button } from "@/components/ui";

type DevotionListenPlayerProps = {
  devotion: Devotion;
  compact?: boolean;
};

export function DevotionListenPlayer({ devotion, compact = false }: DevotionListenPlayerProps) {
  const {
    playing,
    paused,
    supported,
    speechRate,
    isCurrent,
    play,
    pause,
    resume,
    stop,
    setRate,
  } = useDevotionPlayer();

  const hasUpload = devotionHasAudio(devotion);
  const current = isCurrent(devotion.id);

  if (hasUpload && devotion.audioUrl) {
    return (
      <div className={compact ? "" : "rounded-2xl bg-sand-50 p-4"}>
        {!compact && (
          <p className="mb-2 text-sm font-semibold text-night-800">
            {devotion.audioName ?? "Audio devotion"}
          </p>
        )}
        <p className="mb-3 text-sm text-night-600">
          Play continues if you leave this page or switch apps. Use Pause here or your phone’s media controls.
        </p>
        <div className="flex flex-wrap gap-2">
          {!current ? (
            <Button onClick={() => play(devotion)}>Play audio</Button>
          ) : paused ? (
            <Button onClick={resume}>Resume</Button>
          ) : (
            <Button onClick={pause} variant="secondary">
              Pause
            </Button>
          )}
          {current && (
            <Button onClick={stop} variant="secondary">
              Stop
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!supported) {
    return (
      <p className="rounded-xl bg-sand-50 px-3 py-2 text-sm text-night-600">
        Audio playback is not supported in this browser. Switch to Read mode.
      </p>
    );
  }

  return (
    <div className={compact ? "" : "rounded-2xl bg-sand-50 p-4"}>
      {!compact && (
        <p className="mb-3 text-sm text-night-600">
          Tap play to listen. Audio keeps going if you move to another page or switch apps.
        </p>
      )}

      <div className={compact ? "mb-3" : "mb-4"}>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-night-500">
          Speed
        </span>
        <div className="flex flex-wrap gap-2">
          {DEVOTION_TTS_SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRate(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                speechRate === option.value
                  ? "bg-night-900 text-sand-50"
                  : "bg-white text-night-700 ring-1 ring-night-900/10 hover:bg-sand-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!current ? (
          <Button onClick={() => play(devotion)}>Play audio</Button>
        ) : paused ? (
          <Button onClick={resume}>Resume</Button>
        ) : (
          <Button onClick={pause} variant="secondary">
            Pause
          </Button>
        )}
        {current && (
          <Button onClick={stop} variant="secondary">
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}
