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
import {
  SHANAH_MEDIA_SPEEDS,
  type ShanahMediaItem,
  type ShanahMediaSpeed,
} from "@/lib/shanah-media-types";

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
  isCurrent: (id: string) => boolean;
  play: (item: ShanahMediaItem, options?: { startAt?: number; queue?: ShanahMediaItem[] }) => Promise<void>;
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    setItem(null);
    setPosition(0);
    setDuration(0);
    syncMediaSession(null, {}, { position: 0, duration: 0, playing: false });
  }, [persistProgress, position]);

  const pause = useCallback(() => {
    if (nativeActiveRef.current) {
      void ShanahNativeMedia.pause().catch(() => undefined);
    } else {
      audioRef.current?.pause();
    }
    setPaused(true);
    setPlaying(true);
  }, []);

  const resume = useCallback(() => {
    if (nativeActiveRef.current) {
      void ShanahNativeMedia.resume().catch(() => undefined);
    } else {
      void audioRef.current?.play().catch(() => undefined);
    }
    setPaused(false);
    setPlaying(true);
  }, []);

  const seek = useCallback((seconds: number) => {
    if (!Number.isFinite(seconds)) return;
    const next = Math.max(0, seconds);
    if (nativeActiveRef.current) {
      void ShanahNativeMedia.seek({ positionSec: next }).catch(() => undefined);
    } else {
      const audio = audioRef.current;
      if (audio) audio.currentTime = next;
    }
    setPosition(next);
  }, []);

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
  }, []);

  const startItem = useCallback(
    async (next: ShanahMediaItem, options?: { startAt?: number; queue?: ShanahMediaItem[] }) => {
      notifyShanahMediaStarting();
      setError(null);
      setLoading(true);

      if (itemRef.current?.id !== next.id) {
        if (itemRef.current && position > 0) persistProgress(itemRef.current, position);
        audioRef.current?.pause();
      }

      setItem(next);
      setQueue(options?.queue ?? queueRef.current.filter((entry) => entry.id !== next.id));
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
    async (next: ShanahMediaItem, options?: { startAt?: number; queue?: ShanahMediaItem[] }) => {
      await startItem(next, options);
    },
    [startItem],
  );

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
      isCurrent: (id: string) => item?.id === id && (playing || paused || loading),
      play,
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
      play,
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
