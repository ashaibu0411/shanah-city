import { anedotFrequencyParam } from "@/lib/anedot-frequency";
import type { GivingCheckoutFrequency } from "@/lib/giving-types";

export type BuildAnedotCheckoutUrlInput = {
  actionPageUrl: string;
  amount: number;
  frequency: GivingCheckoutFrequency;
  /** Opaque signed intent reference — never a raw member user id. */
  intentReference: string;
  fundAnedotIdentifier?: string;
};

/**
 * Builds a hosted Anedot checkout URL (no iframe). Query params follow Anedot URL-parameter support;
 * Finance must align hidden/custom field + fund identifiers on the Action Page.
 */
export function buildAnedotHostedCheckoutUrl(input: BuildAnedotCheckoutUrlInput): string {
  const base = new URL(input.actionPageUrl);
  const amount = Math.round(input.amount * 100) / 100;
  if (amount > 0) {
    base.searchParams.set("amount", String(amount));
  }
  const freq = anedotFrequencyParam(input.frequency);
  if (freq !== "once") {
    base.searchParams.set("frequency", freq);
  }
  if (input.fundAnedotIdentifier?.trim()) {
    base.searchParams.set("fund_id", input.fundAnedotIdentifier.trim());
  }
  base.searchParams.set("utm_content", input.intentReference);
  base.searchParams.set("utm_source", "shanah_city_giving_hub");
  base.searchParams.set("utm_medium", "hosted_redirect");
  return base.toString();
}
