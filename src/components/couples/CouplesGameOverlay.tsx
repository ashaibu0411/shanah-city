"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function CouplesGameOverlay({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
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
      className="fixed inset-0 z-[250] flex flex-col bg-[#0e0e14]/92"
      role="dialog"
      aria-modal="true"
      aria-labelledby="couple-game-overlay-title"
    >
      <div className="mx-auto flex h-[100dvh] w-full max-w-lg flex-col bg-[var(--couples-sheet-bg)] shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <h2
              id="couple-game-overlay-title"
              className="font-display text-lg font-semibold leading-snug text-stone-900"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--couples-sheet-muted)]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-700"
            onClick={onClose}
          >
            Done
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
