"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { readJsonResponse } from "@/lib/read-json-response";
import {
  CommunityLiveAudienceStage,
  CommunityLiveJoinActions,
} from "@/components/community/CommunityLiveAudienceStage";
import { CommunityLiveCommentsPanel } from "@/components/community/CommunityLiveCommentsPanel";

type CommunityLivePlayerProps = {
  statusId: string;
  authorName: string;
  authorId: string;
  viewerIsHost: boolean;
  paused: boolean;
  onLiveEnded: () => void;
};

export function CommunityLivePlayer({
  statusId,
  authorName,
  authorId,
  viewerIsHost,
  paused,
  onLiveEnded,
}: CommunityLivePlayerProps) {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const goCoHost = useCallback(() => {
    router.push(`/community/live/cohost?statusId=${encodeURIComponent(statusId)}`);
  }, [router, statusId]);

  const loadToken = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/community/live/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId, role: "viewer" }),
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
    <div className="community-story-live-stack">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={!paused}
        audio
        video={false}
        className="community-story-live-room h-full w-full min-h-0 flex-1"
        onDisconnected={() => onLiveEnded()}
      >
        <CommunityLiveAudienceStage authorName={authorName} />
        <RoomAudioRenderer />
      </LiveKitRoom>
      <div className="community-story-live-overlay">
        <CommunityLiveCommentsPanel statusId={statusId} compact className="community-story-live-comments" />
        {!viewerIsHost && authorId ? (
          <CommunityLiveJoinActions statusId={statusId} onApproved={goCoHost} />
        ) : null}
      </div>
    </div>
  );
}
