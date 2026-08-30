import Link from "next/link";
import type { Devotion } from "@/lib/types";
import { getDevotionArtwork } from "@/lib/devotion-artwork";

type DevotionPromoCardProps = {
  devotion: Devotion;
  eyebrow?: string;
  className?: string;
};

export function DevotionPromoCard({
  devotion,
  eyebrow = "Today's Word",
  className = "",
}: DevotionPromoCardProps) {
  const artworkUrl = getDevotionArtwork(devotion, "wide");

  return (
    <div className={className}>
      <p className="px-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">
        {eyebrow}
      </p>
      <Link
        href={`/devotions/${encodeURIComponent(devotion.id)}`}
        className="mt-2 block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-night-900/5 transition hover:shadow-md active:scale-[0.99]"
      >
        {artworkUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={artworkUrl} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : null}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-sand-600">
              {devotion.date} · {devotion.readingTime}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-night-900">
              {devotion.title}
            </p>
            <p className="mt-1 text-sm text-night-600">{devotion.reference}</p>
          </div>
          <span className="shrink-0 rounded-full bg-night-900 px-3 py-1.5 text-xs font-bold text-white">
            Open
          </span>
        </div>
      </Link>
    </div>
  );
}
