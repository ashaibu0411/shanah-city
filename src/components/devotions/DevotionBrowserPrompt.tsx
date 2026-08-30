"use client";

import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { Button } from "@/components/ui";
import { richTextToPlain } from "@/lib/rich-text";

function devotionTeaser(devotion: Devotion) {
  const verse = richTextToPlain(devotion.verse);
  if (verse.length <= 160) return verse;
  return `${verse.slice(0, 157).trim()}…`;
}

export function DevotionBrowserPrompt({ devotion }: { devotion: Devotion }) {
  const teaser = devotionTeaser(devotion);

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-night-900/15 bg-sand-50 p-5">
      {teaser ? (
        <blockquote className="border-l-4 border-sand-400 pl-4 italic text-night-700">
          &ldquo;{teaser}&rdquo;
          <footer className="mt-2 not-italic text-sm font-semibold text-night-500">
            — {devotion.reference}
          </footer>
        </blockquote>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed text-night-700">
        The full devotion, audio listen, and mark-as-read are available in the Shanah City
        app. Open TestFlight or the installed app to read today&apos;s message.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button href="/devotions">Browse devotions</Button>
        <Link
          href="/sign-in?next=/devotions"
          className="inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-night-700 ring-1 ring-night-900/10 transition hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
