"use client";

import { useEffect, useState } from "react";
import type { GivingRecord } from "@/lib/giving-types";
import { Button } from "@/components/ui";

type ThankYouPreview = {
  message: string;
  canSend: boolean;
  channel: "message" | "email" | null;
  alreadySent: boolean;
};

type GivingThankYouComposerProps = {
  record: GivingRecord;
  onSent?: (record: GivingRecord) => void;
  compact?: boolean;
};

export function GivingThankYouComposer({
  record,
  onSent,
  compact = false,
}: GivingThankYouComposerProps) {
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState<ThankYouPreview["channel"]>(null);
  const [canSend, setCanSend] = useState(false);
  const [alreadySent, setAlreadySent] = useState(Boolean(record.thankYouSentAt));
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingPreview(true);
    setStatus(null);

    fetch(`/api/admin/giving/thank-you?recordId=${encodeURIComponent(record.id)}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data.message) {
          setMessage(data.message);
          setChannel(data.channel ?? null);
          setCanSend(Boolean(data.canSend));
          setAlreadySent(Boolean(data.alreadySent));
        } else {
          setStatus(data.error ?? "Could not load thank-you preview.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [record.id]);

  async function sendThankYou() {
    setSending(true);
    setStatus(null);

    const response = await fetch("/api/admin/giving/thank-you", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId: record.id, message }),
    });
    const data = await response.json();
    setSending(false);

    if (!response.ok) {
      setStatus(data.error ?? "Could not send thank-you.");
      return;
    }

    setAlreadySent(true);
    setStatus(
      data.channel === "message"
        ? `Thank-you sent to ${record.donorName} in Messages.`
        : `Thank-you email sent to ${record.donorEmail}.`,
    );
    if (data.record) {
      onSent?.(data.record);
    }
  }

  if (loadingPreview) {
    return <p className="text-sm text-night-500">Loading personalized thank-you…</p>;
  }

  if (!canSend) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Link a member profile or add a donor email to send a personalized thank-you.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "mt-4 space-y-3 rounded-xl bg-sand-50 p-4"}>
      {!compact && (
        <div>
          <p className="text-sm font-semibold text-night-900">Personalized thank-you</p>
          <p className="mt-1 text-xs text-night-600">
            Review and edit this message for {record.donorName}. It will be sent{" "}
            {channel === "message" ? "as an in-app message" : "by email"} — unique to this giver.
          </p>
        </div>
      )}

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={compact ? 6 : 8}
        className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm leading-relaxed text-night-800 outline-none ring-night-900/5 focus:ring-2"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={sendThankYou} disabled={sending || !message.trim()}>
          {sending ? "Sending…" : alreadySent ? "Send again" : "Send thank-you"}
        </Button>
        {alreadySent && (
          <span className="text-xs font-semibold text-emerald-700">Thank-you already sent</span>
        )}
      </div>

      {status && <p className="text-sm text-night-700">{status}</p>}
    </div>
  );
}
