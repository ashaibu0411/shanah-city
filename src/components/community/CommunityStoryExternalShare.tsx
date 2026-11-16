"use client";

import { useEffect, useState } from "react";
import type { CommunityStatus } from "@/lib/member-types";
import { resolveStoryMediaUrl } from "@/lib/community-story-utils";

function storyUrl(id: string) {
  return new URL("/community?story=" + encodeURIComponent(id), window.location.origin).toString();
}

/**
 * External sharing deliberately uses a link for all stories.
 * A native media export is offered only for the authenticated poster's own
 * image/video, and exports the original uploaded file without any music layer.
 */
export function CommunityStoryExternalShare({
  slide,
  mayExport,
  onDismiss,
}: {
  slide: CommunityStatus;
  mayExport: boolean;
  onDismiss: () => void;
}) {
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(true);
  const link = typeof window === "undefined" ? "" : storyUrl(slide.id);
  const eligibleMedia = mayExport &&
    (slide.mediaType === "image" || slide.mediaType === "video") &&
    Boolean(slide.mediaUrl);
  const caption = "See this Shanah City Story (available for 24 hours; church app sign-in required): ";
  const whatsapp = "https://wa.me/?text=" + encodeURIComponent(caption + link);

  // Prefetch the original media as the share panel opens. iPhone Safari
  // requires navigator.share() to run in the direct click gesture.
  useEffect(() => {
    if (!eligibleMedia) {
      setPreparing(false);
      return;
    }
    let active = true;
    const prepare = async () => {
      try {
        const response = await fetch(resolveStoryMediaUrl(slide.mediaUrl));
        if (!response.ok) throw new Error("Cannot access the original media.");
        const blob = await response.blob();
        const video = slide.mediaType === "video";
        const type = blob.type && blob.type !== "application/octet-stream"
          ? blob.type : video ? "video/mp4" : "image/jpeg";
        const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp"
          : type.includes("quicktime") ? "mov" : video ? "mp4" : "jpg";
        if (active) setPreparedFile(new File([blob], "shanah-city-story." + extension, { type }));
      } catch {
        if (active) setFeedback("The original media could not be prepared for native sharing. You can still open and save it manually below.");
      } finally {
        if (active) setPreparing(false);
      }
    };
    void prepare();
    return () => { active = false; };
  }, [eligibleMedia, slide.id, slide.mediaType, slide.mediaUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setFeedback("Story link copied. It opens the story while it is active.");
    } catch {
      setFeedback("Copy is unavailable here. Use WhatsApp to send the story link.");
    }
  }

  async function nativeMediaShare() {
    if (!eligibleMedia || busy || !preparedFile) return;
    setBusy(true);
    setFeedback("");
    try {
      if (navigator.canShare?.({ files: [preparedFile] }) && navigator.share) {
        // Invoke the share sheet before awaiting any other operation.
        await navigator.share({ files: [preparedFile] });
        setFeedback("Choose WhatsApp and then My Status if offered. Only your original media is sent.");
      } else {
        setFeedback("Native media sharing isn't supported here. Open the original media below, save it, then upload it to WhatsApp Status.");
      }
    } catch (error) {
      setFeedback(error instanceof Error && error.name === "AbortError"
        ? "Sharing cancelled."
        : "The native share sheet could not open. Save the original media below and upload it to WhatsApp Status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-x-3 top-20 z-[65] max-h-[min(76dvh,520px)] overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:w-[360px]" role="dialog" aria-label="Share this story" aria-modal="false" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold">Share this story</h2>
        <button type="button" aria-label="Close story sharing" className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/15 text-xl font-bold" onClick={onDismiss}>×</button>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-white/75">Story links expire after 24 hours. Recipients must sign in to Shanah City.</p>
      <div className="mt-4 grid gap-3">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-emerald-600 px-4 py-3 text-center text-base font-bold text-white">WhatsApp chats & groups</a>
        <button type="button" className="rounded-xl border border-white/30 px-4 py-3 text-base font-bold" onClick={() => void copyLink()}>Copy story link</button>
        {eligibleMedia ? (
          <>
            <button type="button" disabled={busy || preparing || !preparedFile} className="rounded-xl bg-white px-4 py-3 text-base font-bold text-slate-950 disabled:opacity-60" onClick={() => void nativeMediaShare()}>
              {busy ? "Opening share sheet…" : preparing ? "Preparing photo/video…" : "Share photo/video to WhatsApp Status"}
            </button>
            <a href={resolveStoryMediaUrl(slide.mediaUrl)} target="_blank" rel="noopener noreferrer" className="text-center text-sm font-bold text-blue-200 underline underline-offset-4">Open original media to save manually</a>
            <p className="text-xs leading-relaxed text-white/70">Your original photo/video only. Background songs, voice-over layers and story stickers are not exported. WhatsApp Status must be chosen in your phone's share sheet; availability depends on your device.</p>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-white/70">WhatsApp Status media export is available for your own photo/video stories. Other stories can be shared as a link without copying their content or licensed music.</p>
        )}
      </div>
      {feedback && <p role="status" className="mt-3 rounded-lg bg-white/10 p-3 text-sm leading-relaxed">{feedback}</p>}
    </div>
  );
}
