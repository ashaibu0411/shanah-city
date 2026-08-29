"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CommunityStatus } from "@/lib/member-types";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import {
  uploadCommunityMediaClient,
  validateCommunityStoryFile,
} from "@/lib/community-media-client";
import { inferCommunityVideoContentType } from "@/lib/community-media-shared";
import { openCommunityGalleryPicker } from "@/lib/native-media-picker";
import { readJsonResponse } from "@/lib/read-json-response";

function resolveMediaUrl(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  if (typeof window !== "undefined") {
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  }
  return url;
}

function StoryVideo({ src, fileName }: { src: string; fileName?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const mediaUrl = resolveMediaUrl(src);
  const mimeType = inferCommunityVideoContentType(fileName ?? mediaUrl);

  useEffect(() => {
    setFailed(false);
    setNeedsTap(false);
    const video = videoRef.current;
    if (!video) return;

    video.load();
    const playAttempt = video.play();
    if (playAttempt) {
      void playAttempt.catch(() => setNeedsTap(true));
    }
  }, [mediaUrl]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-white">
        <p className="text-sm text-white/80">
          This video format may not play in your browser. Try opening it directly.
        </p>
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white"
        >
          Open video
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        key={mediaUrl}
        controls
        playsInline
        muted
        autoPlay
        preload="auto"
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      >
        <source src={mediaUrl} type={mimeType} />
      </video>
      {needsTap ? (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            void video.play().then(() => setNeedsTap(false)).catch(() => setFailed(true));
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/35 text-white"
        >
          <span className="rounded-full bg-black/55 px-4 py-2 text-sm font-semibold">Tap to play</span>
        </button>
      ) : null}
    </div>
  );
}

function StatusViewer({
  status,
  onClose,
}: {
  status: CommunityStatus;
  onClose: () => void;
}) {
  const mediaUrl = resolveMediaUrl(status.mediaUrl);

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
            <StoryVideo src={status.mediaUrl} fileName={status.mediaUrl} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="h-full w-full object-contain" />
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
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch("/api/community/statuses", { cache: "no-store" })
      .then(async (response) => {
        const data = await readJsonResponse<{ error?: string; statuses?: CommunityStatus[] }>(
          response,
        );
        if (data.error) {
          setError(data.error);
          setStatuses([]);
          return;
        }
        setStatuses(data.statuses ?? []);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error ? loadError.message : "Stories are unavailable right now.",
        );
        setStatuses([]);
      });
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

  const myStatus = useMemo(
    () => (user ? grouped.find((status) => status.authorId === user.id) ?? null : null),
    [grouped, user],
  );

  const otherStatuses = useMemo(
    () => grouped.filter((status) => status.authorId !== user?.id),
    [grouped, user?.id],
  );

  async function uploadStatus(file: File) {
    if (!user) return;
    const validationError = validateCommunityStoryFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const { mediaUrl, mediaType } = await uploadCommunityMediaClient(file);
      const response = await fetch("/api/community/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl, mediaType }),
      });
      const data = await readJsonResponse<{ status?: CommunityStatus; error?: string }>(response);
      if (!response.ok) {
        setError(data.error ?? "Could not share story.");
        return;
      }
      if (!data.status) {
        setError("Could not share story.");
        return;
      }
      const savedStatus = data.status;
      setStatuses((current) => [
        savedStatus,
        ...current.filter((entry) => entry.authorId !== user.id),
      ]);
      setActiveStatus(savedStatus);
      setNotice("Story shared. Tap your photo to view it.");
      window.setTimeout(() => setNotice(""), 4000);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not share story.");
    } finally {
      setUploading(false);
    }
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
        {notice ? <p className="px-1 text-xs text-emerald-700">{notice}</p> : null}
        <div className="community-stories-row">
          <button
            type="button"
            onClick={() =>
              openCommunityGalleryPicker(
                fileRef.current,
                (files) => {
                  const file = files[0];
                  if (file) void uploadStatus(file);
                },
                { preferNativePhotoPicker: true },
              )
            }
            disabled={uploading}
            className="community-story-item"
          >
            <div className="relative">
              <CommunityAvatar
                name={user.name}
                authorId={user.id}
                size="story"
                ring={Boolean(myStatus)}
              />
              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#1877f2] text-lg font-bold leading-none text-white ring-2 ring-white">
                +
              </span>
            </div>
            <span className="community-story-label">{myStatus ? "Add story" : "Create story"}</span>
          </button>

          {myStatus ? (
            <button
              type="button"
              onClick={() => setActiveStatus(myStatus)}
              className="community-story-item"
            >
              <CommunityAvatar
                name={myStatus.authorName}
                authorId={myStatus.authorId}
                size="story"
                ring
              />
              <span className="community-story-label">Your story</span>
            </button>
          ) : null}

          {otherStatuses.map((status) => (
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
          accept="image/*,video/*,.heic,.heif,.3gp,.mp4,.mov,.webm"
          className="hidden"
        />
      </div>

      {activeStatus ? (
        <StatusViewer status={activeStatus} onClose={() => setActiveStatus(null)} />
      ) : null}
    </>
  );
}
