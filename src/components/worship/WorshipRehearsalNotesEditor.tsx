"use client";

import { editorialPremium } from "@/components/app/editorial-premium";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";

type WorshipRehearsalNotesEditorProps = {
  value: string;
  onChange: (value: string) => void;
  serviceLabel?: string;
};

export function WorshipRehearsalNotesEditor({
  value,
  onChange,
  serviceLabel,
}: WorshipRehearsalNotesEditorProps) {
  return (
    <MobilePremiumFrame
      variant="surface"
      className="mb-6 overflow-hidden rounded-[1.35rem] border border-night-900/8 shadow-[0_1px_2px_rgba(45,36,24,0.04),0_12px_32px_rgba(45,36,24,0.06)] ring-1 ring-night-900/5 dark:border-white/10 dark:ring-white/10"
    >
      <div className="border-b border-night-900/6 bg-gradient-to-br from-violet-50/90 via-sand-50 to-white px-4 py-4 dark:border-white/10 dark:from-violet-950/40 dark:via-[var(--color-bg-soft)] dark:to-[var(--color-surface)]">
        <p className={editorialPremium.sectionLabel}>Rehearsal notes</p>
        <h3 className={`${editorialPremium.sectionTitle} mt-1`}>Run order &amp; transitions</h3>
        {serviceLabel ? (
          <p className="mt-1 text-xs font-medium text-night-600 dark:text-sand-400">{serviceLabel}</p>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-night-500 dark:text-sand-400">
          Published notes appear above the setlist for the team — full screen reader included.
        </p>
      </div>
      <div className="p-4">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={8}
          placeholder="Run order, transitions, who leads which song, medley flow…"
          className="min-h-[11rem] w-full resize-y rounded-[1.15rem] border border-night-900/10 bg-sand-50/90 px-4 py-3.5 font-sans text-sm leading-relaxed text-night-800 outline-none ring-night-900/5 transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-200/80 dark:border-white/10 dark:bg-[var(--color-bg-muted)] dark:text-sand-100 dark:focus:border-violet-700 dark:focus:ring-violet-900/40"
        />
      </div>
    </MobilePremiumFrame>
  );
}
