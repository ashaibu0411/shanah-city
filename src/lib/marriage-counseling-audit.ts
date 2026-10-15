import type { MarriageAuditLogRecord } from "@/lib/marriage-counseling-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";

export async function logMarriageAudit(input: Omit<MarriageAuditLogRecord, "id" | "at">) {
  const record: MarriageAuditLogRecord = {
    id: `mal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...input,
  };
  await marriageStore().appendAuditLog(record);
  return record;
}
