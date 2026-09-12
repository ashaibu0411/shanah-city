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
