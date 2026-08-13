"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { hasMediaRole } from "@/lib/gallery-permissions";
import { Button, Card } from "@/components/ui";

export function MediaClipUploadPanel() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canPublish =
    !loading && user && (hasMediaRole(user) || user.role === "leader");

  if (!canPublish) {
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/media/clips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Could not publish clip.");
      return;
    }

    setTitle("");
    setUrl("");
    setMessage("Short video published. The community was notified.");
    router.refresh();
  }

  return (
    <Card className="mb-4 border border-violet-100 bg-violet-50/40">
      <h3 className="font-display text-lg font-semibold text-night-900">
        Publish a short video
      </h3>
      <p className="mt-2 text-sm text-night-600">
        Media team and leaders can add a YouTube Short. Everyone with community
        notifications enabled gets a push alert.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Video title"
          required
          className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="YouTube Shorts link or video ID"
          required
          className="w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
        />

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        <Button type="submit" disabled={busy || !title.trim() || !url.trim()}>
          {busy ? "Publishing..." : "Publish & notify community"}
        </Button>
      </form>
    </Card>
  );
}
