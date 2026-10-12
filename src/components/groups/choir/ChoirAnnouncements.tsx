import Link from "next/link";
import type { ChoirAnnouncementView } from "@/lib/choir-dashboard-types";

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
  onOpenChat: () => void;
};

export function ChoirAnnouncements({ items, onOpenChat }: ChoirAnnouncementsProps) {
  return (
    <section aria-labelledby="choir-announcements-heading">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="choir-announcements-heading" className="choir-section-heading">
          Ministry announcements
        </h2>
        <button
          type="button"
          onClick={onOpenChat}
          className="min-h-[44px] text-xs font-semibold text-[var(--choir-gold-dark)]"
        >
          Open chat
        </button>
      </div>

      {items.length === 0 ? (
        <div className="choir-card p-4">
          <p className="text-sm text-[var(--choir-muted)]">
            Team updates from group chat will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.chatHref} className="choir-card block p-3.5 transition active:scale-[0.99]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--choir-gold-dark)]">{item.authorName}</p>
                  <span className="text-[11px] text-[var(--choir-muted)]">{formatWhen(item.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--choir-body)]">{item.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
