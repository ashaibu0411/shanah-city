"use client";

import { APP_THEME_META, type AppTheme } from "@/lib/theme";
import { useTheme } from "@/components/app/ThemeProvider";

type ThemeControlProps = {
  variant?: "mobile" | "desktop";
};

const THEME_OPTIONS: AppTheme[] = ["light", "dark"];

export function ThemeControl({ variant = "mobile" }: ThemeControlProps) {
  const { theme, setTheme } = useTheme();
  const isMobile = variant === "mobile";
  const current = APP_THEME_META[theme];

  const buttonBase = isMobile
    ? "rounded-lg px-2 py-2.5 text-xs font-bold transition"
    : "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition";

  const activeClass = isMobile
    ? "bg-night-950 text-white dark:bg-white/15 dark:text-sand-100 dark:ring-1 dark:ring-white/20"
    : "bg-night-900 text-sand-50 dark:bg-white/15 dark:text-sand-100 dark:ring-1 dark:ring-white/20";

  const inactiveClass = isMobile
    ? "text-night-700 hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-night-800"
    : "text-night-700 hover:bg-night-900/5 dark:text-sand-300 dark:hover:bg-white/5";

  return (
    <div className={isMobile ? "" : "flex items-center gap-3"}>
      {!isMobile && (
        <div className="hidden min-w-[7.5rem] lg:block">
          <p className="text-xs font-semibold text-night-900 dark:text-sand-100">Background</p>
          <p className="text-[11px] text-night-500 dark:text-sand-400">{current.label}</p>
        </div>
      )}

      {isMobile && (
        <>
          <p className="text-sm font-semibold text-night-900 dark:text-sand-100">Background theme</p>
          <p className="mt-0.5 text-sm text-night-600 dark:text-sand-400">
            Choose the warm light look or a darker background for evening use.
          </p>
        </>
      )}

      <div
        className={
          isMobile
            ? "mt-3 grid grid-cols-2 gap-1 rounded-xl bg-sand-100/90 p-1 ring-1 ring-night-900/8 dark:bg-night-800/80 dark:ring-white/10"
            : "flex items-center gap-1 rounded-xl bg-sand-100/90 p-1 ring-1 ring-night-900/8 dark:bg-night-800/80 dark:ring-white/10"
        }
        role="group"
        aria-label="Background theme"
      >
        {THEME_OPTIONS.map((option) => {
          const meta = APP_THEME_META[option];
          const active = theme === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => setTheme(option)}
              className={`${buttonBase} ${active ? activeClass : inactiveClass}`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
