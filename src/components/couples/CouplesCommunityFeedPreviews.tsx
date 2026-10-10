"use client";

import Image from "next/image";
import { IgCommentIcon, IgHeartIcon } from "@/components/community/CommunityPostIcons";

/** Static previews aligned to the Couples Community mockup when the feed is empty. */
export function CouplesCommunityFeedPreviews() {
  return (
    <div className="space-y-3.5">
      <p className="sr-only">Example discussions shown when your feed is empty.</p>
      <article className="couples-community-post-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--couples-gold-light)] text-sm font-semibold text-[var(--couples-mocha)]">
            PJ
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[0.9375rem] text-[var(--couples-text)]">
                  Marriage in Real Life
                </p>
                <p className="mt-0.5 text-xs text-[var(--couples-muted)]">Pastor James · 2h ago</p>
              </div>
              <span className="text-[var(--couples-muted)]" aria-hidden>✦</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--couples-text)]">
          What&apos;s one thing that has strengthened your marriage this year?
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-semibold text-[var(--couples-text)]">
            <span className="inline-flex items-center gap-1.5 text-red-600">
              <IgHeartIcon filled />
              24
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IgCommentIcon />
              8
            </span>
          </div>
          <span className="text-[var(--couples-muted)]" aria-hidden>⌁</span>
        </div>
      </article>

      <article className="couples-community-post-card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--couples-blush)] text-sm font-semibold text-[var(--couples-mocha)]">
            TM
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[0.9375rem] text-[var(--couples-text)]">Date Night Ideas</p>
                <p className="mt-0.5 text-xs text-[var(--couples-muted)]">Tanya M. · 5h ago</p>
              </div>
              <span className="text-[var(--couples-muted)]" aria-hidden>✦</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--couples-text)]">
          Here&apos;s a fun and affordable date idea we tried this weekend! 👫
        </p>
        <div className="relative mt-3 h-44 w-full overflow-hidden rounded-xl">
          <Image
            src="/couples/couples-hub-hero.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="390px"
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm font-semibold text-[var(--couples-text)]">
            <span className="inline-flex items-center gap-1.5 text-red-600">
              <IgHeartIcon filled />
              37
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IgCommentIcon />
              12
            </span>
          </div>
          <span className="text-[var(--couples-muted)]" aria-hidden>⌁</span>
        </div>
      </article>
    </div>
  );
}
