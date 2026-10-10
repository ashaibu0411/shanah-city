"use client";

import { useEffect, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.couplesGameOverlay = "true";
    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.body.dataset.couplesGameOverlay;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="couples-hub-page couples-hub-typography couples-game-overlay-portal fixed inset-0 z-[9999] flex flex-col bg-[var(--couples-background)] text-[var(--couples-text)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="couple-game-overlay-title"
    >
      <header
        className="couples-page-header flex shrink-0 items-start justify-between gap-3 border-b border-[var(--couples-border)] bg-[var(--couples-midnight)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-[var(--couples-header-text)]"
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
          Done
        </button>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {progress ? <GameProgressBar current={progress.current} total={progress.total} /> : null}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
