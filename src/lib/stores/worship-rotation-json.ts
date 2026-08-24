import { promises as fs } from "fs";
import path from "path";
import {
  defaultRotationConfig,
  type WorshipRotationPoolMember,
  type WorshipScheduleRotationConfig,
} from "@/lib/worship-types";

const DATA_DIR = path.join(process.cwd(), "data");
const ROTATION_FILE = path.join(DATA_DIR, "worship-schedule-rotation.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
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

export async function getWorshipRotationConfig() {
  const config = await readJson<WorshipScheduleRotationConfig | null>(ROTATION_FILE, null);
  return config ?? defaultRotationConfig();
}

export async function saveWorshipRotationConfig(input: {
  pool: WorshipRotationPoolMember[];
  serviceTime: string;
  serviceKind: "sunday" | "friday";
  rotationIndex?: number;
  skipDates?: string[];
  weeksAhead?: number;
  uploadDutyLeadDays?: number;
  actor: { id: string; name: string };
}) {
  const existing = await getWorshipRotationConfig();
  const now = new Date().toISOString();

  const config: WorshipScheduleRotationConfig = {
    ...existing,
    pool: input.pool,
    serviceTime: input.serviceTime,
    serviceKind: input.serviceKind,
    rotationIndex: input.rotationIndex ?? existing.rotationIndex,
    skipDates: input.skipDates ?? existing.skipDates,
    weeksAhead: input.weeksAhead ?? existing.weeksAhead,
    uploadDutyLeadDays: input.uploadDutyLeadDays ?? existing.uploadDutyLeadDays,
    updatedBy: input.actor.id,
    updatedByName: input.actor.name,
    updatedAt: now,
  };

  await writeJson(ROTATION_FILE, config);
  return config;
}

export async function updateWorshipRotationIndex(rotationIndex: number) {
  const existing = await getWorshipRotationConfig();
  await writeJson(ROTATION_FILE, {
    ...existing,
    rotationIndex,
    updatedAt: new Date().toISOString(),
  });
}
