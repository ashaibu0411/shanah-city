"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TextScale = "small" | "comfortable" | "large" | "extraLarge";

export const TEXT_SCALE_STEPS: {
  id: TextScale;
  label: string;
  scale: number;
}[] = [
  { id: "small", label: "Small", scale: 0.875 },
  { id: "comfortable", label: "Standard", scale: 1 },
  { id: "large", label: "Large", scale: 1.125 },
  { id: "extraLarge", label: "Extra large", scale: 1.25 },
];

const TEXT_SCALES = TEXT_SCALE_STEPS.map((step) => step.id);

type ReadabilityContextValue = {
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
  increaseTextScale: () => void;
  decreaseTextScale: () => void;
  canIncrease: boolean;
  canDecrease: boolean;
};

const STORAGE_KEY = "shanah-text-scale";

const ReadabilityContext = createContext<ReadabilityContextValue | null>(null);

function scaleValue(scale: TextScale) {
  return TEXT_SCALE_STEPS.find((step) => step.id === scale)?.scale ?? 1;
}

function applyTextScale(scale: TextScale) {
  const root = document.documentElement;
  root.style.setProperty("--reading-scale", String(scaleValue(scale)));
  document.body.dataset.textScale = scale;
}

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
    applyTextScale(textScale);
    window.localStorage.setItem(STORAGE_KEY, textScale);
  }, [ready, textScale]);

  const setTextScale = (scale: TextScale) => {
    setTextScaleState(scale);
  };

  const currentIndex = TEXT_SCALES.indexOf(textScale);

  const increaseTextScale = () => {
    if (currentIndex >= TEXT_SCALES.length - 1) return;
    setTextScaleState(TEXT_SCALES[currentIndex + 1]);
  };

  const decreaseTextScale = () => {
    if (currentIndex <= 0) return;
    setTextScaleState(TEXT_SCALES[currentIndex - 1]);
  };

  const value = useMemo(
    () => ({
      textScale,
      setTextScale,
      increaseTextScale,
      decreaseTextScale,
      canIncrease: currentIndex < TEXT_SCALES.length - 1,
      canDecrease: currentIndex > 0,
    }),
    [currentIndex, textScale],
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
