"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Devotion } from "@/lib/types";
import { devotionHasAudio } from "@/lib/devotion-utils";
import { richTextToPlain } from "@/lib/rich-text";
import {
  DEFAULT_DEVOTION_TTS_RATE,
  DEVOTION_TTS_SPEED_OPTIONS,
  getStoredDevotionTtsRate,
  loadDevotionTtsVoices,
  pickDefaultDevotionVoice,
  setStoredDevotionTtsRate,
  setStoredDevotionTtsVoiceUri,
} from "@/lib/devotion-tts-utils";
import { Button } from "@/components/ui";

function buildListenScript(devotion: Devotion) {
  const verse = richTextToPlain(devotion.verse);
  const content = richTextToPlain(devotion.content);
  const prayer = richTextToPlain(devotion.prayer);
  return [
    devotion.title,
    `From ${devotion.reference}.`,
    verse,
    content,
    "Prayer.",
    prayer,
  ].join(" ... ");
}

type DevotionListenPlayerProps = {
  devotion: Devotion;
  compact?: boolean;
};

export function DevotionListenPlayer({ devotion, compact = false }: DevotionListenPlayerProps) {
  const hasUpload = devotionHasAudio(devotion);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
  const [speechRate, setSpeechRate] = useState<number>(DEFAULT_DEVOTION_TTS_RATE);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const listenScript = useMemo(() => buildListenScript(devotion), [devotion]);
  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === selectedVoiceUri) ?? null,
    [voices, selectedVoiceUri],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (hasUpload) return;
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    setSpeechRate(getStoredDevotionTtsRate());

    loadDevotionTtsVoices().then((loaded) => {
      setVoices(loaded);
      const defaultVoice = pickDefaultDevotionVoice(loaded);
      if (defaultVoice) {
        setSelectedVoiceUri(defaultVoice.voiceURI);
      }
    });
  }, [hasUpload]);

  function stopTts() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
    utteranceRef.current = null;
  }

  function startTts() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(listenScript);
    utterance.rate = speechRate;
    utterance.pitch = 0.98;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
    setPaused(false);
  }

  function pauseTts() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }

  function resumeTts() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }

  function handleVoiceChange(voiceUri: string) {
    setSelectedVoiceUri(voiceUri);
    setStoredDevotionTtsVoiceUri(voiceUri);
    if (playing) stopTts();
  }

  function handleRateChange(rate: number) {
    setSpeechRate(rate);
    setStoredDevotionTtsRate(rate);
    if (playing) stopTts();
  }

  if (hasUpload && devotion.audioUrl) {
    return (
      <div className={compact ? "" : "rounded-2xl bg-sand-50 p-4"}>
        {!compact && (
          <p className="mb-2 text-sm font-semibold text-night-800">
            {devotion.audioName ?? "Audio devotion"}
          </p>
        )}
        <audio controls preload="metadata" className="w-full" src={devotion.audioUrl}>
          Your browser does not support audio playback.
        </audio>
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
          No uploaded recording yet — choose a voice and speed, then play to hear the devotion read
          aloud.
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
              onChange={(event) => handleVoiceChange(event.target.value)}
              disabled={playing && !paused}
              className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2 disabled:opacity-60"
            >
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
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
                onClick={() => handleRateChange(option.value)}
                disabled={playing && !paused}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
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
        {!playing ? (
          <Button onClick={startTts}>Play audio</Button>
        ) : paused ? (
          <Button onClick={resumeTts}>Resume</Button>
        ) : (
          <Button onClick={pauseTts} variant="secondary">
            Pause
          </Button>
        )}
        {playing && (
          <Button onClick={stopTts} variant="secondary">
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}
