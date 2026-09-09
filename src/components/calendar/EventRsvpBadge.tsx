export function EventRsvpBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-night-900/12 bg-[#f7f3eb] font-bold uppercase tracking-wide text-night-800 ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      }`}
    >
      RSVP needed
    </span>
  );
}
