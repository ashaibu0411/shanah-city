"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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

export function CommunityStatusRow() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [statuses, setStatuses] = useState<CommunityStatus[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => loadSeenStoryIds());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState({ deckIndex: 0, slideIndex: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSeenIds(loadSeenStoryIds());
  }, []);

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

  const decks = useMemo(
    () => buildStoryDecks(statuses, seenIds, user?.id),
    [seenIds, statuses, user?.id],
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
        void uploadStatuses(files);
      },
      { preferNativePhotoPicker: true },
    );
  }

  function openViewer(deckIndex: number, slideIndex = 0) {
    setViewerStart({ deckIndex, slideIndex });
    setViewerOpen(true);
  }

  async function uploadStatuses(fileList: File[]) {
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
        const response = await fetch("/api/community/statuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaUrl, mediaType }),
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
      const nextDecks = buildStoryDecks(next, seenIds, user.id);
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

  return (
    <>
      <div className="community-feed-card community-stories-card">
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <p className="text-[15px] font-semibold text-[#050505]">Stories</p>
          {uploading ? <span className="text-xs text-[#65676b]">{uploadLabel}</span> : null}
        </div>
        {error ? <p className="px-1 text-xs text-rose-600">{error}</p> : null}
        {notice ? <p className="px-1 text-xs text-emerald-700">{notice}</p> : null}
        <div className="community-stories-row">
          <CommunityStoryRing
            authorName={user.name}
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
        />
      ) : null}
    </>
  );
}
