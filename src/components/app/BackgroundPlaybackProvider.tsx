"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { setBackgroundPlaybackKeepAliveElement } from "@/lib/native-background-playback";

/** Shared silent track + Android WebView keep-alive for HTML5 audio outside devotion listen. */
export function BackgroundPlaybackProvider({ children }: { children: ReactNode }) {
  const keepAliveRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setBackgroundPlaybackKeepAliveElement(keepAliveRef.current);
    return () => setBackgroundPlaybackKeepAliveElement(null);
  }, []);

  return (
    <>
      <audio ref={keepAliveRef} className="hidden" loop playsInline preload="auto" src="/silence.wav" />
      {children}
    </>
  );
}
