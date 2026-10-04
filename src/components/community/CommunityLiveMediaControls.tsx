"use client";

import { useCallback, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { LocalVideoTrack } from "livekit-client";
import {
  liveStoryCameraCaptureOptions,
  oppositeLiveCameraFacing,
  type LiveCameraFacingMode,
} from "@/lib/community-live-camera";

export function CommunityLiveMediaControls() {
  const {
    cameraTrack,
    isCameraEnabled,
    isMicrophoneEnabled,
    localParticipant,
  } = useLocalParticipant();
  const [facingMode, setFacingMode] = useState<LiveCameraFacingMode>("user");
  const [flipping, setFlipping] = useState(false);

  const toggleCamera = useCallback(async () => {
    if (!localParticipant) return;
    if (isCameraEnabled) {
      await localParticipant.setCameraEnabled(false);
      return;
    }
    await localParticipant.setCameraEnabled(
      true,
      liveStoryCameraCaptureOptions(facingMode),
    );
  }, [facingMode, isCameraEnabled, localParticipant]);

  const flipCamera = useCallback(async () => {
    if (!localParticipant || flipping) return;

    const nextFacing = oppositeLiveCameraFacing(facingMode);
    setFlipping(true);
    try {
      const options = liveStoryCameraCaptureOptions(nextFacing);
      const videoTrack = cameraTrack?.videoTrack;
      if (isCameraEnabled && videoTrack instanceof LocalVideoTrack) {
        await videoTrack.restartTrack(options);
      } else if (isCameraEnabled) {
        await localParticipant.setCameraEnabled(true, options);
      }
      setFacingMode(nextFacing);
    } catch (error) {
      console.error("Could not flip camera:", error);
    } finally {
      setFlipping(false);
    }
  }, [cameraTrack, facingMode, flipping, isCameraEnabled, localParticipant]);

  if (!localParticipant) return null;

  const flipLabel = facingMode === "user" ? "Back cam" : "Front cam";

  return (
    <div className="community-live-media-controls">
      <button
        type="button"
        onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        className={`community-live-media-btn ${isMicrophoneEnabled ? "" : "community-live-media-btn-off"}`}
        aria-pressed={isMicrophoneEnabled}
      >
        {isMicrophoneEnabled ? "Mic on" : "Mic off"}
      </button>
      <button
        type="button"
        onClick={() => void toggleCamera()}
        className={`community-live-media-btn ${isCameraEnabled ? "" : "community-live-media-btn-off"}`}
        aria-pressed={isCameraEnabled}
      >
        {isCameraEnabled ? "Video on" : "Video off"}
      </button>
      <button
        type="button"
        onClick={() => void flipCamera()}
        disabled={flipping || !isCameraEnabled}
        className="community-live-media-btn"
        aria-label="Flip camera"
        title={isCameraEnabled ? "Switch front or back camera" : "Turn video on to flip camera"}
      >
        {flipping ? "…" : flipLabel}
      </button>
    </div>
  );
}
