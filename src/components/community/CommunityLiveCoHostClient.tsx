"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { readJsonResponse } from "@/lib/read-json-response";
import { CommunityLivePublisherStage } from "@/components/community/CommunityLivePublisherStage";
import { CommunityLiveCommentsPanel } from "@/components/community/CommunityLiveCommentsPanel";

export function CommunityLiveCoHostClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusId = searchParams.get("statusId")?.trim() ?? "";
  const leavingRef = useRef(false);

  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const leaveCoHost = useCallback(async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    if (statusId) {
      try {
        await fetch("/api/community/live/cohost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId, action: "leave" }),
        });
      } catch {
        // best effort
      }
    }
    router.replace("/community");
    router.refresh();
  }, [router, statusId]);

  useEffect(() => {
    if (!statusId) {
      setError("Missing live id.");
      setBusy(false);
      return;
    }

    let cancelled = false;

    async function connect() {
      setBusy(true);
      setError("");
      try {
        const sessionRes = await fetch(
          `/api/community/live/session?statusId=${encodeURIComponent(statusId)}`,
          { cache: "no-store" },
        );
        const sessionData = await readJsonResponse<{
          error?: string;
          isCoHost?: boolean;
          joinRequestState?: string;
        }>(sessionRes);
        if (cancelled) return;
        if (!sessionRes.ok) {
          setError(sessionData.error ?? "Live unavailable.");
          setBusy(false);
          return;
        }
        if (!sessionData.isCoHost && sessionData.joinRequestState !== "approved") {
          setError("The host has not approved you as a co-host yet.");
          setBusy(false);
          return;
        }

        const response = await fetch("/api/community/live/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId, role: "cohost" }),
        });
        const data = await readJsonResponse<{
          error?: string;
          token?: string;
          serverUrl?: string;
        }>(response);
        if (cancelled) return;
        if (!response.ok || !data.token || !data.serverUrl) {
          setError(data.error ?? "Could not join as co-host.");
          setBusy(false);
          return;
        }
        setServerUrl(data.serverUrl);
        setToken(data.token);
        setBusy(false);
      } catch (connectError) {
        if (!cancelled) {
          setError(connectError instanceof Error ? connectError.message : "Could not join live.");
          setBusy(false);
        }
      }
    }

    void connect();
    return () => {
      cancelled = true;
    };
  }, [statusId]);

  useEffect(() => {
    return () => {
      if (statusId && !leavingRef.current) {
        void fetch("/api/community/live/cohost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId, action: "leave" }),
          keepalive: true,
        });
      }
    };
  }, [statusId]);

  if (busy) {
    return (
      <div className="community-live-host-shell">
        <p className="text-sm text-white/85">Joining as co-host…</p>
      </div>
    );
  }

  if (error || !token || !serverUrl || !statusId) {
    return (
      <div className="community-live-host-shell">
        <p className="max-w-sm text-center text-sm text-rose-200">{error || "Live unavailable."}</p>
        <button
          type="button"
          onClick={() => router.replace("/community")}
          className="mt-4 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to community
        </button>
      </div>
    );
  }

  return (
    <div className="community-live-host-shell">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        audio
        video
        options={{ adaptiveStream: true, dynacast: true }}
        className="community-live-host-room flex h-full w-full flex-col"
        onDisconnected={() => void leaveCoHost()}
      >
        <div className="community-live-host-top">
          <span className="community-story-live-badge">LIVE</span>
          <p className="text-xs font-semibold text-white/90">Co-host · mic &amp; video controls below</p>
        </div>
        <div className="relative min-h-0 flex-1 bg-black">
          <CommunityLivePublisherStage showRemoteCoHosts={false} />
        </div>
        <CommunityLiveCommentsPanel statusId={statusId} compact />
        <div className="community-live-host-actions community-live-host-actions-split">
          <button
            type="button"
            onClick={() => void leaveCoHost()}
            className="rounded-full bg-white/15 px-6 py-3 text-sm font-bold text-white"
          >
            Leave co-host
          </button>
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
