import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  ChoirMinistryResource,
  ChoirResourceRequest,
  ChoirResourceStore,
} from "@/lib/choir-resource-types";

const FILE = path.join(process.cwd(), "data", "choir-ministry-resources.json");

const EMPTY: ChoirResourceStore = { resources: [], requests: [] };

async function readStore(): Promise<ChoirResourceStore> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ChoirResourceStore>;
    return {
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeStore(store: ChoirResourceStore) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2));
}

export async function listChoirMinistryResourcesJson(groupId: string) {
  const store = await readStore();
  return store.resources
    .filter((row) => row.groupId === groupId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export async function upsertChoirMinistryResourceJson(resource: ChoirMinistryResource) {
  const store = await readStore();
  const index = store.resources.findIndex((row) => row.id === resource.id);
  if (index >= 0) {
    store.resources[index] = resource;
  } else {
    store.resources.push(resource);
  }
  await writeStore(store);
  return resource;
}

export async function deleteChoirMinistryResourceJson(groupId: string, id: string) {
  const store = await readStore();
  store.resources = store.resources.filter((row) => !(row.groupId === groupId && row.id === id));
  await writeStore(store);
}

export async function createChoirResourceRequestJson(
  input: Omit<ChoirResourceRequest, "id" | "createdAt" | "updatedAt" | "status">,
) {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: ChoirResourceRequest = {
    ...input,
    id: randomUUID(),
    status: "submitted",
    createdAt: now,
    updatedAt: now,
  };
  store.requests.push(record);
  await writeStore(store);
  return record;
}

export async function listChoirResourceRequestsJson(groupId: string, userId?: string) {
  const store = await readStore();
  return store.requests
    .filter((row) => {
      if (row.groupId !== groupId) return false;
      if (userId) return row.userId === userId;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateChoirResourceRequestJson(
  groupId: string,
  id: string,
  patch: Partial<Pick<ChoirResourceRequest, "status">>,
) {
  const store = await readStore();
  const index = store.requests.findIndex((row) => row.groupId === groupId && row.id === id);
  if (index < 0) return null;
  store.requests[index] = {
    ...store.requests[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.requests[index];
}
