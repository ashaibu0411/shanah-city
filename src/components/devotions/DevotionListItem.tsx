import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";

export function DevotionListItem({ devotion }: { devotion: Devotion }) {
  const artworkUrl = getDevotionArtwork(devotion, "square");

  return (
    <Link
      href={`/devotions/${devotion.id}`}
      className="group flex items-center gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-night-900/5 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-night-900/10"
    >
      {artworkUrl ? (
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-night-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artworkUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-night-900 text-sm font-bold text-amber-300">
          ✦
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sand-600">
          {devotion.date}
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-night-900 group-hover:text-night-700">
          {devotion.title}
        </h3>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs font-medium text-night-500">{devotion.readingTime}</p>
        <p className="mt-1 text-sm font-semibold text-night-600 group-hover:text-night-900">
          Read →
        </p>
      </div>
    </Link>
  );
}
