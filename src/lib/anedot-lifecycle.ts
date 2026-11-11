/** Monotonic lifecycle ranks — higher wins unless explicit reversal rules apply. */
export const ANEDOT_LIFECYCLE_RANK: Record<string, number> = {
  unknown: 0,
  processing: 10,
  completed: 20,
  settled: 30,
  chargeback_reversed: 35,
  partially_refunded: 45,
  refunded: 60,
  ach_returned: 60,
  chargeback: 60,
  voided: 60,
};

const TERMINAL = new Set(["refunded", "ach_returned", "chargeback", "voided"]);

export function anedotLifecycleRank(status: string): number {
  return ANEDOT_LIFECYCLE_RANK[status] ?? 0;
}

export function anedotLifecycleIsTerminal(status: string): boolean {
  return TERMINAL.has(status);
}

export type AnedotStaleDecision =
  | { apply: true }
  | { apply: false; reason: "stale_event" | "terminal_locked" | "illegal_reversal" };

/**
 * Prevents out-of-order webhooks from resurrecting reversed gifts or downgrading verified state.
 */
export function anedotShouldApplyLifecycleTransition(input: {
  currentStatus: string;
  currentRank: number;
  nextStatus: string;
  nextRank: number;
  eventType: string;
  eventAtMs: number;
  lastEventAtMs: number;
}): AnedotStaleDecision {
  if (input.currentStatus === input.nextStatus) {
    return { apply: true };
  }

  if (anedotLifecycleIsTerminal(input.currentStatus)) {
    if (input.eventType === "donation_chargeback_reversed" && input.currentStatus === "chargeback") {
      return { apply: true };
    }
    if (input.nextRank > input.currentRank && input.eventType === "donation_chargeback_reversed") {
      return { apply: true };
    }
    return { apply: false, reason: "terminal_locked" };
  }

  if (input.eventAtMs < input.lastEventAtMs && input.nextRank < input.currentRank) {
    return { apply: false, reason: "stale_event" };
  }

  if (input.nextRank < input.currentRank) {
    return { apply: false, reason: "stale_event" };
  }

  return { apply: true };
}

export type AnedotGiftMutation =
  | { kind: "none" }
  | { kind: "create"; grossAmount: number; effectiveAmount: number }
  | { kind: "confirm_settlement" }
  | { kind: "full_reversal" }
  | { kind: "partial_reversal"; effectiveAmount: number; reversedDelta: number };

export function anedotGiftMutationForEvent(input: {
  eventType: string;
  paymentSource: string | null;
  grossAmount: number | null;
  netAmount: number | null;
  existingGivingRecordId: string | null;
  existingEffectiveAmount: number | null;
}): AnedotGiftMutation {
  const gross = input.grossAmount;
  const net = input.netAmount;

  switch (input.eventType) {
    case "donation_completed": {
      if (input.paymentSource === "bank_account") {
        return { kind: "none" };
      }
      if (gross === null || gross <= 0) return { kind: "none" };
      if (input.existingGivingRecordId) return { kind: "none" };
      return { kind: "create", grossAmount: gross, effectiveAmount: gross };
    }
    case "donation_settled": {
      if (input.existingGivingRecordId) return { kind: "confirm_settlement" };
      if (gross === null || gross <= 0) return { kind: "none" };
      return { kind: "create", grossAmount: gross, effectiveAmount: gross };
    }
    case "donation_refunded":
    case "donation_ach_returned":
    case "donation_chargeback":
    case "donation_voided":
      if (!input.existingGivingRecordId) return { kind: "none" };
      return { kind: "full_reversal" };
    case "donation_partially_refunded": {
      if (!input.existingGivingRecordId || gross === null) return { kind: "none" };
      const priorEffective = input.existingEffectiveAmount ?? gross;
      const nextEffective = net !== null && net >= 0 ? net : priorEffective;
      const reversedDelta = Math.max(0, priorEffective - nextEffective);
      if (reversedDelta <= 0) return { kind: "none" };
      return { kind: "partial_reversal", effectiveAmount: nextEffective, reversedDelta };
    }
    case "donation_chargeback_reversed": {
      if (!input.existingGivingRecordId || gross === null) return { kind: "none" };
      const prior = input.existingEffectiveAmount ?? 0;
      if (prior >= gross - 0.01) return { kind: "none" };
      return {
        kind: "partial_reversal",
        effectiveAmount: gross,
        reversedDelta: prior - gross,
      };
    }
    default:
      return { kind: "none" };
  }
}
