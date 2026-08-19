"use client";

import { useState } from "react";
import type { Devotion } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { DevotionListenPlayer } from "@/components/devotions/DevotionListenPlayer";

type DevotionMode = "read" | "listen";

function ModeToggle({
  mode,
  onChange,
}: {
  mode: DevotionMode;
  onChange: (mode: DevotionMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-sand-100 p-1">
      {(
        [
          ["read", "Read"],
          ["listen", "Listen"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === value ? "bg-night-900 text-sand-50" : "text-night-700 hover:bg-white"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function DevotionPreview({ devotion }: { devotion: Devotion }) {
  const [completed, setCompleted] = useState(false);
  const [mode, setMode] = useState<DevotionMode>("read");

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
        <div className="flex flex-wrap items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          {completed && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              ✓ Done today
            </span>
          )}
        </div>
      </div>

      {mode === "listen" ? (
        <div className="mt-4">
          <DevotionListenPlayer devotion={devotion} />
        </div>
      ) : (
        <>
          <blockquote className="mt-4 border-l-4 border-sand-400 pl-4 italic text-night-700">
            &ldquo;
            <RichTextContent text={devotion.verse} />
            &rdquo;
            <footer className="mt-2 not-italic text-sm font-semibold text-night-500">
              — {devotion.reference}
            </footer>
          </blockquote>

          <div className="mt-4 text-sm leading-relaxed text-night-600">
            <RichTextContent text={devotion.content} />
          </div>
        </>
      )}

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
  const [mode, setMode] = useState<DevotionMode>("read");

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-night-500">{devotion.date}</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-night-900">
            {devotion.title}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-night-600">
            {devotion.readingTime}
          </span>
        </div>
      </div>

      {mode === "listen" ? (
        <div className="mt-4">
          <blockquote className="text-sm italic text-night-700">
            &ldquo;
            <RichTextContent text={devotion.verse} />
            &rdquo; — {devotion.reference}
          </blockquote>
          <div className="mt-4">
            <DevotionListenPlayer devotion={devotion} />
          </div>
        </div>
      ) : (
        <>
          <blockquote className="mt-4 text-sm italic text-night-700">
            &ldquo;
            <RichTextContent text={devotion.verse} />
            &rdquo; — {devotion.reference}
          </blockquote>

          {expanded && (
            <div className="mt-4 space-y-3 text-sm text-night-600">
              <RichTextContent text={devotion.content} className="block" />
              <p className="rounded-xl bg-sand-50 p-3">
                <span className="font-semibold text-night-800">Prayer: </span>
                <RichTextContent text={devotion.prayer} />
              </p>
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {mode === "read" && (
          <Button
            variant="secondary"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show less" : "Read full"}
          </Button>
        )}
        <Button onClick={() => setCompleted(true)}>
          {completed ? "✓ Done" : "Mark read"}
        </Button>
      </div>
    </Card>
  );
}
