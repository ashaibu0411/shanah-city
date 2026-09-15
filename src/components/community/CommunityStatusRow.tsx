"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPublicDisplayName } from "@/lib/member-display-name";
import { CommunityStoryRing } from "@/components/community/CommunityStoryRing";
import { CommunityStoryViewer } from "@/components/community/CommunityStoryViewer";
import type { CommunityStatus, CommunityStatusStoryKind } from "@/lib/member-types";
import {
  defaultServiceInviteCaption,
  getNextWorshipService,
} from "@/lib/community-worship-service";
import {
  uploadCommunityMediaClient,
  validateCommunityStoryFile,
} from "@/lib/community-media-client";
import { validateCommunityStoryVideoFile } from "@/lib/community-story-video-client";
import { isCommunityVideoFile } from "@/lib/community-media-shared";
import { openCommunityGalleryPicker } from "@/lib/native-media-picker";
import { readJsonResponse } from "@/lib/read-json-response";
import {
  buildStoryDecks,
  COMMUNITY_STORY_MAX_MEDIA,
  findDeckIndex,
  loadSeenStoryIds,
  markStoriesSeen,
} from "@/lib/community-story-utils";
import { normalizeStorySocialLink } from "@/lib/community-story-link-shared";

type CommunityStatusRowProps = {
  variant?: "feed" | "home";
};

type ComposeMode = "media" | "text" | "service" | "link";

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
  const [composeMode, setComposeMode] = useState<ComposeMode>("media");
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextService = useMemo(() => getNextWorshipService(), []);

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

  function openShareMenu() {
    setShareMenuOpen(true);
  }

  function closeShareMenu() {
    setShareMenuOpen(false);
  }

  function openMediaPicker() {
    closeShareMenu();
    openCommunityGalleryPicker(
      fileRef.current,
      (files) => {
        if (files.length === 0) return;
        setComposeMode("media");
        setPendingFiles(files);
        setCaptionDraft("");
        setCaptionOpen(true);
      },
      { preferNativePhotoPicker: true },
    );
  }

  function openTextComposer() {
    closeShareMenu();
    setComposeMode("text");
    setPendingFiles([]);
    setCaptionDraft("");
    setCaptionOpen(true);
  }

  function openServiceComposer() {
    closeShareMenu();
    setComposeMode("service");
    setPendingFiles([]);
    setLinkDraft("");
    setCaptionDraft(defaultServiceInviteCaption());
    setCaptionOpen(true);
  }

  function openLinkComposer() {
    closeShareMenu();
    setComposeMode("link");
    setPendingFiles([]);
    setCaptionDraft("");
    setLinkDraft("");
    setCaptionOpen(true);
  }

  function closeComposeDialog() {
    setCaptionOpen(false);
    setPendingFiles([]);
    setCaptionDraft("");
    setLinkDraft("");
    setComposeMode("media");
  }

  function confirmComposeAndShare() {
    if (composeMode === "media") {
      const files = pendingFiles;
      const caption = captionDraft.trim();
      closeComposeDialog();
      void uploadStatuses(files, caption || undefined);
      return;
    }

    if (composeMode === "link") {
      const rawLink = linkDraft.trim();
      if (!rawLink) {
        setError("Paste the link from Instagram or another social app.");
        return;
      }
      try {
        normalizeStorySocialLink(rawLink);
      } catch (linkError) {
        setError(linkError instanceof Error ? linkError.message : "Invalid link.");
        return;
      }
      const note = captionDraft.trim();
      closeComposeDialog();
      void postLinkMoment({ linkUrl: rawLink, caption: note || undefined });
      return;
    }

    const caption = captionDraft.trim();
    if (!caption) {
      setError(composeMode === "text" ? "Write something for your moment." : "Add a note for your invite.");
      return;
    }

    const storyKind: CommunityStatusStoryKind =
      composeMode === "service" ? "service_invite" : "default";
    closeComposeDialog();
    void postWrittenMoment({ caption, storyKind });
  }

  function openViewer(deckIndex: number, slideIndex = 0) {
    setViewerStart({ deckIndex, slideIndex });
    setViewerOpen(true);
  }

  async function postLinkMoment(input: { linkUrl: string; caption?: string }) {
    if (!user) return;

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/community/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: "link",
          linkUrl: input.linkUrl,
          caption: input.caption,
        }),
      });
      const data = await readJsonResponse<{ status?: CommunityStatus; error?: string }>(response);
      if (!response.ok || !data.status) {
        setError(data.error ?? "Could not share link.");
        return;
      }
      applySavedStatuses([data.status]);
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Could not share link.");
    } finally {
      setUploading(false);
    }
  }

  async function postWrittenMoment(input: {
    caption: string;
    storyKind?: CommunityStatusStoryKind;
  }) {
    if (!user) return;

    setUploading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/community/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: "text",
          caption: input.caption,
          storyKind: input.storyKind ?? "default",
        }),
      });
      const data = await readJsonResponse<{ status?: CommunityStatus; error?: string }>(response);
      if (!response.ok || !data.status) {
        setError(data.error ?? "Could not share story.");
        return;
      }
      applySavedStatuses([data.status]);
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : "Could not share story.");
    } finally {
      setUploading(false);
    }
  }

  function applySavedStatuses(savedStatuses: CommunityStatus[]) {
    if (!user || savedStatuses.length === 0) return;

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

      const validationError = isCommunityVideoFile(file)
        ? await validateCommunityStoryVideoFile(file)
        : validateCommunityStoryFile(file);
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

    applySavedStatuses(savedStatuses);
  }

  if (!user) return null;

  const uploadLabel =
    uploadProgress && uploadProgress.total > 1
      ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}…`
      : "Uploading…";

  const cardClass =
    variant === "home"
      ? "community-stories-strip community-stories-strip-home"
      : "community-stories-strip";

  const composeDialogOpen =
    captionOpen &&
    mounted &&
    (composeMode === "link" ||
      composeMode === "text" ||
      composeMode === "service" ||
      (composeMode === "media" && pendingFiles.length > 0));

  const shareMenu =
    shareMenuOpen && mounted
      ? createPortal(
          <div
            className="community-composer-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Share a moment"
          >
            <button
              type="button"
              className="community-composer-backdrop"
              onClick={closeShareMenu}
              aria-label="Close"
            />
            <div className="community-composer-dialog community-story-share-menu">
              <div className="border-b border-night-900/10 px-4 py-3 dark:border-white/10">
                <h2 className="text-center font-display text-[17px] font-bold text-night-900 dark:text-sand-100">
                  Share a moment
                </h2>
                <p className="mt-1 text-center text-xs text-night-600 dark:text-sand-300">
                  Visible to the whole church family · gone in 24 hours
                </p>
              </div>
              <div className="flex flex-col gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={openMediaPicker}
                  className="rounded-xl border border-night-900/10 px-4 py-3 text-left hover:bg-sand-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <p className="font-semibold text-night-900 dark:text-sand-100">Photo, video, or audio</p>
                  <p className="text-xs text-night-600 dark:text-sand-400">
                    Worship clip, voice note, music snippet (MP3, M4A…)
                  </p>
                </button>
                <button
                  type="button"
                  onClick={openTextComposer}
                  className="rounded-xl border border-night-900/10 px-4 py-3 text-left hover:bg-sand-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <p className="font-semibold text-night-900 dark:text-sand-100">Text moment</p>
                  <p className="text-xs text-night-600 dark:text-sand-400">Prayer ask, verse, “on my way”…</p>
                </button>
                <button
                  type="button"
                  onClick={openServiceComposer}
                  className="rounded-xl border border-clay-500/30 bg-clay-500/5 px-4 py-3 text-left hover:bg-clay-500/10"
                >
                  <p className="font-semibold text-night-900 dark:text-sand-100">
                    Who&apos;s going to {nextService.title.toLowerCase()}?
                  </p>
                  <p className="text-xs text-night-600 dark:text-sand-400">
                    Next up: {nextService.scheduleLabel} · friends tap &quot;I&apos;m going&quot;
                  </p>
                </button>
                <button
                  type="button"
                  onClick={openLinkComposer}
                  className="rounded-xl border border-night-900/10 px-4 py-3 text-left hover:bg-sand-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <p className="font-semibold text-night-900 dark:text-sand-100">Social link</p>
                  <p className="text-xs text-night-600 dark:text-sand-400">
                    Instagram, TikTok, Facebook, YouTube — plays here when possible
                  </p>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const captionDialog = composeDialogOpen
      ? createPortal(
          <div
            className="community-composer-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Share moment"
          >
            <button
              type="button"
              className="community-composer-backdrop"
              onClick={closeComposeDialog}
              aria-label="Close"
            />
            <div className="community-composer-dialog community-story-caption-dialog">
              <div className="flex items-center justify-between border-b border-night-900/10 px-4 py-3 dark:border-white/10">
                <h2 className="flex-1 text-center font-display text-[17px] font-bold text-night-900 dark:text-sand-100">
                  {composeMode === "service"
                    ? "Service invite"
                    : composeMode === "text"
                      ? "Text moment"
                      : composeMode === "link"
                        ? "Social link"
                        : "Share moment"}
                </h2>
                <button
                  type="button"
                  onClick={closeComposeDialog}
                  className="rounded-full p-2 text-night-600 hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="px-4 py-3">
                {composeMode === "media" ? (
                  <p className="text-sm text-night-600 dark:text-sand-300">
                    {pendingFiles.length === 1
                      ? "Add an optional caption (shown on your story and in push previews)."
                      : `Sharing ${Math.min(pendingFiles.length, COMMUNITY_STORY_MAX_MEDIA)} items — caption applies to the first only.`}
                  </p>
                ) : composeMode === "service" ? (
                  <p className="text-sm text-night-600 dark:text-sand-300">
                    Invite the church family to {nextService.scheduleLabel}. People can tap
                    &quot;I&apos;m going&quot; on your moment.
                  </p>
                ) : composeMode === "link" ? (
                  <p className="text-sm text-night-600 dark:text-sand-300">
                    Paste a share link from <strong>Instagram</strong>, <strong>TikTok</strong>,{" "}
                    <strong>Facebook</strong>, or <strong>YouTube</strong>. Clips that can embed
                    play inside the app; everything else opens in that app or your browser.
                  </p>
                ) : (
                  <p className="text-sm text-night-600 dark:text-sand-300">
                    Share a short note the whole church family can see for 24 hours.
                  </p>
                )}
                {composeMode === "link" ? (
                  <input
                    type="url"
                    inputMode="url"
                    value={linkDraft}
                    onChange={(event) => setLinkDraft(event.target.value)}
                    placeholder="https://instagram.com/… · tiktok.com/… · facebook.com/…"
                    className="community-story-caption-input mt-3 w-full rounded-xl border border-night-900/12 bg-white px-3 py-2.5 text-[15px] text-night-900 placeholder:text-night-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20 dark:border-white/15 dark:bg-night-900 dark:text-sand-100"
                    autoFocus
                  />
                ) : null}
                <textarea
                  value={captionDraft}
                  onChange={(event) => setCaptionDraft(event.target.value.slice(0, 200))}
                  rows={composeMode === "text" ? 4 : composeMode === "link" ? 2 : 3}
                  maxLength={200}
                  placeholder={
                    composeMode === "service"
                      ? nextService.inviteHeadline
                      : composeMode === "text"
                        ? "Need prayer, on my way, grabbing food after…"
                        : composeMode === "link"
                          ? "Optional note (e.g. Come see our Friday worship reel)"
                          : "What's on your heart?"
                  }
                  className={`community-story-caption-input w-full resize-none rounded-xl border border-night-900/12 bg-white px-3 py-2.5 text-[15px] text-night-900 placeholder:text-night-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20 dark:border-white/15 dark:bg-night-900 dark:text-sand-100 ${composeMode === "link" ? "mt-2" : "mt-3"}`}
                  autoFocus={composeMode !== "link"}
                />
                <p className="mt-1 text-right text-xs text-night-500 dark:text-sand-400">
                  {captionDraft.length}/200
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={closeComposeDialog}
                    className="flex-1 rounded-xl border border-night-900/12 px-4 py-2.5 text-sm font-semibold text-night-700 hover:bg-sand-50 dark:border-white/15 dark:text-sand-200 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmComposeAndShare}
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
      {shareMenu}
      {captionDialog}
      <div className={cardClass}>
        {variant === "feed" && uploading ? (
          <p className="community-stories-status text-xs text-night-600 dark:text-sand-400">{uploadLabel}</p>
        ) : null}
        {error ? <p className="community-stories-status text-xs text-rose-600">{error}</p> : null}
        {notice ? <p className="community-stories-status text-xs text-emerald-700">{notice}</p> : null}
        <div className="community-stories-row">
          <CommunityStoryRing
            authorName={getPublicDisplayName(user)}
            authorId={user.id}
            preview={myDeck?.previewItem ?? null}
            hasUnseen={myDeck?.hasUnseen ?? false}
            showAddBadge
            disabled={uploading}
            label="Your story"
            onPress={() => {
              if (myDeck) {
                openViewer(findDeckIndex(decks, user.id));
              } else {
                openShareMenu();
              }
            }}
            onAddPress={openShareMenu}
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
          accept="image/*,video/*,audio/*,.heic,.heif,.3gp,.mp4,.mov,.webm,.mp3,.m4a,.aac,.wav,.ogg"
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
