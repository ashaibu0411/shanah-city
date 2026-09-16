"use client";

import { useEffect } from "react";
import {
  useConnectionState,
  useLocalParticipant,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { CommunityLiveMediaControls } from "@/components/community/CommunityLiveMediaControls";

type CommunityLivePublisherStageProps = {
  showRemoteCoHosts?: boolean;
};

export function CommunityLivePublisherStage({
  showRemoteCoHosts = true,
}: CommunityLivePublisherStageProps) {
  const connectionState = useConnectionState();
  const {
    cameraTrack,
    localParticipant,
    lastCameraError,
    lastMicrophoneError,
    isCameraEnabled,
  } = useLocalParticipant();

  const remoteTracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  }).filter(
    (entry) =>
      !entry.participant.isLocal &&
      entry.publication?.kind === Track.Kind.Video &&
      !entry.publication.isMuted,
  );

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
        // surfaced via lastCameraError
      }
    }

    if (!cancelled) void enableMedia();
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
      </div>
    );
  }

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-white/80">
        Connecting…
      </div>
    );
  }

  return (
    <div className="community-live-publisher-stage">
      <div className="community-live-publisher-main">
        {!cameraTrack || !localParticipant ? (
          <div className="flex h-full items-center justify-center text-sm text-white/80">
            {isCameraEnabled ? "Starting camera…" : "Camera off"}
          </div>
        ) : (
          <VideoTrack
            trackRef={{
              participant: localParticipant,
              publication: cameraTrack,
              source: Track.Source.Camera,
            }}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {showRemoteCoHosts && remoteTracks.length > 0 ? (
        <div className="community-live-publisher-cohosts">
          {remoteTracks.map((trackRef) => (
            <div key={trackRef.publication.trackSid} className="community-live-publisher-cohost-tile">
              <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
              <span className="community-live-publisher-cohost-label">
                {trackRef.participant.name || "Co-host"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <CommunityLiveMediaControls />
    </div>
  );
}
