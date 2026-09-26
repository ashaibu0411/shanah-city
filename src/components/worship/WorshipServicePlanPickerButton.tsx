"use client";

type WorshipServicePlanPickerButtonProps = {
  label: string;
  description?: string;
  published?: boolean;
  actionLabel?: string;
  onClick: () => void;
};

export function WorshipServicePlanPickerButton({
  label,
  description,
  published = false,
  actionLabel,
  onClick,
}: WorshipServicePlanPickerButtonProps) {
  const cta = actionLabel ?? (published ? "Open setlist" : "Open");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-[1.25rem] border border-violet-200/90 bg-gradient-to-br from-violet-50/95 via-white to-sand-50/80 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(91,33,182,0.06),0_8px_24px_rgba(45,36,24,0.05)] ring-1 ring-violet-100/90 transition hover:border-violet-300 hover:shadow-[0_12px_32px_rgba(91,33,182,0.12)] active:scale-[0.995] dark:border-violet-800/45 dark:from-violet-950/35 dark:via-[var(--color-surface)] dark:to-[var(--color-bg-soft)] dark:ring-violet-900/40 dark:hover:border-violet-700/60"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 font-display text-sm font-bold text-white shadow-sm ring-2 ring-violet-400/30 dark:bg-violet-700 dark:ring-violet-500/25"
        aria-hidden
      >
        ♪
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-semibold tracking-tight text-night-900 dark:text-sand-100">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-snug text-night-600 dark:text-sand-400">
            {description}
          </span>
        ) : null}
        {published ? (
          <span className="mt-1.5 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
            Published
          </span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5 text-violet-700 dark:text-violet-300">
        <span className="text-xs font-bold uppercase tracking-wide">{cta}</span>
        <span className="text-xl leading-none transition group-hover:translate-x-0.5" aria-hidden>
          ›
        </span>
      </span>
    </button>
  );
}
