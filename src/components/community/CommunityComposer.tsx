"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/components/app/AppProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";
import { CommunityMediaPreviewCarousel } from "@/components/community/CommunityMediaCarousel";
import {
  uploadCommunityMediaClient,
  validateCommunityStoryFile,
} from "@/lib/community-media-client";
import { COMMUNITY_POST_MAX_MEDIA } from "@/lib/community-post-media";
import type { SignupGroupOption } from "@/lib/group-types";

type ComposerMode = "share" | "announcement";

type PendingMedia = {
  id: string;
  mediaUrl?: string;
  mediaType: "image" | "video";
  previewUrl: string;
  uploading: boolean;
};

type CommunityComposerProps = {
  onLocalPost: (post: import("@/lib/member-types").CommunityPost) => void;
};

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-[#45bd62]">
      <path d="M6.5 4.5h11A2 2 0 0 1 19.5 6.5v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Zm0 2v9.086l2.793-2.793a1 1 0 0 1 1.414 0L15.5 17.5l2-2a1 1 0 0 1 1.414 0L18.5 17.5V6.5h-12Zm3 1.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z" />
    </svg>
  );
}

function PrayerIcon() {
  return <span className="text-lg leading-none">🙏</span>;
}

function PraiseIcon() {
  return <span className="text-lg leading-none">✨</span>;
}

export function CommunityComposer({ onLocalPost }: CommunityComposerProps) {
  const { campus } = useApp();
  const { user, permissions } = useAuth();
  const canAnnounce = permissions.canManageAdmin;
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ComposerMode>("share");
  const [postType, setPostType] = useState<"prayer" | "praise">("prayer");
  const [draft, setDraft] = useState("");
  const [announcementDraft, setAnnouncementDraft] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [targetGroups, setTargetGroups] = useState<SignupGroupOption[]>([]);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!canAnnounce || !open) return;
    fetch("/api/groups/signup-options")
      .then((response) => response.json())
      .then((data) => setTargetGroups(data.groups ?? []))
      .catch(() => setTargetGroups([]));
  }, [canAnnounce, open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const mediaBusy = pendingMedia.some((item) => item.uploading);
  const uploadedMedia = pendingMedia.filter((item) => item.mediaUrl);

  function clearPendingMedia() {
    for (const item of pendingMedia) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    setPendingMedia([]);
  }

  function closeComposer() {
    setOpen(false);
    setError("");
    clearPendingMedia();
  }

  function removePendingMedia(id: string) {
    setPendingMedia((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function uploadSinglePendingMedia(id: string, file: File) {
    try {
      const { mediaUrl, mediaType } = await uploadCommunityMediaClient(file);
      setPendingMedia((current) =>
        current.map((item) =>
          item.id === id ? { ...item, mediaUrl, mediaType, uploading: false } : item,
        ),
      );
    } catch (uploadError) {
      setPendingMedia((current) => current.filter((item) => item.id !== id));
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload media.");
    }
  }

  async function addPostMediaFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const availableSlots = COMMUNITY_POST_MAX_MEDIA - pendingMedia.length;
    if (availableSlots <= 0) {
      setError(`You can attach up to ${COMMUNITY_POST_MAX_MEDIA} photos or videos.`);
      return;
    }

    const chosen = files.slice(0, availableSlots);
    setError("");

    for (const file of chosen) {
      const validationError = validateCommunityStoryFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const mediaType = file.type.startsWith("video/") || /\.(mp4|mov|webm|m4v|3gp)$/i.test(file.name)
        ? "video"
        : "image";

      setPendingMedia((current) => [
        ...current,
        {
          id,
          mediaType,
          previewUrl: URL.createObjectURL(file),
          uploading: true,
        },
      ]);

      void uploadSinglePendingMedia(id, file);
    }
  }

  async function submitSharePost() {
    if (!draft.trim() && uploadedMedia.length === 0) return;
    if (mediaBusy) return;

    setSubmitting(true);
    setError("");
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campusId: campus.id,
        content: draft.trim(),
        type: postType,
        mediaItems: uploadedMedia.map((item) => ({
          url: item.mediaUrl,
          type: item.mediaType,
        })),
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setError(data.error ?? "Could not post.");
      return;
    }
    onLocalPost(data.post);
    setDraft("");
    closeComposer();
  }

  async function submitAnnouncement() {
    if (!announcementDraft.trim()) return;
    setSubmitting(true);
    setError("");
    const selectedGroup = targetGroups.find((group) => group.id === targetGroupId);
    const response = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campusId: campus.id,
        content: announcementDraft.trim(),
        type: "announcement",
        targetGroupId: targetGroupId || undefined,
        targetGroupName: selectedGroup?.name,
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setError(data.error ?? "Could not post announcement.");
      return;
    }
    onLocalPost(data.post);
    setAnnouncementDraft("");
    setTargetGroupId("");
    closeComposer();
  }

  const composerName = user?.name ?? "friend";

  const modal = open && mounted ? (
    createPortal(
      <div className="community-composer-modal" role="dialog" aria-modal="true" aria-label="Create post">
        <button type="button" className="community-composer-backdrop" onClick={closeComposer} aria-label="Close" />
        <div className="community-composer-dialog">
          <div className="flex items-center justify-between border-b border-[#dadde1] px-4 py-3">
            <h2 className="flex-1 text-center text-[17px] font-bold text-[#050505]">Create post</h2>
            <button
              type="button"
              onClick={closeComposer}
              className="rounded-full p-2 text-[#65676b] hover:bg-[#f0f2f5]"
              aria-label="Close composer"
            >
              ✕
            </button>
          </div>

          {canAnnounce ? (
            <div className="flex gap-2 border-b border-[#dadde1] px-4 py-2">
              <button
                type="button"
                onClick={() => setMode("share")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  mode === "share" ? "bg-[#e7f3ff] text-[#1877f2]" : "text-[#65676b] hover:bg-[#f0f2f5]"
                }`}
              >
                Share
              </button>
              <button
                type="button"
                onClick={() => setMode("announcement")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  mode === "announcement"
                    ? "bg-[#e7f3ff] text-[#1877f2]"
                    : "text-[#65676b] hover:bg-[#f0f2f5]"
                }`}
              >
                Announcement
              </button>
            </div>
          ) : null}

          <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
            <div className="flex items-center gap-2.5">
              <CommunityAvatar name={composerName} authorId={user?.id} size="md" />
              <div>
                <p className="text-[15px] font-semibold text-[#050505]">{composerName}</p>
                {mode === "share" ? (
                  <div className="mt-1 flex gap-1">
                    {(["prayer", "praise"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPostType(type)}
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                          postType === type
                            ? "bg-[#e7f3ff] text-[#1877f2]"
                            : "bg-[#f0f2f5] text-[#65676b]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#65676b]">Admin announcement</p>
                )}
              </div>
            </div>

            {mode === "share" ? (
              <>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`What's on your mind, ${composerName.split(" ")[0]}?`}
                  rows={5}
                  autoFocus
                  className="mt-3 w-full resize-none border-0 bg-transparent text-[24px] leading-snug text-[#050505] outline-none placeholder:text-[#65676b]"
                />
                <CommunityMediaPreviewCarousel
                  items={pendingMedia}
                  onRemove={removePendingMedia}
                />
              </>
            ) : (
              <>
                <select
                  value={targetGroupId}
                  onChange={(event) => setTargetGroupId(event.target.value)}
                  className="mt-3 w-full rounded-lg border border-[#ccd0d5] bg-[#f0f2f5] px-3 py-2.5 text-sm outline-none focus:border-[#1877f2]"
                >
                  <option value="">All church members</option>
                  {targetGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} only
                    </option>
                  ))}
                </select>
                <textarea
                  value={announcementDraft}
                  onChange={(event) => setAnnouncementDraft(event.target.value)}
                  placeholder="Service update, event reminder, campus news..."
                  rows={5}
                  autoFocus
                  className="mt-3 w-full resize-none rounded-lg border border-[#ccd0d5] bg-[#f0f2f5] px-3 py-2.5 text-[15px] text-[#050505] outline-none focus:border-[#1877f2]"
                />
              </>
            )}

            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          </div>

          <div className="border-t border-[#dadde1] px-4 py-3">
            {mode === "share" ? (
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[15px] font-semibold text-[#050505]">Add to your post</span>
                  <p className="text-xs text-[#65676b]">
                    Up to {COMMUNITY_POST_MAX_MEDIA} photos or videos
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={mediaBusy || pendingMedia.length >= COMMUNITY_POST_MAX_MEDIA}
                  className="rounded-lg p-2 hover:bg-[#f0f2f5] disabled:opacity-50"
                  aria-label="Add photo or video"
                >
                  <PhotoIcon />
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={mode === "share" ? submitSharePost : submitAnnouncement}
              disabled={
                submitting ||
                mediaBusy ||
                (mode === "share"
                  ? !draft.trim() && uploadedMedia.length === 0
                  : !announcementDraft.trim())
              }
              className="w-full rounded-lg bg-[#1877f2] px-4 py-2.5 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#e4e6eb] disabled:text-[#bcc0c4]"
            >
              {submitting ? "Posting…" : mediaBusy ? "Uploading…" : "Post"}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  ) : null;

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      multiple
      accept="image/*,video/*,.heic,.heif,.3gp,.mp4,.mov,.webm"
      className="hidden"
      onChange={(event) => {
        const files = event.target.files;
        event.target.value = "";
        if (files?.length) {
          if (!open) setOpen(true);
          void addPostMediaFiles(files);
        }
      }}
    />
  );

  if (!user) {
    return (
      <div className="community-feed-card community-composer-bar">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/sign-in?next=/community";
          }}
          className="community-composer-trigger"
        >
          <CommunityAvatar name="Guest" size="md" />
          <span className="community-composer-placeholder">Sign in to share with the community</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="community-feed-card community-composer-bar">
        <button type="button" onClick={() => setOpen(true)} className="community-composer-trigger">
          <CommunityAvatar name={composerName} authorId={user.id} size="md" />
          <span className="community-composer-placeholder">
            What&apos;s on your mind, {composerName.split(" ")[0]}?
          </span>
        </button>

        <div className="community-composer-actions">
          <button
            type="button"
            onClick={() => {
              setMode("share");
              setPostType("prayer");
              setOpen(true);
            }}
            className="community-composer-action"
          >
            <PrayerIcon />
            <span>Prayer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("share");
              setPostType("praise");
              setOpen(true);
            }}
            className="community-composer-action"
          >
            <PraiseIcon />
            <span>Praise</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("share");
              setOpen(true);
            }}
            className="community-composer-action"
          >
            <PhotoIcon />
            <span>Photo</span>
          </button>
        </div>
      </div>

      {modal}
      {fileInput}
    </>
  );
}
