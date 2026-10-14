"use client";

type YouTubeIframeApiWindow = Window & {
  YT?: {
    Player: new (
      elementId: string,
      options: {
        videoId: string;
        width?: string | number;
        height?: string | number;
        playerVars?: Record<string, string | number>;
        events?: {
          onReady?: (event: { target: YouTubePlayerInstance }) => void;
          onStateChange?: (event: { data: number; target: YouTubePlayerInstance }) => void;
          onError?: (event: { data: number }) => void;
        };
      },
    ) => YouTubePlayerInstance;
    PlayerState: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
};

export type YouTubePlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
};

let loadPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const win = window as YouTubeIframeApiWindow;
  if (win.YT?.Player) return Promise.resolve();

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-shanah-yt-api="1"]');
    if (existing) {
      const check = window.setInterval(() => {
        if (win.YT?.Player) {
          window.clearInterval(check);
          resolve();
        }
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(check);
        if (win.YT?.Player) resolve();
        else reject(new Error("YouTube IFrame API failed to load."));
      }, 15000);
      return;
    }

    win.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.shanahYtApi = "1";
    script.onerror = () => reject(new Error("Could not load YouTube IFrame API."));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function getYouTubePlayerState() {
  const win = window as YouTubeIframeApiWindow;
  return win.YT?.PlayerState;
}
