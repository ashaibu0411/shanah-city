"use client";

/** Google Cast sender for hosted HTTPS media (no YouTube bypass). */

const CAST_SDK =
  "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";

let castLoadPromise: Promise<boolean> | null = null;

type CastMediaInfo = {
  metadata: { title?: string; subtitle?: string };
  startTime?: number;
};

function loadCastFramework(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (castLoadPromise) return castLoadPromise;

  castLoadPromise = new Promise((resolve) => {
    const w = window as Window & {
      cast?: { framework?: { CastContext: { getInstance: () => CastContextInstance } } };
      chrome?: { cast?: CastChromeApi };
    };
    if (w.cast?.framework) {
      resolve(true);
      return;
    }
    const existing = document.querySelector('script[data-shanah-cast="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(w.cast?.framework)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = CAST_SDK;
    script.async = true;
    script.dataset.shanahCast = "1";
    script.onload = () => resolve(Boolean(w.cast?.framework));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return castLoadPromise;
}

type CastContextInstance = {
  setOptions: (opts: { receiverApplicationId: string; autoJoinPolicy: number }) => void;
  requestSession: () => Promise<void>;
  getCurrentSession: () => {
    loadMedia: (req: unknown, onSuccess: () => void, onError: (err: unknown) => void) => void;
  } | null;
};

type CastChromeApi = {
  AutoJoinPolicy?: { ORIGIN_SCOPED: number };
  media?: {
    DEFAULT_MEDIA_RECEIVER_APP_ID: string;
    MediaInfo: new (url: string, contentType: string) => CastMediaInfo;
    GenericMediaMetadata: new () => { title?: string; subtitle?: string };
    LoadRequest: new (info: CastMediaInfo) => unknown;
  };
};

export async function isCastAvailableForUrl(url: string) {
  if (!url.trim().startsWith("https://")) return false;
  return loadCastFramework();
}

export async function castHostedMedia(options: {
  url: string;
  title: string;
  subtitle?: string;
  contentType: string;
  startAtSec?: number;
}) {
  const ready = await loadCastFramework();
  const w = window as Window & {
    cast?: { framework?: { CastContext: { getInstance: () => CastContextInstance } } };
    chrome?: { cast?: CastChromeApi };
  };

  if (!ready || !w.cast?.framework || !w.chrome?.cast?.media) {
    throw new Error("Cast is not available on this device. Try Chrome with a Cast receiver on the same network.");
  }

  const context = w.cast.framework.CastContext.getInstance();
  context.setOptions({
    receiverApplicationId: w.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: w.chrome.cast.AutoJoinPolicy?.ORIGIN_SCOPED ?? 0,
  });

  await context.requestSession();

  const session = context.getCurrentSession();
  if (!session) throw new Error("Could not connect to a Cast device.");

  const mediaInfo = new w.chrome.cast.media.MediaInfo(options.url, options.contentType);
  mediaInfo.metadata = new w.chrome.cast.media.GenericMediaMetadata();
  mediaInfo.metadata.title = options.title;
  if (options.subtitle) mediaInfo.metadata.subtitle = options.subtitle;
  if (options.startAtSec && options.startAtSec > 0) {
    mediaInfo.startTime = options.startAtSec;
  }

  const request = new w.chrome.cast.media.LoadRequest(mediaInfo);
  await new Promise<void>((resolve, reject) => {
    session.loadMedia(request, resolve, reject);
  });
}
