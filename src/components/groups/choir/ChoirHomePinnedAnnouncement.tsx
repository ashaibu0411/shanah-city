import Link from "next/link";
import type { ChoirPinnedLeadershipAnnouncement } from "@/lib/choir-dashboard-types";

type ChoirHomePinnedAnnouncementProps = {
  announcement: ChoirPinnedLeadershipAnnouncement;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ChoirHomePinnedAnnouncement({ announcement }: ChoirHomePinnedAnnouncementProps) {
  return (
    <section
      className="choir-card border border-[var(--choir-gold-soft)] bg-[var(--choir-surface)] px-4 py-3"
      aria-labelledby="choir-pinned-announcement-heading"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--choir-gold-dark)]">
        Leadership announcement
      </p>
      <h2 id="choir-pinned-announcement-heading" className="mt-1 font-display text-base font-bold text-[var(--choir-heading)]">
        {announcement.title}
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--choir-body)]">{announcement.excerpt}</p>
      <p className="mt-2 text-xs text-[var(--choir-muted)]">
        {announcement.authorName} · {formatDate(announcement.createdAt)}
      </p>
      <Link
        href={announcement.detailHref}
        className="mt-3 inline-flex min-h-[44px] items-center text-sm font-bold text-[var(--choir-gold-dark)]"
      >
        View details →
      </Link>
    </section>
  );
}
