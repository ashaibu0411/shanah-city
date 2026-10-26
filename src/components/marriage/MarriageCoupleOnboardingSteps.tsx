"use client";

import Link from "next/link";
import type { MarriageCoupleOnboardingView } from "@/lib/marriage-couple-onboarding-types";
import { marriagePremium } from "@/components/marriage/marriage-counseling-premium";

type Props = {
  onboarding: MarriageCoupleOnboardingView;
};

export function MarriageCoupleOnboardingSteps({ onboarding }: Props) {
  return (
    <section className={`${marriagePremium.card} mt-6`} aria-labelledby="couple-onboarding-heading">
      <h2 id="couple-onboarding-heading" className={marriagePremium.sectionLabel}>
        Your path together
      </h2>
      <p className="mt-2 text-sm font-semibold text-night-900 dark:text-sand-100">{onboarding.nextStepTitle}</p>
      <p className={`${marriagePremium.cardMuted} mt-1 text-sm`}>{onboarding.nextStepDetail}</p>
      {onboarding.steps.find((s) => s.current && s.actionHref) ? (
        <Link
          href={onboarding.steps.find((s) => s.current)!.actionHref!}
          className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-clay-700 px-4 text-sm font-bold text-white dark:bg-clay-600"
        >
          {onboarding.steps.find((s) => s.current)!.actionLabel ?? "Continue"}
        </Link>
      ) : null}
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-clay-600 transition-all"
          style={{ width: `${onboarding.progressPercent}%` }}
          role="progressbar"
          aria-valuenow={onboarding.progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        />
      </div>
      <ol className="mt-4 space-y-3">
        {onboarding.steps.map((step, index) => (
          <li
            key={step.id}
            className={`flex gap-3 rounded-xl border px-3 py-3 text-sm ${
              step.current
                ? "border-clay-500 bg-clay-50/80 dark:border-clay-600 dark:bg-clay-950/30"
                : "border-stone-200 dark:border-white/10"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.complete
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100"
                  : step.current
                    ? "bg-clay-700 text-white"
                    : "bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-sand-300"
              }`}
              aria-hidden
            >
              {step.complete ? "✓" : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{step.title}</p>
              <p className="mt-0.5 text-xs text-night-600 dark:text-sand-400">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
