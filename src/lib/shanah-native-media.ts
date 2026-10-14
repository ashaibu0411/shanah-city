"use client";

import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type NativeMediaState = {
  playing?: boolean;
  paused?: boolean;
  position?: number;
  duration?: number;
  buffering?: boolean;
  ended?: boolean;
};

export type ShanahNativeMediaPlugin = {
  isAvailable(): Promise<{ available: boolean }>;
  play(options: {
    url: string;
    title: string;
    artist: string;
    artworkUrl?: string;
    startAtSec?: number;
  }): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seek(options: { positionSec: number }): Promise<void>;
  setRate(options: { rate: number }): Promise<void>;
  getState(): Promise<NativeMediaState>;
  addListener(
    eventName: "state",
    listenerFunc: (state: NativeMediaState) => void,
  ): Promise<PluginListenerHandle>;
};

export const ShanahNativeMedia = registerPlugin<ShanahNativeMediaPlugin>("ShanahNativeMedia");

export function isAndroidNativeMediaPlatform() {
  return Capacitor.getPlatform() === "android";
}

export async function isShanahNativeMediaSupported() {
  if (!isAndroidNativeMediaPlatform()) return false;
  try {
    const result = await ShanahNativeMedia.isAvailable();
    return Boolean(result.available);
  } catch {
    return false;
  }
}
