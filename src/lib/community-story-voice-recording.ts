import {
  COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC,
  COMMUNITY_STORY_OVERLAY_AUDIO_MIN_SEC,
} from "@/lib/community-media-shared";

/** Ignore empty containers; real validation uses duration when available. */
export const COMMUNITY_STORY_VOICE_MIN_BYTES = 128;

export type StoryVoiceValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateStoryVoiceRecording(input: {
  sizeBytes: number;
  durationSec: number | null;
}): StoryVoiceValidationResult {
  if (input.sizeBytes < COMMUNITY_STORY_VOICE_MIN_BYTES) {
    return {
      ok: false,
      message: "Recording was too short. Try again and speak for a few seconds.",
    };
  }

  if (input.durationSec != null && Number.isFinite(input.durationSec)) {
    if (input.durationSec < COMMUNITY_STORY_OVERLAY_AUDIO_MIN_SEC) {
      return {
        ok: false,
        message: "Recording was too short. Try again and speak for a few seconds.",
      };
    }
    if (input.durationSec > COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC + 0.75) {
      return {
        ok: false,
        message: `Recording must be ${COMMUNITY_STORY_OVERLAY_AUDIO_MAX_SEC} seconds or less.`,
      };
    }
    return { ok: true };
  }

  if (input.sizeBytes < 512) {
    return {
      ok: false,
      message:
        "Recording did not save correctly. Tap Stop recording, wait a moment, then try again.",
    };
  }

  return { ok: true };
}

/** iOS Safari may deliver the last chunk after `stop`; flush before assembling the Blob. */
export function flushMediaRecorderBeforeStop(recorder: MediaRecorder) {
  if (recorder.state !== "recording") return;
  try {
    recorder.requestData();
  } catch {
    /* optional on some browsers */
  }
}

export function waitForRecorderFinalizationMs() {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), 120);
  });
}

export function measureAudioBlobDurationSec(blob: Blob): Promise<number | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    const finish = (value: number | null) => {
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      finish(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => finish(null);
    audio.src = url;
  });
}
