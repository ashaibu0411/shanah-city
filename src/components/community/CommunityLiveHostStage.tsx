"use client";

import { useEffect } from "react";
import {
  useConnectionState,
  useLocalParticipant,
  VideoTrack,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";

export function CommunityLiveHostStage() {
  const connectionState = useConnectionState();
  const {
    cameraTrack,
    localParticipant,
    lastCameraError,
    lastMicrophoneError,
    isCameraEnabled,
  } = useLocalParticipant();

  useEffect(() => {
    if (!localParticipant) return;

    let cancelled = false;

    async function enableMedia() {
      try {
        await localParticipant.setMicrophoneEnabled(true);
        await localParticipant.setCameraEnabled(true, {
          facingMode: "user",
          resolution: { width: 720, height: 1280, frameRate: 24 },
        });
      } catch {
        // lastCameraError / lastMicrophoneError surface in UI.
      }
    }

    void enableMedia();
    return () => {
      cancelled = true;
    };
  }, [localParticipant]);

  const mediaError = lastCameraError ?? lastMicrophoneError;
  if (mediaError) {
    return (
      <div className="community-story-live-waiting px-6">
        <p className="text-sm font-semibold text-rose-200">Camera or mic blocked</p>
        <p className="mt-2 text-sm text-white/80">{mediaError.message}</p>
        <p className="mt-3 text-xs text-white/65">
          On Android: Settings → Apps → Shanah City → Permissions → allow Camera and Microphone.
          Close other apps using the camera (e.g. phone calls), then try again.
        </p>
      </div>
    );
  }

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-white/80">
        Connecting to live…
      </div>
    );
  }

  if (!cameraTrack || !localParticipant) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/80">
        <p>{isCameraEnabled ? "Starting camera…" : "Turning camera on…"}</p>
        <p className="text-xs text-white/55">Allow camera access if your browser asks.</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={{
        participant: localParticipant,
        publication: cameraTrack,
        source: Track.Source.Camera,
      }}
      className="h-full w-full object-cover"
    />
  );
}
