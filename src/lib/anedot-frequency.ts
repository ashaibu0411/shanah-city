import type { GivingCheckoutFrequency } from "@/lib/giving-types";

/** Anedot hosted page frequency query values (confirm with Finance when Action Page is created). */
const ANEDOT_FREQUENCY: Record<GivingCheckoutFrequency, string> = {
  once: "once",
  weekly: "weekly",
  biweekly: "biweekly",
  monthly: "monthly",
};

export function anedotFrequencyParam(frequency: GivingCheckoutFrequency): string {
  return ANEDOT_FREQUENCY[frequency] ?? "once";
}
