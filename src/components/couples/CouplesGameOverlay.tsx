"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { GameProgressBar } from "@/lib/couple-games-ui";

export function CouplesGameOverlay({
  open,
  title,
  subtitle,
  progress,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  progress?: { current: number; total: number };
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex flex-col bg-[var(--couples-midnight)]/90"
      role="dialog"
      aria-modal="true"
      aria-labelledby="couple-game-overlay-title"
    >
      <div className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col bg-[var(--couples-ivory)] shadow-2xl">
        <header
          className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--couples-border)] bg-[var(--couples-midnight)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white"
        >
          <div className="min-w-0 flex-1">
            <h2
              id="couple-game-overlay-title"
              className="font-[family-name:var(--font-couples-display)] text-lg font-semibold leading-snug"
            >
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-xs text-white/75">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15"
            onClick={onClose}
          >
            Close
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {progress ? <GameProgressBar current={progress.current} total={progress.total} /> : null}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
