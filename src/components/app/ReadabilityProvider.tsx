"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TextScale = "comfortable" | "large" | "extraLarge";

const TEXT_SCALES: TextScale[] = ["comfortable", "large", "extraLarge"];

type ReadabilityContextValue = {
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
};

const STORAGE_KEY = "shanah-text-scale";

const ReadabilityContext = createContext<ReadabilityContextValue | null>(null);

export function ReadabilityProvider({ children }: { children: ReactNode }) {
  const [textScale, setTextScaleState] = useState<TextScale>("comfortable");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TEXT_SCALES.includes(stored as TextScale)) {
      setTextScaleState(stored as TextScale);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.body.dataset.textScale = textScale;
    window.localStorage.setItem(STORAGE_KEY, textScale);
  }, [ready, textScale]);

  const setTextScale = (scale: TextScale) => {
    setTextScaleState(scale);
  };

  const value = useMemo(
    () => ({ textScale, setTextScale }),
    [textScale],
  );

  return (
    <ReadabilityContext.Provider value={value}>{children}</ReadabilityContext.Provider>
  );
}

export function useReadability() {
  const context = useContext(ReadabilityContext);
  if (!context) {
    throw new Error("useReadability must be used within ReadabilityProvider");
  }
  return context;
}
