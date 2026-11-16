"use client";

import { useState } from "react";
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
  const link = typeof window === "undefined" ? "" : storyUrl(slide.id);
  const eligibleMedia = mayExport &&
    (slide.mediaType === "image" || slide.mediaType === "video") &&
    Boolean(slide.mediaUrl);
  const caption = "See this Shanah City Story (available for 24 hours; church app sign-in required): ";
  const whatsapp = "https://wa.me/?text=" + encodeURIComponent(caption + link);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setFeedback("Story link copied. It opens the story while it is active.");
    } catch {
      setFeedback("Copy is unavailable here. Use WhatsApp to send the story link.");
    }
  }

  async function nativeMediaShare() {
    if (!eligibleMedia || busy) return;
    setBusy(true);
    setFeedback("");
    try {
      const source = resolveStoryMediaUrl(slide.mediaUrl);
      const response = await fetch(source);
      if (!response.ok) throw new Error("The original media could not be downloaded.");
      const blob = await response.blob();
      const isVideo = slide.mediaType === "video";
      const type = blob.type || (isVideo ? "video/mp4" : "image/jpeg");
      const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp"
        : type.includes("quicktime") ? "mov" : isVideo ? "mp4" : "jpg";
      const file = new File([blob], "shanah-city-story." + extension, { type });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file] });
        setFeedback("Choose WhatsApp, then My Status if your device offers it. Only the original media is shared.");
      } else {
        setFeedback("Media sharing is unavailable in this browser. Open the original media below, save it, then upload it to WhatsApp Status.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setFeedback("Sharing cancelled.");
      } else {
        setFeedback("Unable to share media directly. Open the original media below, save it, then add it to WhatsApp Status.");
      }
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
            <button type="button" disabled={busy} className="rounded-xl bg-white px-4 py-3 text-base font-bold text-slate-950 disabled:opacity-60" onClick={() => void nativeMediaShare()}>
              {busy ? "Preparing original media…" : "Share photo/video to WhatsApp Status"}
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
