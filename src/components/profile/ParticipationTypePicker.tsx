"use client";

import type { MemberParticipationType } from "@/lib/member-participation";
import { participationTypeOptions } from "@/lib/member-participation";

type ParticipationTypePickerProps = {
  value: MemberParticipationType;
  onChange: (value: MemberParticipationType) => void;
  emphasizeNoGroups?: boolean;
  name?: string;
};

export function ParticipationTypePicker({
  value,
  onChange,
  emphasizeNoGroups = false,
  name = "participationType",
}: ParticipationTypePickerProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-night-900 dark:text-sand-100">
        How are you connecting with Shanah City?
      </legend>
      {emphasizeNoGroups ? (
        <p className="text-sm text-night-600 dark:text-sand-300">
          You didn&apos;t pick a ministry group — choose how we should treat your account. You can
          join groups anytime from the Groups page.
        </p>
      ) : (
        <p className="text-sm text-night-600 dark:text-sand-300">
          This helps us welcome you correctly. Ministry groups are optional.
        </p>
      )}
      <div className="space-y-2">
        {participationTypeOptions.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
              value === option.id
                ? "border-clay-500 bg-clay-50/80 ring-1 ring-clay-500/30 dark:border-clay-400 dark:bg-clay-950/20"
                : "border-night-900/10 bg-sand-50 dark:border-white/10 dark:bg-night-900/40"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold text-night-900 dark:text-sand-100">
                {option.label}
              </span>
              <span className="mt-0.5 block text-sm text-night-600 dark:text-sand-300">
                {option.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
