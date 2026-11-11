import type { GivingRecord } from "@/lib/giving-types";

/** Tax / statement totals use effective amount when Anedot reversals adjusted the gift. */
export function givingRecordEffectiveAmount(record: GivingRecord): number {
  if (record.effectiveAmount !== undefined && record.effectiveAmount !== null) {
    return record.effectiveAmount;
  }
  return record.amount;
}

export function givingRecordCountsTowardTotals(record: GivingRecord): boolean {
  return givingRecordEffectiveAmount(record) > 0.0001;
}
