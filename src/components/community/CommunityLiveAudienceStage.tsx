"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useConnectionState,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";

export function CommunityLiveAudienceStage({ authorName }: { authorName: string }) {
  const connectionState = useConnectionState();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true }).filter(
    (entry) =>
      !entry.participant.isLocal &&
      entry.publication?.kind === Track.Kind.Video &&
      !entry.publication.isMuted,
  );

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="community-story-live-waiting">
        <span className="community-story-live-badge">LIVE</span>
        <p className="mt-4 text-sm text-white/85">Connecting to {authorName}&apos;s live…</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="community-story-live-waiting">
        <span className="community-story-live-badge">LIVE</span>
        <p className="mt-4 text-sm text-white/85">Waiting for video…</p>
      </div>
    );
  }

  if (tracks.length === 1) {
    return <VideoTrack trackRef={tracks[0]} className="h-full w-full object-cover" />;
  }

  return (
    <div className="community-live-audience-grid">
      {tracks.map((trackRef) => (
        <div key={trackRef.publication.trackSid} className="community-live-audience-grid-cell">
          <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
          <span className="community-live-audience-name">
            {trackRef.participant.name || "Live"}
          </span>
        </div>
      ))}
    </div>
  );
}

type CommunityLiveJoinActionsProps = {
  statusId: string;
  onApproved: () => void;
};

export function CommunityLiveJoinActions({ statusId, onApproved }: CommunityLiveJoinActionsProps) {
  const [state, setState] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/community/live/session?statusId=${encodeURIComponent(statusId)}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) return;
      const next = data.joinRequestState ?? "none";
      if (next === "approved" || data.isCoHost) {
        setState("approved");
        onApproved();
        return;
      }
      if (next === "pending" || next === "rejected" || next === "none") {
        setState(next);
      }
    } catch {
      // ignore
    }
  }, [onApproved, statusId]);

  useEffect(() => {
    void refreshSession();
    const timer = window.setInterval(() => void refreshSession(), 3000);
    return () => window.clearInterval(timer);
  }, [refreshSession]);

  async function requestJoin() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/live/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not request to join.");
        return;
      }
      setState("pending");
      setMessage("Request sent — waiting for host approval.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "approved") {
    return (
      <p className="community-live-join-msg">Approved — opening co-host…</p>
    );
  }

  return (
    <div className="community-live-join-actions">
      {state === "pending" ? (
        <p className="community-live-join-msg">Waiting for host to approve…</p>
      ) : (
        <button
          type="button"
          disabled={busy || state === "rejected"}
          onClick={() => void requestJoin()}
          className="community-live-join-btn"
        >
          Request to join live
        </button>
      )}
      {state === "rejected" ? (
        <p className="community-live-join-msg">Host declined this request.</p>
      ) : null}
      {message ? <p className="community-live-join-msg">{message}</p> : null}
    </div>
  );
}
