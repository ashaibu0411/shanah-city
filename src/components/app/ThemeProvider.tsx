"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  APP_THEME_META,
  APP_THEME_STORAGE_KEY,
  applyAppTheme,
  readStoredAppTheme,
  type AppTheme,
} from "@/lib/theme";
import { isNativeAppPlatform } from "@/lib/native-app";

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredAppTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyAppTheme(theme);
    window.localStorage.setItem(APP_THEME_STORAGE_KEY, theme);

    if (!isNativeAppPlatform()) return;

    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const statusStyle = theme === "dark" ? Style.Dark : Style.Light;
        await StatusBar.setStyle({ style: statusStyle });
        await StatusBar.setBackgroundColor({
          color: APP_THEME_META[theme].themeColor,
        });
      } catch {
        // Status bar plugin is iOS/Android only.
      }
    })();
  }, [ready, theme]);

  const setTheme = (nextTheme: AppTheme) => {
    setThemeState(nextTheme);
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      isDark: theme === "dark",
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
