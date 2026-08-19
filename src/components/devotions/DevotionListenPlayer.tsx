"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Devotion } from "@/lib/types";
import { devotionHasAudio } from "@/lib/devotion-utils";
import { richTextToPlain } from "@/lib/rich-text";
import { Button } from "@/components/ui";

function buildListenScript(devotion: Devotion) {
  const verse = richTextToPlain(devotion.verse);
  const content = richTextToPlain(devotion.content);
  const prayer = richTextToPlain(devotion.prayer);
  return `${devotion.title}. From ${devotion.reference}. ${verse}. ${content}. Prayer. ${prayer}.`;
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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const listenScript = useMemo(() => buildListenScript(devotion), [devotion]);

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
    utterance.rate = 0.95;
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
          No uploaded recording yet — this uses your device&apos;s voice to read the devotion aloud.
        </p>
      )}
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
