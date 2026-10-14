"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

export type NativeRecorderState = "idle" | "recording" | "paused" | "stopped";

export type NativeRecorderStatus = {
  state: NativeRecorderState;
  elapsedMs: number;
  recordingId?: string;
  error?: string;
  interruptionReason?: string;
};

export type LocalRecordingEntry = {
  recordingId: string;
  path: string;
  fileName: string;
  fileSizeBytes: number;
  lastModified: number;
};

export type NativeRecorderStopResult = NativeRecorderStatus & {
  path?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  durationMs?: number;
};

export type ShanahNativeRecorderPlugin = {
  isAvailable(): Promise<{ available: boolean; incrementalFile?: boolean; backgroundCapable?: boolean }>;
  start(options: { recordingId: string; title?: string }): Promise<NativeRecorderStatus>;
  pause(): Promise<NativeRecorderStatus>;
  resume(): Promise<NativeRecorderStatus>;
  stop(): Promise<NativeRecorderStopResult>;
  discard(): Promise<NativeRecorderStatus>;
  getStatus(): Promise<NativeRecorderStatus>;
  listLocalRecordings(): Promise<{ recordings: LocalRecordingEntry[] }>;
  deleteLocalRecording(options: { recordingId: string }): Promise<void>;
  checkPermissions(): Promise<{ microphone: string }>;
  requestPermissions(): Promise<{ microphone: string }>;
};

export const ShanahNativeRecorder = registerPlugin<ShanahNativeRecorderPlugin>("ShanahNativeRecorder");

export function isAndroidNativeRecorderPlatform() {
  return Capacitor.getPlatform() === "android";
}

export async function isShanahNativeRecorderSupported() {
  if (!isAndroidNativeRecorderPlatform()) return false;
  try {
    const result = await ShanahNativeRecorder.isAvailable();
    return Boolean(result.available);
  } catch {
    return false;
  }
}

export async function ensureNativeRecorderPermission() {
  try {
    const current = await ShanahNativeRecorder.checkPermissions();
    if (current.microphone === "granted") return true;
    const requested = await ShanahNativeRecorder.requestPermissions();
    return requested.microphone === "granted";
  } catch {
    return false;
  }
}

/** Load a native M4A file into a Blob for upload (Android Capacitor file URL). */
export async function nativeRecordingPathToBlob(path: string, mimeType = "audio/mp4") {
  const url = Capacitor.convertFileSrc(path);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not read the recording from device storage.");
  }
  const blob = await response.blob();
  if (!blob.type || blob.type === "application/octet-stream") {
    return new Blob([blob], { type: mimeType });
  }
  return blob;
}
