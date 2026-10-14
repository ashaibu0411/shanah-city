"use client";

import { useEffect, useId, useRef } from "react";
import {
  getYouTubePlayerState,
  loadYouTubeIframeApi,
  type YouTubePlayerInstance,
} from "@/lib/youtube-iframe-api";
import { wrapYouTubePlayer, type ShanahYouTubeController } from "@/lib/shanah-youtube-controller";

type ShanahYouTubeIframePlayerProps = {
  videoId: string;
  origin: string;
  playbackRate: number;
  onControllerReady: (controller: ShanahYouTubeController | null) => void;
  onTimeUpdate: (position: number, duration: number) => void;
  onPlayingChange: (playing: boolean, buffering: boolean) => void;
  onEnded: () => void;
  onError: (message: string) => void;
};

export function ShanahYouTubeIframePlayer({
  videoId,
  origin,
  playbackRate,
  onControllerReady,
  onTimeUpdate,
  onPlayingChange,
  onEnded,
  onError,
}: ShanahYouTubeIframePlayerProps) {
  const reactId = useId();
  const elementId = `shanah-yt-${reactId.replace(/:/g, "")}`;
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const callbacksRef = useRef({
    onControllerReady,
    onTimeUpdate,
    onPlayingChange,
    onEnded,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onControllerReady,
      onTimeUpdate,
      onPlayingChange,
      onEnded,
      onError,
    };
  });

  useEffect(() => {
    let cancelled = false;
    let tick: number | undefined;

    void (async () => {
      try {
        await loadYouTubeIframeApi();
        if (cancelled) return;

        const win = window as Window & {
          YT?: {
            Player: new (
              elementId: string,
              options: Record<string, unknown>,
            ) => YouTubePlayerInstance;
          };
        };
        if (!win.YT?.Player) {
          callbacksRef.current.onError("YouTube player unavailable.");
          return;
        }

        const created = new win.YT.Player(elementId, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
            origin,
          },
          events: {
            onReady: (event: { target: YouTubePlayerInstance }) => {
              if (cancelled) return;
              const player = event.target as YouTubePlayerInstance;
              playerRef.current = player;
              if (playbackRate !== 1) {
                try {
                  player.setPlaybackRate(playbackRate);
                } catch {
                  // Some videos restrict playback speed.
                }
              }
              player.playVideo();
              callbacksRef.current.onControllerReady(wrapYouTubePlayer(player));

              tick = window.setInterval(() => {
                if (!playerRef.current) return;
                const position = player.getCurrentTime();
                const duration = player.getDuration();
                callbacksRef.current.onTimeUpdate(position, duration);
              }, 500);
            },
            onStateChange: (event: { data: number }) => {
              const states = getYouTubePlayerState();
              if (!states) return;
              const playing = event.data === states.PLAYING;
              const buffering = event.data === states.BUFFERING;
              const paused = event.data === states.PAUSED;
              callbacksRef.current.onPlayingChange(
                playing || buffering,
                buffering,
              );
              if (paused) callbacksRef.current.onPlayingChange(false, false);
              if (event.data === states.ENDED) callbacksRef.current.onEnded();
            },
            onError: (event: { data: number }) => {
              callbacksRef.current.onError(`YouTube playback error (${event.data}).`);
            },
          },
        }) as YouTubePlayerInstance;
        playerRef.current = created;
      } catch (err) {
        callbacksRef.current.onError(
          err instanceof Error ? err.message : "Could not start YouTube playback.",
        );
      }
    })();

    return () => {
      cancelled = true;
      if (tick != null) window.clearInterval(tick);
      callbacksRef.current.onControllerReady(null);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recreate only when the sermon video id changes
  }, [elementId, origin, videoId]);

  useEffect(() => {
    if (!playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate(playbackRate);
    } catch {
      // Some videos restrict speed.
    }
  }, [playbackRate]);

  return (
    <div className="shanah-media-full-player__iframe-wrap">
      <div id={elementId} className="h-full w-full" title="Sermon video" />
    </div>
  );
}
