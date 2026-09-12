export type AppTheme = "light" | "dark";

export const APP_THEME_STORAGE_KEY = "shanah-app-theme";

export const APP_THEME_META: Record<
  AppTheme,
  { label: string; description: string; themeColor: string }
> = {
  light: {
    label: "Light",
    description: "Warm cream background (default)",
    themeColor: "#faf7f2",
  },
  dark: {
    label: "Dark",
    description: "Darker background for low light",
    themeColor: "#1b1409",
  },
};

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === "light" || value === "dark";
}

export function applyAppTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", APP_THEME_META[theme].themeColor);
  }
}

export function readStoredAppTheme(): AppTheme {
  try {
    const stored = window.localStorage.getItem(APP_THEME_STORAGE_KEY);
    if (isAppTheme(stored)) return stored;
  } catch {
    // Ignore storage errors (private mode, etc.).
  }
  return "light";
}

/** Dark-mode styling for light-tinted home banners and alert cards. */
export const themeBannerDark = {
  amber:
    "dark:border-amber-800/45 dark:from-amber-950/60 dark:to-orange-950/50 dark:ring-amber-900/30",
  clay: "dark:border-clay-700/45 dark:from-clay-950/55 dark:to-orange-950/45 dark:ring-clay-900/25",
  violet:
    "dark:border-violet-800/45 dark:from-violet-950/55 dark:to-indigo-950/50 dark:ring-violet-900/30",
  rose: "dark:border-rose-800/45 dark:from-rose-950/55 dark:to-pink-950/50 dark:ring-rose-900/30",
  neutral:
    "dark:border-white/10 dark:from-[var(--color-bg-soft)] dark:to-[var(--color-surface)] dark:ring-white/10",
} as const;

export const themeBannerText = {
  eyebrowAmber: "text-amber-800 dark:text-amber-200",
  eyebrowClay: "text-clay-800 dark:text-clay-200",
  eyebrowViolet: "text-violet-800 dark:text-violet-200",
  eyebrowRose: "text-rose-800 dark:text-rose-200",
  eyebrowAmberAlt: "text-amber-700 dark:text-amber-200",
  title: "text-night-900 dark:text-sand-100",
  body: "text-night-600 dark:text-sand-300",
  bodyStrong: "text-night-800 dark:text-sand-200",
} as const;

export const themeTileDark =
  "dark:from-night-800 dark:to-night-900 dark:text-sand-100 dark:ring-white/10";
