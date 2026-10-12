import type { PublicMember } from "@/lib/auth-types";
import { canManageAsAdmin } from "@/lib/admin-access-server";
import { choirWorshipEventDetailHref } from "@/lib/choir-events-links";
import type {
  ChoirWorshipEventDetailPayload,
  ChoirWorshipEventMeta,
  ChoirWorshipEventsHomePayload,
  WorshipEventCardView,
  WorshipEventRegistrationCardView,
  WorshipEventTeamOpportunityView,
} from "@/lib/choir-events-types";
import { DEFAULT_WORSHIP_EVENT_GUIDELINES } from "@/lib/choir-events-types";
import {
  churchEventPrimaryDateKey,
  defaultAudienceLabel,
  formatWorshipEventDateParts,
  inferWorshipEventCategory,
  isWorshipEventsEligible,
  registrationStatusForEvent,
  worshipEventCategoryLabel,
  worshipEventImageUrl,
  worshipEventStartsAtMs,
} from "@/lib/choir-events-utils";
import { SHANAH_WORSHIP_GROUP_ID } from "@/lib/choir-group-constants";
import { getEventRsvpView, getMyEventRsvps } from "@/lib/event-rsvp-server";
import { eventRsvpStatusLabel } from "@/lib/event-rsvp-types";
import { getEventById, getEvents } from "@/lib/event-server";
import { getGroupDetail } from "@/lib/group-server";
import { canManageGroupEvents } from "@/lib/group-permissions-server";
import { isMemberTrainingRequired } from "@/lib/ministry-readiness-server";
import { isGroupLeaderOrAssistant } from "@/lib/group-admin-utils";
import { getGroups } from "@/lib/group-server";
import { sendPushToUsers } from "@/lib/push-server";
import { getAppBaseUrl } from "@/lib/share-urls";
import {
  getChoirEventTeamInterestForUserJson,
  getChoirWorshipEventGuidelinesJson,
  getChoirWorshipEventsStoreJson,
  saveChoirWorshipEventGuidelinesJson,
  updateChoirEventTeamInterestStatusJson,
  upsertChoirEventTeamInterestJson,
  upsertChoirWorshipEventMetaJson,
} from "@/lib/stores/choir-events-json";
import { site } from "@/lib/site";
import type { ChurchEvent } from "@/lib/types";
import { listWorshipPlans } from "@/lib/worship-server";

function metaMap(store: Awaited<ReturnType<typeof getChoirWorshipEventsStoreJson>>) {
  return new Map(store.eventMeta.map((row) => [row.eventId, row]));
}

async function assertChoirWorshipEventsAccess(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return null;
  const group = await getGroupDetail(groupId, user.id);
  if (!group?.isMember && !(await canManageAsAdmin(user))) return null;
  if (group?.isMember && (await isMemberTrainingRequired(user.id, group))) return null;
  return group;
}

export async function canManageChoirWorshipEvents(user: PublicMember, groupId: string) {
  if (groupId !== SHANAH_WORSHIP_GROUP_ID) return false;
  if (await canManageAsAdmin(user)) return true;
  return canManageGroupEvents(user, groupId);
}

async function loadEligibleEvents(groupId: string) {
  const store = await getChoirWorshipEventsStoreJson();
  const metaById = metaMap(store);
  const groupEvents = await getEvents({ groupId });
  const churchEvents = await getEvents({ groupId: null });
  const pinnedChurch = churchEvents.filter((event) => metaById.get(event.id)?.includeOnWorshipEvents);

  const byId = new Map<string, ChurchEvent>();
  for (const event of [...groupEvents, ...pinnedChurch]) {
    const meta = metaById.get(event.id);
    if (isWorshipEventsEligible(event, groupId, meta)) {
      byId.set(event.id, event);
    }
  }
  return { events: [...byId.values()], store, metaById };
}

async function toCardView(
  event: ChurchEvent,
  groupId: string,
  metaById: Map<string, ChoirWorshipEventMeta>,
  viewer: PublicMember,
): Promise<WorshipEventCardView> {
  const meta = metaById.get(event.id);
  const dateKey = churchEventPrimaryDateKey(event);
  const parts = formatWorshipEventDateParts(event, dateKey);
  const category = inferWorshipEventCategory(event, meta);
  const rsvp = await getEventRsvpView(event, viewer);
  const registration = registrationStatusForEvent(event, {
    summary: rsvp.summary,
    myStatus: rsvp.myStatus,
    canceled: Boolean(meta?.canceledAt),
  });

  return {
    id: event.id,
    title: event.title.trim() || "Worship event",
    category,
    categoryLabel: worshipEventCategoryLabel(category),
    dateKey: parts.dateKey,
    monthLabel: parts.monthLabel,
    dayLabel: parts.dayLabel,
    weekdayLabel: parts.weekdayLabel,
    timeLabel: event.time?.trim() || "Time TBA",
    endTimeLabel: null,
    location: event.location?.trim() || site.heroChurchName,
    audienceLabel: meta?.audienceLabel?.trim() || defaultAudienceLabel(groupId),
    imageUrl: worshipEventImageUrl(event),
    shortDescription:
      meta?.shortDescription?.trim() ||
      event.rsvpInstructions?.trim()?.slice(0, 160) ||
      "Join us for a special worship gathering.",
    registrationStatus: registration.status,
    registrationLabel: registration.label,
    featured: typeof meta?.featuredOrder === "number",
    detailHref: choirWorshipEventDetailHref(groupId, event.id),
    startsAtMs: worshipEventStartsAtMs(event, dateKey),
    rsvpEnabled: Boolean(event.rsvpEnabled),
  };
}

function splitUpcomingPast(cards: WorshipEventCardView[], nowMs: number) {
  const upcoming = cards.filter((card) => card.startsAtMs >= nowMs - 86_400_000);
  const past = cards.filter((card) => card.startsAtMs < nowMs - 86_400_000);
  upcoming.sort((a, b) => a.startsAtMs - b.startsAtMs);
  past.sort((a, b) => b.startsAtMs - a.startsAtMs);
  return { upcoming, past };
}

function pickFeatured(cards: WorshipEventCardView[], metaById: Map<string, ChoirWorshipEventMeta>) {
  const featuredCandidates = cards
    .filter((card) => {
      const order = metaById.get(card.id)?.featuredOrder;
      return typeof order === "number";
    })
    .sort((a, b) => {
      const orderA = metaById.get(a.id)?.featuredOrder ?? 999;
      const orderB = metaById.get(b.id)?.featuredOrder ?? 999;
      return orderA - orderB || a.startsAtMs - b.startsAtMs;
    });
  if (featuredCandidates[0]) return featuredCandidates[0];
  return cards.find((card) => card.startsAtMs >= Date.now() - 86_400_000) ?? null;
}

export async function buildChoirWorshipEventsHomePayload(
  user: PublicMember,
  groupId: string,
): Promise<ChoirWorshipEventsHomePayload | null> {
  const group = await assertChoirWorshipEventsAccess(user, groupId);
  if (!group) return null;

  const { events, metaById } = await loadEligibleEvents(groupId);
  const cards = await Promise.all(events.map((event) => toCardView(event, groupId, metaById, user)));
  const { upcoming } = splitUpcomingPast(cards, Date.now());
  const featured = pickFeatured(upcoming, metaById);
  const featuredCount = upcoming.filter((card) => metaById.get(card.id)?.featuredOrder != null).length;

  return {
    groupId,
    groupChatHref: `/groups/${encodeURIComponent(groupId)}?chat=1`,
    canManageEvents: await canManageChoirWorshipEvents(user, groupId),
    manageEventsHref: `/groups/${encodeURIComponent(groupId)}?calendar=1`,
    featured,
    upcoming: upcoming.slice(0, 6),
    featuredCount,
    upcomingCount: upcoming.length,
  };
}

export async function listChoirWorshipEventCards(
  user: PublicMember,
  groupId: string,
  options?: {
    mode?: "upcoming" | "past" | "featured" | "all";
    query?: string;
    category?: string;
    registration?: string;
  },
) {
  const group = await assertChoirWorshipEventsAccess(user, groupId);
  if (!group) return null;

  const { events, metaById } = await loadEligibleEvents(groupId);
  let cards = await Promise.all(events.map((event) => toCardView(event, groupId, metaById, user)));
  const { upcoming, past } = splitUpcomingPast(cards, Date.now());

  if (options?.mode === "past") cards = past;
  else if (options?.mode === "featured") {
    cards = upcoming.filter((card) => typeof metaById.get(card.id)?.featuredOrder === "number");
  } else if (options?.mode === "all") cards = [...upcoming, ...past];
  else cards = upcoming;

  const q = options?.query?.trim().toLowerCase();
  if (q) {
    cards = cards.filter(
      (card) =>
        card.title.toLowerCase().includes(q) ||
        card.shortDescription.toLowerCase().includes(q) ||
        card.location.toLowerCase().includes(q),
    );
  }

  if (options?.category && options.category !== "all") {
    cards = cards.filter((card) => card.category === options.category);
  }

  if (options?.registration === "open") {
    cards = cards.filter((card) => card.registrationStatus === "open");
  }

  return cards;
}

export async function buildChoirWorshipEventDetailPayload(
  user: PublicMember,
  groupId: string,
  eventId: string,
): Promise<ChoirWorshipEventDetailPayload | null> {
  const group = await assertChoirWorshipEventsAccess(user, groupId);
  if (!group) return null;

  const event = await getEventById(eventId);
  if (!event) return null;

  const store = await getChoirWorshipEventsStoreJson();
  const metaById = metaMap(store);
  const meta = metaById.get(eventId);
  if (!isWorshipEventsEligible(event, groupId, meta)) return null;

  const card = await toCardView(event, groupId, metaById, user);
  const rsvp = await getEventRsvpView(event, user);
  const interest = await getChoirEventTeamInterestForUserJson(groupId, eventId, user.id);

  const plans = await listWorshipPlans({ since: churchEventPrimaryDateKey(event) });
  const matchingPlan = plans.find(
    (plan) =>
      plan.status === "published" &&
      plan.serviceDate === churchEventPrimaryDateKey(event) &&
      plan.title?.trim().toLowerCase() === event.title.trim().toLowerCase(),
  );

  const serviceDate = matchingPlan?.serviceDate ?? churchEventPrimaryDateKey(event);
  const serviceTime = matchingPlan?.serviceTime;

  return {
    rsvpEvent: event,
    event: card,
    description:
      meta?.shortDescription?.trim() ||
      event.rsvpInstructions?.trim() ||
      "Details will be shared by worship leadership.",
    organizerLabel: event.groupName?.trim() || defaultAudienceLabel(groupId),
    deadlineLabel: event.rsvpDeadline
      ? new Date(event.rsvpDeadline).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null,
    capacityLabel:
      event.rsvpCapacity != null && event.rsvpCapacity > 0
        ? `${rsvp.summary?.going ?? 0} / ${event.rsvpCapacity} registered`
        : null,
    rsvpInstructions: event.rsvpInstructions?.trim() || null,
    myRsvpStatus: rsvp.myStatus,
    myGuestCount: rsvp.myGuestCount,
    canRegister: rsvp.canRespond,
    canManageRsvp: rsvp.canManage,
    shareUrl: `${getAppBaseUrl()}${choirWorshipEventDetailHref(groupId, eventId)}`,
    teamVolunteerOpen: meta?.teamVolunteerOpen ?? Boolean(event.rsvpEnabled),
    myTeamStatus: interest?.status ?? null,
    recapSummary: meta?.recapSummary ?? null,
    recapPhotoUrls: meta?.recapPhotoUrls ?? [],
    recapVideoUrls: meta?.recapVideoUrls ?? [],
    worshipPlanHref:
      matchingPlan && serviceDate && serviceTime
        ? `/worship?date=${encodeURIComponent(serviceDate)}&time=${encodeURIComponent(serviceTime)}`
        : null,
    setlistHref:
      serviceDate && serviceTime
        ? `/groups/${encodeURIComponent(groupId)}/setlists?date=${encodeURIComponent(serviceDate)}&time=${encodeURIComponent(serviceTime)}`
        : null,
    rehearsalHref:
      serviceDate && serviceTime
        ? `/groups/${encodeURIComponent(groupId)}/rehearsal?date=${encodeURIComponent(serviceDate)}&time=${encodeURIComponent(serviceTime)}`
        : null,
  };
}

export async function listChoirWorshipEventRegistrations(user: PublicMember, groupId: string) {
  const group = await assertChoirWorshipEventsAccess(user, groupId);
  if (!group) return null;

  const { events } = await loadEligibleEvents(groupId);
  const eligibleIds = new Set(events.map((event) => event.id));
  const mine = await getMyEventRsvps(user);
  const rows: WorshipEventRegistrationCardView[] = [];

  for (const item of [...mine.responded, ...mine.pending]) {
    if (!eligibleIds.has(item.eventId)) continue;
    const event = events.find((entry) => entry.id === item.eventId);
    if (!event) continue;
    const parts = formatWorshipEventDateParts(event);
    rows.push({
      eventId: item.eventId,
      title: item.title,
      imageUrl: worshipEventImageUrl(event),
      dateLabel: parts.dateLabel,
      timeLabel: item.time?.trim() || event.time?.trim() || "Time TBA",
      location: item.location?.trim() || event.location?.trim() || site.heroChurchName,
      status: item.myStatus,
      statusLabel: item.myStatus ? eventRsvpStatusLabel(item.myStatus) : "Response needed",
      guestCount: null,
      detailHref: choirWorshipEventDetailHref(groupId, item.eventId),
    });
  }

  rows.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  return rows;
}

export async function listChoirWorshipEventTeamOpportunities(
  user: PublicMember,
  groupId: string,
): Promise<WorshipEventTeamOpportunityView[] | null> {
  const group = await assertChoirWorshipEventsAccess(user, groupId);
  if (!group) return null;

  const { events, metaById } = await loadEligibleEvents(groupId);
  const nowMs = Date.now();
  const opportunities: WorshipEventTeamOpportunityView[] = [];

  for (const event of events) {
    const meta = metaById.get(event.id);
    const open = meta?.teamVolunteerOpen ?? Boolean(event.rsvpEnabled);
    if (!open) continue;
    const dateKey = churchEventPrimaryDateKey(event);
    if (worshipEventStartsAtMs(event, dateKey) < nowMs - 86_400_000) continue;

    const interest = await getChoirEventTeamInterestForUserJson(groupId, event.id, user.id);
    const parts = formatWorshipEventDateParts(event, dateKey);
    opportunities.push({
      eventId: event.id,
      title: event.title,
      dateLabel: parts.dateLabel,
      teamLabel: meta?.audienceLabel?.trim() || "Worship team",
      roles: meta?.teamRoles?.length ? meta.teamRoles : ["Vocalist", "Musician", "Worship leader"],
      deadlineLabel: meta?.teamDeadline
        ? new Date(meta.teamDeadline).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : null,
      myStatus: interest?.status ?? null,
      detailHref: choirWorshipEventDetailHref(groupId, event.id),
    });
  }

  return opportunities.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
}

export async function getChoirWorshipEventGuidelines(user: PublicMember, groupId: string) {
  const group = await assertChoirWorshipEventsAccess(user, groupId);
  if (!group) return null;
  const markdown = await getChoirWorshipEventGuidelinesJson();
  return markdown || DEFAULT_WORSHIP_EVENT_GUIDELINES;
}

export async function handleChoirWorshipEventsAction(user: PublicMember, body: Record<string, unknown>) {
  const action = typeof body.action === "string" ? body.action : "";
  const groupId = typeof body.groupId === "string" ? body.groupId : SHANAH_WORSHIP_GROUP_ID;

  if (action === "team_interest") {
    const group = await assertChoirWorshipEventsAccess(user, groupId);
    if (!group) throw new Error("Access denied.");
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    if (!eventId) throw new Error("Event required.");
    const event = await getEventById(eventId);
    if (!event) throw new Error("Event not found.");
    const store = await getChoirWorshipEventsStoreJson();
    const meta = store.eventMeta.find((row) => row.eventId === eventId);
    if (!isWorshipEventsEligible(event, groupId, meta)) throw new Error("Event not available.");
    const interest = await upsertChoirEventTeamInterestJson({
      groupId,
      eventId,
      userId: user.id,
      userName: user.name,
      preferredRole: typeof body.preferredRole === "string" ? body.preferredRole : null,
      note: typeof body.note === "string" ? body.note : null,
    });
    const groups = await getGroups();
    const choirGroup = groups.find((entry) => entry.id === groupId);
    const leaderIds =
      choirGroup?.memberIds.filter((memberId) => isGroupLeaderOrAssistant(choirGroup, memberId)) ??
      [];
    if (leaderIds.length) {
      void sendPushToUsers(
        leaderIds,
        {
          title: "Event team interest",
          body: `${user.name} requested to serve at ${event.title}.`,
          url: choirWorshipEventDetailHref(groupId, eventId),
        },
        "worship",
      );
    }
    return { interest };
  }

  if (action === "review_team_interest") {
    if (!(await canManageChoirWorshipEvents(user, groupId))) {
      throw new Error("Not authorized.");
    }
    const interestId = typeof body.interestId === "string" ? body.interestId : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!interestId || !status) throw new Error("Invalid request.");
    const updated = await updateChoirEventTeamInterestStatusJson(
      interestId,
      status as Parameters<typeof updateChoirEventTeamInterestStatusJson>[1],
    );
    if (!updated) throw new Error("Interest not found.");
    return { interest: updated };
  }

  if (action === "set_event_meta") {
    if (!(await canManageChoirWorshipEvents(user, groupId))) {
      throw new Error("Not authorized.");
    }
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    if (!eventId) throw new Error("Event required.");
    const meta = await upsertChoirWorshipEventMetaJson({
      eventId,
      includeOnWorshipEvents: body.includeOnWorshipEvents === true ? true : undefined,
      featuredOrder:
        typeof body.featuredOrder === "number"
          ? body.featuredOrder
          : body.featuredOrder === null
            ? null
            : undefined,
      category: typeof body.category === "string" ? (body.category as never) : undefined,
      shortDescription:
        typeof body.shortDescription === "string" ? body.shortDescription : undefined,
      teamVolunteerOpen: body.teamVolunteerOpen === true ? true : body.teamVolunteerOpen === false ? false : undefined,
      audienceLabel: typeof body.audienceLabel === "string" ? body.audienceLabel : undefined,
    });
    return { meta };
  }

  if (action === "save_guidelines") {
    if (!(await canManageChoirWorshipEvents(user, groupId))) {
      throw new Error("Not authorized.");
    }
    const markdown = typeof body.markdown === "string" ? body.markdown : "";
    if (!markdown.trim()) throw new Error("Guidelines cannot be empty.");
    await saveChoirWorshipEventGuidelinesJson(markdown);
    return { ok: true };
  }

  throw new Error("Unknown action.");
}

export { parseWorshipEventsTab } from "@/lib/choir-events-utils";

export async function listChoirWorshipPastEventCards(user: PublicMember, groupId: string) {
  return listChoirWorshipEventCards(user, groupId, { mode: "past" });
}

