import { promises as fs } from "fs";
import path from "path";
import type {
  MinistryReadinessCompletion,
  MinistryReadinessKey,
  MinistryReadinessSource,
} from "@/lib/ministry-readiness-types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "ministry-readiness-completions.json");

async function load(): Promise<MinistryReadinessCompletion[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MinistryReadinessCompletion[]) : [];
  } catch {
    return [];
  }
}

async function save(records: MinistryReadinessCompletion[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(records, null, 2));
}

export async function getMinistryReadinessCompletion(userId: string, readinessKey: MinistryReadinessKey) {
  const records = await load();
  return records.find((record) => record.userId === userId && record.readinessKey === readinessKey) ?? null;
}

export async function saveMinistryReadinessCompletion(
  input: Omit<MinistryReadinessCompletion, "id" | "createdAt">,
) {
  const records = await load();
  const now = new Date().toISOString();
  const existingIndex = records.findIndex(
    (record) => record.userId === input.userId && record.readinessKey === input.readinessKey,
  );
  const record: MinistryReadinessCompletion = {
    id: `readiness-${Date.now()}`,
    createdAt: now,
    ...input,
  };

  if (existingIndex >= 0) {
    records[existingIndex] = { ...records[existingIndex], ...record, id: records[existingIndex].id };
  } else {
    records.push(record);
  }

  await save(records);
  return record;
}

export async function listMinistryReadinessCompletionsForGroup(
  groupId: string,
  options?: { source?: MinistryReadinessSource },
) {
  const records = await load();
  return records
    .filter(
      (record) =>
        record.groupId === groupId && (!options?.source || record.source === options.source),
    )
    .sort((a, b) => b.agreedAt.localeCompare(a.agreedAt));
}
