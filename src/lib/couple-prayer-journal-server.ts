import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import type {
  CouplePrayerJournalEntryRecord,
  CouplePrayerJournalEntryView,
  CouplePrayerJournalStatus,
} from "@/lib/couple-prayer-journal-types";
import { useDatabase } from "@/lib/use-database";
import * as couplePrayerJournalDb from "@/lib/stores/couple-prayer-journal-db";
import * as couplePrayerJournalJson from "@/lib/stores/couple-prayer-journal-json";

const store = () => (useDatabase() ? couplePrayerJournalDb : couplePrayerJournalJson);

async function toView(entry: CouplePrayerJournalEntryRecord): Promise<CouplePrayerJournalEntryView> {
  const author = await getUserById(entry.createdBy);
  return { ...entry, createdByName: author?.name ?? "Spouse" };
}

async function assertEntryAccess(user: PublicMember, entryId: string) {
  const link = await assertActiveCoupleWorkspace(user);
  const entry = await store().getPrayerJournalEntry(entryId);
  if (!entry || entry.coupleLinkId !== link.id) {
    throw new Error("Entry not found.");
  }
  return { link, entry };
}

export async function getCouplePrayerJournalForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const records = await store().listPrayerJournalEntries(link.id);
  const entries = await Promise.all(records.map((record) => toView(record)));
  return { coupleLinkId: link.id, entries };
}

export async function createCouplePrayerJournalEntryForUser(
  user: PublicMember,
  body: Record<string, unknown>,
) {
  const link = await assertActiveCoupleWorkspace(user);
  const title = String(body.title ?? "").trim();
  const journalBody = String(body.body ?? "").trim();
  if (!title) throw new Error("Add a title for this prayer.");
  if (!journalBody) throw new Error("Write your prayer request.");
  if (title.length > 200) throw new Error("Title is too long.");
  if (journalBody.length > 4000) throw new Error("Keep the prayer under 4,000 characters.");

  const record = await store().createPrayerJournalEntry({
    coupleLinkId: link.id,
    createdBy: user.id,
    title,
    body: journalBody,
  });

  const feed = await getCouplePrayerJournalForUser(user);
  const entry = await toView(record);
  return { entry, ...feed };
}

export async function updateCouplePrayerJournalEntryForUser(
  user: PublicMember,
  entryId: string,
  body: Record<string, unknown>,
) {
  await assertEntryAccess(user, entryId);

  const statusRaw = body.status;
  let status: CouplePrayerJournalStatus | undefined;
  if (statusRaw === "praying" || statusRaw === "answered") {
    status = statusRaw;
  }

  const title = body.title !== undefined ? String(body.title).trim() : undefined;
  const journalBody = body.body !== undefined ? String(body.body).trim() : undefined;

  if (title !== undefined && !title) throw new Error("Title cannot be empty.");
  if (journalBody !== undefined && !journalBody) throw new Error("Prayer text cannot be empty.");

  await store().updatePrayerJournalEntry(entryId, { title, body: journalBody, status });
  return getCouplePrayerJournalForUser(user);
}

export async function deleteCouplePrayerJournalEntryForUser(user: PublicMember, entryId: string) {
  await assertEntryAccess(user, entryId);
  await store().deletePrayerJournalEntry(entryId);
  return getCouplePrayerJournalForUser(user);
}
