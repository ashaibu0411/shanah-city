"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { backgroundCapableAudioEventHandlers } from "@/lib/native-background-playback";
import { setNativeBackgroundAudioActive } from "@/lib/native-webview-bridge";
import {
  isShanahNativeMediaSupported,
  ShanahNativeMedia,
} from "@/lib/shanah-native-media";
import {
  clearMediaProgress,
  loadMediaProgress,
  saveMediaProgress,
} from "@/lib/shanah-media-progress";
import { notifyShanahMediaStarting, resolveAbsoluteMediaUrl } from "@/lib/shanah-media-helpers";
import { castHostedMedia } from "@/lib/shanah-media-cast";
import { inferWorshipAudioContentType } from "@/lib/worship-audio-shared";
import {
  SHANAH_MEDIA_SPEEDS,
  type ShanahMediaItem,
  type ShanahMediaPlaybackMode,
  type ShanahMediaSpeed,
} from "@/lib/shanah-media-types";
import type { ShanahYouTubeController } from "@/lib/shanah-youtube-controller";
import { Capacitor } from "@capacitor/core";
import {
  isShanahNativeHostedVideoSupported,
  ShanahNativeHostedVideo,
} from "@/lib/shanah-native-hosted-video";

type ShanahMediaContextValue = {
  item: ShanahMediaItem | null;
  queue: ShanahMediaItem[];
  playing: boolean;
  paused: boolean;
  loading: boolean;
  buffering: boolean;
  error: string | null;
  position: number;
  duration: number;
  playbackRate: ShanahMediaSpeed;
  fullPlayerOpen: boolean;
  playbackMode: ShanahMediaPlaybackMode;
  isCurrent: (id: string) => boolean;
  registerVideoElement: (element: HTMLVideoElement | null) => void;
  registerYouTubeController: (controller: ShanahYouTubeController | null) => void;
  handleYouTubeTimeUpdate: (position: number, duration: number) => void;
  handleYouTubePlayingChange: (active: boolean, buffering: boolean) => void;
  handleYouTubeEnded: () => void;
  handleYouTubeError: (message: string) => void;
  play: (
    item: ShanahMediaItem,
    options?: { startAt?: number; queue?: ShanahMediaItem[]; mode?: ShanahMediaPlaybackMode },
  ) => Promise<void>;
  switchToAudio: () => Promise<void>;
  switchToVideo: () => Promise<void>;
  enterPictureInPicture: () => Promise<void>;
  openCast: () => Promise<void>;
  shareCurrent: () => Promise<void>;
  playNext: (item: ShanahMediaItem) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  skipBackward: (seconds?: number) => void;
  skipForward: (seconds?: number) => void;
  setPlaybackRate: (rate: ShanahMediaSpeed) => void;
  setFullPlayerOpen: (open: boolean) => void;
  nextInQueue: () => void;
  previousInQueue: () => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  retry: () => void;
};

const ShanahMediaContext = createContext<ShanahMediaContextValue | null>(null);

const PROGRESS_SAVE_MS = 8000;

function syncMediaSession(
  item: ShanahMediaItem | null,
  handlers: { play?: () => void; pause?: () => void; stop?: () => void; seek?: (t: number) => void },
  state: { position: number; duration: number; playing: boolean },
) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  if (!item) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }

  const artwork = item.artworkUrl
    ? [{ src: item.artworkUrl, sizes: "512x512", type: "image/jpeg" as const }]
    : [];

  navigator.mediaSession.metadata = new MediaMetadata({
    title: item.title,
    artist: item.artist,
    album: "Shanah City",
    artwork,
  });

  navigator.mediaSession.setActionHandler("play", handlers.play ?? null);
  navigator.mediaSession.setActionHandler("pause", handlers.pause ?? null);
  navigator.mediaSession.setActionHandler("stop", handlers.stop ?? null);
  navigator.mediaSession.setActionHandler("seekbackward", () => handlers.seek?.(Math.max(0, state.position - 15)));
  navigator.mediaSession.setActionHandler("seekforward", () =>
    handlers.seek?.(Math.min(state.duration || state.position + 15, state.position + 15)),
  );

  if (state.duration > 0 && "setPositionState" in navigator.mediaSession) {
    try {
      navigator.mediaSession.setPositionState({
        duration: state.duration,
        playbackRate: 1,
        position: Math.min(state.position, state.duration),
      });
    } catch {
      // ignore unsupported position
    }
  }

  navigator.mediaSession.playbackState = state.playing ? "playing" : "paused";
}

export function ShanahMediaPlayerProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<ShanahMediaItem | null>(null);
  const [queue, setQueue] = useState<ShanahMediaItem[]>([]);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState<ShanahMediaSpeed>(1);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<ShanahMediaPlaybackMode>("audio");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubeControllerRef = useRef<ShanahYouTubeController | null>(null);
  const itemRef = useRef<ShanahMediaItem | null>(null);
  const queueRef = useRef<ShanahMediaItem[]>([]);
  const lastProgressSaveRef = useRef(0);
  const pendingStartRef = useRef<number | undefined>(undefined);
  const nativeSupportedRef = useRef(false);
  const nativeActiveRef = useRef(false);
  const nextInQueueRef = useRef<() => void>(() => undefined);
  const stopRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let cancelled = false;
    void isShanahNativeMediaSupported().then((supported) => {
      if (!cancelled) nativeSupportedRef.current = supported;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const persistProgress = useCallback((currentItem: ShanahMediaItem | null, seconds: number) => {
    const key = currentItem?.resumeKey ?? currentItem?.id;
    if (!key) return;
    const now = Date.now();
    if (now - lastProgressSaveRef.current < PROGRESS_SAVE_MS) return;
    lastProgressSaveRef.current = now;
    saveMediaProgress(key, seconds);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let listener: { remove: () => Promise<void> } | undefined;

    void (async () => {
      const supported = await isShanahNativeMediaSupported();
      if (cancelled || !supported) return;
      listener = await ShanahNativeMedia.addListener("state", (state) => {
        if (!nativeActiveRef.current) return;
        const pos = state.position ?? 0;
        setPosition(pos);
        setDuration(state.duration ?? 0);
        setBuffering(Boolean(state.buffering));
        setPlaying(Boolean(state.playing) || Boolean(state.paused));
        setPaused(Boolean(state.paused));
        setLoading(false);
        if (itemRef.current) persistProgress(itemRef.current, pos);
        if (state.ended) {
          const current = itemRef.current;
          if (current?.resumeKey || current?.id) {
            clearMediaProgress(current.resumeKey ?? current.id);
          }
          if (queueRef.current.length > 0) {
            nextInQueueRef.current();
          } else {
            stopRef.current();
          }
        }
      });
    })();

    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, [persistProgress]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    const current = itemRef.current;
    if (current && position > 0) {
      persistProgress(current, position);
    }
    if (nativeActiveRef.current) {
      nativeActiveRef.current = false;
      void ShanahNativeMedia.stop().catch(() => undefined);
      setNativeBackgroundAudioActive(false);
    }
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPlaying(false);
    setPaused(false);
    setLoading(false);
    setBuffering(false);
    setError(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    if (youtubeControllerRef.current) {
      try {
        youtubeControllerRef.current.destroy();
      } catch {
        // ignore
      }
      youtubeControllerRef.current = null;
    }
    setPlaybackMode("audio");
    setItem(null);
    setPosition(0);
    setDuration(0);
    syncMediaSession(null, {}, { position: 0, duration: 0, playing: false });
  }, [persistProgress, position]);

  const registerVideoElement = useCallback(
    (element: HTMLVideoElement | null) => {
      if (videoRef.current && videoRef.current !== element) {
        videoRef.current.ontimeupdate = null;
        videoRef.current.onloadedmetadata = null;
      }
      videoRef.current = element;
      if (!element) return;

      element.onloadedmetadata = () => {
        setDuration(element.duration || 0);
        const startAt = pendingStartRef.current;
        if (startAt != null && startAt > 0 && startAt < (element.duration || Infinity)) {
          element.currentTime = startAt;
          setPosition(startAt);
        }
        pendingStartRef.current = undefined;
        void element.play().catch(() => undefined);
        setPlaying(true);
        setPaused(false);
      };

      element.ontimeupdate = () => {
        setPosition(element.currentTime);
        if (itemRef.current) persistProgress(itemRef.current, element.currentTime);
      };

      element.onwaiting = () => setBuffering(true);
      element.onplaying = () => {
        setBuffering(false);
        setPaused(false);
        setPlaying(true);
      };
      element.onpause = () => {
        if (!element.ended) setPaused(true);
      };
      element.onended = () => {
        const current = itemRef.current;
        if (current?.resumeKey || current?.id) {
          clearMediaProgress(current.resumeKey ?? current.id);
        }
        if (queueRef.current.length > 0) nextInQueueRef.current();
        else stopRef.current();
      };
      element.onerror = () => setError("This video could not be loaded.");
    },
    [persistProgress],
  );

  const registerYouTubeController = useCallback((controller: ShanahYouTubeController | null) => {
    if (youtubeControllerRef.current && youtubeControllerRef.current !== controller) {
      try {
        youtubeControllerRef.current.destroy();
      } catch {
        // ignore
      }
    }
    youtubeControllerRef.current = controller;
    if (controller) {
      const startAt = pendingStartRef.current;
      if (startAt != null && startAt > 0) {
        controller.seekTo(startAt);
        setPosition(startAt);
        pendingStartRef.current = undefined;
      }
      setLoading(false);
    }
  }, []);

  const handleYouTubeTimeUpdate = useCallback(
    (seconds: number, total: number) => {
      if (!youtubeControllerRef.current) return;
      setPosition(seconds);
      if (Number.isFinite(total) && total > 0) setDuration(total);
      if (itemRef.current) persistProgress(itemRef.current, seconds);
    },
    [persistProgress],
  );

  const handleYouTubePlayingChange = useCallback((active: boolean, isBuffering: boolean) => {
    setBuffering(isBuffering);
    if (active && !isBuffering) {
      setPlaying(true);
      setPaused(false);
      setLoading(false);
      return;
    }
    if (isBuffering) {
      setPlaying(true);
      setLoading(false);
      return;
    }
    setPaused(true);
    setPlaying(true);
  }, []);

  const handleYouTubeError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  const handleYouTubeEnded = useCallback(() => {
    const current = itemRef.current;
    if (current?.resumeKey || current?.id) {
      clearMediaProgress(current.resumeKey ?? current.id);
    }
    if (queueRef.current.length > 0) nextInQueueRef.current();
    else stopRef.current();
  }, []);

  const pause = useCallback(() => {
    if (playbackMode === "video" && youtubeControllerRef.current) {
      youtubeControllerRef.current.pauseVideo();
    } else if (playbackMode === "video" && videoRef.current) {
      videoRef.current.pause();
    } else if (nativeActiveRef.current) {
      void ShanahNativeMedia.pause().catch(() => undefined);
    } else {
      audioRef.current?.pause();
    }
    setPaused(true);
    setPlaying(true);
  }, [playbackMode]);

  const resume = useCallback(() => {
    if (playbackMode === "video" && youtubeControllerRef.current) {
      youtubeControllerRef.current.playVideo();
    } else if (playbackMode === "video" && videoRef.current) {
      void videoRef.current.play().catch(() => undefined);
    } else if (nativeActiveRef.current) {
      void ShanahNativeMedia.resume().catch(() => undefined);
    } else {
      void audioRef.current?.play().catch(() => undefined);
    }
    setPaused(false);
    setPlaying(true);
  }, [playbackMode]);

  const seek = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds)) return;
    const next = Math.max(0, seconds);
    if (playbackMode === "video" && youtubeControllerRef.current) {
      youtubeControllerRef.current.seekTo(next);
    } else if (playbackMode === "video" && videoRef.current) {
      videoRef.current.currentTime = next;
    } else if (nativeActiveRef.current) {
      void ShanahNativeMedia.seek({ positionSec: next }).catch(() => undefined);
    } else {
      const audio = audioRef.current;
      if (audio) audio.currentTime = next;
    }
    setPosition(next);
  }, [playbackMode]);

  const skipBackward = useCallback(
    (seconds = 15) => seek(Math.max(0, position - seconds)),
    [position, seek],
  );
  const skipForward = useCallback(
    (seconds = 15) => seek(duration > 0 ? Math.min(duration, position + seconds) : position + seconds),
    [duration, position, seek],
  );

  const setPlaybackRate = useCallback((rate: ShanahMediaSpeed) => {
    setPlaybackRateState(rate);
    if (nativeActiveRef.current) {
      void ShanahNativeMedia.setRate({ rate }).catch(() => undefined);
    }
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
    if (youtubeControllerRef.current) {
      try {
        youtubeControllerRef.current.setPlaybackRate(rate);
      } catch {
        // Some YouTube videos restrict speed changes.
      }
    }
  }, []);

  const startItem = useCallback(
    async (
      next: ShanahMediaItem,
      options?: { startAt?: number; queue?: ShanahMediaItem[]; mode?: ShanahMediaPlaybackMode },
    ) => {
      notifyShanahMediaStarting();
      setError(null);
      setLoading(true);

      const mode = options?.mode ?? "audio";
      const wantsVideo = mode === "video" && Boolean(next.hostedVideoUrl || next.youtubeVideoId);

      if (itemRef.current?.id !== next.id) {
        if (itemRef.current && position > 0) persistProgress(itemRef.current, position);
        audioRef.current?.pause();
      }

      if (nativeActiveRef.current) {
        nativeActiveRef.current = false;
        void ShanahNativeMedia.stop().catch(() => undefined);
        setNativeBackgroundAudioActive(false);
      }

      setItem(next);
      setPlaybackMode(wantsVideo ? "video" : "audio");
      setQueue(options?.queue ?? queueRef.current.filter((entry) => entry.id !== next.id));

      if (wantsVideo) {
        const hostedUrl = next.hostedVideoUrl?.trim();
        const useNativeHosted =
          Capacitor.getPlatform() === "android" &&
          hostedUrl?.startsWith("https://") &&
          Boolean(next.preferNativeHostedVideo) &&
          (await isShanahNativeHostedVideoSupported());

        if (useNativeHosted && hostedUrl) {
          setPlaying(true);
          setPaused(false);
          setLoading(true);
          try {
            const result = await ShanahNativeHostedVideo.present({
              url: resolveAbsoluteMediaUrl(hostedUrl),
              title: next.title,
              artist: next.artist,
              publishedAt: next.publishedAt,
              startAtSec: options?.startAt,
              playbackRate,
            });
            if (result.lastPositionSec != null && result.lastPositionSec > 0) {
              setPosition(result.lastPositionSec);
            }
            setPlaying(false);
            setPaused(false);
            setLoading(false);
            setFullPlayerOpen(false);
            if (result.completed) {
              stopRef.current();
            }
            return;
          } catch {
            setLoading(false);
            // Fall through to in-app HTML5 player.
          }
        }

        setFullPlayerOpen(true);
        setPlaying(true);
        setPaused(false);
        setLoading(Boolean(next.youtubeVideoId && !next.hostedVideoUrl));
        pendingStartRef.current = options?.startAt;
        return;
      }
      const startAt =
        options?.startAt ??
        (next.resumeKey || next.id ? loadMediaProgress(next.resumeKey ?? next.id) : 0);
      pendingStartRef.current = startAt;

      let useNative = nativeSupportedRef.current;
      if (!useNative) {
        useNative = await isShanahNativeMediaSupported();
        nativeSupportedRef.current = useNative;
      }

      const streamUrl = resolveAbsoluteMediaUrl(next.audioUrl);
      let nativeStarted = false;

      if (useNative) {
        nativeActiveRef.current = true;
        setNativeBackgroundAudioActive(false);
        try {
          await ShanahNativeMedia.play({
            url: streamUrl,
            title: next.title,
            artist: next.artist,
            artworkUrl: next.artworkUrl,
            startAtSec: startAt > 0 ? startAt : undefined,
          });
          await ShanahNativeMedia.setRate({ rate: playbackRate });
          await new Promise((resolve) => window.setTimeout(resolve, 700));
          const nativeState = await ShanahNativeMedia.getState();
          nativeStarted = Boolean(
            nativeState.playing || nativeState.buffering || (nativeState.duration ?? 0) > 0,
          );
          if (nativeStarted) {
            setPlaying(true);
            setPaused(Boolean(nativeState.paused));
            setLoading(false);
            pendingStartRef.current = undefined;
          } else {
            nativeActiveRef.current = false;
            void ShanahNativeMedia.stop().catch(() => undefined);
          }
        } catch {
          nativeActiveRef.current = false;
          void ShanahNativeMedia.stop().catch(() => undefined);
        }
      }

      if (nativeStarted) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) {
        setError("Audio player unavailable.");
        setLoading(false);
        return;
      }

      nativeActiveRef.current = false;
      setNativeBackgroundAudioActive(true);
      audio.src = streamUrl;
      audio.playbackRate = playbackRate;

      try {
        await audio.play();
        setPlaying(true);
        setPaused(false);
        setLoading(false);
        pendingStartRef.current = undefined;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not play audio.");
        setPlaying(false);
        setLoading(false);
      }
    },
    [persistProgress, playbackRate, position],
  );

  const play = useCallback(
    async (
      next: ShanahMediaItem,
      options?: { startAt?: number; queue?: ShanahMediaItem[]; mode?: ShanahMediaPlaybackMode },
    ) => {
      await startItem(next, options);
    },
    [startItem],
  );

  const switchToAudio = useCallback(async () => {
    const current = itemRef.current;
    if (!current) return;
    const audioUrl = current.companionAudioUrl || current.audioUrl;
    if (!audioUrl?.trim()) {
      setError("No authorized audio is available for this message.");
      return;
    }
    const handoff =
      youtubeControllerRef.current?.getCurrentTime() ??
      videoRef.current?.currentTime ??
      position;
    if (youtubeControllerRef.current) {
      youtubeControllerRef.current.pauseVideo();
      try {
        youtubeControllerRef.current.destroy();
      } catch {
        // ignore
      }
      youtubeControllerRef.current = null;
    }
    if (videoRef.current) videoRef.current.pause();
    setPlaybackMode("audio");
    await startItem(
      { ...current, kind: current.kind === "sermon-video" ? "sermon-audio" : current.kind, audioUrl },
      { startAt: handoff, mode: "audio" },
    );
  }, [position, startItem]);

  const switchToVideo = useCallback(async () => {
    const current = itemRef.current;
    if (!current?.hostedVideoUrl && !current?.youtubeVideoId) return;
    const handoff = position;
    if (nativeActiveRef.current) {
      nativeActiveRef.current = false;
      void ShanahNativeMedia.stop().catch(() => undefined);
    }
    audioRef.current?.pause();
    setPlaybackMode("video");
    setFullPlayerOpen(true);
    pendingStartRef.current = handoff;
    setPlaying(true);
    setPaused(false);
  }, [position]);

  const enterPictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      setError("Picture-in-Picture is not supported for this video on your device.");
      return;
    }
    if (document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement !== video) {
          await video.requestPictureInPicture();
        }
        return;
      } catch {
        // Fall through to Android activity PiP hint (Home) on supported builds.
      }
    }
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.getPlatform() === "android") {
      setError("Press Home to watch in the floating video window.");
      return;
    }
    setError("Picture-in-Picture is not supported for this video on your device.");
  }, []);

  const openCast = useCallback(async () => {
    const current = itemRef.current;
    if (!current) return;
    setError(null);
    try {
      const url =
        playbackMode === "video" && current.hostedVideoUrl
          ? resolveAbsoluteMediaUrl(current.hostedVideoUrl)
          : resolveAbsoluteMediaUrl(current.companionAudioUrl || current.audioUrl);
      const contentType =
        playbackMode === "video"
          ? "video/mp4"
          : current.contentType ?? inferWorshipAudioContentType(url);
      await castHostedMedia({
        url,
        title: current.title,
        subtitle: current.artist,
        contentType,
        startAtSec: position,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cast failed.");
    }
  }, [playbackMode, position]);

  const shareCurrent = useCallback(async () => {
    const current = itemRef.current;
    if (!current) return;
    const shareUrl =
      typeof window !== "undefined" && current.href
        ? new URL(current.href, window.location.origin).href
        : window.location.href;
    if (navigator.share) {
      await navigator.share({ title: current.title, text: current.artist, url: shareUrl });
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    }
  }, []);

  const playNext = useCallback((next: ShanahMediaItem) => {
    setQueue((current) => [...current.filter((entry) => entry.id !== next.id), next]);
  }, []);

  const nextInQueue = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) {
      stop();
      return;
    }
    const [head, ...rest] = q;
    setQueue(rest);
    void startItem(head, { queue: rest, startAt: 0 });
  }, [startItem, stop]);

  useEffect(() => {
    nextInQueueRef.current = nextInQueue;
    stopRef.current = stop;
  }, [nextInQueue, stop]);

  const previousInQueue = useCallback(() => {
    seek(0);
  }, [seek]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  const retry = useCallback(() => {
    const current = itemRef.current;
    if (!current) return;
    void startItem(current, { startAt: position });
  }, [position, startItem]);

  useEffect(() => {
    if (!item) return;
    syncMediaSession(
      item,
      { play: resume, pause, stop, seek },
      { position, duration, playing: playing && !paused },
    );
  }, [item, pause, playing, paused, position, duration, resume, seek, stop]);

  const audioHandlers = useMemo(() => backgroundCapableAudioEventHandlers(), []);

  const value = useMemo<ShanahMediaContextValue>(
    () => ({
      item,
      queue,
      playing,
      paused,
      loading,
      buffering,
      error,
      position,
      duration,
      playbackRate,
      fullPlayerOpen,
      playbackMode,
      registerVideoElement,
      registerYouTubeController,
      handleYouTubeTimeUpdate,
      handleYouTubePlayingChange,
      handleYouTubeEnded,
      handleYouTubeError,
      isCurrent: (id: string) => item?.id === id && (playing || paused || loading),
      play,
      switchToAudio,
      switchToVideo,
      enterPictureInPicture,
      openCast,
      shareCurrent,
      playNext,
      pause,
      resume,
      stop,
      seek,
      skipBackward,
      skipForward,
      setPlaybackRate,
      setFullPlayerOpen,
      nextInQueue,
      previousInQueue,
      removeFromQueue,
      clearQueue,
      retry,
    }),
    [
      item,
      queue,
      playing,
      paused,
      loading,
      buffering,
      error,
      position,
      duration,
      playbackRate,
      fullPlayerOpen,
      playbackMode,
      registerVideoElement,
      registerYouTubeController,
      handleYouTubeTimeUpdate,
      handleYouTubePlayingChange,
      handleYouTubeEnded,
      handleYouTubeError,
      play,
      switchToAudio,
      switchToVideo,
      enterPictureInPicture,
      openCast,
      shareCurrent,
      playNext,
      pause,
      resume,
      stop,
      seek,
      skipBackward,
      skipForward,
      setPlaybackRate,
      nextInQueue,
      previousInQueue,
      removeFromQueue,
      clearQueue,
      retry,
    ],
  );

  return (
    <ShanahMediaContext.Provider value={value}>
      <audio
        ref={audioRef}
        className="hidden"
        playsInline
        preload="metadata"
        onPlay={audioHandlers.onPlay}
        onPause={(event) => {
          audioHandlers.onPause(event);
          if (!event.currentTarget.ended && !paused) {
            setPaused(true);
          }
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => {
          setBuffering(false);
          setPaused(false);
          setPlaying(true);
        }}
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          setDuration(audio.duration || 0);
          const startAt = pendingStartRef.current;
          if (startAt != null && startAt > 0 && startAt < (audio.duration || Infinity)) {
            audio.currentTime = startAt;
            setPosition(startAt);
          }
          pendingStartRef.current = undefined;
        }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setPosition(audio.currentTime);
          if (itemRef.current) persistProgress(itemRef.current, audio.currentTime);
        }}
        onEnded={() => {
          audioHandlers.onEnded();
          const current = itemRef.current;
          if (current?.resumeKey || current?.id) {
            clearMediaProgress(current.resumeKey ?? current.id);
          }
          if (queueRef.current.length > 0) {
            nextInQueue();
            return;
          }
          stop();
        }}
        onError={() => {
          setBuffering(false);
          setError("This recording could not be loaded. Check your connection and try again.");
          setPlaying(false);
        }}
      />
      {children}
    </ShanahMediaContext.Provider>
  );
}

export function useShanahMedia() {
  const ctx = useContext(ShanahMediaContext);
  if (!ctx) throw new Error("useShanahMedia must be used within ShanahMediaPlayerProvider");
  return ctx;
}

export function useShanahMediaOptional() {
  return useContext(ShanahMediaContext);
}

export { SHANAH_MEDIA_SPEEDS };
