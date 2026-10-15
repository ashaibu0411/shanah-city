import type { PublicMember } from "@/lib/auth-types";
import { assertJourneyParticipantLoose } from "@/lib/marriage-counseling-access";
import { resolveJourneyPartnerId } from "@/lib/marriage-counseling-participants";
import type {
  MarriageActionPlanRecord,
  MarriageHubModuleProgress,
  MarriageSharedGoalRecord,
  MarriageStage2ActivityCategory,
  MarriageStage2Dashboard,
} from "@/lib/marriage-counseling-types";
import { marriageStore } from "@/lib/stores/marriage-counseling-store";
import { allStage2ModuleDefinitions } from "@/lib/marriage-stage2-module-registry";
import { buildLearningSections } from "@/lib/marriage-stage2-learning-sections";
import { isMarriageStage2Enabled } from "@/lib/marriage-stage2-feature";
import { buildTemperamentInsights } from "@/lib/marriage-stage2-temperament-insights";
import { getActiveContentVersionLabel, getModuleForContentVersion } from "@/lib/marriage-curriculum-service";
import { MARRIAGE_CONSENT_VERSION } from "@/lib/marriage-counseling-curriculum";

const store = () => marriageStore();

async function activeJourneyContext(viewer: PublicMember) {
  const journey = await store().getActiveJourneyForUser(viewer.id);
  if (!journey) return null;
  const consents = await store().getConsentsForJourney(journey.id);
  const myConsent = consents.some(
    (c) => c.userId === viewer.id && c.consentVersion === MARRIAGE_CONSENT_VERSION,
  );
  const contentVersion = await getActiveContentVersionLabel();
  const assignments = await store().listAssignments(journey.id);
  const assignmentsOpen = assignments.filter(
    (a) => a.dueAt && !a.completedByUserIds.includes(viewer.id),
  ).length;
  return { journey, myConsent, contentVersion, assignmentsOpen };
}

function statusFromResponse(response: { status: string } | null): MarriageHubModuleProgress["myStatus"] {
  if (!response) return "not_started";
  if (response.status === "submitted") return "submitted";
  return "draft";
}

function partnerStatusFromResponse(response: { status: string } | null): MarriageHubModuleProgress["partnerStatus"] {
  if (!response) return "not_started";
  if (response.status === "submitted") return "submitted";
  return response ? "draft" : "not_started";
}

export async function buildStage2Dashboard(viewer: PublicMember): Promise<MarriageStage2Dashboard | null> {
  if (!isMarriageStage2Enabled()) return null;

  const ctx = await activeJourneyContext(viewer);
  if (!ctx?.journey || !ctx.myConsent) {
    return {
      enabled: true,
      resumeModuleId: null,
      activities: [],
      actionPlans: [],
      sharedGoals: [],
      assignmentsOpen: 0,
      modulesCompleted: 0,
      activitiesTotal: allStage2ModuleDefinitions().length,
      sections: buildLearningSections(),
      partnerName: null,
      programType: null,
      nextSessionAt: null,
    };
  }

  const journey = ctx.journey;
  const partnerId = await resolveJourneyPartnerId(journey, viewer.id);
  const contentVersion = ctx.contentVersion;

  const activities = [];
  let modulesCompleted = 0;
  for (const mod of allStage2ModuleDefinitions()) {
    const myResponse = await store().getResponse(journey.id, mod.id, viewer.id);
    const partnerResponse = partnerId
      ? await store().getResponse(journey.id, mod.id, partnerId)
      : null;
    const versionKey = myResponse?.contentVersion ?? contentVersion;
    const unlock = await store().getUnlock(journey.id, mod.id, versionKey);
    const mySt = statusFromResponse(myResponse);
    const parSt = partnerStatusFromResponse(partnerResponse);
    if (mySt === "submitted") modulesCompleted += 1;
    let category: MarriageStage2ActivityCategory = "learning";
    if (mod.meta?.stage2Section === "scenarios" || mod.id.includes("scenario")) category = "scenario";
    else if (mod.id.includes("financial")) category = "financial";
    else if (mod.id.includes("temperament")) category = "temperament";
    activities.push({
      activityId: `activity-${mod.id}`,
      moduleId: mod.id,
      title: mod.title,
      summary: mod.summary,
      category,
      myStatus: mySt,
      partnerStatus: parSt,
      comparisonReady: Boolean(unlock),
    });
  }

  let resumeModuleId: string | null = journey.currentModuleId;
  const inProgress = activities.find((a) => a.myStatus === "draft" || a.myStatus === "not_started");
  if (inProgress) resumeModuleId = inProgress.moduleId;

  const actionPlans = await store().listActionPlans(journey.id);
  const sharedGoals = await store().listSharedGoals(journey.id);
  const assignmentsOpen = ctx.assignmentsOpen;
  const sessions = await store().listSessions(journey.id);
  const nextSession = sessions.find(
    (s) => s.status !== "cancelled" && new Date(s.scheduledAt).getTime() >= Date.now(),
  );
  let partnerName: string | null = null;
  if (partnerId) {
    const { getUserById } = await import("@/lib/auth-server");
    partnerName = (await getUserById(partnerId))?.name ?? null;
  }

  return {
    enabled: true,
    resumeModuleId,
    activities,
    actionPlans,
    sharedGoals,
    assignmentsOpen,
    modulesCompleted,
    activitiesTotal: allStage2ModuleDefinitions().length,
    sections: buildLearningSections(),
    partnerName,
    programType: journey.programType,
    nextSessionAt: nextSession?.scheduledAt ?? null,
  };
}

export async function getTemperamentInsightsForCouple(viewer: PublicMember) {
  if (!isMarriageStage2Enabled()) throw new Error("Stage 2 is not enabled.");
  const ctx = await activeJourneyContext(viewer);
  if (!ctx?.journey) throw new Error("No active journey.");
  await assertJourneyParticipantLoose(ctx.journey, viewer.id);
  const partnerId = await resolveJourneyPartnerId(ctx.journey, viewer.id);
  if (!partnerId) throw new Error("Partner has not joined.");

  const moduleId = "s2-temperament-discovery";
  const myResponse = await store().getResponse(ctx.journey.id, moduleId, viewer.id);
  const partnerResponse = await store().getResponse(ctx.journey.id, moduleId, partnerId);
  if (myResponse?.status !== "submitted" || partnerResponse?.status !== "submitted") {
    throw new Error("Both partners must submit the temperament activity first.");
  }
  const unlock = await store().getUnlock(
    ctx.journey.id,
    moduleId,
    myResponse.contentVersion,
  );
  if (!unlock) throw new Error("Comparison not unlocked yet.");

  const mod = await getModuleForContentVersion(moduleId, myResponse.contentVersion);
  if (!mod) throw new Error("Module not found.");

  const isA = viewer.id === myResponse.userId;
  const answersA = isA ? myResponse.answers : partnerResponse.answers;
  const answersB = isA ? partnerResponse.answers : myResponse.answers;

  return {
    moduleTitle: mod.title,
    insights: buildTemperamentInsights(mod.questions, answersA, answersB),
    disclaimer:
      "These insights describe tendencies, not disorders or fixed labels. Use them to encourage conversation and prayer.",
  };
}

export async function createActionPlan(
  viewer: PublicMember,
  input: { title: string; moduleId?: string; items: Array<{ text: string; ownerUserId?: string }> },
) {
  const ctx = await activeJourneyContext(viewer);
  if (!ctx?.journey) throw new Error("No active journey.");
  await assertJourneyParticipantLoose(ctx.journey, viewer.id);

  const now = new Date().toISOString();
  const plan: MarriageActionPlanRecord = {
    id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: ctx.journey.id,
    moduleId: input.moduleId,
    title: input.title.trim(),
    createdByUserId: viewer.id,
    items: input.items.map((item, i) => ({
      id: `item-${i}`,
      text: item.text.trim(),
      ownerUserId: item.ownerUserId,
      done: false,
    })),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  await store().saveActionPlan(plan);
  return plan;
}

export async function proposeActionPlan(viewer: PublicMember, planId: string) {
  const plan = await store().getActionPlanById(planId);
  if (!plan) throw new Error("Plan not found.");
  const journeyForPlan = await store().getJourneyById(plan.journeyId);
  if (!journeyForPlan) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journeyForPlan, viewer.id);
  plan.status = "proposed";
  plan.updatedAt = new Date().toISOString();
  await store().saveActionPlan(plan);
  return plan;
}

export async function agreeActionPlan(viewer: PublicMember, planId: string) {
  const plan = await store().getActionPlanById(planId);
  if (!plan) throw new Error("Plan not found.");
  const journey = await store().getJourneyById(plan.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  const now = new Date().toISOString();
  plan.status = "agreed";
  plan.agreedAt = now;
  plan.updatedAt = now;
  await store().saveActionPlan(plan);
  return plan;
}

export async function createSharedGoal(
  viewer: PublicMember,
  input: {
    title: string;
    description?: string;
    category: MarriageSharedGoalRecord["category"];
    targetDate?: string;
  },
) {
  const ctx = await activeJourneyContext(viewer);
  if (!ctx?.journey) throw new Error("No active journey.");
  await assertJourneyParticipantLoose(ctx.journey, viewer.id);
  const now = new Date().toISOString();
  const goal: MarriageSharedGoalRecord = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    journeyId: ctx.journey.id,
    title: input.title.trim(),
    description: input.description?.trim(),
    category: input.category,
    createdByUserId: viewer.id,
    acknowledgedByUserIds: [viewer.id],
    targetDate: input.targetDate,
    createdAt: now,
    updatedAt: now,
  };
  await store().saveSharedGoal(goal);
  return goal;
}

export async function acknowledgeSharedGoal(viewer: PublicMember, goalId: string) {
  const goal = await store().getSharedGoalById(goalId);
  if (!goal) throw new Error("Goal not found.");
  const journey = await store().getJourneyById(goal.journeyId);
  if (!journey) throw new Error("Journey not found.");
  await assertJourneyParticipantLoose(journey, viewer.id);
  if (!goal.acknowledgedByUserIds.includes(viewer.id)) {
    goal.acknowledgedByUserIds.push(viewer.id);
  }
  goal.updatedAt = new Date().toISOString();
  await store().saveSharedGoal(goal);
  return goal;
}
