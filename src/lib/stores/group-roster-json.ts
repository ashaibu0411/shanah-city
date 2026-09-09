import { promises as fs } from "fs";
import path from "path";
import type { GroupCategory } from "@/lib/group-types";
import {
  defaultRosterRolesForGroup,
  normalizeRosterSlots,
  previousSundayIso,
  type GroupRosterSlot,
  type GroupServiceRoster,
} from "@/lib/group-roster-types";

const DATA_DIR = path.join(process.cwd(), "data");
const ROSTER_FILE = path.join(DATA_DIR, "group-service-rosters.json");
const TEMPLATE_FILE = path.join(DATA_DIR, "group-roster-templates.json");

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

function withNormalized(roster: GroupServiceRoster): GroupServiceRoster {
  return { ...roster, assignments: normalizeRosterSlots(roster.assignments) };
}

function sortRosters(rosters: GroupServiceRoster[]) {
  return [...rosters].sort(
    (left, right) =>
      left.serviceDate.localeCompare(right.serviceDate) ||
      left.serviceTime.localeCompare(right.serviceTime),
  );
}

export async function getGroupRosterTemplateRoles(group: {
  id: string;
  name: string;
  category: GroupCategory;
}) {
  const templates = await readJson<Record<string, string[]>>(TEMPLATE_FILE, {});
  const saved = templates[group.id];
  if (saved?.length) return saved;
  return defaultRosterRolesForGroup(group);
}

export async function saveGroupRosterTemplateRoles(groupId: string, roles: string[]) {
  const templates = await readJson<Record<string, string[]>>(TEMPLATE_FILE, {});
  templates[groupId] = roles.map((role) => role.trim()).filter(Boolean);
  await writeJson(TEMPLATE_FILE, templates);
  return templates[groupId];
}

export async function listGroupServiceRosters(options: {
  groupId: string;
  since?: string;
  until?: string;
}) {
  let rosters = sortRosters(await readJson<GroupServiceRoster[]>(ROSTER_FILE, [])).filter(
    (roster) => roster.groupId === options.groupId,
  );
  if (options.since) {
    rosters = rosters.filter((roster) => roster.serviceDate >= options.since!);
  }
  if (options.until) {
    rosters = rosters.filter((roster) => roster.serviceDate <= options.until!);
  }
  return rosters.map(withNormalized);
}

export async function getGroupServiceRoster(
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) {
  const rosters = await readJson<GroupServiceRoster[]>(ROSTER_FILE, []);
  const roster = rosters.find(
    (entry) =>
      entry.groupId === groupId &&
      entry.serviceDate === serviceDate &&
      entry.serviceTime === serviceTime,
  );
  return roster ? withNormalized(roster) : null;
}

export async function findPreviousGroupServiceRoster(
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) {
  const rosters = sortRosters(await readJson<GroupServiceRoster[]>(ROSTER_FILE, [])).filter(
    (entry) => entry.groupId === groupId,
  );
  const prevSunday = previousSundayIso(serviceDate);
  const exact = rosters.find(
    (entry) => entry.serviceDate === prevSunday && entry.serviceTime === serviceTime,
  );
  if (exact) return withNormalized(exact);
  const fallback = rosters.find(
    (entry) => entry.serviceTime === serviceTime && entry.serviceDate < serviceDate,
  );
  return fallback ? withNormalized(fallback) : null;
}

export async function saveGroupServiceRoster(input: {
  groupId: string;
  serviceDate: string;
  serviceTime: string;
  title?: string;
  assignments: GroupRosterSlot[];
  notes?: string;
  status: GroupServiceRoster["status"];
  actor: { id: string; name: string };
}) {
  const rosters = await readJson<GroupServiceRoster[]>(ROSTER_FILE, []);
  const index = rosters.findIndex(
    (entry) =>
      entry.groupId === input.groupId &&
      entry.serviceDate === input.serviceDate &&
      entry.serviceTime === input.serviceTime,
  );
  const now = new Date().toISOString();
  const assignments = normalizeRosterSlots(input.assignments);

  if (index >= 0) {
    const existing = rosters[index];
    rosters[index] = withNormalized({
      ...existing,
      title: input.title?.trim() || existing.title,
      assignments,
      notes: input.notes,
      status: input.status,
      publishedAt:
        input.status === "published"
          ? existing.publishedAt ?? now
          : input.status === "draft"
            ? undefined
            : existing.publishedAt,
      updatedAt: now,
    });
    await writeJson(ROSTER_FILE, rosters);
    return rosters[index];
  }

  const roster: GroupServiceRoster = withNormalized({
    id: `group-roster-${Date.now()}`,
    groupId: input.groupId,
    serviceDate: input.serviceDate,
    serviceTime: input.serviceTime,
    title: input.title?.trim() || null,
    assignments,
    notes: input.notes,
    status: input.status,
    publishedAt: input.status === "published" ? now : undefined,
    createdBy: input.actor.id,
    createdByName: input.actor.name,
    createdAt: now,
    updatedAt: now,
  });
  rosters.push(roster);
  await writeJson(ROSTER_FILE, rosters);
  return roster;
}

export async function deleteGroupServiceRoster(
  groupId: string,
  serviceDate: string,
  serviceTime: string,
) {
  const rosters = await readJson<GroupServiceRoster[]>(ROSTER_FILE, []);
  const next = rosters.filter(
    (entry) =>
      !(
        entry.groupId === groupId &&
        entry.serviceDate === serviceDate &&
        entry.serviceTime === serviceTime
      ),
  );
  if (next.length === rosters.length) return false;
  await writeJson(ROSTER_FILE, next);
  return true;
}
