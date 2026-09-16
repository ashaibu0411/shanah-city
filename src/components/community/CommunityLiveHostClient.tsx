"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { readJsonResponse } from "@/lib/read-json-response";
import { CommunityLiveHostStage } from "@/components/community/CommunityLiveHostStage";

export function CommunityLiveHostClient() {
  const router = useRouter();
  const endingRef = useRef(false);
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [statusId, setStatusId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  const endLive = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    if (statusId) {
      try {
        await fetch("/api/community/live/start", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId }),
        });
      } catch {
        // Best effort end.
      }
    }
    router.replace("/community");
    router.refresh();
  }, [router, statusId]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/community/live/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption: "Live now" }),
        });
        const data = await readJsonResponse<{
          error?: string;
          token?: string;
          serverUrl?: string;
          status?: { id: string };
        }>(response);
        if (cancelled) return;
        if (!response.ok || !data.token || !data.serverUrl || !data.status?.id) {
          setError(data.error ?? "Could not go live.");
          setBusy(false);
          return;
        }
        setServerUrl(data.serverUrl);
        setToken(data.token);
        setStatusId(data.status.id);
        setBusy(false);
      } catch (startError) {
        if (!cancelled) {
          setError(startError instanceof Error ? startError.message : "Could not go live.");
          setBusy(false);
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (statusId && !endingRef.current) {
        void fetch("/api/community/live/start", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId }),
          keepalive: true,
        });
      }
    };
  }, [statusId]);

  if (busy) {
    return (
      <div className="community-live-host-shell">
        <p className="text-sm text-white/85">Starting your live story…</p>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
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
        options={{
          adaptiveStream: true,
          dynacast: true,
        }}
        className="community-live-host-room flex h-full w-full flex-col"
        onDisconnected={() => void endLive()}
      >
        <div className="community-live-host-top">
          <span className="community-story-live-badge">LIVE</span>
          <p className="text-xs font-semibold text-white/90">Your story · church family can join</p>
        </div>
        <div className="relative min-h-0 flex-1 bg-black">
          <CommunityLiveHostStage />
        </div>
        <div className="community-live-host-actions">
          <button
            type="button"
            onClick={() => void endLive()}
            className="rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg"
          >
            End live
          </button>
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}
