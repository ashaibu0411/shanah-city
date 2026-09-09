import { promises as fs } from "fs";
import path from "path";
import type { CreateGroupResourceInput, GroupResourceRecord } from "@/lib/group-resource-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "group-resources.json");

async function readResources() {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as GroupResourceRecord[];
  } catch {
    return [];
  }
}

async function writeResources(resources: GroupResourceRecord[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(resources, null, 2));
}

export async function getGroupResources(groupId: string) {
  const resources = await readResources();
  return resources
    .filter((entry) => entry.groupId === groupId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export async function createGroupResource(input: CreateGroupResourceInput) {
  const resources = await readResources();
  const now = new Date().toISOString();
  const record: GroupResourceRecord = {
    id: `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    groupId: input.groupId,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    url: input.url?.trim() || undefined,
    category: input.category?.trim() || "marriage",
    sortOrder: input.sortOrder ?? resources.filter((r) => r.groupId === input.groupId).length,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: now,
    updatedAt: now,
  };
  resources.push(record);
  await writeResources(resources);
  return record;
}

export async function updateGroupResource(
  id: string,
  update: Partial<Pick<GroupResourceRecord, "title" | "description" | "url" | "category" | "sortOrder">>,
) {
  const resources = await readResources();
  const index = resources.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  resources[index] = {
    ...resources[index],
    ...update,
    title: update.title?.trim() ?? resources[index].title,
    description:
      update.description === undefined
        ? resources[index].description
        : update.description?.trim() || undefined,
    url: update.url === undefined ? resources[index].url : update.url?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeResources(resources);
  return resources[index];
}

export async function deleteGroupResource(id: string) {
  const resources = await readResources();
  await writeResources(resources.filter((entry) => entry.id !== id));
}

export async function getGroupResourceById(id: string) {
  const resources = await readResources();
  return resources.find((entry) => entry.id === id) ?? null;
}
