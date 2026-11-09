import { normalizeGivingEmail, type GivingRecord } from "@/lib/giving-types";
import { linkGivingRecordsToUser, listGivingRecords } from "@/lib/giving-server";

function sortGivingRecords(records: GivingRecord[]) {
  return [...records].sort(
    (left, right) =>
      right.givenOn.localeCompare(left.givenOn) ||
      right.createdAt.localeCompare(left.createdAt),
  );
}

/**
 * Member-visible giving history: link guest gifts by verified email, then return
 * records owned by this user (never another member's userId).
 */
export async function listGivingRecordsForMember(member: { id: string; email: string }) {
  await linkGivingRecordsToUser(member.email, member.id);

  const byUserId = await listGivingRecords({ userId: member.id });
  const merged = new Map<string, GivingRecord>();
  for (const record of byUserId) {
    merged.set(record.id, record);
  }

  const email = normalizeGivingEmail(member.email);
  if (email) {
    const byEmail = await listGivingRecords({ donorEmail: email });
    for (const record of byEmail) {
      if (record.userId && record.userId !== member.id) {
        continue;
      }
      merged.set(record.id, record);
    }
  }

  return sortGivingRecords([...merged.values()]);
}
