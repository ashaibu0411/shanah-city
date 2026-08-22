"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type ShareActionsProps = {
  shareUrl: string;
  viewUrl?: string;
  notifyEnabled?: boolean;
  onNotify?: () => Promise<void>;
  compact?: boolean;
};

export function ShareActions({
  shareUrl,
  viewUrl,
  notifyEnabled = false,
  onNotify,
  compact = false,
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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

  async function sendNotify() {
    if (!onNotify) return;
    setNotifyBusy(true);
    setNotifyMessage("");
    try {
      await onNotify();
      setNotifyMessage("Notification sent.");
    } catch (error) {
      setNotifyMessage(error instanceof Error ? error.message : "Could not send notification.");
    } finally {
      setNotifyBusy(false);
    }
  }

  const actions = [
    {
      id: "copy",
      label: copied ? "Copied" : "Copy link",
      onClick: copyLink,
    },
    {
      id: "qr",
      label: "QR code",
      onClick: () => setQrOpen((open) => !open),
    },
    {
      id: "view",
      label: "View",
      onClick: () => window.open(viewUrl ?? shareUrl, "_blank", "noopener,noreferrer"),
    },
    ...(notifyEnabled && onNotify
      ? [
          {
            id: "notify",
            label: notifyBusy ? "Sending…" : "Notify",
            onClick: sendNotify,
            disabled: notifyBusy,
          },
        ]
      : []),
  ];

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-night-500">Share</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={"disabled" in action ? action.disabled : false}
            onClick={action.onClick}
            className="rounded-xl bg-sand-100 px-3 py-2 text-xs font-semibold text-night-800 ring-1 ring-night-900/8 transition hover:bg-sand-200 disabled:opacity-60"
          >
            {action.label}
          </button>
        ))}
      </div>
      <p className="break-all text-[11px] text-night-500">{shareUrl}</p>

      {qrOpen ? (
        <div className="inline-block rounded-2xl bg-white p-3 ring-1 ring-night-900/10">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR code for share link" className="h-[220px] w-[220px]" />
          ) : (
            <p className="text-xs text-night-500">Generating QR code…</p>
          )}
        </div>
      ) : null}

      {notifyMessage ? <p className="text-xs text-night-600">{notifyMessage}</p> : null}
    </div>
  );
}
