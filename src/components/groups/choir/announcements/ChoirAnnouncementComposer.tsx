"use client";

import { useState } from "react";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import type { ChoirAnnouncementFeedItem } from "@/lib/choir-announcements-types";

type ChoirAnnouncementComposerProps = {
  onCreated: (item: ChoirAnnouncementFeedItem) => void;
};

export function ChoirAnnouncementComposer({ onCreated }: ChoirAnnouncementComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/groups/choir-announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        groupId: SHANAH_WORSHIP_GROUP_ID,
        title,
        body,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not post announcement.");
      return;
    }
    setTitle("");
    setBody("");
    if (data.announcement) {
      onCreated(data.announcement);
    }
  }

  return (
    <form className="choir-card space-y-3 p-4" onSubmit={submit}>
      <p className="choir-section-label !text-[var(--choir-gold-dark)]">Post announcement</p>
      <input
        className="choir-setlist-search"
        placeholder="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        maxLength={120}
      />
      <textarea
        className="choir-announcement-textarea"
        placeholder="Share details with the worship team…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        required
        rows={4}
        maxLength={4000}
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" className="choir-btn-primary" disabled={busy}>
        {busy ? "Posting…" : "Publish announcement"}
      </button>
    </form>
  );
}
