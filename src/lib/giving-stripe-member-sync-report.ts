export type MemberStripeSyncSkipReason =
  | "not_paid"
  | "not_shanah_checkout"
  | "not_shanah_invoice"
  | "not_eligible_invoice"
  | "metadata_owner_conflict"
  | "customer_mismatch"
  | "already_recorded"
  | "record_create_failed"
  | "subscription_metadata_unavailable"
  | "unauthorized_session";

export type MemberStripeSyncReport = {
  durationMs: number;
  scannedCheckoutSessions: number;
  scannedInvoices: number;
  paidCheckoutSessions: number;
  paidInvoices: number;
  eligibleCheckoutSessions: number;
  eligibleInvoices: number;
  alreadyRecorded: number;
  newlyRecorded: number;
  linked: number;
  flagged: number;
  skippedByReason: Partial<Record<MemberStripeSyncSkipReason, number>>;
  errors: string[];
};

export function emptyMemberStripeSyncReport(): MemberStripeSyncReport {
  return {
    durationMs: 0,
    scannedCheckoutSessions: 0,
    scannedInvoices: 0,
    paidCheckoutSessions: 0,
    paidInvoices: 0,
    eligibleCheckoutSessions: 0,
    eligibleInvoices: 0,
    alreadyRecorded: 0,
    newlyRecorded: 0,
    linked: 0,
    flagged: 0,
    skippedByReason: {},
    errors: [],
  };
}

export function bumpSkipReason(
  report: MemberStripeSyncReport,
  reason: MemberStripeSyncSkipReason,
  count = 1,
) {
  report.skippedByReason[reason] = (report.skippedByReason[reason] ?? 0) + count;
}

export function reportToSyncResult(
  report: MemberStripeSyncReport,
  status: "ok" | "partial" | "timeout" | "stripe_error" | "skipped_cooldown" | "skipped_contention" | "noop",
  skippedReason?: string,
) {
  const skipped = Object.values(report.skippedByReason).reduce((sum, n) => sum + (n ?? 0), 0);
  return {
    recorded: report.newlyRecorded,
    linked: report.linked,
    flagged: report.flagged,
    skipped,
    status,
    skippedReason,
    report,
  };
}
