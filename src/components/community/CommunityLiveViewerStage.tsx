"use client";

import {
  useConnectionState,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";

export function CommunityLiveViewerStage({ authorName }: { authorName: string }) {
  const connectionState = useConnectionState();
  const tracks = useTracks([Track.Source.Camera], {
    onlySubscribed: true,
  });

  const hostVideo = tracks.find(
    (entry) =>
      !entry.participant.isLocal &&
      entry.publication &&
      !entry.publication.isMuted &&
      entry.publication.kind === Track.Kind.Video,
  );

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="community-story-live-waiting">
        <span className="community-story-live-badge">LIVE</span>
        <p className="mt-4 text-sm text-white/85">Connecting to {authorName}&apos;s live…</p>
      </div>
    );
  }

  if (!hostVideo) {
    return (
      <div className="community-story-live-waiting">
        <span className="community-story-live-badge">LIVE</span>
        <p className="mt-4 text-sm text-white/85">Waiting for {authorName}&apos;s video…</p>
        <p className="mt-2 text-xs text-white/60">They may still be allowing camera access.</p>
      </div>
    );
  }

  return <VideoTrack trackRef={hostVideo} className="h-full w-full object-cover" />;
}
