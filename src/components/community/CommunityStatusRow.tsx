"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { CommunityStoryRing } from "@/components/community/CommunityStoryRing";
import { CommunityStoryViewer } from "@/components/community/CommunityStoryViewer";
import type { CommunityStatus } from "@/lib/member-types";
import {
  uploadCommunityMediaClient,
  validateCommunityStoryFile,
} from "@/lib/community-media-client";
import { openCommunityGalleryPicker } from "@/lib/native-media-picker";
import { readJsonResponse } from "@/lib/read-json-response";
import {
  buildStoryDecks,
  COMMUNITY_STORY_MAX_MEDIA,
  findDeckIndex,
  loadSeenStoryIds,
  markStoriesSeen,
} from "@/lib/community-story-utils";

type CommunityStatusRowProps = {
  variant?: "feed" | "home";
};

export function CommunityStatusRow({ variant = "feed" }: CommunityStatusRowProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statuses, setStatuses] = useState<CommunityStatus[]>([]);
  const [priorityAuthorIds, setPriorityAuthorIds] = useState<string[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => loadSeenStoryIds());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState({ deckIndex: 0, slideIndex: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [captionOpen, setCaptionOpen] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSeenIds(loadSeenStoryIds());
  }, []);

  useEffect(() => {
    fetch("/api/community/statuses", { cache: "no-store" })
      .then(async (response) => {
        const data = await readJsonResponse<{
          error?: string;
          statuses?: CommunityStatus[];
          priorityAuthorIds?: string[];
        }>(response);
        if (data.error) {
          setError(data.error);
          setStatuses([]);
          setPriorityAuthorIds([]);
          return;
        }
        setStatuses(data.statuses ?? []);
        setPriorityAuthorIds(data.priorityAuthorIds ?? []);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error ? loadError.message : "Stories are unavailable right now.",
        );
        setStatuses([]);
      });
  }, []);

  const decks = useMemo(
    () => buildStoryDecks(statuses, seenIds, user?.id, priorityAuthorIds),
    [seenIds, statuses, user?.id, priorityAuthorIds],
  );

  const myDeck = useMemo(
    () => (user ? decks.find((deck) => deck.authorId === user.id) ?? null : null),
    [decks, user],
  );

  const otherDecks = useMemo(
    () => decks.filter((deck) => deck.authorId !== user?.id),
    [decks, user?.id],
  );

  function openPicker() {
    openCommunityGalleryPicker(
      fileRef.current,
      (files) => {
        if (files.length === 0) return;
        setPendingFiles(files);
        setCaptionDraft("");
        setCaptionOpen(true);
      },
      { preferNativePhotoPicker: true },
    );
  }

  function closeCaptionDialog() {
    setCaptionOpen(false);
    setPendingFiles([]);
    setCaptionDraft("");
  }

  function confirmCaptionAndUpload() {
    const files = pendingFiles;
    const caption = captionDraft.trim();
    closeCaptionDialog();
    void uploadStatuses(files, caption || undefined);
  }

  function openViewer(deckIndex: number, slideIndex = 0) {
    setViewerStart({ deckIndex, slideIndex });
    setViewerOpen(true);
  }

  async function uploadStatuses(fileList: File[], caption?: string) {
    if (!user || fileList.length === 0) return;

    const files = fileList.slice(0, COMMUNITY_STORY_MAX_MEDIA);
    if (fileList.length > COMMUNITY_STORY_MAX_MEDIA) {
      setNotice(`Only the first ${COMMUNITY_STORY_MAX_MEDIA} files were added.`);
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    setError("");
    if (fileList.length <= COMMUNITY_STORY_MAX_MEDIA) {
      setNotice("");
    }

    const savedStatuses: CommunityStatus[] = [];
    let lastError = "";

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setUploadProgress({ current: index + 1, total: files.length });

      const validationError = validateCommunityStoryFile(file);
      if (validationError) {
        lastError = validationError;
        continue;
      }

      try {
        const { mediaUrl, mediaType } = await uploadCommunityMediaClient(file);
        const statusCaption = index === 0 ? caption : undefined;
        const response = await fetch("/api/community/statuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaUrl, mediaType, caption: statusCaption }),
        });
        const data = await readJsonResponse<{ status?: CommunityStatus; error?: string }>(response);
        if (!response.ok || !data.status) {
          lastError = data.error ?? "Could not share story.";
          break;
        }
        savedStatuses.push(data.status);
      } catch (uploadError) {
        lastError =
          uploadError instanceof Error ? uploadError.message : "Could not share story.";
        break;
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (savedStatuses.length === 0) {
      setError(lastError || "Could not share story.");
      return;
    }

    if (lastError) {
      setError(
        savedStatuses.length === 1
          ? lastError
          : `${savedStatuses.length} stories shared, then upload stopped: ${lastError}`,
      );
    } else if (savedStatuses.length > 1) {
      setNotice(`${savedStatuses.length} stories shared.`);
      window.setTimeout(() => setNotice(""), 4000);
    }

    const firstSaved = savedStatuses[0];
    setStatuses((current) => {
      const next = [...savedStatuses.toReversed(), ...current];
      const nextDecks = buildStoryDecks(next, seenIds, user.id, priorityAuthorIds);
      const myDeckIndex = findDeckIndex(nextDecks, user.id);
      const myDeckItems = nextDecks[myDeckIndex]?.items ?? [];
      const slideIndex = Math.max(
        0,
        myDeckItems.findIndex((item) => item.id === firstSaved.id),
      );
      setViewerStart({ deckIndex: Math.max(0, myDeckIndex), slideIndex });
      setViewerOpen(true);
      return next;
    });
  }

  if (!user) return null;

  const uploadLabel =
    uploadProgress && uploadProgress.total > 1
      ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…`
      : "Uploading…";

  const cardClass =
    variant === "home"
      ? "community-stories-card community-stories-card-home border-0 bg-transparent shadow-none"
      : "community-feed-card community-stories-card";

  const captionDialog =
    captionOpen && mounted && pendingFiles.length > 0
      ? createPortal(
          <div
            className="community-composer-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add a caption to your moment"
          >
            <button
              type="button"
              className="community-composer-backdrop"
              onClick={closeCaptionDialog}
              aria-label="Close"
            />
            <div className="community-composer-dialog community-story-caption-dialog">
              <div className="flex items-center justify-between border-b border-night-900/10 px-4 py-3 dark:border-white/10">
                <h2 className="flex-1 text-center font-display text-[17px] font-bold text-night-900 dark:text-sand-100">
                  Share moment
                </h2>
                <button
                  type="button"
                  onClick={closeCaptionDialog}
                  className="rounded-full p-2 text-night-600 hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-night-600 dark:text-sand-300">
                  {pendingFiles.length === 1
                    ? "Add an optional caption (shown on your story and in push previews)."
                    : `Sharing ${Math.min(pendingFiles.length, COMMUNITY_STORY_MAX_MEDIA)} items — caption applies to the first only.`}
                </p>
                <textarea
                  value={captionDraft}
                  onChange={(event) => setCaptionDraft(event.target.value.slice(0, 200))}
                  rows={3}
                  maxLength={200}
                  placeholder="What's on your heart?"
                  className="community-story-caption-input mt-3 w-full resize-none rounded-xl border border-night-900/12 bg-white px-3 py-2.5 text-[15px] text-night-900 placeholder:text-night-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20 dark:border-white/15 dark:bg-night-900 dark:text-sand-100"
                  autoFocus
                />
                <p className="mt-1 text-right text-xs text-night-500 dark:text-sand-400">
                  {captionDraft.length}/200
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={closeCaptionDialog}
                    className="flex-1 rounded-xl border border-night-900/12 px-4 py-2.5 text-sm font-semibold text-night-700 hover:bg-sand-50 dark:border-white/15 dark:text-sand-200 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmCaptionAndUpload}
                    className="flex-1 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-clay-700"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {captionDialog}
      <div className={cardClass}>
        {variant === "feed" ? (
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <p className="text-[15px] font-semibold text-night-900 font-display">Stories</p>
            {uploading ? <span className="text-xs text-night-600">{uploadLabel}</span> : null}
          </div>
        ) : null}
        {variant === "feed" ? (
          <p className="px-1 pb-1 text-xs text-night-600">
            Your groups and message friends appear first · gone in 24h
          </p>
        ) : null}
        {error ? <p className="px-1 text-xs text-rose-600">{error}</p> : null}
        {notice ? <p className="px-1 text-xs text-emerald-700">{notice}</p> : null}
        <div className="community-stories-row">
          <CommunityStoryRing
            authorName={getPublicDisplayName(user)}
            authorId={user.id}
            preview={myDeck?.previewItem ?? null}
            hasUnseen={Boolean(myDeck)}
            showAddBadge
            disabled={uploading}
            label="Your story"
            onPress={() => {
              if (myDeck) {
                openViewer(findDeckIndex(decks, user.id));
              } else {
                openPicker();
              }
            }}
            onAddPress={openPicker}
          />

          {otherDecks.map((deck) => {
            const deckIndex = findDeckIndex(decks, deck.authorId);
            return (
              <CommunityStoryRing
                key={deck.authorId}
                authorName={deck.authorName}
                authorId={deck.authorId}
                preview={deck.previewItem}
                hasUnseen={deck.hasUnseen}
                label={deck.authorName.split(" ")[0] ?? deck.authorName}
                onPress={() => openViewer(deckIndex)}
              />
            );
          })}
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,.heic,.heif,.3gp,.mp4,.mov,.webm"
          className="hidden"
        />
      </div>

      {viewerOpen && decks.length > 0 ? (
        <CommunityStoryViewer
          decks={decks}
          initialDeckIndex={viewerStart.deckIndex}
          initialSlideIndex={viewerStart.slideIndex}
          currentUserId={user.id}
          onClose={() => setViewerOpen(false)}
          onStoriesSeen={(ids) => {
            setSeenIds((current) => markStoriesSeen(ids, current));
          }}
          onStoryDeleted={(statusId) => {
            setStatuses((current) => current.filter((status) => status.id !== statusId));
          }}
          onStatusReactionChange={(statusId, reactions, viewerReactions) => {
            setStatuses((current) =>
              current.map((status) =>
                status.id === statusId
                  ? { ...status, reactions, viewerReactions }
                  : status,
              ),
            );
          }}
        />
      ) : null}
    </>
  );
}
