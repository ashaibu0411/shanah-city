"use client";

import Image from "next/image";
import Link from "next/link";
import type { ChoirSongSuggestionCardView } from "@/lib/choir-song-suggestion-types";
import { CHOIR_HERO_IMAGE_PATH } from "@/lib/choir-group-constants";

type SuggestionCardProps = {
  card: ChoirSongSuggestionCardView;
  variant?: "recent" | "trending" | "list";
  onSupport?: () => void;
  supportBusy?: boolean;
};

function statusClass(status: string) {
  if (status === "approved" || status === "added_to_library") return "choir-song-status-approved";
  if (status === "under_review" || status === "submitted") return "choir-song-status-review";
  if (status === "declined") return "choir-song-status-declined";
  return "choir-song-status-neutral";
}

export function SuggestionCard({ card, variant = "recent", onSupport, supportBusy }: SuggestionCardProps) {
  const thumb = card.thumbnailUrl ?? CHOIR_HERO_IMAGE_PATH;
  const isTrending = variant === "trending";

  if (isTrending) {
    return (
      <article className="choir-song-trending-card">
        <Link href={card.detailHref} className="block">
          <div className="choir-song-trending-thumb-wrap">
            <Image src={thumb} alt="" width={140} height={100} className="choir-song-trending-thumb" />
          </div>
          <p className="choir-song-trending-title">{card.title}</p>
          <p className="choir-song-trending-artist">{card.artist}</p>
        </Link>
        <div className="choir-song-trending-meta">
          {card.mediaUrl ? (
            <a href={card.mediaUrl} target="_blank" rel="noreferrer" className="choir-song-play-btn" aria-label="Open song">
              ▶
            </a>
          ) : null}
          <button
            type="button"
            className={`choir-song-support-chip ${card.viewerSupported ? "choir-song-support-chip-on" : ""}`}
            onClick={onSupport}
            disabled={supportBusy || !onSupport}
          >
            ♥ {card.supportCount}
          </button>
          <span className="choir-song-comment-chip">💬 {card.commentCount}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="choir-song-recent-card">
      <Link href={card.detailHref} className="choir-song-recent-link">
        <div className="choir-song-recent-thumb-wrap">
          <Image src={thumb} alt="" width={120} height={88} className="choir-song-recent-thumb" />
          {card.mediaUrl ? <span className="choir-song-recent-play" aria-hidden>▶</span> : null}
        </div>
        <div className="choir-song-recent-body">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="choir-song-recent-title">{card.title}</p>
              <p className="choir-song-recent-artist">{card.artist}</p>
            </div>
            <span className={`choir-song-status-badge ${statusClass(card.status)}`}>{card.statusLabel}</span>
          </div>
          <p className="choir-song-recent-excerpt">{card.reasonExcerpt}</p>
          <p className="choir-song-recent-byline">
            {card.submittedByName} · {card.relativeDate}
          </p>
          <div className="choir-song-recent-stats">
            <button
              type="button"
              className={`choir-song-support-inline ${card.viewerSupported ? "choir-song-support-inline-on" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSupport?.();
              }}
              disabled={supportBusy || !onSupport}
            >
              ♥ {card.supportCount}
            </button>
            <span>💬 {card.commentCount}</span>
          </div>
        </div>
        <span className="choir-song-recent-chevron" aria-hidden>›</span>
      </Link>
    </article>
  );
}
