import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  ChoirEventTeamInterest,
  ChoirEventTeamInterestStatus,
  ChoirWorshipEventMeta,
  ChoirWorshipEventsStore,
} from "@/lib/choir-events-types";
import { DEFAULT_WORSHIP_EVENT_GUIDELINES } from "@/lib/choir-events-types";

const FILE = path.join(process.cwd(), "data", "choir-worship-events.json");

const EMPTY: ChoirWorshipEventsStore = {
  eventMeta: [],
  teamInterests: [],
  guidelinesMarkdown: DEFAULT_WORSHIP_EVENT_GUIDELINES,
};

async function readStore(): Promise<ChoirWorshipEventsStore> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ChoirWorshipEventsStore>;
    return {
      eventMeta: Array.isArray(parsed.eventMeta) ? parsed.eventMeta : [],
      teamInterests: Array.isArray(parsed.teamInterests) ? parsed.teamInterests : [],
      guidelinesMarkdown:
        typeof parsed.guidelinesMarkdown === "string"
          ? parsed.guidelinesMarkdown
          : DEFAULT_WORSHIP_EVENT_GUIDELINES,
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeStore(store: ChoirWorshipEventsStore) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2));
}

export async function getChoirWorshipEventsStoreJson() {
  return readStore();
}

export async function getChoirWorshipEventMetaJson(eventId: string) {
  const store = await readStore();
  return store.eventMeta.find((row) => row.eventId === eventId) ?? null;
}

export async function upsertChoirWorshipEventMetaJson(meta: ChoirWorshipEventMeta) {
  const store = await readStore();
  const index = store.eventMeta.findIndex((row) => row.eventId === meta.eventId);
  if (index >= 0) {
    store.eventMeta[index] = { ...store.eventMeta[index], ...meta };
  } else {
    store.eventMeta.push(meta);
  }
  await writeStore(store);
  return store.eventMeta.find((row) => row.eventId === meta.eventId)!;
}

export async function getChoirWorshipEventGuidelinesJson() {
  const store = await readStore();
  return store.guidelinesMarkdown ?? DEFAULT_WORSHIP_EVENT_GUIDELINES;
}

export async function saveChoirWorshipEventGuidelinesJson(markdown: string) {
  const store = await readStore();
  store.guidelinesMarkdown = markdown;
  await writeStore(store);
  return store.guidelinesMarkdown;
}

export async function listChoirEventTeamInterestsJson(groupId: string, eventId?: string) {
  const store = await readStore();
  return store.teamInterests.filter((row) => {
    if (row.groupId !== groupId) return false;
    if (eventId && row.eventId !== eventId) return false;
    return true;
  });
}

export async function getChoirEventTeamInterestForUserJson(
  groupId: string,
  eventId: string,
  userId: string,
) {
  const store = await readStore();
  return (
    store.teamInterests.find(
      (row) => row.groupId === groupId && row.eventId === eventId && row.userId === userId,
    ) ?? null
  );
}

export async function upsertChoirEventTeamInterestJson(input: {
  groupId: string;
  eventId: string;
  userId: string;
  userName: string;
  preferredRole?: string | null;
  note?: string | null;
}) {
  const store = await readStore();
  const existing = store.teamInterests.find(
    (row) =>
      row.groupId === input.groupId && row.eventId === input.eventId && row.userId === input.userId,
  );
  const now = new Date().toISOString();
  if (existing) {
    existing.preferredRole = input.preferredRole ?? existing.preferredRole;
    existing.note = input.note ?? existing.note;
    existing.updatedAt = now;
    if (existing.status === "declined") {
      existing.status = "interested";
    }
    await writeStore(store);
    return existing;
  }
  const created: ChoirEventTeamInterest = {
    id: randomUUID(),
    groupId: input.groupId,
    eventId: input.eventId,
    userId: input.userId,
    userName: input.userName,
    preferredRole: input.preferredRole ?? null,
    note: input.note ?? null,
    status: "interested",
    createdAt: now,
    updatedAt: now,
  };
  store.teamInterests.push(created);
  await writeStore(store);
  return created;
}

export async function updateChoirEventTeamInterestStatusJson(
  interestId: string,
  status: ChoirEventTeamInterestStatus,
) {
  const store = await readStore();
  const row = store.teamInterests.find((entry) => entry.id === interestId);
  if (!row) return null;
  row.status = status;
  row.updatedAt = new Date().toISOString();
  await writeStore(store);
  return row;
}
