"use client";

import { useState } from "react";
import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { Button, Card } from "@/components/ui";

export function DevotionPreview({ devotion }: { devotion: Devotion }) {
  const [completed, setCompleted] = useState(false);

  return (
    <Card className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
            Today&apos;s devotion · {devotion.readingTime}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-night-900">
            {devotion.title}
          </h2>
        </div>
        {completed && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            ✓ Done today
          </span>
        )}
      </div>

      <blockquote className="mt-4 border-l-4 border-sand-400 pl-4 italic text-night-700">
        &ldquo;{devotion.verse}&rdquo;
        <footer className="mt-2 not-italic text-sm font-semibold text-night-500">
          — {devotion.reference}
        </footer>
      </blockquote>

      <p className="mt-4 text-sm leading-relaxed text-night-600">
        {devotion.content}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => setCompleted(true)}>
          {completed ? "Completed" : "Mark as read"}
        </Button>
        <Button href="/devotions" variant="secondary">
          All devotions
        </Button>
      </div>
    </Card>
  );
}

export function DevotionCard({ devotion }: { devotion: Devotion }) {
  const [expanded, setExpanded] = useState(false);
  const [completed, setCompleted] = useState(false);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-night-500">{devotion.date}</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-night-900">
            {devotion.title}
          </h3>
        </div>
        <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-night-600">
          {devotion.readingTime}
        </span>
      </div>

      <blockquote className="mt-4 text-sm italic text-night-700">
        &ldquo;{devotion.verse}&rdquo; — {devotion.reference}
      </blockquote>

      {expanded && (
        <div className="mt-4 space-y-3 text-sm text-night-600">
          <p>{devotion.content}</p>
          <p className="rounded-xl bg-sand-50 p-3">
            <span className="font-semibold text-night-800">Prayer: </span>
            {devotion.prayer}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show less" : "Read full"}
        </Button>
        <Button onClick={() => setCompleted(true)}>
          {completed ? "✓ Done" : "Mark read"}
        </Button>
      </div>
    </Card>
  );
}
