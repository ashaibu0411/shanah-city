"use client";

type WorshipSetlistGroupHeaderProps = {
  title: string;
  subtitle?: string;
  songCount: number;
};

export function WorshipSetlistGroupHeader({
  title,
  subtitle,
  songCount,
}: WorshipSetlistGroupHeaderProps) {
  const setMatch = title.match(/^Set (\d+)$/);

  return (
    <div className="relative mt-5 first:mt-0">
      <div
        className="flex items-center gap-3 rounded-2xl border border-violet-200/90 bg-gradient-to-r from-violet-50 via-white to-sand-50/90 px-4 py-3 shadow-[0_1px_2px_rgba(45,36,24,0.04)] dark:border-violet-900/35 dark:from-violet-950/40 dark:via-[var(--color-surface)] dark:to-[var(--color-bg-soft)]"
        aria-label={`${title}, ${songCount} songs`}
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold shadow-sm ${
            setMatch
              ? "bg-gradient-to-br from-violet-600 to-indigo-800 text-white"
              : "bg-night-900 text-sand-50 dark:bg-violet-700"
          }`}
        >
          {setMatch ? setMatch[1] : title.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          {subtitle ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-800/80 dark:text-violet-300/90">
              {subtitle}
            </p>
          ) : null}
          <h4 className="font-display text-lg font-semibold leading-tight text-night-900 dark:text-sand-100">
            {title}
          </h4>
          <p className="mt-0.5 text-xs text-night-500 dark:text-sand-400">
            {songCount} song{songCount === 1 ? "" : "s"} in this block
          </p>
        </div>
      </div>
    </div>
  );
}
