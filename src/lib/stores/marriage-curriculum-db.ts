import { prisma } from "@/lib/db";
import type {
  MarriageCurriculumVersionRecord,
  MarriageModuleDefinition,
  MarriageProgramTrackRecord,
  MarriageProgramType,
} from "@/lib/marriage-counseling-types";
import { DEFAULT_PROGRAM_TRACKS } from "@/lib/marriage-counseling-program-tracks";

function mapVersion(row: {
  id: string;
  version: string;
  status: string;
  modulesJson: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  basedOnVersion: string | null;
}): MarriageCurriculumVersionRecord {
  return {
    id: row.id,
    version: row.version,
    status: row.status as MarriageCurriculumVersionRecord["status"],
    modules: JSON.parse(row.modulesJson) as MarriageModuleDefinition[],
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString(),
    basedOnVersion: row.basedOnVersion ?? undefined,
  };
}

export async function listCurriculumVersions() {
  const rows = await prisma.marriageCurriculumVersion.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapVersion);
}

export async function getPublishedCurriculumVersion() {
  const row = await prisma.marriageCurriculumVersion.findFirst({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
  });
  return row ? mapVersion(row) : null;
}

export async function saveCurriculumDraft(input: {
  id?: string;
  version: string;
  modules: MarriageModuleDefinition[];
  createdBy: string;
  createdByName: string;
  basedOnVersion?: string;
}) {
  const now = new Date();
  const id = input.id ?? `mcv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const row = await prisma.marriageCurriculumVersion.upsert({
    where: { id },
    create: {
      id,
      version: input.version,
      status: "draft",
      modulesJson: JSON.stringify(input.modules),
      createdBy: input.createdBy,
      createdByName: input.createdByName,
      createdAt: now,
      updatedAt: now,
      basedOnVersion: input.basedOnVersion ?? null,
    },
    update: {
      version: input.version,
      modulesJson: JSON.stringify(input.modules),
      updatedAt: now,
      basedOnVersion: input.basedOnVersion ?? null,
    },
  });
  return mapVersion(row);
}

export async function publishCurriculumVersion(id: string, actorId: string, actorName: string) {
  const now = new Date();
  await prisma.marriageCurriculumVersion.updateMany({
    where: { status: "published" },
    data: { status: "archived", updatedAt: now },
  });
  const row = await prisma.marriageCurriculumVersion.update({
    where: { id },
    data: {
      status: "published",
      publishedAt: now,
      updatedAt: now,
      createdBy: actorId,
      createdByName: actorName,
    },
  });
  return mapVersion(row);
}

export async function archiveCurriculumVersion(id: string) {
  const row = await prisma.marriageCurriculumVersion.update({
    where: { id },
    data: { status: "archived", updatedAt: new Date() },
  });
  return mapVersion(row);
}

export async function getProgramTrack(programType: MarriageProgramType) {
  const row = await prisma.marriageProgramTrack.findUnique({ where: { programType } });
  if (!row) return DEFAULT_PROGRAM_TRACKS[programType];
  return JSON.parse(row.entriesJson) as MarriageProgramTrackRecord["entries"];
}

export async function saveProgramTrack(
  programType: MarriageProgramType,
  entries: MarriageProgramTrackRecord["entries"],
  updatedBy: string,
) {
  const now = new Date();
  await prisma.marriageProgramTrack.upsert({
    where: { programType },
    create: {
      programType,
      entriesJson: JSON.stringify(entries),
      updatedAt: now,
      updatedBy,
    },
    update: {
      entriesJson: JSON.stringify(entries),
      updatedAt: now,
      updatedBy,
    },
  });
  return { programType, entries, updatedAt: now.toISOString(), updatedBy };
}
