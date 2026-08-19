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
import type { Devotion } from "@/lib/types";
import { isNativeAppPlatform } from "@/lib/native-app";
import { devotionHasAudio } from "@/lib/devotion-utils";
import { buildDevotionListenScript, splitDevotionListenChunks } from "@/lib/devotion-listen";
import {
  DEFAULT_DEVOTION_TTS_RATE,
  findSpeechSynthesisVoice,
  getStoredDevotionTtsRate,
  getStoredDevotionTtsVoiceUri,
  loadDevotionTtsVoices,
  pickDefaultDevotionVoice,
  setStoredDevotionTtsRate,
  setStoredDevotionTtsVoiceUri,
  type DevotionTtsVoiceOption,
} from "@/lib/devotion-tts-utils";

const KEEP_ALIVE_SRC = "/silence.wav";

type DevotionPlayerContextValue = {
  devotion: Devotion | null;
  playing: boolean;
  paused: boolean;
  supported: boolean;
  voices: DevotionTtsVoiceOption[];
  selectedVoiceUri: string;
  speechRate: number;
  isCurrent: (id: string) => boolean;
  play: (devotion: Devotion) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoice: (voiceUri: string) => void;
  setRate: (rate: number) => void;
  previewVoice: (voiceUri: string) => void;
};

const DevotionPlayerContext = createContext<DevotionPlayerContextValue | null>(null);

function updateMediaSession(devotion: Devotion | null, handlers: {
  play?: () => void;
  pause?: () => void;
  stop?: () => void;
}) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  if (!devotion) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: devotion.title,
    artist: "Shanah City Devotions",
    album: devotion.reference,
  });
  navigator.mediaSession.setActionHandler("play", handlers.play ?? null);
  navigator.mediaSession.setActionHandler("pause", handlers.pause ?? null);
  navigator.mediaSession.setActionHandler("stop", handlers.stop ?? null);
  navigator.mediaSession.playbackState = "playing";
}

export function DevotionPlayerProvider({ children }: { children: ReactNode }) {
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<DevotionTtsVoiceOption[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
  const [speechRate, setSpeechRate] = useState<number>(DEFAULT_DEVOTION_TTS_RATE);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const keepAliveRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const devotionRef = useRef<Devotion | null>(null);
  const rateRef = useRef<number>(speechRate);
  const voiceUriRef = useRef(selectedVoiceUri);
  const keepAliveTimerRef = useRef<number | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    devotionRef.current = devotion;
  }, [devotion]);
  useEffect(() => {
    rateRef.current = speechRate;
  }, [speechRate]);
  useEffect(() => {
    voiceUriRef.current = selectedVoiceUri;
  }, [selectedVoiceUri]);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current != null) {
      window.clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
    keepAliveRef.current?.pause();
  }, []);

  const startKeepAlive = useCallback(() => {
    const keepAlive = keepAliveRef.current;
    if (keepAlive) {
      keepAlive.loop = true;
      keepAlive.muted = false;
      keepAlive.volume = 1;
      if (keepAlive.src && !keepAlive.src.endsWith("silence.wav")) {
        keepAlive.src = KEEP_ALIVE_SRC;
      }
      void keepAlive.play().catch(() => undefined);
    }
    if (keepAliveTimerRef.current != null) {
      window.clearInterval(keepAliveTimerRef.current);
    }
    keepAliveTimerRef.current = window.setInterval(() => {
      if (!playingRef.current || pausedRef.current) return;
      void keepAliveRef.current?.play().catch(() => undefined);
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        return;
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 8000);
  }, []);

  const cancelTts = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;
    playingRef.current = false;
    pausedRef.current = false;
    cancelTts();
    stopKeepAlive();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    setPlaying(false);
    setPaused(false);
    setDevotion(null);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    }
  }, [cancelTts, stopKeepAlive]);

  const speakCurrentChunk = useCallback(() => {
    if (!playingRef.current || pausedRef.current) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (chunkIndexRef.current >= chunksRef.current.length) {
      stop();
      return;
    }

    const generation = generationRef.current;
    const utterance = new SpeechSynthesisUtterance(chunksRef.current[chunkIndexRef.current]);
    utterance.rate = rateRef.current;
    utterance.pitch = 0.98;
    const voice = findSpeechSynthesisVoice(voiceUriRef.current);
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (generation !== generationRef.current) return;
      if (!playingRef.current || pausedRef.current) return;
      chunkIndexRef.current += 1;
      speakCurrentChunk();
    };
    utterance.onerror = (event) => {
      if (generation !== generationRef.current) return;
      if (event.error === "interrupted" || event.error === "canceled") return;
      if (!playingRef.current) return;
      chunkIndexRef.current += 1;
      speakCurrentChunk();
    };
    window.speechSynthesis.speak(utterance);
  }, [stop]);

  const pause = useCallback(() => {
    if (!playingRef.current) return;
    pausedRef.current = true;
    if (devotionRef.current && devotionHasAudio(devotionRef.current) && audioRef.current) {
      audioRef.current.pause();
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    keepAliveRef.current?.pause();
    setPaused(true);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }, []);

  const resume = useCallback(() => {
    if (!playingRef.current) return;
    pausedRef.current = false;
    if (devotionRef.current && devotionHasAudio(devotionRef.current) && audioRef.current) {
      void audioRef.current.play().catch(() => undefined);
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (!window.speechSynthesis.speaking) {
        speakCurrentChunk();
      }
      startKeepAlive();
    }
    setPaused(false);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  }, [speakCurrentChunk, startKeepAlive]);

  const play = useCallback(
    (next: Devotion) => {
      cancelTts();
      stopKeepAlive();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
      }

      setDevotion(next);
      devotionRef.current = next;
      playingRef.current = true;
      pausedRef.current = false;
      generationRef.current += 1;
      setPlaying(true);
      setPaused(false);
      chunkIndexRef.current = 0;

      updateMediaSession(next, {
        play: () => resume(),
        pause: () => pause(),
        stop: () => stop(),
      });

      if (devotionHasAudio(next) && next.audioUrl && audio) {
        audio.src = next.audioUrl;
        audio.onended = () => stop();
        void audio.play().catch(() => {
          playingRef.current = false;
          setPlaying(false);
        });
        return;
      }

      if (typeof window === "undefined" || !window.speechSynthesis) {
        setSupported(false);
        stop();
        return;
      }

      chunksRef.current = splitDevotionListenChunks(buildDevotionListenScript(next));
      startKeepAlive();
      speakCurrentChunk();
    },
    [cancelTts, pause, resume, speakCurrentChunk, startKeepAlive, stop, stopKeepAlive],
  );

  const setVoice = useCallback(
    (voiceUri: string) => {
      voiceUriRef.current = voiceUri;
      setSelectedVoiceUri(voiceUri);
      setStoredDevotionTtsVoiceUri(voiceUri);
      if (playingRef.current && devotionRef.current && !devotionHasAudio(devotionRef.current)) {
        play(devotionRef.current);
      }
    },
    [play],
  );

  const setRate = useCallback(
    (rate: number) => {
      rateRef.current = rate;
      setSpeechRate(rate);
      setStoredDevotionTtsRate(rate);
      if (playingRef.current && devotionRef.current && !devotionHasAudio(devotionRef.current)) {
        play(devotionRef.current);
      }
    },
    [play],
  );

  const previewVoice = useCallback(
    (voiceUri: string) => {
      if (playingRef.current) return;
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "This is how this voice sounds reading today's devotion.",
      );
      utterance.rate = rateRef.current;
      utterance.pitch = 0.98;
      const voice = findSpeechSynthesisVoice(voiceUri);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  const resumeSpeaking = useCallback(() => {
    if (!playingRef.current || pausedRef.current) return;
    void keepAliveRef.current?.play().catch(() => undefined);
    void audioRef.current?.play().catch(() => undefined);
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      return;
    }
    if (!window.speechSynthesis.speaking) {
      speakCurrentChunk();
    }
  }, [speakCurrentChunk]);

  const isCurrent = useCallback((id: string) => devotion?.id === id && playing, [devotion, playing]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    setSpeechRate(getStoredDevotionTtsRate());

    const applyVoices = (loaded: DevotionTtsVoiceOption[]) => {
      setVoices(loaded);
      const defaultVoice = pickDefaultDevotionVoice(loaded);
      if (!defaultVoice) return;
      setSelectedVoiceUri((current) => {
        if (current && loaded.some((voice) => voice.voiceURI === current)) {
          return current;
        }
        return defaultVoice.voiceURI;
      });
      if (!getStoredDevotionTtsVoiceUri()) {
        setStoredDevotionTtsVoiceUri(defaultVoice.voiceURI);
      }
    };

    void loadDevotionTtsVoices().then(applyVoices);

    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const refresh = () => {
      void loadDevotionTtsVoices().then(applyVoices);
    };
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  useEffect(() => {
    document.body.dataset.devotionPlayer = playing ? "on" : "";
    return () => {
      delete document.body.dataset.devotionPlayer;
    };
  }, [playing]);

  useEffect(() => {
    const onVisibility = () => {
      if (!playingRef.current || pausedRef.current) return;
      resumeSpeaking();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);
    window.addEventListener("pageshow", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
    };
  }, [resumeSpeaking]);

  useEffect(() => {
    if (!isNativeAppPlatform()) return;
    let handle: { remove: () => Promise<void> } | undefined;
    void import("@capacitor/app").then(({ App }) => {
      void App.addListener("appStateChange", () => {
        resumeSpeaking();
      }).then((listener) => {
        handle = listener;
      });
    });
    return () => {
      void handle?.remove();
    };
  }, [resumeSpeaking]);

  useEffect(() => {
    return () => {
      cancelTts();
      stopKeepAlive();
    };
  }, [cancelTts, stopKeepAlive]);

  const value = useMemo<DevotionPlayerContextValue>(
    () => ({
      devotion,
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
    }),
    [
      devotion,
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
    ],
  );

  return (
    <DevotionPlayerContext.Provider value={value}>
      <audio ref={audioRef} className="hidden" playsInline preload="none" />
      <audio ref={keepAliveRef} className="hidden" loop playsInline src={KEEP_ALIVE_SRC} />
      {children}
    </DevotionPlayerContext.Provider>
  );
}

export function useDevotionPlayer() {
  const context = useContext(DevotionPlayerContext);
  if (!context) {
    throw new Error("useDevotionPlayer must be used within DevotionPlayerProvider");
  }
  return context;
}
