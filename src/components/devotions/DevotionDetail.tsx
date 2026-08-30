"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppShell } from "@/components/app/AppShellContext";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";
import { Button, Card } from "@/components/ui";
import { DevotionBody } from "@/components/devotions/DevotionBody";
import { DevotionBrowserPrompt } from "@/components/devotions/DevotionBrowserPrompt";
import { DevotionListenPlayer } from "@/components/devotions/DevotionListenPlayer";
import { DevotionPromoCard } from "@/components/devotions/DevotionPromoCard";

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

function DevotionArtworkHero({ devotion }: { devotion: Devotion }) {
  const artworkUrl = getDevotionArtwork(devotion, "wide");
  if (!artworkUrl) return null;

  return (
    <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-2xl sm:-mx-6 sm:-mt-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artworkUrl} alt="" className="aspect-[16/9] w-full object-cover" />
    </div>
  );
}

export function DevotionDetail({
  devotion,
  eyebrow = "Devotion",
  backHref = "/devotions",
  backLabel = "All devotions",
  showBackLink = true,
}: {
  devotion: Devotion;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  showBackLink?: boolean;
}) {
  const { isNativeApp } = useAppShell();
  const [completed, setCompleted] = useState(false);
  const [mode, setMode] = useState<DevotionMode>("read");

  return (
    <Card>
      <DevotionArtworkHero devotion={devotion} />
      {showBackLink && (
        <div className="mb-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-night-600 hover:text-night-900"
          >
            ← {backLabel}
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-600">
            {eyebrow} · {devotion.date} · {devotion.readingTime}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-night-900 sm:text-3xl">
            {devotion.title}
          </h1>
        </div>
        {isNativeApp ? (
          <div className="flex flex-wrap items-center gap-2">
            <ModeToggle mode={mode} onChange={setMode} />
            {completed && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                ✓ Done
              </span>
            )}
          </div>
        ) : null}
      </div>

      {isNativeApp ? (
        <>
          {mode === "listen" && (
            <div className="mt-4">
              <DevotionListenPlayer devotion={devotion} />
            </div>
          )}

          <DevotionBody devotion={devotion} className="mt-4" />

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => setCompleted(true)}>
              {completed ? "Completed" : "Mark as read"}
            </Button>
            <Button href={backHref} variant="secondary">
              {backLabel}
            </Button>
          </div>
        </>
      ) : (
        <DevotionBrowserPrompt devotion={devotion} />
      )}
    </Card>
  );
}

export function DevotionPreview({ devotion }: { devotion: Devotion }) {
  const { isNativeApp } = useAppShell();

  if (!isNativeApp) {
    return (
      <DevotionPromoCard devotion={devotion} eyebrow="Today's devotion" className="mb-8" />
    );
  }

  return (
    <DevotionDetail
      devotion={devotion}
      eyebrow="Today's devotion"
      backHref="/devotions"
      backLabel="All devotions"
      showBackLink={false}
    />
  );
}
