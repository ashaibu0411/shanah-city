"use client";

import { useState } from "react";
import Link from "next/link";
import { CHOIR_PREPARATION_ITEMS } from "@/lib/choir-group-constants";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";

type ChoirPreparationChecklistProps = {
  planKey: string | null;
  checked: string[];
  onChange: (itemId: string, checked: boolean) => Promise<void>;
};

export function ChoirPreparationChecklist({
  planKey,
  checked,
  onChange,
}: ChoirPreparationChecklistProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const total = CHOIR_PREPARATION_ITEMS.length;
  const done = CHOIR_PREPARATION_ITEMS.filter((item) => checked.includes(item.id)).length;

  if (!planKey) {
    return null;
  }

  return (
    <section className="choir-card p-4" aria-labelledby="choir-prep-heading">
      <p className="choir-section-label">This week&apos;s preparation</p>
      <h2 id="choir-prep-heading" className="mt-1 text-base font-bold text-[var(--choir-heading)]">
        This week&apos;s preparation
      </h2>
      <p className="mt-1 text-xs font-semibold text-[var(--choir-muted)]">
        {done} of {total} completed
      </p>
      <div className="choir-prep-progress mt-3" aria-hidden>
        <span className="choir-prep-progress-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      <ul className="mt-3 space-y-2">
        {CHOIR_PREPARATION_ITEMS.map((item) => {
          const isChecked = checked.includes(item.id);
          if (item.id === "availability") {
            return (
              <li key={item.id}>
                <Link
                  href={`/groups/${SHANAH_WORSHIP_GROUP_ID}/availability`}
                  className="flex min-h-[44px] items-center gap-3 rounded-xl bg-[var(--choir-surface-soft)] px-3 py-2 text-sm text-[var(--choir-body)]"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isChecked
                        ? "border-[var(--choir-gold)] bg-[var(--choir-gold)] text-[var(--choir-heading)]"
                        : "border-[var(--choir-muted)] bg-white"
                    }`}
                    aria-hidden
                  >
                    {isChecked ? "✓" : ""}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {!isChecked ? (
                    <span className="text-xs font-bold text-[var(--choir-gold-dark)]">Confirm →</span>
                  ) : (
                    <span className="text-xs font-semibold text-[var(--choir-muted)]">Update</span>
                  )}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.id}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl bg-[var(--choir-surface-soft)] px-3 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--choir-gold)]"
                  checked={isChecked}
                  disabled={busyId === item.id}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setBusyId(item.id);
                    void onChange(item.id, next).finally(() => setBusyId(null));
                  }}
                />
                <span className="text-sm text-[var(--choir-body)]">{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
