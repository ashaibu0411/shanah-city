import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { getGroupDetail } from "@/lib/group-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import {
  SHANAH_WORSHIP_GROUP_ID,
  choirPlanKey,
} from "@/lib/choir-group-constants";
import type { ChoirCalendarEvent, ChoirCalendarPagePayload } from "@/lib/choir-calendar-types";
import { isGroupScheduleDetailEvent } from "@/lib/choir-calendar-utils";
import { getEvents } from "@/lib/stores/event-json";
import { site } from "@/lib/site";
import { listWorshipPlans } from "@/lib/worship-server";
import {
  canManageWorshipPlan,
  canViewWorshipServicePlan,
} from "@/lib/worship-access-server";
import {
  combinePlanDateTime,
  worshipPartLabel,
  worshipRoleLabel,
  worshipTimeLabel,
  type WorshipServicePlan,
  type WorshipTeamMember,
} from "@/lib/worship-types";

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function compareEvent(a: ChoirCalendarEvent, b: ChoirCalendarEvent) {
  return a.startsAtMs - b.startsAtMs;
}

function memberRoleLabel(member: WorshipTeamMember) {
  const base = worshipRoleLabel(member.role);
  if (member.partRole?.trim()) {
    const part = worshipPartLabel(member.partRole);
    if (member.role === "singer") {
      return `${part} vocals`;
    }
    return `${base} (${part})`;
  }
  return base;
}

function personalStatus(member: WorshipTeamMember | undefined): ChoirCalendarEvent["personalStatus"] {
  if (!member) return null;
  if (member.ready) return "confirmed";
  return "assigned";
}

function planServiceEvent(plan: WorshipServicePlan, userId: string): ChoirCalendarEvent | null {
  if (plan.status !== "published") return null;
  const mine = plan.team.find((member) => member.userId === userId);
  const planKey = choirPlanKey(plan.serviceDate, plan.serviceTime);
  const title = plan.title?.trim() || "Sunday Service";
  return {
    id: `worship-service-${planKey}`,
    sourceType: "worship-plan",
    sourceId: planKey,
    category: "service",
    title,
    dateKey: plan.serviceDate,
    timeLabel: worshipTimeLabel(plan.serviceTime) || plan.serviceTime,
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
    location: site.heroChurchName,
    description: plan.rehearsalNotes?.trim() || undefined,
    teamLabel: mine ? memberRoleLabel(mine) : "Worship team",
    songCount: plan.songs.length,
    worshipPlanKey: planKey,
    personalRoleLabel: mine ? memberRoleLabel(mine) : null,
    personalStatus: personalStatus(mine),
    detailHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}/calendar?event=${encodeURIComponent(`worship-service-${planKey}`)}`,
    startsAtMs: combinePlanDateTime(plan.serviceDate, plan.serviceTime).getTime(),
  };
}

function planRehearsalEvent(plan: WorshipServicePlan): ChoirCalendarEvent | null {
  if (plan.status !== "published" || !plan.rehearsalDate?.trim()) return null;
  const planKey = choirPlanKey(plan.serviceDate, plan.serviceTime);
  const rehearsalTime = plan.rehearsalTime?.trim() || "19:00";
  const title = `Rehearsal — ${plan.title?.trim() || "Sunday Service"}`;
  return {
    id: `worship-rehearsal-${planKey}`,
    sourceType: "worship-rehearsal",
    sourceId: planKey,
    category: "rehearsal",
    title,
    dateKey: plan.rehearsalDate,
    timeLabel: worshipTimeLabel(rehearsalTime) || rehearsalTime,
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
    location: site.heroChurchName,
    description: plan.rehearsalNotes?.trim() || undefined,
    teamLabel: "Worship team",
    worshipPlanKey: planKey,
    personalRoleLabel: null,
    personalStatus: null,
    detailHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}/calendar?event=${encodeURIComponent(`worship-rehearsal-${planKey}`)}`,
    startsAtMs: combinePlanDateTime(plan.rehearsalDate, rehearsalTime).getTime(),
  };
}

function categorizeGroupEvent(event: {
  id: string;
  title: string;
  startsOn?: string | null;
}): ChoirCalendarEvent["category"] {
  if (isGroupScheduleDetailEvent(event.id)) return "service";
  const title = event.title.toLowerCase();
  if (title.includes("rehearsal")) return "rehearsal";
  if (title.includes("workshop") || title.includes("encounter") || title.includes("night")) {
    return "event";
  }
  return "event";
}

function churchEventToCalendarEvent(event: {
  id: string;
  title: string;
  time: string;
  location: string;
  startsOn?: string | null;
  endsOn?: string | null;
  rsvpInstructions?: string | null;
}): ChoirCalendarEvent | null {
  const dateKey = event.startsOn?.trim();
  if (!dateKey) return null;
  const category = categorizeGroupEvent(event);
  const timeLabel = event.time?.trim() || "Time TBD";
  const description = event.rsvpInstructions?.trim() || undefined;
  return {
    id: `group-event-${event.id}`,
    sourceType: "group-event",
    sourceId: event.id,
    category,
    title: event.title.trim() || "Event",
    dateKey,
    timeLabel,
    location: event.location?.trim() || site.heroChurchName,
    description,
    teamLabel: category === "rehearsal" ? "Worship team" : undefined,
    personalRoleLabel: null,
    personalStatus: null,
    detailHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?calendar=1&event=${encodeURIComponent(event.id)}`,
    startsAtMs: new Date(`${dateKey}T12:00:00`).getTime(),
  };
}

export async function buildChoirCalendarPagePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirCalendarPagePayload | null> {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) {
    return null;
  }

  const group = await getGroupDetail(groupId, user.id);
  const isSiteAdmin = await canManageAsAdmin(user);
  if (!group?.isMember && !isSiteAdmin) {
    return null;
  }

  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) {
    return null;
  }

  const canManageWorship = await canManageWorshipPlan(user);
  const canManageSchedule = await canManageGroupEvents(user, groupId);
  const since = isoDaysAgo(30);

  const plans = (await listWorshipPlans({ since }))
    .filter((plan) => canViewWorshipServicePlan(canManageWorship, plan))
    .sort(
      (a, b) =>
        combinePlanDateTime(a.serviceDate, a.serviceTime).getTime() -
        combinePlanDateTime(b.serviceDate, b.serviceTime).getTime(),
    );

  const worshipServiceSlots = new Set<string>();
  const events: ChoirCalendarEvent[] = [];

  for (const plan of plans) {
    const service = planServiceEvent(plan, user.id);
    if (service) {
      worshipServiceSlots.add(`${service.dateKey}|${service.serviceTime ?? ""}`);
      events.push(service);
    }
    const rehearsal = planRehearsalEvent(plan);
    if (rehearsal) {
      events.push(rehearsal);
    }
  }

  const churchEvents = await getEvents({ groupId });
  for (const event of churchEvents) {
    if (isGroupScheduleDetailEvent(event.id)) {
      const slot = `${event.startsOn ?? ""}|`;
      const duplicatePlan = worshipServiceSlots.has(`${event.startsOn}|`) ||
        plans.some(
          (plan) =>
            plan.status === "published" &&
            plan.serviceDate === event.startsOn &&
            worshipTimeLabel(plan.serviceTime) === event.time?.trim(),
        );
      if (duplicatePlan) continue;
    }
    const mapped = churchEventToCalendarEvent(event);
    if (mapped) {
      events.push(mapped);
    }
  }

  const unique = new Map<string, ChoirCalendarEvent>();
  for (const entry of events) {
    unique.set(entry.id, entry);
  }

  const sorted = [...unique.values()].sort(compareEvent);
  const mine = plans
    .flatMap((plan) => plan.team.filter((member) => member.userId === user.id))
    .find(Boolean);

  return {
    events: sorted,
    canManageSchedule,
    canManageWorship,
    groupChatHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?chat=1`,
    memberRoleLabel: mine ? memberRoleLabel(mine) : null,
    manageScheduleHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?calendar=1`,
    managePlannerHref: "/worship",
    legacyCalendarHref: `/groups/${SHANAH_WORSHIP_GROUP_ID}?calendar=1`,
  };
}
