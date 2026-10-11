"use client";

import { setNativeBackgroundAudioActive } from "@/lib/native-webview-bridge";

const KEEP_ALIVE_SRC = "/silence.wav";

let activeSessions = 0;
let keepAliveElement: HTMLAudioElement | null = null;

export function setBackgroundPlaybackKeepAliveElement(element: HTMLAudioElement | null) {
  keepAliveElement = element;
}

function startKeepAlive() {
  setNativeBackgroundAudioActive(true);
  const el = keepAliveElement;
  if (!el) return;
  el.loop = true;
  if (!el.src || !el.src.endsWith("silence.wav")) {
    el.src = KEEP_ALIVE_SRC;
  }
  void el.play().catch(() => undefined);
}

function stopKeepAlive() {
  setNativeBackgroundAudioActive(false);
  keepAliveElement?.pause();
}

export function acquireBackgroundPlayback() {
  activeSessions += 1;
  if (activeSessions === 1) {
    startKeepAlive();
  }
}

export function releaseBackgroundPlayback() {
  activeSessions = Math.max(0, activeSessions - 1);
  if (activeSessions === 0) {
    stopKeepAlive();
  }
}

/** Attach to `<audio controls>` so worship, chat voice, etc. keep playing in the native app. */
export function backgroundCapableAudioEventHandlers(): {
  onPlay: () => void;
  onPause: (event: React.SyntheticEvent<HTMLAudioElement>) => void;
  onEnded: () => void;
} {
  return {
    onPlay: () => acquireBackgroundPlayback(),
    onPause: (event) => {
      if (event.currentTarget.ended) return;
      releaseBackgroundPlayback();
    },
    onEnded: () => releaseBackgroundPlayback(),
  };
}
