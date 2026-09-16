"use client";

import { useCallback, useState } from "react";
import { useRemoteParticipants } from "@livekit/components-react";
import { readJsonResponse } from "@/lib/read-json-response";

type CommunityLiveHostRemoteControlsProps = {
  statusId: string;
  hostUserId: string;
};

export function CommunityLiveHostRemoteControls({
  statusId,
  hostUserId,
}: CommunityLiveHostRemoteControlsProps) {
  const participants = useRemoteParticipants();
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");

  const coHosts = participants.filter((entry) => entry.identity !== hostUserId);

  const muteRemote = useCallback(
    async (guestUserId: string, source: "microphone" | "camera", muted: boolean) => {
      const key = `${guestUserId}-${source}`;
      setBusyKey(key);
      setError("");
      try {
        const response = await fetch("/api/community/live/mute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId, guestUserId, source, muted }),
        });
        const data = await readJsonResponse<{ error?: string }>(response);
        if (!response.ok) {
          setError(data.error ?? "Could not update guest media.");
        }
      } finally {
        setBusyKey("");
      }
    },
    [statusId],
  );

  if (coHosts.length === 0) {
    return null;
  }

  return (
    <div className="community-live-host-remote-panel">
      <p className="community-live-host-session-title">Guest media (host)</p>
      <ul className="community-live-host-session-list">
        {coHosts.map((participant) => {
          const micPub = [...participant.audioTrackPublications.values()][0];
          const camPub = [...participant.videoTrackPublications.values()][0];
          const micMuted = micPub?.isMuted ?? !micPub?.track;
          const camMuted = camPub?.isMuted ?? !camPub?.track;
          return (
            <li key={participant.identity} className="community-live-host-remote-row">
              <span className="community-live-host-session-name">
                {participant.name || "Co-host"}
              </span>
              <span className="community-live-host-remote-actions">
                <button
                  type="button"
                  disabled={busyKey === `${participant.identity}-microphone`}
                  className="community-live-host-session-decline"
                  onClick={() =>
                    void muteRemote(participant.identity, "microphone", !micMuted)
                  }
                >
                  {micMuted ? "Unmute mic" : "Mute mic"}
                </button>
                <button
                  type="button"
                  disabled={busyKey === `${participant.identity}-camera`}
                  className="community-live-host-session-decline"
                  onClick={() => void muteRemote(participant.identity, "camera", !camMuted)}
                >
                  {camMuted ? "Unmute video" : "Mute video"}
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      {error ? <p className="community-live-host-session-error">{error}</p> : null}
    </div>
  );
}
