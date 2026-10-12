import { randomUUID } from "crypto";
import { readJsonFromData, writeJsonToData } from "@/lib/json-file-store";
import type {
  ChoirAvailabilityPreferences,
  ChoirAvailabilityStore,
  ChoirEventAvailabilityRecord,
  ChoirScheduleChangeRequest,
} from "@/lib/choir-availability-types";

const STORE_FILENAME = "choir-availability.json";

const EMPTY: ChoirAvailabilityStore = {
  responses: [],
  preferences: [],
  changeRequests: [],
  eventDeadlines: {},
  guidelinesMarkdown: null,
};

async function readStore(): Promise<ChoirAvailabilityStore> {
  const parsed = await readJsonFromData<Partial<ChoirAvailabilityStore>>(STORE_FILENAME, {});
  if (!parsed || typeof parsed !== "object" || Object.keys(parsed).length === 0) {
    return { ...EMPTY };
  }
  return {
    responses: Array.isArray(parsed.responses) ? parsed.responses : [],
    preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
    changeRequests: Array.isArray(parsed.changeRequests) ? parsed.changeRequests : [],
    eventDeadlines:
      parsed.eventDeadlines && typeof parsed.eventDeadlines === "object" ? parsed.eventDeadlines : {},
    guidelinesMarkdown:
      typeof parsed.guidelinesMarkdown === "string" ? parsed.guidelinesMarkdown : null,
  };
}

async function writeStore(store: ChoirAvailabilityStore) {
  await writeJsonToData(STORE_FILENAME, store);
}

export async function getChoirAvailabilityResponseJson(
  groupId: string,
  eventId: string,
  memberId: string,
) {
  const store = await readStore();
  return (
    store.responses.find(
      (row) => row.groupId === groupId && row.eventId === eventId && row.memberId === memberId,
    ) ?? null
  );
}

export async function listChoirAvailabilityResponsesForMemberJson(groupId: string, memberId: string) {
  const store = await readStore();
  return store.responses.filter((row) => row.groupId === groupId && row.memberId === memberId);
}

export async function listChoirAvailabilityResponsesForGroupJson(groupId: string) {
  const store = await readStore();
  return store.responses.filter((row) => row.groupId === groupId);
}

export async function upsertChoirAvailabilityResponseJson(record: ChoirEventAvailabilityRecord) {
  const store = await readStore();
  const index = store.responses.findIndex(
    (row) =>
      row.groupId === record.groupId &&
      row.eventId === record.eventId &&
      row.memberId === record.memberId,
  );
  if (index >= 0) {
    store.responses[index] = record;
  } else {
    store.responses.push(record);
  }
  await writeStore(store);
  return record;
}

export async function getChoirAvailabilityPreferencesJson(groupId: string, memberId: string) {
  const store = await readStore();
  return store.preferences.find((row) => row.groupId === groupId && row.memberId === memberId) ?? null;
}

export async function saveChoirAvailabilityPreferencesJson(preferences: ChoirAvailabilityPreferences) {
  const store = await readStore();
  const index = store.preferences.findIndex(
    (row) => row.groupId === preferences.groupId && row.memberId === preferences.memberId,
  );
  if (index >= 0) {
    store.preferences[index] = preferences;
  } else {
    store.preferences.push(preferences);
  }
  await writeStore(store);
  return preferences;
}

export async function createChoirScheduleChangeRequestJson(
  input: Omit<ChoirScheduleChangeRequest, "id" | "createdAt" | "updatedAt" | "status">,
) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: ChoirScheduleChangeRequest = {
    ...input,
    id: randomUUID(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  store.changeRequests.push(record);
  await writeStore(store);
  return record;
}

export async function listChoirScheduleChangeRequestsJson(groupId: string, memberId?: string) {
  const store = await readStore();
  return store.changeRequests
    .filter((row) => {
      if (row.groupId !== groupId) return false;
      if (memberId) return row.memberId === memberId;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateChoirScheduleChangeRequestJson(
  id: string,
  patch: Partial<ChoirScheduleChangeRequest>,
) {
  const store = await readStore();
  const index = store.changeRequests.findIndex((row) => row.id === id);
  if (index < 0) return null;
  store.changeRequests[index] = {
    ...store.changeRequests[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.changeRequests[index];
}

export async function getChoirAvailabilityDeadlinesJson() {
  const store = await readStore();
  return store.eventDeadlines;
}

export async function setChoirAvailabilityDeadlineJson(eventId: string, deadlineIso: string | null) {
  const store = await readStore();
  if (!deadlineIso) {
    delete store.eventDeadlines[eventId];
  } else {
    store.eventDeadlines[eventId] = deadlineIso;
  }
  await writeStore(store);
  return store.eventDeadlines;
}

export async function getChoirAvailabilityGuidelinesJson() {
  const store = await readStore();
  return store.guidelinesMarkdown;
}

export async function saveChoirAvailabilityGuidelinesJson(markdown: string) {
  const store = await readStore();
  store.guidelinesMarkdown = markdown;
  await writeStore(store);
  return markdown;
}
