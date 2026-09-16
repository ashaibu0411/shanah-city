"use client";

import { useCallback, useEffect, useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";

type PendingRequest = {
  userId: string;
  userName: string;
  createdAt: string;
};

type CoHostEntry = {
  userId: string;
  userName: string;
};

type CommunityLiveHostSessionPanelProps = {
  statusId: string;
};

export function CommunityLiveHostSessionPanel({ statusId }: CommunityLiveHostSessionPanelProps) {
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [coHosts, setCoHosts] = useState<CoHostEntry[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/community/live/session?statusId=${encodeURIComponent(statusId)}`,
        { cache: "no-store" },
      );
      const data = await readJsonResponse<{
        error?: string;
        pendingRequests?: PendingRequest[];
        coHosts?: CoHostEntry[];
        isHost?: boolean;
      }>(response);
      if (!response.ok || !data.isHost) return;
      setPending(data.pendingRequests ?? []);
      setCoHosts(data.coHosts ?? []);
    } catch {
      // ignore poll errors
    }
  }, [statusId]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function act(guestUserId: string, action: "approve" | "reject" | "remove") {
    setBusyId(guestUserId);
    setError("");
    try {
      const response = await fetch("/api/community/live/cohost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId, guestUserId, action }),
      });
      const data = await readJsonResponse<{ error?: string }>(response);
      if (!response.ok) {
        setError(data.error ?? "Could not update co-host.");
        return;
      }
      await refresh();
    } finally {
      setBusyId("");
    }
  }

  if (pending.length === 0 && coHosts.length === 0) {
    return null;
  }

  return (
    <div className="community-live-host-session-panel">
      {pending.length > 0 ? (
        <div className="community-live-host-session-block">
          <p className="community-live-host-session-title">Join requests</p>
          <ul className="community-live-host-session-list">
            {pending.map((entry) => (
              <li key={entry.userId} className="community-live-host-session-row">
                <span className="community-live-host-session-name">{entry.userName}</span>
                <span className="community-live-host-session-actions">
                  <button
                    type="button"
                    disabled={busyId === entry.userId}
                    className="community-live-host-session-approve"
                    onClick={() => void act(entry.userId, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === entry.userId}
                    className="community-live-host-session-decline"
                    onClick={() => void act(entry.userId, "reject")}
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {coHosts.length > 0 ? (
        <div className="community-live-host-session-block">
          <p className="community-live-host-session-title">Co-hosts on camera</p>
          <ul className="community-live-host-session-list">
            {coHosts.map((entry) => (
              <li key={entry.userId} className="community-live-host-session-row">
                <span className="community-live-host-session-name">{entry.userName}</span>
                <button
                  type="button"
                  disabled={busyId === entry.userId}
                  className="community-live-host-session-decline"
                  onClick={() => void act(entry.userId, "remove")}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p className="community-live-host-session-error">{error}</p> : null}
    </div>
  );
}
