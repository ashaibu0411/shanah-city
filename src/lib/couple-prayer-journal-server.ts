import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import {
  COUPLE_PRAYER_JOURNAL_CATEGORIES,
  type CouplePrayerJournalCategoryId,
  type CouplePrayerJournalEntryRecord,
  type CouplePrayerJournalEntryView,
  type CouplePrayerJournalPrivacy,
  type CouplePrayerJournalStatus,
} from "@/lib/couple-prayer-journal-types";
import { useDatabase } from "@/lib/use-database";
import * as couplePrayerJournalDb from "@/lib/stores/couple-prayer-journal-db";
import * as couplePrayerJournalJson from "@/lib/stores/couple-prayer-journal-json";

const store = () => (useDatabase() ? couplePrayerJournalDb : couplePrayerJournalJson);

const CATEGORY_IDS = new Set(COUPLE_PRAYER_JOURNAL_CATEGORIES.map((c) => c.id));

function parseCategory(value: unknown): CouplePrayerJournalCategoryId {
  const raw = String(value ?? "our-marriage");
  return CATEGORY_IDS.has(raw as CouplePrayerJournalCategoryId)
    ? (raw as CouplePrayerJournalCategoryId)
    : "our-marriage";
}

function parsePrivacy(value: unknown): CouplePrayerJournalPrivacy {
  return value === "personal" ? "personal" : "couple";
}

function canViewEntry(userId: string, entry: CouplePrayerJournalEntryRecord) {
  if (entry.privacy === "personal" && entry.createdBy !== userId) return false;
  return true;
}

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
  if (!canViewEntry(user.id, entry)) {
    throw new Error("Entry not found.");
  }
  return { link, entry };
}

export async function getCouplePrayerJournalForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const records = await store().listPrayerJournalEntries(link.id);
  const visible = records.filter((record) => canViewEntry(user.id, record));
  const entries = await Promise.all(visible.map((record) => toView(record)));
  return { coupleLinkId: link.id, entries };
}

export async function createCouplePrayerJournalEntryForUser(
  user: PublicMember,
  body: Record<string, unknown>,
) {
  const link = await assertActiveCoupleWorkspace(user);
  const title = String(body.title ?? "").trim();
  const journalBody = String(body.body ?? "").trim();
  const category = parseCategory(body.category);
  const scriptureRef = String(body.scriptureRef ?? "").trim();
  const privacy = parsePrivacy(body.privacy);

  if (!title) throw new Error("Add a title for this prayer.");
  if (!journalBody) throw new Error("Write your prayer request.");
  if (title.length > 200) throw new Error("Title is too long.");
  if (journalBody.length > 4000) throw new Error("Keep the prayer under 4,000 characters.");
  if (scriptureRef.length > 200) throw new Error("Scripture reference is too long.");

  const record = await store().createPrayerJournalEntry({
    coupleLinkId: link.id,
    createdBy: user.id,
    title,
    body: journalBody,
    category,
    scriptureRef: scriptureRef || undefined,
    privacy,
  });

  const feed = await getCouplePrayerJournalForUser(user);
  const entry = await toView(record);
  return { entry, ...feed };
}

function parseAnsweredAt(value: unknown): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const raw = String(value).trim();
  const parsed = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Use a valid date for when this prayer was answered.");
  }
  return parsed;
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
  const category = body.category !== undefined ? parseCategory(body.category) : undefined;
  const privacy = body.privacy !== undefined ? parsePrivacy(body.privacy) : undefined;
  const scriptureRef =
    body.scriptureRef !== undefined ? String(body.scriptureRef).trim() || undefined : undefined;
  const testimony =
    body.testimony !== undefined ? String(body.testimony).trim() || undefined : undefined;
  const thanksgivingScripture =
    body.thanksgivingScripture !== undefined
      ? String(body.thanksgivingScripture).trim() || undefined
      : undefined;
  const answeredPhotoKey =
    body.answeredPhotoKey !== undefined
      ? String(body.answeredPhotoKey).trim() || undefined
      : undefined;

  let answeredAt: Date | null | undefined = undefined;
  if (body.answeredAt !== undefined) {
    answeredAt = parseAnsweredAt(body.answeredAt) ?? null;
  }

  if (title !== undefined && !title) throw new Error("Title cannot be empty.");
  if (journalBody !== undefined && !journalBody) throw new Error("Prayer text cannot be empty.");
  if (testimony && testimony.length > 4000) throw new Error("Testimony is too long.");

  await store().updatePrayerJournalEntry(entryId, {
    title,
    body: journalBody,
    category,
    privacy,
    scriptureRef,
    status,
    answeredAt,
    testimony,
    thanksgivingScripture,
    answeredPhotoKey,
  });
  return getCouplePrayerJournalForUser(user);
}

export async function deleteCouplePrayerJournalEntryForUser(user: PublicMember, entryId: string) {
  await assertEntryAccess(user, entryId);
  await store().deletePrayerJournalEntry(entryId);
  return getCouplePrayerJournalForUser(user);
}
