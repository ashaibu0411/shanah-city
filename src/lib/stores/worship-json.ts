import { promises as fs } from "fs";
import path from "path";
import type {
  WorshipServicePlan,
  WorshipSong,
  WorshipTeamMember,
} from "@/lib/worship-types";
import { normalizeSongs, normalizeTeam } from "@/lib/worship-types";

const DATA_DIR = path.join(process.cwd(), "data");
const WORSHIP_FILE = path.join(DATA_DIR, "worship-service-plans.json");

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

async function readPlans() {
  return readJson<WorshipServicePlan[]>(WORSHIP_FILE, []);
}

function sortPlans(plans: WorshipServicePlan[]) {
  return [...plans].sort(
    (left, right) =>
      right.serviceDate.localeCompare(left.serviceDate) ||
      left.serviceTime.localeCompare(right.serviceTime),
  );
}

function withNormalized(plan: WorshipServicePlan): WorshipServicePlan {
  return {
    ...plan,
    songs: normalizeSongs(plan.songs),
    team: normalizeTeam(plan.team),
  };
}

export async function listWorshipPlans(options?: {
  since?: string;
  until?: string;
  status?: WorshipServicePlan["status"];
}) {
  let plans = sortPlans(await readPlans());

  if (options?.since) {
    plans = plans.filter((plan) => plan.serviceDate >= options.since!);
  }
  if (options?.until) {
    plans = plans.filter((plan) => plan.serviceDate <= options.until!);
  }
  if (options?.status) {
    plans = plans.filter((plan) => plan.status === options.status);
  }

  return plans.map(withNormalized);
}

export async function getWorshipPlan(serviceDate: string, serviceTime: string) {
  const plans = await readPlans();
  const plan = plans.find(
    (entry) => entry.serviceDate === serviceDate && entry.serviceTime === serviceTime,
  );
  return plan ? withNormalized(plan) : null;
}

export async function saveWorshipPlan(input: {
  serviceDate: string;
  serviceTime: string;
  title?: string;
  songs: WorshipSong[];
  team: WorshipTeamMember[];
  rehearsalNotes?: string;
  status: WorshipServicePlan["status"];
  actor: { id: string; name: string };
}) {
  const plans = await readPlans();
  const index = plans.findIndex(
    (plan) => plan.serviceDate === input.serviceDate && plan.serviceTime === input.serviceTime,
  );
  const now = new Date().toISOString();
  const songs = normalizeSongs(input.songs);
  const team = normalizeTeam(input.team);

  if (index >= 0) {
    const existing = plans[index];
    plans[index] = withNormalized({
      ...existing,
      title: input.title,
      songs,
      team,
      rehearsalNotes: input.rehearsalNotes,
      status: input.status,
      publishedAt:
        input.status === "published"
          ? existing.publishedAt ?? now
          : input.status === "draft"
            ? undefined
            : existing.publishedAt,
      updatedAt: now,
    });
    await writeJson(WORSHIP_FILE, plans);
    return plans[index];
  }

  const plan: WorshipServicePlan = withNormalized({
    id: `worship-${Date.now()}`,
    serviceDate: input.serviceDate,
    serviceTime: input.serviceTime,
    title: input.title,
    status: input.status,
    songs,
    team,
    rehearsalNotes: input.rehearsalNotes,
    publishedAt: input.status === "published" ? now : undefined,
    createdBy: input.actor.id,
    createdByName: input.actor.name,
    createdAt: now,
    updatedAt: now,
  });

  plans.push(plan);
  await writeJson(WORSHIP_FILE, plans);
  return plan;
}

export async function updateWorshipMemberStatus(input: {
  serviceDate: string;
  serviceTime: string;
  userId: string;
  ready?: boolean;
  songId?: string;
  prepared?: boolean;
}) {
  const plans = await readPlans();
  const index = plans.findIndex(
    (plan) => plan.serviceDate === input.serviceDate && plan.serviceTime === input.serviceTime,
  );
  if (index === -1) return null;

  const plan = withNormalized(plans[index]);
  const memberIndex = plan.team.findIndex((member) => member.userId === input.userId);
  if (memberIndex === -1) return null;

  if (typeof input.ready === "boolean") {
    plan.team[memberIndex] = { ...plan.team[memberIndex], ready: input.ready };
  }

  if (input.songId) {
    const songIndex = plan.songs.findIndex((song) => song.id === input.songId);
    if (songIndex >= 0) {
      const preparedBy = new Set(plan.songs[songIndex].preparedBy);
      if (input.prepared) {
        preparedBy.add(input.userId);
      } else {
        preparedBy.delete(input.userId);
      }
      plan.songs[songIndex] = {
        ...plan.songs[songIndex],
        preparedBy: [...preparedBy],
      };
    }
  }

  plan.updatedAt = new Date().toISOString();
  plans[index] = plan;
  await writeJson(WORSHIP_FILE, plans);
  return plan;
}

export async function deleteWorshipPlan(serviceDate: string, serviceTime: string) {
  const plans = await readPlans();
  const next = plans.filter(
    (plan) => !(plan.serviceDate === serviceDate && plan.serviceTime === serviceTime),
  );
  if (next.length === plans.length) return false;
  await writeJson(WORSHIP_FILE, next);
  return true;
}
