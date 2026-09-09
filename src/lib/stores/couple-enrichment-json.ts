import { promises as fs } from "fs";
import path from "path";
import type {
  CoupleEnrichmentModuleRecord,
  CoupleEnrichmentModuleView,
} from "@/lib/couple-enrichment-types";

const DATA_DIR = path.join(process.cwd(), "data");
const MODULES_FILE = path.join(DATA_DIR, "couple-enrichment-modules.json");
const PROGRESS_FILE = path.join(DATA_DIR, "couple-enrichment-progress.json");

type ProgressRecord = {
  id: string;
  moduleId: string;
  coupleLinkId: string;
  completedBy: string;
  completedByName: string;
  completedAt: string;
};

async function readJson<T>(file: string, fallback: T) {
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function getEnrichmentModules(groupId: string) {
  const modules = await readJson<CoupleEnrichmentModuleRecord[]>(MODULES_FILE, []);
  return modules
    .filter((entry) => entry.groupId === groupId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export async function createEnrichmentModule(input: {
  groupId: string;
  title: string;
  description?: string;
  sortOrder?: number;
  createdBy: string;
  createdByName: string;
}) {
  const modules = await readJson<CoupleEnrichmentModuleRecord[]>(MODULES_FILE, []);
  const now = new Date().toISOString();
  const record: CoupleEnrichmentModuleRecord = {
    id: `enrich-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    groupId: input.groupId,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    sortOrder: input.sortOrder ?? modules.filter((m) => m.groupId === input.groupId).length,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: now,
    updatedAt: now,
  };
  modules.push(record);
  await writeJson(MODULES_FILE, modules);
  return record;
}

export async function deleteEnrichmentModule(id: string) {
  const modules = await readJson<CoupleEnrichmentModuleRecord[]>(MODULES_FILE, []);
  const progress = await readJson<ProgressRecord[]>(PROGRESS_FILE, []);
  await writeJson(
    MODULES_FILE,
    modules.filter((entry) => entry.id !== id),
  );
  await writeJson(
    PROGRESS_FILE,
    progress.filter((entry) => entry.moduleId !== id),
  );
}

export async function getProgressForCoupleLink(coupleLinkId: string) {
  const progress = await readJson<ProgressRecord[]>(PROGRESS_FILE, []);
  return progress.filter((entry) => entry.coupleLinkId === coupleLinkId);
}

export async function setEnrichmentProgress(input: {
  moduleId: string;
  coupleLinkId: string;
  completed: boolean;
  userId: string;
  userName: string;
}) {
  const progress = await readJson<ProgressRecord[]>(PROGRESS_FILE, []);
  const without = progress.filter(
    (entry) =>
      !(entry.moduleId === input.moduleId && entry.coupleLinkId === input.coupleLinkId),
  );
  if (!input.completed) {
    await writeJson(PROGRESS_FILE, without);
    return null;
  }
  const record: ProgressRecord = {
    id: `enrich-prog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    moduleId: input.moduleId,
    coupleLinkId: input.coupleLinkId,
    completedBy: input.userId,
    completedByName: input.userName,
    completedAt: new Date().toISOString(),
  };
  without.push(record);
  await writeJson(PROGRESS_FILE, without);
  return record;
}

export async function buildModuleViews(
  modules: CoupleEnrichmentModuleRecord[],
  coupleLinkId: string | null,
): Promise<CoupleEnrichmentModuleView[]> {
  if (!coupleLinkId) {
    return modules.map((module) => ({ ...module, completed: false }));
  }
  const progress = await getProgressForCoupleLink(coupleLinkId);
  const completedIds = new Set(progress.map((entry) => entry.moduleId));
  const completedAtByModule = new Map(progress.map((entry) => [entry.moduleId, entry.completedAt]));
  return modules.map((module) => ({
    ...module,
    completed: completedIds.has(module.id),
    completedAt: completedAtByModule.get(module.id),
  }));
}
