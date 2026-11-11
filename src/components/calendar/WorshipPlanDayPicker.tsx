"use client";

import Link from "next/link";
import type { WorshipServicePlan } from "@/lib/worship-types";
import { serviceDateTimeLabel } from "@/lib/worship-types";
import { worshipDetailHrefForPlan } from "@/lib/worship-plan-event-resolve";

export function WorshipPlanDayPicker({
  plans,
  canManageWorship,
  heading = "Choose a service plan",
}: {
  plans: WorshipServicePlan[];
  canManageWorship: boolean;
  heading?: string;
}) {
  if (plans.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">{heading}</p>
      <ul className="mt-2 space-y-2">
        {plans.map((plan) => {
          const href = worshipDetailHrefForPlan(plan, canManageWorship);
          const label = plan.title?.trim() || serviceDateTimeLabel(plan.serviceDate, plan.serviceTime);
          return (
            <li key={`${plan.serviceDate}-${plan.serviceTime}`}>
              <Link
                href={href}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-night-900 ring-1 ring-night-900/8 transition hover:bg-violet-50 hover:ring-violet-300"
              >
                <span>{label}</span>
                <span className="shrink-0 text-xs font-semibold text-violet-700">Open planner</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
