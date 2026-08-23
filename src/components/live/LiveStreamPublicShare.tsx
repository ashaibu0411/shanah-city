"use client";

import { useMemo, useState } from "react";
import { liveStreamShareMessage, whatsAppShareUrl } from "@/lib/live-share-utils";
import { liveShareUrl } from "@/lib/share-urls";

type LiveStreamPublicShareProps = {
  title?: string;
  platform?: string;
  isLive?: boolean;
  onDark?: boolean;
  compact?: boolean;
};

export function LiveStreamPublicShare({
  title = "Shanah City Worship",
  platform,
  isLive = false,
  onDark = false,
  compact = false,
}: LiveStreamPublicShareProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = platform ? `?platform=${encodeURIComponent(platform)}` : "";
      return `${window.location.origin}/live${params}`;
    }
    return liveShareUrl(platform);
  }, [platform]);

  const shareText = useMemo(
    () =>
      liveStreamShareMessage({
        title,
        url: shareUrl,
        isLive,
        platform,
      }),
    [title, shareUrl, isLive, platform],
  );

  const buttonClass = onDark
    ? "rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
    : "rounded-xl bg-sand-100 px-3 py-2 text-xs font-semibold text-night-800 ring-1 ring-night-900/8 transition hover:bg-sand-200";

  async function copyLink() {
    setShareError("");
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Could not copy. Try Share instead.");
    }
  }

  async function shareNative() {
    setShareError("");
    if (!navigator.share) {
      window.open(whatsAppShareUrl(shareText), "_blank", "noopener,noreferrer");
      return;
    }

    try {
      await navigator.share({
        title: isLive ? `Live: ${title}` : title,
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareError("Could not open share menu.");
    }
  }

  function shareWhatsApp() {
    setShareError("");
    window.open(whatsAppShareUrl(shareText), "_blank", "noopener,noreferrer");
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
          onDark ? "text-white/80" : "text-night-500"
        }`}
      >
        Share livestream
      </p>
      {!compact ? (
        <p className={`text-xs ${onDark ? "text-white/75" : "text-night-600"}`}>
          Invite friends and family to watch in the app or on the web.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={shareNative} className={buttonClass}>
          Share
        </button>
        <button type="button" onClick={shareWhatsApp} className={buttonClass}>
          WhatsApp
        </button>
        <button type="button" onClick={copyLink} className={buttonClass}>
          {copied ? "Copied" : "Copy message"}
        </button>
      </div>
      {shareError ? (
        <p className={`text-xs ${onDark ? "text-red-100" : "text-red-700"}`}>{shareError}</p>
      ) : null}
    </div>
  );
}
