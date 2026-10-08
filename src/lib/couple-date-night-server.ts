import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import { buildStartEndIso } from "@/lib/couple-calendar-utils";
import { createCoupleCalendarEventForUser } from "@/lib/couple-calendar-server";
import { getZonedDateParts } from "@/lib/denver-time";
import {
  DATE_NIGHT_BUDGETS,
  DATE_NIGHT_LOCATIONS,
  type CoupleDateNightPlanRecord,
  type CoupleDateNightPlanView,
  type DateNightBudget,
  type DateNightLocation,
  type DateNightPlanStatus,
} from "@/lib/couple-date-night-types";
import {
  DATE_NIGHT_IDEA_CATALOG,
  weeklyDateNightChallenge,
} from "@/lib/couple-date-night-ideas";
import { sendPushToUsersWithPushEnabled } from "@/lib/push-server";
import { useDatabase } from "@/lib/use-database";
import * as coupleDateNightDb from "@/lib/stores/couple-date-night-db";
import * as coupleDateNightJson from "@/lib/stores/couple-date-night-json";

const store = () => (useDatabase() ? coupleDateNightDb : coupleDateNightJson);

function parseBudget(value: unknown): DateNightBudget | undefined {
  const raw = String(value ?? "");
  return DATE_NIGHT_BUDGETS.some((entry) => entry.id === raw)
    ? (raw as DateNightBudget)
    : undefined;
}

function parseLocation(value: unknown): DateNightLocation | undefined {
  const raw = String(value ?? "");
  return DATE_NIGHT_LOCATIONS.some((entry) => entry.id === raw)
    ? (raw as DateNightLocation)
    : undefined;
}

function parseStatus(value: unknown): DateNightPlanStatus | undefined {
  const raw = String(value ?? "");
  const allowed: DateNightPlanStatus[] = [
    "idea",
    "favorite",
    "planned",
    "completed",
    "surprise_pending",
  ];
  return allowed.includes(raw as DateNightPlanStatus) ? (raw as DateNightPlanStatus) : undefined;
}

async function toView(plan: CoupleDateNightPlanRecord, viewer: PublicMember): Promise<CoupleDateNightPlanView> {
  const author = await getUserById(plan.createdBy);
  const isFromMe = plan.createdBy === viewer.id;
  const isSurpriseRecipient =
    plan.isSurprise &&
    plan.invitedUserId === viewer.id &&
    plan.status === "surprise_pending";

  return {
    ...plan,
    createdByName: author?.name ?? "Spouse",
    isFromMe,
    displayTitle: isSurpriseRecipient ? "Surprise date — tap to open" : plan.title,
    canAcceptSurprise: isSurpriseRecipient,
  };
}

export async function getDateNightHubForUser(user: PublicMember) {
  const link = await assertActiveCoupleWorkspace(user);
  const records = await store().listCoupleDateNightPlans(link.id);
  const plans = await Promise.all(records.map((record) => toView(record, user)));

  const upcoming = plans.filter(
    (plan) => plan.status === "planned" || plan.status === "surprise_pending",
  );
  const favorites = plans.filter((plan) => plan.status === "favorite");
  const ideas = plans.filter((plan) => plan.status === "idea");
  const history = plans
    .filter((plan) => plan.status === "completed")
    .sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt));

  return {
    coupleLinkId: link.id,
    catalog: DATE_NIGHT_IDEA_CATALOG,
    weeklyChallenge: weeklyDateNightChallenge(),
    plans,
    upcoming,
    favorites,
    ideas,
    history,
  };
}

async function assertPlanAccess(user: PublicMember, planId: string) {
  const link = await assertActiveCoupleWorkspace(user);
  const plan = await store().getCoupleDateNightPlanById(planId);
  if (!plan || plan.coupleLinkId !== link.id) {
    throw new Error("Date not found.");
  }
  return { link, plan };
}

function scheduledAtFromBody(body: Record<string, unknown>) {
  const dateKey = String(body.dateKey ?? "").trim();
  const time = String(body.time ?? "19:00").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return undefined;
  const { startAt } = buildStartEndIso({
    dateKey,
    time,
    allDay: false,
    timezone: "America/Denver",
  });
  return startAt;
}

async function maybeAddCalendarEvent(user: PublicMember, title: string, scheduledAt: string) {
  const parts = getZonedDateParts(new Date(scheduledAt));
  const time = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
  try {
    await createCoupleCalendarEventForUser(user, {
      title: `Date night: ${title}`,
      category: "date-night",
      dateKey: parts.dateKey,
      time,
      allDay: false,
      recurrence: "none",
      timezone: "America/Denver",
      notes: "From Date night planner",
    });
  } catch {
    // Calendar sync is best-effort
  }
}

export async function createDateNightPlanForUser(user: PublicMember, body: Record<string, unknown>) {
  const link = await assertActiveCoupleWorkspace(user);
  const catalogId = String(body.catalogId ?? "").trim();
  const catalogItem = DATE_NIGHT_IDEA_CATALOG.find((entry) => entry.id === catalogId);

  const title = String(body.title ?? catalogItem?.title ?? "").trim();
  if (!title) throw new Error("Enter a date title.");

  const scheduledAt = scheduledAtFromBody(body);
  const isSurprise = body.isSurprise === true;
  const partnerId = partnerIdFromLink(link, user.id);

  if (isSurprise && !partnerId) {
    throw new Error("Link your spouse to send a surprise invite.");
  }

  const status: DateNightPlanStatus = isSurprise
    ? "surprise_pending"
    : scheduledAt
      ? "planned"
      : body.asFavorite === true
        ? "favorite"
        : "idea";

  const record = await store().createCoupleDateNightPlan({
    coupleLinkId: link.id,
    createdBy: user.id,
    title,
    budget: parseBudget(body.budget) ?? catalogItem?.budget,
    locationType: parseLocation(body.locationType) ?? catalogItem?.locationType,
    scheduledAt,
    isSurprise,
    invitedUserId: isSurprise ? partnerId ?? undefined : undefined,
    status,
  });

  if (isSurprise && partnerId) {
    void sendPushToUsersWithPushEnabled([partnerId], {
      title: "Surprise date",
      body: "Your spouse planned a surprise date for you in Couples Hub.",
      url: "/couples/marriage/date-night",
    }).catch(() => undefined);
  } else if (scheduledAt && !isSurprise && body.addToCalendar === true) {
    void maybeAddCalendarEvent(user, title, scheduledAt);
  }

  const hub = await getDateNightHubForUser(user);
  const plan = await toView(record, user);
  return { plan, ...hub };
}

export async function updateDateNightPlanForUser(
  user: PublicMember,
  planId: string,
  body: Record<string, unknown>,
) {
  const { plan } = await assertPlanAccess(user, planId);

  const patch: Parameters<typeof coupleDateNightDb.updateCoupleDateNightPlan>[1] = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) throw new Error("Enter a date title.");
    patch.title = title;
  }
  if (body.budget !== undefined) patch.budget = parseBudget(body.budget) ?? null;
  if (body.locationType !== undefined) patch.locationType = parseLocation(body.locationType) ?? null;

  if (body.dateKey !== undefined) {
    const scheduledAt = scheduledAtFromBody(body);
    patch.scheduledAt = scheduledAt ?? null;
    if (scheduledAt && plan.status !== "completed") {
      patch.status = plan.isSurprise && plan.status === "surprise_pending" ? "surprise_pending" : "planned";
    }
  }

  if (body.status !== undefined) {
    const status = parseStatus(body.status);
    if (!status) throw new Error("Invalid status.");
    patch.status = status;
    if (status === "completed") {
      patch.completedAt = new Date().toISOString();
    }
  }

  if (body.asFavorite === true) {
    patch.status = "favorite";
  }

  const updated = await store().updateCoupleDateNightPlan(planId, patch);

  if (body.addToCalendar === true && updated.scheduledAt) {
    void maybeAddCalendarEvent(user, updated.title, updated.scheduledAt);
  }

  const hub = await getDateNightHubForUser(user);
  const view = await toView(updated, user);
  return { plan: view, ...hub };
}

export async function acceptSurpriseDateForUser(user: PublicMember, planId: string) {
  const { plan } = await assertPlanAccess(user, planId);
  if (plan.status !== "surprise_pending" || plan.invitedUserId !== user.id) {
    throw new Error("Nothing to accept.");
  }

  const updated = await store().updateCoupleDateNightPlan(planId, {
    status: "planned",
  });

  const hub = await getDateNightHubForUser(user);
  return { plan: await toView(updated, user), ...hub };
}

export async function deleteDateNightPlanForUser(user: PublicMember, planId: string) {
  await assertPlanAccess(user, planId);
  await store().deleteCoupleDateNightPlan(planId);
  return getDateNightHubForUser(user);
}
