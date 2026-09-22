"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  smsShareUrl,
  urgentAlertPublicShareBlurb,
  urgentAlertShareMessage,
  whatsAppShareUrl,
} from "@/lib/urgent-alert-utils";
import { urgentAlertShareUrl } from "@/lib/share-urls";
import { communityPostIdForUrgentAlert } from "@/lib/urgent-alert-utils";

type AlertPublicShareProps = {
  alertId: string;
  title: string;
  message: string;
  onDark?: boolean;
  /** Anchor id for deep links from the home carousel */
  sectionId?: string;
};

export function AlertPublicShare({
  alertId,
  title,
  message,
  onDark = false,
  sectionId = "urgent-alert-share",
}: AlertPublicShareProps) {
  const postId = communityPostIdForUrgentAlert(alertId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [shareError, setShareError] = useState("");

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/community#post-${encodeURIComponent(postId)}`;
    }
    return urgentAlertShareUrl(alertId);
  }, [alertId, postId]);

  const shareText = useMemo(
    () => urgentAlertShareMessage({ title, message }, shareUrl),
    [title, message, shareUrl],
  );

  const buttonClass = onDark
    ? "rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
    : "rounded-xl bg-sand-100 px-3 py-2 text-xs font-semibold text-night-800 ring-1 ring-night-900/8 transition hover:bg-sand-200";

  useEffect(() => {
    if (!qrOpen) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [qrOpen, shareUrl]);

  async function copyLinkOnly() {
    setShareError("");
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setShareError("Could not copy the link. Try Share or WhatsApp.");
    }
  }

  async function copyFullMessage() {
    setShareError("");
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedMessage(true);
      window.setTimeout(() => setCopiedMessage(false), 2000);
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

  function shareSms() {
    setShareError("");
    window.location.href = smsShareUrl(shareText);
  }

  return (
    <div id={sectionId} className={onDark ? "" : "scroll-mt-24"}>
      <p
        className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
          onDark ? "text-red-100/90" : "text-night-500"
        }`}
      >
        Share with people not on the app
      </p>
      <p className={`mt-1 text-xs ${onDark ? "text-red-50/85" : "text-night-600"}`}>
        {urgentAlertPublicShareBlurb()} Send the link by text, WhatsApp, or email.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={shareNative} className={buttonClass}>
          Share…
        </button>
        <button type="button" onClick={shareWhatsApp} className={buttonClass}>
          WhatsApp
        </button>
        <button type="button" onClick={shareSms} className={buttonClass}>
          Text message
        </button>
        <button type="button" onClick={copyLinkOnly} className={buttonClass}>
          {copiedLink ? "Link copied" : "Copy link"}
        </button>
        <button type="button" onClick={copyFullMessage} className={buttonClass}>
          {copiedMessage ? "Message copied" : "Copy full message"}
        </button>
        <button type="button" onClick={() => setQrOpen((open) => !open)} className={buttonClass}>
          {qrOpen ? "Hide QR" : "QR code"}
        </button>
      </div>
      <p
        className={`mt-2 break-all text-[11px] ${onDark ? "text-red-100/75" : "text-night-500"}`}
      >
        {shareUrl}
      </p>

      {qrOpen ? (
        <div className="mt-3 inline-block rounded-2xl bg-white p-3 ring-1 ring-white/20">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code to open this alert in a browser" className="h-[220px] w-[220px]" />
          ) : (
            <p className="text-xs text-night-600">Generating QR code…</p>
          )}
          <p className="mt-2 max-w-[220px] text-center text-[11px] text-night-600">
            Scan to open — works without the app
          </p>
        </div>
      ) : null}

      {shareError ? (
        <p className={`mt-2 text-xs ${onDark ? "text-red-100" : "text-red-700"}`}>{shareError}</p>
      ) : null}
    </div>
  );
}
