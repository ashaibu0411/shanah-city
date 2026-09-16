"use client";

import { useLocalParticipant } from "@livekit/components-react";

export function CommunityLiveMediaControls() {
  const {
    isCameraEnabled,
    isMicrophoneEnabled,
    localParticipant,
  } = useLocalParticipant();

  if (!localParticipant) return null;

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
        onClick={() => void localParticipant.setCameraEnabled(!isCameraEnabled)}
        className={`community-live-media-btn ${isCameraEnabled ? "" : "community-live-media-btn-off"}`}
        aria-pressed={isCameraEnabled}
      >
        {isCameraEnabled ? "Video on" : "Video off"}
      </button>
    </div>
  );
}
