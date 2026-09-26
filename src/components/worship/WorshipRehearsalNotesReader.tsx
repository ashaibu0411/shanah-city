"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { RichTextContent } from "@/components/ui/RichTextContent";

type WorshipRehearsalNotesReaderProps = {
  notes: string;
  serviceLabel?: string;
};

export function WorshipRehearsalNotesReader({
  notes,
  serviceLabel,
}: WorshipRehearsalNotesReaderProps) {
  const trimmed = notes.trim();
  const [readerOpen, setReaderOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!readerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [readerOpen]);

  useEffect(() => {
    if (!readerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setReaderOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [readerOpen]);

  if (!trimmed) {
    return null;
  }

  const reader =
    readerOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[220] flex flex-col bg-[var(--color-bg)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="worship-rehearsal-notes-title"
          >
            <MobilePremiumFrame
              variant="surface"
              className="shrink-0 border-b border-night-900/8 dark:border-white/10"
            >
              <div className="flex items-start gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <button
                  type="button"
                  onClick={() => setReaderOpen(false)}
                  className="mt-0.5 shrink-0 rounded-full bg-sand-100 px-3 py-1.5 text-sm font-semibold text-night-800 dark:bg-[var(--color-bg-soft)] dark:text-sand-100"
                >
                  Close
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-clay-700 dark:text-clay-400">
                    Rehearsal notes
                  </p>
                  <h2
                    id="worship-rehearsal-notes-title"
                    className="mt-1 font-display text-lg font-semibold leading-snug text-night-900 dark:text-sand-100"
                  >
                    {serviceLabel ?? "For this service"}
                  </h2>
                </div>
              </div>
            </MobilePremiumFrame>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <article className="mx-auto max-w-prose text-sm leading-relaxed text-night-700 dark:text-sand-200">
                <RichTextContent text={trimmed} />
              </article>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-night-900/8 bg-white shadow-sm ring-1 ring-night-900/5 dark:border-white/10 dark:bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-night-900/6 bg-sand-50/80 px-4 py-3 dark:border-white/10 dark:bg-[var(--color-bg-soft)]">
          <h2 className="font-display text-base font-semibold text-night-900 dark:text-sand-100">
            Rehearsal notes
          </h2>
          <button
            type="button"
            onClick={() => setReaderOpen(true)}
            className="rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            Read full screen
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="text-sm leading-relaxed text-night-700 dark:text-sand-200">
            <RichTextContent text={trimmed} />
          </div>
        </div>
      </div>
      {reader}
    </>
  );
}
