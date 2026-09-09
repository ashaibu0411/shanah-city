"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import type { CouplePrayerPostRecord } from "@/lib/couple-prayer-types";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CouplePrayerPanel() {
  const [posts, setPosts] = useState<CouplePrayerPostRecord[]>([]);
  const [canPost, setCanPost] = useState(false);
  const [content, setContent] = useState("");
  const [type, setType] = useState<"prayer" | "praise">("prayer");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadFeed() {
    const response = await fetch("/api/groups/couple-prayer");
    const data = await response.json();
    if (response.ok) {
      setPosts(data.posts ?? []);
      setCanPost(Boolean(data.canPost));
    } else {
      setMessage(data.error ?? "Could not load prayer wall.");
    }
  }

  useEffect(() => {
    void loadFeed();
  }, []);

  async function submitPost() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/groups/couple-prayer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not post.");
      return;
    }
    setPosts(data.posts ?? []);
    setCanPost(Boolean(data.canPost));
    setContent("");
    setMessage("Shared with your spouse and ministry leaders.");
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-night-700">
        Private to your linked spouse and Power Couples leaders — not the public church feed.
      </p>

      {!canPost ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-night-700">
          Link your spouse on{" "}
          <Link href="/profile" className="font-semibold text-night-900 underline-offset-2 hover:underline">
            your profile
          </Link>{" "}
          and join Shanah Power Couples to post here.
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
          <div className="flex flex-wrap gap-2">
            {(["prayer", "praise"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  type === option
                    ? "bg-night-900 text-white"
                    : "bg-white text-night-800 ring-1 ring-night-900/10"
                }`}
              >
                {option === "prayer" ? "Prayer" : "Praise"}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            placeholder="Share a prayer request or praise with your spouse and leaders…"
            className="mt-3 w-full rounded-xl border border-night-900/10 bg-white px-3 py-2.5 text-sm outline-none ring-night-900/5 focus:ring-2"
          />
          <Button className="mt-3" disabled={busy || !content.trim()} onClick={submitPost}>
            {busy ? "Posting…" : "Post privately"}
          </Button>
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-sand-50 px-4 py-3 text-sm text-night-600">
          No posts yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-2xl border border-night-900/10 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-night-900">{post.authorName}</p>
                <span className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                  {post.type}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-night-800">{post.content}</p>
              <p className="mt-2 text-xs text-night-500">{formatWhen(post.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {message ? <p className="mt-3 text-sm text-night-600">{message}</p> : null}
    </div>
  );
}
