"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export type ShanahNativeHostedVideoPresentResult = {
  lastPositionSec?: number;
  completed?: boolean;
};

export type ShanahNativeHostedVideoPlugin = {
  isAvailable(): Promise<{ available: boolean }>;
  present(options: {
    url: string;
    title: string;
    artist?: string;
    publishedAt?: string;
    startAtSec?: number;
    playbackRate?: number;
  }): Promise<ShanahNativeHostedVideoPresentResult>;
};

export const ShanahNativeHostedVideo = registerPlugin<ShanahNativeHostedVideoPlugin>(
  "ShanahNativeHostedVideo",
);

export async function isShanahNativeHostedVideoSupported() {
  if (Capacitor.getPlatform() !== "android") return false;
  try {
    const result = await ShanahNativeHostedVideo.isAvailable();
    return Boolean(result.available);
  } catch {
    return false;
  }
}
