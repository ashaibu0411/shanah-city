import { useDatabase } from "@/lib/use-database";
import {
  formatPrayerAssignmentDate,
  listPrayerAssignmentDates,
  PRAYER_SLOT_META,
  summarizePrayerDates,
  type PrayerRotationPoolMember,
  type PrayerScheduleRotationConfig,
  type PrayerSlotType,
} from "@/lib/prayer-schedule-types";
import * as prayerRotationDb from "@/lib/stores/prayer-rotation-db";
import * as prayerRotationJson from "@/lib/stores/prayer-rotation-json";

const store = () => (useDatabase() ? prayerRotationDb : prayerRotationJson);

export const getPrayerRotationConfig = (slotType: PrayerSlotType) =>
  store().getPrayerRotationConfig(slotType);

export const savePrayerRotationConfig = (
  input: Parameters<typeof prayerRotationJson.savePrayerRotationConfig>[0],
) => store().savePrayerRotationConfig(input);

export const listPrayerAssignments = (
  options: Parameters<typeof prayerRotationJson.listPrayerAssignments>[0],
) => store().listPrayerAssignments(options);

export const getPrayerAssignment = (slotType: PrayerSlotType, assignmentDate: string) =>
  store().getPrayerAssignment(slotType, assignmentDate);

export const publishPrayerAssignments = (slotType: PrayerSlotType, since?: string) =>
  store().publishPrayerAssignments(slotType, since);

export const markPrayerAssignmentsNotified = (slotType: PrayerSlotType, userIds: string[]) =>
  store().markPrayerAssignmentsNotified(slotType, userIds);

export async function listUpcomingPrayerAssignments(
  slotType: PrayerSlotType,
  config?: PrayerScheduleRotationConfig,
) {
  const rotation = config ?? (await getPrayerRotationConfig(slotType));
  const since = new Date().toISOString().slice(0, 10);
  const untilDate = new Date();
  untilDate.setDate(untilDate.getDate() + rotation.weeksAhead * 7);
  const until = untilDate.toISOString().slice(0, 10);

  return listPrayerAssignments({ slotType, since, until });
}

export async function generatePrayerSchedule(input: {
  slotType: PrayerSlotType;
  startDate?: string;
  weeksAhead?: number;
  overwrite?: boolean;
  actor: { id: string; name: string };
}) {
  const config = await getPrayerRotationConfig(input.slotType);
  if (config.pool.length === 0) {
    throw new Error(`Add members to the ${PRAYER_SLOT_META[input.slotType].label} rotation pool first.`);
  }

  const startDate = input.startDate?.trim() || new Date().toISOString().slice(0, 10);
  const weeksAhead = input.weeksAhead ?? config.weeksAhead;
  const dates = listPrayerAssignmentDates(
    input.slotType,
    startDate,
    weeksAhead,
    config.skipDates,
  );

  let rotationIndex = config.rotationIndex;
  const created = [];
  const skipped: string[] = [];

  for (const assignmentDate of dates) {
    const existing = await getPrayerAssignment(input.slotType, assignmentDate);
    if (existing && !input.overwrite) {
      skipped.push(assignmentDate);
      continue;
    }

    const member = config.pool[rotationIndex % config.pool.length];
    rotationIndex += 1;

    const assignment = await store().savePrayerAssignment({
      slotType: input.slotType,
      assignmentDate,
      userId: member.userId,
      userName: member.name,
      status: existing?.status === "published" ? "published" : "draft",
      publishedAt: existing?.publishedAt ? new Date(existing.publishedAt) : null,
      notifiedAt: existing?.notifiedAt ? new Date(existing.notifiedAt) : null,
    });
    created.push(assignment);
  }

  await savePrayerRotationConfig({
    slotType: input.slotType,
    pool: config.pool,
    rotationIndex,
    skipDates: config.skipDates,
    weeksAhead: config.weeksAhead,
    status: "draft",
    actor: input.actor,
  });

  return {
    created,
    skipped,
    config: await getPrayerRotationConfig(input.slotType),
  };
}

export async function approvePrayerSchedule(input: {
  slotType: PrayerSlotType;
  actor: { id: string; name: string };
}) {
  const config = await getPrayerRotationConfig(input.slotType);
  const since = new Date().toISOString().slice(0, 10);
  const assignments = (await listUpcomingPrayerAssignments(input.slotType, config)).filter(
    (entry) => entry.status === "draft" || entry.status === "published",
  );

  if (assignments.length === 0) {
    throw new Error("Generate a schedule before approving it.");
  }

  await store().publishPrayerAssignments(input.slotType, since);
  const now = new Date();

  await savePrayerRotationConfig({
    slotType: input.slotType,
    pool: config.pool,
    rotationIndex: config.rotationIndex,
    skipDates: config.skipDates,
    weeksAhead: config.weeksAhead,
    status: "published",
    publishedAt: now,
    scheduleNotifiedAt: now,
    actor: input.actor,
  });

  const publishedAssignments = await listUpcomingPrayerAssignments(input.slotType);
  return {
    config: await getPrayerRotationConfig(input.slotType),
    assignments: publishedAssignments,
  };
}

export function groupAssignmentsByUser(
  assignments: Awaited<ReturnType<typeof listPrayerAssignments>>,
) {
  const grouped = new Map<string, { userId: string; userName: string; dates: string[] }>();
  for (const entry of assignments) {
    const current = grouped.get(entry.userId) ?? {
      userId: entry.userId,
      userName: entry.userName,
      dates: [],
    };
    current.dates.push(entry.assignmentDate);
    grouped.set(entry.userId, current);
  }
  return [...grouped.values()].map((entry) => ({
    ...entry,
    dates: entry.dates.sort(),
    summary: summarizePrayerDates(entry.dates),
    nextDateLabel: entry.dates[0] ? formatPrayerAssignmentDate(entry.dates[0]) : "",
  }));
}

export type { PrayerRotationPoolMember, PrayerScheduleRotationConfig, PrayerSlotType };
