import { promises as fs } from "fs";
import path from "path";
import { MARRIAGE_COUNSELING_MODULES } from "@/lib/marriage-counseling-curriculum";
import type {
  MarriageCurriculumVersionRecord,
  MarriageProgramTrackRecord,
  MarriageProgramType,
} from "@/lib/marriage-counseling-types";
import { DEFAULT_PROGRAM_TRACKS } from "@/lib/marriage-counseling-program-tracks";
import { mergeMissingStage2Modules } from "@/lib/marriage-curriculum-stage2-merge";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE =
  process.env.MARRIAGE_CURRICULUM_DATA_FILE?.trim() ||
  path.join(DATA_DIR, "marriage-curriculum.json");

type CurriculumFile = {
  versions: MarriageCurriculumVersionRecord[];
  programTracks: MarriageProgramTrackRecord[];
};

async function readFile(): Promise<CurriculumFile> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw) as CurriculumFile;
  } catch {
    return { versions: [], programTracks: [] };
  }
}

async function writeFile(data: CurriculumFile) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function listCurriculumVersions() {
  const data = await readFile();
  return data.versions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCurriculumVersion(id: string) {
  const data = await readFile();
  return data.versions.find((v) => v.id === id) ?? null;
}

export async function getPublishedCurriculumVersion() {
  const data = await readFile();
  return (
    data.versions
      .filter((v) => v.status === "published")
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0] ?? null
  );
}

export async function saveCurriculumDraft(input: {
  id?: string;
  version: string;
  modules: MarriageCurriculumVersionRecord["modules"];
  createdBy: string;
  createdByName: string;
  basedOnVersion?: string;
}) {
  const data = await readFile();
  const now = new Date().toISOString();
  const id = input.id ?? `mcv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const existingIndex = data.versions.findIndex((v) => v.id === id);
  const record: MarriageCurriculumVersionRecord = {
    id,
    version: input.version,
    status: "draft",
    modules: input.modules,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdAt: existingIndex === -1 ? now : data.versions[existingIndex].createdAt,
    updatedAt: now,
    basedOnVersion: input.basedOnVersion,
  };
  if (existingIndex === -1) data.versions.push(record);
  else data.versions[existingIndex] = record;
  await writeFile(data);
  return record;
}

export async function publishCurriculumVersion(id: string, actorId: string, actorName: string) {
  const data = await readFile();
  const index = data.versions.findIndex((v) => v.id === id);
  if (index === -1) throw new Error("Draft not found.");
  const now = new Date().toISOString();
  for (const v of data.versions) {
    if (v.status === "published") {
      v.status = "archived";
      v.updatedAt = now;
    }
  }
  data.versions[index] = {
    ...data.versions[index],
    status: "published",
    publishedAt: now,
    updatedAt: now,
    createdBy: data.versions[index].createdBy || actorId,
    createdByName: data.versions[index].createdByName || actorName,
  };
  await writeFile(data);
  return data.versions[index];
}

export async function archiveCurriculumVersion(id: string) {
  const data = await readFile();
  const index = data.versions.findIndex((v) => v.id === id);
  if (index === -1) throw new Error("Version not found.");
  data.versions[index].status = "archived";
  data.versions[index].updatedAt = new Date().toISOString();
  await writeFile(data);
  return data.versions[index];
}

export async function getProgramTrack(programType: MarriageProgramType) {
  const data = await readFile();
  const stored = data.programTracks.find((t) => t.programType === programType);
  if (stored) return stored.entries;
  return DEFAULT_PROGRAM_TRACKS[programType];
}

export async function saveProgramTrack(
  programType: MarriageProgramType,
  entries: MarriageProgramTrackRecord["entries"],
  updatedBy: string,
) {
  const data = await readFile();
  const now = new Date().toISOString();
  const index = data.programTracks.findIndex((t) => t.programType === programType);
  const record: MarriageProgramTrackRecord = {
    programType,
    entries,
    updatedAt: now,
    updatedBy,
  };
  if (index === -1) data.programTracks.push(record);
  else data.programTracks[index] = record;
  await writeFile(data);
  return record;
}

export function seedModulesSnapshot() {
  return mergeMissingStage2Modules(structuredClone(MARRIAGE_COUNSELING_MODULES));
}
