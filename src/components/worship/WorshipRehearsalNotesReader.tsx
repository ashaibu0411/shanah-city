"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { editorialPremium } from "@/components/app/editorial-premium";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { RichTextContent } from "@/components/ui/RichTextContent";

type WorshipRehearsalNotesReaderProps = {
  notes: string;
  serviceLabel?: string;
};

export const worshipRehearsalNotesBodyClass =
  "worship-rehearsal-notes-body text-[1.0625rem] font-medium leading-[1.65] text-night-900 dark:text-sand-100 sm:text-[1.125rem]";

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
            className="fixed inset-0 z-[220] flex flex-col overflow-y-auto overscroll-y-contain bg-[var(--color-bg)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="worship-rehearsal-notes-title"
          >
            <MobilePremiumFrame
              variant="surface"
              className="sticky top-0 z-10 border-b border-night-900/8 dark:border-white/10"
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
                  <p className={editorialPremium.sectionLabel}>Rehearsal notes</p>
                  <h2
                    id="worship-rehearsal-notes-title"
                    className="mt-1 font-display text-xl font-semibold leading-snug text-night-900 dark:text-sand-100"
                  >
                    {serviceLabel ?? "For this service"}
                  </h2>
                </div>
              </div>
            </MobilePremiumFrame>

            <article
              className={`${worshipRehearsalNotesBodyClass} worship-rehearsal-notes-body--fullscreen mx-auto w-full max-w-prose px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]`}
            >
              <RichTextContent text={trimmed} />
            </article>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <MobilePremiumFrame
        variant="surface"
        className="overflow-visible rounded-[1.35rem] border border-night-900/8 shadow-[0_1px_2px_rgba(45,36,24,0.04),0_12px_32px_rgba(45,36,24,0.06)] ring-1 ring-night-900/5 dark:border-white/10 dark:ring-white/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-night-900/6 bg-gradient-to-br from-violet-50/90 via-sand-50 to-white px-4 py-3.5 dark:border-white/10 dark:from-violet-950/35 dark:via-[var(--color-bg-soft)] dark:to-[var(--color-surface)]">
          <div>
            <p className={editorialPremium.sectionLabel}>Rehearsal notes</p>
            <h2 className={`${editorialPremium.sectionTitle} mt-0.5`}>For this service</h2>
          </div>
          <button
            type="button"
            onClick={() => setReaderOpen(true)}
            className="rounded-full bg-night-900 px-4 py-2 text-xs font-bold uppercase tracking-wide text-sand-50 shadow-sm transition hover:bg-night-950 active:scale-[0.98] dark:bg-violet-600 dark:hover:bg-violet-700"
          >
            Focus view
          </button>
        </div>
        <div className="px-4 py-4">
          <div className={worshipRehearsalNotesBodyClass}>
            <RichTextContent text={trimmed} />
          </div>
        </div>
      </MobilePremiumFrame>
      {reader}
    </>
  );
}
