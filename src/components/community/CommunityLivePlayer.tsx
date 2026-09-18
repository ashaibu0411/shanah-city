"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { readJsonResponse } from "@/lib/read-json-response";
import {
  CommunityLiveAudienceStage,
  CommunityLiveJoinActions,
} from "@/components/community/CommunityLiveAudienceStage";
import { CommunityLiveCommentsPanel } from "@/components/community/CommunityLiveCommentsPanel";
import { CommunityLivePublisherStage } from "@/components/community/CommunityLivePublisherStage";

type CommunityLivePlayerProps = {
  statusId: string;
  authorName: string;
  authorId: string;
  viewerIsHost: boolean;
  onLiveUiActiveChange?: (active: boolean) => void;
  /** Called when the viewer chooses to leave after live has ended. */
  onLiveEnded: () => void;
};

function isLiveEndedMessage(message: string | undefined) {
  if (!message) return false;
  return message.toLowerCase().includes("ended");
}

export function CommunityLiveEndedNotice({
  authorName,
  onContinue,
  continueLabel = "Continue",
}: {
  authorName?: string;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="community-story-live-ended" role="alert">
      <span className="community-story-live-ended-badge">Live ended</span>
      <p className="community-story-live-ended-title">This live is over</p>
      <p className="community-story-live-ended-body">
        {authorName
          ? `${authorName} has ended this live story.`
          : "The host has ended this live story."}
      </p>
      <button type="button" onClick={onContinue} className="community-story-live-ended-btn">
        {continueLabel}
      </button>
    </div>
  );
}

export function CommunityLivePlayer({
  statusId,
  authorName,
  authorId,
  viewerIsHost,
  onLiveUiActiveChange,
  onLiveEnded,
}: CommunityLivePlayerProps) {
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [roomRole, setRoomRole] = useState<"viewer" | "cohost">("viewer");
  const [error, setError] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [liveEnded, setLiveEnded] = useState(false);
  const ignoreNextDisconnectRef = useRef(false);
  const hasRoomCredentialsRef = useRef(false);

  const markLiveEnded = useCallback(() => {
    setLiveEnded(true);
    setToken("");
    setServerUrl("");
    hasRoomCredentialsRef.current = false;
  }, []);

  const loadToken = useCallback(
    async (role: "viewer" | "cohost", options?: { refresh?: boolean }) => {
      const refresh = options?.refresh ?? hasRoomCredentialsRef.current;
      if (refresh) {
        ignoreNextDisconnectRef.current = true;
      } else {
        setBootstrapping(true);
      }
      setError("");
      if (role === "viewer" && !refresh) {
        setLiveEnded(false);
      }
      try {
        const response = await fetch("/api/community/live/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId, role }),
        });
        const data = await readJsonResponse<{
          error?: string;
          token?: string;
          serverUrl?: string;
        }>(response);
        if (!response.ok || !data.token || !data.serverUrl) {
          if (response.status === 404 || isLiveEndedMessage(data.error)) {
            markLiveEnded();
            return;
          }
          setError(data.error ?? "Could not join this live.");
          return;
        }
        setRoomRole(role);
        setServerUrl(data.serverUrl);
        setToken(data.token);
        hasRoomCredentialsRef.current = true;
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not join live.");
      } finally {
        if (!refresh) {
          setBootstrapping(false);
        }
      }
    },
    [markLiveEnded, statusId],
  );

  const upgradeToCoHost = useCallback(async () => {
    await loadToken("cohost", { refresh: true });
  }, [loadToken]);

  useEffect(() => {
    hasRoomCredentialsRef.current = false;
    setBootstrapping(true);
    setLiveEnded(false);
    setToken("");
    setServerUrl("");
    void loadToken("viewer");
  }, [loadToken, statusId]);

  useEffect(() => {
    if (!token || liveEnded) return;
    let cancelled = false;

    async function watchLiveStatus() {
      try {
        const response = await fetch(
          `/api/community/live/session?statusId=${encodeURIComponent(statusId)}`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        if (response.status === 404) {
          const data = await readJsonResponse<{ error?: string }>(response);
          if (isLiveEndedMessage(data.error)) {
            markLiveEnded();
          }
        }
      } catch {
        // ignore
      }
    }

    void watchLiveStatus();
    const timer = window.setInterval(() => void watchLiveStatus(), 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [liveEnded, markLiveEnded, statusId, token]);

  function stopStoryGestures(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  if (liveEnded) {
    return (
      <CommunityLiveEndedNotice
        authorName={authorName}
        onContinue={() => onLiveEnded()}
        continueLabel="Next story"
      />
    );
  }

  if (bootstrapping) {
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
          onClick={() => void loadToken(roomRole)}
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
        key={`${statusId}-${roomRole}-${token.slice(0, 12)}`}
        token={token}
        serverUrl={serverUrl}
        connect
        audio
        video={roomRole === "cohost"}
        className="community-story-live-room h-full w-full min-h-0 flex-1"
        onDisconnected={() => {
          if (ignoreNextDisconnectRef.current) {
            ignoreNextDisconnectRef.current = false;
            return;
          }
          if (roomRole === "cohost") {
            void loadToken("viewer", { refresh: true });
            return;
          }
          void loadToken("viewer", { refresh: true });
        }}
      >
        {roomRole === "cohost" ? (
          <CommunityLivePublisherStage showRemoteCoHosts={false} />
        ) : (
          <CommunityLiveAudienceStage authorName={authorName} />
        )}
        <RoomAudioRenderer />
      </LiveKitRoom>
      <div
        className="community-story-live-overlay"
        onPointerDown={stopStoryGestures}
        onPointerUp={stopStoryGestures}
        onClick={stopStoryGestures}
      >
        <CommunityLiveCommentsPanel
          statusId={statusId}
          compact
          className="community-story-live-comments"
          onLiveUiActiveChange={onLiveUiActiveChange}
        />
        {!viewerIsHost && authorId ? (
          <CommunityLiveJoinActions
            statusId={statusId}
            onApproved={() => void upgradeToCoHost()}
            onLiveUiActiveChange={onLiveUiActiveChange}
          />
        ) : null}
      </div>
    </div>
  );
}
