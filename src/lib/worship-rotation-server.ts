import { useDatabase } from "@/lib/use-database";
import * as rotationDb from "@/lib/stores/worship-rotation-db";
import * as rotationJson from "@/lib/stores/worship-rotation-json";
import {
  getWorshipPlan,
  listWorshipPlans,
  saveWorshipPlan,
} from "@/lib/worship-server";
import {
  listServiceDatesInRange,
  normalizeTeam,
  serviceTypeForTime,
  suggestedRehearsalDate,
  type WorshipRotationPoolMember,
  type WorshipScheduleRotationConfig,
  type WorshipServicePlan,
  type WorshipTeamMember,
} from "@/lib/worship-types";

const rotationStore = () => (useDatabase() ? rotationDb : rotationJson);

export const getWorshipRotationConfig = () => rotationStore().getWorshipRotationConfig();
export const saveWorshipRotationConfig = (
  input: Parameters<typeof rotationJson.saveWorshipRotationConfig>[0],
) => rotationStore().saveWorshipRotationConfig(input);

export async function generateWorshipSchedule(input: {
  startDate?: string;
  weeksAhead?: number;
  overwrite?: boolean;
  actor: { id: string; name: string };
}) {
  const config = await getWorshipRotationConfig();
  if (config.pool.length === 0) {
    throw new Error("Add worship leaders to the rotation pool first.");
  }

  const startDate = input.startDate?.trim() || new Date().toISOString().slice(0, 10);
  const weeksAhead = input.weeksAhead ?? config.weeksAhead;
  const serviceDates = listServiceDatesInRange(startDate, weeksAhead, config.serviceKind).filter(
    (date) => !config.skipDates.includes(date),
  );

  let rotationIndex = config.rotationIndex;
  const created: WorshipServicePlan[] = [];
  const skipped: string[] = [];

  for (const serviceDate of serviceDates) {
    const existing = await getWorshipPlan(serviceDate, config.serviceTime);
    if (existing && !input.overwrite) {
      if (existing.team.length > 0 || existing.songs.length > 0) {
        skipped.push(serviceDate);
        continue;
      }
    }

    const leader = config.pool[rotationIndex % config.pool.length];
    rotationIndex += 1;

    const team = buildLeaderTeam(leader, existing?.team);
    const plan = await saveWorshipPlan({
      serviceDate,
      serviceTime: config.serviceTime,
      serviceType: serviceTypeForTime(config.serviceTime),
      title: existing?.title ?? undefined,
      songs: existing?.songs ?? [],
      team,
      rehearsalNotes: existing?.rehearsalNotes ?? undefined,
      rehearsalDate: existing?.rehearsalDate ?? suggestedRehearsalDate(serviceDate),
      rehearsalTime: existing?.rehearsalTime ?? "19:00",
      calendarEventId: existing?.calendarEventId ?? undefined,
      uploadDutyUserId: leader.userId,
      uploadDutyUserName: leader.name,
      memberSuggestions: existing?.memberSuggestions,
      status: existing?.status ?? "draft",
      actor: input.actor,
    });

    created.push(plan);
  }

  await rotationStore().saveWorshipRotationConfig({
    pool: config.pool,
    serviceTime: config.serviceTime,
    serviceKind: config.serviceKind,
    rotationIndex,
    skipDates: config.skipDates,
    weeksAhead: config.weeksAhead,
    uploadDutyLeadDays: config.uploadDutyLeadDays,
    actor: input.actor,
  });

  return { created, skipped, config: await getWorshipRotationConfig() };
}

function buildLeaderTeam(
  leader: WorshipRotationPoolMember,
  existingTeam?: WorshipTeamMember[],
) {
  const team = normalizeTeam(existingTeam ?? []);
  const leaderIndex = team.findIndex((member) => member.userId === leader.userId);

  if (leaderIndex >= 0) {
    team[leaderIndex] = {
      ...team[leaderIndex],
      role: "worship-leader",
    };
    return team;
  }

  return [
    { userId: leader.userId, name: leader.name, role: "worship-leader" as const, ready: false },
    ...team,
  ];
}

export async function listUpcomingLeaderAssignments(config?: WorshipScheduleRotationConfig) {
  const rotation = config ?? (await getWorshipRotationConfig());
  const since = new Date().toISOString().slice(0, 10);
  const untilDate = new Date();
  untilDate.setDate(untilDate.getDate() + rotation.weeksAhead * 7);
  const until = untilDate.toISOString().slice(0, 10);

  const plans = await listWorshipPlans({ since, until, serviceTime: rotation.serviceTime });
  return plans
    .filter((plan) => plan.serviceTime === rotation.serviceTime)
    .map((plan) => ({
      serviceDate: plan.serviceDate,
      serviceTime: plan.serviceTime,
      status: plan.status,
      leader: plan.team.find((member) => member.role === "worship-leader"),
      uploadDutyUserId: plan.uploadDutyUserId,
      uploadDutyUserName: plan.uploadDutyUserName,
    }));
}
