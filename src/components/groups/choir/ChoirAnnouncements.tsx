import Link from "next/link";
import type { ChoirAnnouncementView } from "@/lib/choir-dashboard-types";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type ChoirAnnouncementsProps = {
  items: ChoirAnnouncementView[];
};

export function ChoirAnnouncements({ items }: ChoirAnnouncementsProps) {
  const seeAllHref = `/groups/${SHANAH_WORSHIP_GROUP_ID}/announcements`;

  return (
    <section aria-labelledby="choir-announcements-heading">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="choir-announcements-heading" className="choir-section-heading">
          Ministry announcements
        </h2>
        <Link href={seeAllHref} className="min-h-[44px] text-xs font-bold text-[var(--choir-gold-dark)]">
          See all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="choir-card p-4">
          <p className="text-sm text-[var(--choir-muted)]">No announcements yet.</p>
          <Link href={seeAllHref} className="choir-setlist-manage-link mt-2 inline-flex">
            View announcements →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={seeAllHref} className="choir-card block p-3.5 transition active:scale-[0.99]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--choir-gold-dark)]">{item.authorName}</p>
                  <span className="text-[11px] text-[var(--choir-muted)]">{formatWhen(item.createdAt)}</span>
                </div>
                <p className="mt-1.5 font-semibold text-[var(--choir-heading)]">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--choir-body)]">{item.excerpt}</p>
                {item.isSample ? (
                  <p className="mt-2 text-[11px] font-medium text-[var(--choir-muted)]">Sample · leaders can post real updates</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
