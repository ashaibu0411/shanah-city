"use client";

import type { Devotion } from "@/lib/types";
import { devotionHasAudio } from "@/lib/devotion-utils";
import {
  DEVOTION_TTS_SPEED_OPTIONS,
  formatDevotionVoiceLabel,
  recommendedDevotionTtsVoices,
} from "@/lib/devotion-tts-utils";
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
    voices,
    selectedVoiceUri,
    speechRate,
    isCurrent,
    play,
    pause,
    resume,
    stop,
    setVoice,
    setRate,
    previewVoice,
  } = useDevotionPlayer();

  const hasUpload = devotionHasAudio(devotion);
  const current = isCurrent(devotion.id);
  const recommended = recommendedDevotionTtsVoices(voices);
  const recommendedUris = new Set(recommended.map((voice) => voice.voiceURI));
  const otherVoices = voices.filter((voice) => !recommendedUris.has(voice.voiceURI));

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
          Choose a voice, then play. Audio keeps going if you move to another page or switch apps.
          Natural or Online voices usually sound warmer than basic device voices.
        </p>
      )}

      <div className={`grid gap-3 ${compact ? "mb-3" : "mb-4"}`}>
        {voices.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-night-500">
              Voice
            </span>
            <select
              value={selectedVoiceUri}
              onChange={(event) => setVoice(event.target.value)}
              className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
            >
              {recommended.length > 0 && (
                <optgroup label="Recommended">
                  {recommended.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {formatDevotionVoiceLabel(voice)}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherVoices.length > 0 && (
                <optgroup label="More voices on this device">
                  {otherVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {formatDevotionVoiceLabel(voice)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        )}

        <div>
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
        {!current && selectedVoiceUri && (
          <Button onClick={() => previewVoice(selectedVoiceUri)} variant="ghost">
            Preview voice
          </Button>
        )}
      </div>
      <p className="mt-3 text-xs text-night-500">
        Voices come from this phone. On Android, you can download more under Settings → Accessibility →
        Text-to-speech output.
      </p>
    </div>
  );
}
