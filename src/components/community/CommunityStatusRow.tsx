"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CommunityStatus } from "@/lib/member-types";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";

function StatusViewer({
  status,
  onClose,
}: {
  status: CommunityStatus;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#050505]/95 p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white"
      >
        Close
      </button>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#242526] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <CommunityAvatar name={status.authorName} authorId={status.authorId} size="md" ring />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{status.authorName}</p>
            <p className="text-xs text-white/60">Story</p>
          </div>
        </div>
        <div className="relative aspect-[9/16] max-h-[70vh] w-full bg-black">
          {status.mediaType === "video" ? (
            <video
              src={status.mediaUrl}
              controls
              playsInline
              autoPlay
              className="h-full w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={status.mediaUrl} alt="" className="h-full w-full object-contain" />
          )}
        </div>
        {status.caption ? (
          <p className="px-3 py-2.5 text-sm text-white/90">{status.caption}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CommunityStatusRow() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statuses, setStatuses] = useState<CommunityStatus[]>([]);
  const [activeStatus, setActiveStatus] = useState<CommunityStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/community/statuses", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStatuses(data.statuses ?? []))
      .catch(() => setStatuses([]));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CommunityStatus>();
    for (const status of statuses) {
      if (!map.has(status.authorId)) {
        map.set(status.authorId, status);
      }
    }
    return Array.from(map.values());
  }, [statuses]);

  async function uploadStatus(file: File) {
    if (!user) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/community/statuses", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setUploading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not share story.");
      return;
    }
    setStatuses((current) => [data.status, ...current.filter((entry) => entry.authorId !== user.id)]);
  }

  if (!user) return null;

  return (
    <>
      <div className="community-feed-card community-stories-card">
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <p className="text-[15px] font-semibold text-[#050505]">Stories</p>
          {uploading ? <span className="text-xs text-[#65676b]">Uploading…</span> : null}
        </div>
        {error ? <p className="px-1 text-xs text-rose-600">{error}</p> : null}
        <div className="community-stories-row">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="community-story-item"
          >
            <div className="relative">
              <CommunityAvatar name={user.name} authorId={user.id} size="story" />
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#1877f2] text-lg font-bold leading-none text-white ring-2 ring-white">
                +
              </span>
            </div>
            <span className="community-story-label">Create story</span>
          </button>

          {grouped
            .filter((status) => status.authorId !== user.id)
            .map((status) => (
              <button
                key={status.id}
                type="button"
                onClick={() => setActiveStatus(status)}
                className="community-story-item"
              >
                <CommunityAvatar
                  name={status.authorName}
                  authorId={status.authorId}
                  size="story"
                  ring
                />
                <span className="community-story-label">{status.authorName.split(" ")[0]}</span>
              </button>
            ))}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadStatus(file);
          }}
        />
      </div>

      {activeStatus ? (
        <StatusViewer status={activeStatus} onClose={() => setActiveStatus(null)} />
      ) : null}
    </>
  );
}
