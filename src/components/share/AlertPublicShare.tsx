"use client";

import { useMemo, useState } from "react";
import { urgentAlertShareMessage, whatsAppShareUrl } from "@/lib/urgent-alert-utils";
import { urgentAlertShareUrl } from "@/lib/share-urls";

type AlertPublicShareProps = {
  alertId: string;
  title: string;
  message: string;
  onDark?: boolean;
};

export function AlertPublicShare({
  alertId,
  title,
  message,
  onDark = false,
}: AlertPublicShareProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/?alert=${encodeURIComponent(alertId)}`;
    }
    return urgentAlertShareUrl(alertId);
  }, [alertId]);

  const shareText = useMemo(
    () => urgentAlertShareMessage({ title, message }, shareUrl),
    [title, message, shareUrl],
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
        title: `Urgent: ${title}`,
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
    <div className="mt-4 border-t border-white/20 pt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-100/90">
        Share with friends
      </p>
      <p className="mt-1 text-xs text-red-50/85">
        Send this alert to family or friends who are not on the app yet.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
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
      {shareError ? <p className="mt-2 text-xs text-red-100">{shareError}</p> : null}
    </div>
  );
}
