"use client";

import { editorialPremium } from "@/components/app/editorial-premium";
import { MobilePremiumFrame } from "@/components/app/MobilePremiumFrame";
import { RichTextArea } from "@/components/ui/RichTextArea";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { worshipRehearsalNotesBodyClass } from "@/components/worship/WorshipRehearsalNotesReader";

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
      className="mb-6 overflow-visible rounded-[1.35rem] border border-night-900/8 shadow-[0_1px_2px_rgba(45,36,24,0.04),0_12px_32px_rgba(45,36,24,0.06)] ring-1 ring-night-900/5 dark:border-white/10 dark:ring-white/10"
    >
      <div className="border-b border-night-900/6 bg-gradient-to-br from-violet-50/90 via-sand-50 to-white px-4 py-4 dark:border-white/10 dark:from-violet-950/40 dark:via-[var(--color-bg-soft)] dark:to-[var(--color-surface)]">
        <p className={editorialPremium.sectionLabel}>Rehearsal notes</p>
        <h3 className={`${editorialPremium.sectionTitle} mt-1`}>Run order &amp; transitions</h3>
        {serviceLabel ? (
          <p className="mt-1 text-xs font-medium text-night-600 dark:text-sand-400">{serviceLabel}</p>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-night-500 dark:text-sand-400">
          Use line headers with <span className="font-bold text-night-800">B</span> for bold section
          titles. Notes flow on the page — no nested scroll box.
        </p>
      </div>
      <div className="p-4">
        <RichTextArea
          id="worship-rehearsal-notes"
          label="Notes for the team"
          value={value}
          onValueChange={onChange}
          rows={12}
          boldMode="header"
          hint="Tap B on a line to bold that section header. Singers see large, readable type on the service page."
        />
        {value.trim() ? (
          <div className="mt-4 border-t border-night-900/8 pt-4 dark:border-white/10">
            <p className={editorialPremium.sectionLabel}>Preview</p>
            <div className={`${worshipRehearsalNotesBodyClass} mt-2 rounded-[1.15rem] border border-night-900/8 bg-sand-50/50 p-4 dark:border-white/10 dark:bg-[var(--color-bg-muted)]`}>
              <RichTextContent text={value} />
            </div>
          </div>
        ) : null}
      </div>
    </MobilePremiumFrame>
  );
}
