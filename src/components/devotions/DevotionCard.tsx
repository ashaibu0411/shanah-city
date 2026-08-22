"use client";

import { useState, type ReactNode } from "react";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";
import { Button, Card } from "@/components/ui";
import { DevotionBody } from "@/components/devotions/DevotionBody";
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

function DevotionActions({
  completed,
  onComplete,
  extra,
}: {
  completed: boolean;
  onComplete: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <Button onClick={onComplete}>{completed ? "Completed" : "Mark as read"}</Button>
      {extra}
    </div>
  );
}

function DevotionArtworkHero({ devotion }: { devotion: Devotion }) {
  const artworkUrl = getDevotionArtwork(devotion, "wide");
  if (!artworkUrl) return null;

  return (
    <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl sm:-mx-6 sm:-mt-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artworkUrl}
        alt=""
        className="aspect-[16/9] w-full object-cover"
      />
    </div>
  );
}

export function DevotionPreview({ devotion }: { devotion: Devotion }) {
  const [completed, setCompleted] = useState(false);
  const [mode, setMode] = useState<DevotionMode>("read");

  return (
    <Card className="mb-8">
      <DevotionArtworkHero devotion={devotion} />
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

      {mode === "listen" && (
        <div className="mt-4">
          <DevotionListenPlayer devotion={devotion} />
        </div>
      )}

      <DevotionBody devotion={devotion} className="mt-4" />

      <DevotionActions
        completed={completed}
        onComplete={() => setCompleted(true)}
        extra={
          <Button href="/devotions" variant="secondary">
            All devotions
          </Button>
        }
      />
    </Card>
  );
}

export function DevotionCard({
  devotion,
  highlighted = false,
}: {
  devotion: Devotion;
  highlighted?: boolean;
}) {
  const [completed, setCompleted] = useState(false);
  const [mode, setMode] = useState<DevotionMode>("read");

  return (
    <div id={`devotion-${devotion.id}`}>
      <Card className={highlighted ? "ring-2 ring-sand-500/80" : undefined}>
        <DevotionArtworkHero devotion={devotion} />
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

      {mode === "listen" && (
        <div className="mt-4">
          <DevotionListenPlayer devotion={devotion} />
        </div>
      )}

      <DevotionBody devotion={devotion} className="mt-4" />

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => setCompleted(true)}>
          {completed ? "✓ Done" : "Mark read"}
        </Button>
      </div>
      </Card>
    </div>
  );
}
