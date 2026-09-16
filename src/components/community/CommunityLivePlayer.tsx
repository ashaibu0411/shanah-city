"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { readJsonResponse } from "@/lib/read-json-response";

type CommunityLivePlayerProps = {
  statusId: string;
  authorName: string;
  paused: boolean;
  onLiveEnded: () => void;
};

function LiveViewerStage({ authorName }: { authorName: string }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: true,
  });
  const videoTrack = tracks.find((entry) => entry.publication.kind === Track.Kind.Video);

  if (!videoTrack) {
    return (
      <div className="community-story-live-waiting">
        <span className="community-story-live-badge">LIVE</span>
        <p className="mt-4 text-sm text-white/85">Connecting to {authorName}&apos;s live…</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={videoTrack}
      className="h-full w-full object-cover"
    />
  );
}

export function CommunityLivePlayer({
  statusId,
  authorName,
  paused,
  onLiveEnded,
}: CommunityLivePlayerProps) {
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadToken = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/community/live/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
      const data = await readJsonResponse<{
        error?: string;
        token?: string;
        serverUrl?: string;
      }>(response);
      if (!response.ok || !data.token || !data.serverUrl) {
        if (response.status === 404) {
          onLiveEnded();
          return;
        }
        setError(data.error ?? "Could not join this live.");
        return;
      }
      setServerUrl(data.serverUrl);
      setToken(data.token);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not join live.");
    } finally {
      setLoading(false);
    }
  }, [onLiveEnded, statusId]);

  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  if (loading) {
    return (
      <div className="community-story-live-waiting">
        <span className="community-story-live-badge">LIVE</span>
        <p className="mt-4 text-sm text-white/85">Joining live…</p>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="community-story-live-waiting">
        <p className="text-sm text-rose-200">{error || "Live unavailable."}</p>
        <button
          type="button"
          onClick={() => void loadToken()}
          className="mt-3 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={!paused}
      audio
      video={false}
      className="community-story-live-room h-full w-full"
      onDisconnected={() => onLiveEnded()}
    >
      <LiveViewerStage authorName={authorName} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}
