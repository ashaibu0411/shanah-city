import type { VideoCaptureOptions } from "livekit-client";

export type LiveCameraFacingMode = "user" | "environment";

export const LIVE_STORY_CAMERA_RESOLUTION = {
  width: 720,
  height: 1280,
  frameRate: 24,
} as const;

export function liveStoryCameraCaptureOptions(
  facingMode: LiveCameraFacingMode = "user",
): VideoCaptureOptions {
  return {
    facingMode,
    resolution: LIVE_STORY_CAMERA_RESOLUTION,
  };
}

export function oppositeLiveCameraFacing(facing: LiveCameraFacingMode): LiveCameraFacingMode {
  return facing === "user" ? "environment" : "user";
}
