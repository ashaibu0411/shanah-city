import type { PublicMember } from "@/lib/auth-types";
import { getUserById } from "@/lib/auth-server";
import { assertActiveCoupleWorkspace } from "@/lib/couple-workspace-access-server";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import {
  CHECK_IN_DIMENSIONS,
  type CheckInDimensionId,
  type CoupleCheckInAnswerRecord,
} from "@/lib/couple-check-in-types";
import { denverWeekStartKey } from "@/lib/couple-check-in-utils";
import { useDatabase } from "@/lib/use-database";
import * as coupleCheckInDb from "@/lib/stores/couple-check-in-db";
import * as coupleCheckInJson from "@/lib/stores/couple-check-in-json";

const store = () => (useDatabase() ? coupleCheckInDb : coupleCheckInJson);

function parseDimension(value: unknown): CheckInDimensionId {
  const raw = String(value ?? "");
  const allowed = new Set(CHECK_IN_DIMENSIONS.map((d) => d.id));
  return allowed.has(raw as CheckInDimensionId) ? (raw as CheckInDimensionId) : "communication";
}

function answersForUser(answers: CoupleCheckInAnswerRecord[], userId: string) {
  const map: Partial<
    Record<
      CheckInDimensionId,
      { reflection?: string; rating?: number; shareWithSpouse: boolean }
    >
  > = {};
  for (const answer of answers.filter((a) => a.userId === userId)) {
    map[answer.dimension] = {
      reflection: answer.reflection,
      rating: answer.rating,
      shareWithSpouse: answer.shareWithSpouse,
    };
  }
  return map;
}

function sharedFromSpouse(
  answers: CoupleCheckInAnswerRecord[],
  spouseId: string | null,
) {
  if (!spouseId) return {};
  const map: Partial<Record<CheckInDimensionId, { reflection?: string }>> = {};
  for (const answer of answers.filter((a) => a.userId === spouseId && a.shareWithSpouse)) {
    map[answer.dimension] = { reflection: answer.reflection };
  }
  return map;
}

export async function getCoupleCheckInForUser(user: PublicMember, weekStartParam?: string) {
  const link = await assertActiveCoupleWorkspace(user);
  const weekStart = weekStartParam?.trim() || denverWeekStartKey();
  const week = await store().getOrCreateCheckInWeek(link.id, weekStart);
  const answers = await store().listCheckInAnswers(week.id);
  const partnerId = partnerIdFromLink(link, user.id);
  const partner = partnerId ? await getUserById(partnerId) : null;

  return {
    coupleLinkId: link.id,
    weekStart: week.weekStart,
    weekId: week.id,
    dimensions: CHECK_IN_DIMENSIONS,
    myAnswers: answersForUser(answers, user.id),
    spouseShared: sharedFromSpouse(answers, partnerId),
    partnerName: partner?.name,
  };
}

export async function saveCoupleCheckInAnswerForUser(
  user: PublicMember,
  body: Record<string, unknown>,
) {
  const link = await assertActiveCoupleWorkspace(user);
  const weekStart = String(body.weekStart ?? denverWeekStartKey());
  const dimension = parseDimension(body.dimension);
  const reflection = String(body.reflection ?? "").trim();
  const shareWithSpouse = Boolean(body.shareWithSpouse);
  const rawRating = body.rating;
  let rating: number | null | undefined = undefined;
  if (rawRating === null) {
    rating = null;
  } else if (rawRating !== undefined && rawRating !== "") {
    const n = Number(rawRating);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new Error("Choose a rating from 1 to 5, or leave it blank.");
    }
    rating = n;
  }

  if (reflection.length > 2000) {
    throw new Error("Keep your reflection under 2,000 characters.");
  }

  const week = await store().getOrCreateCheckInWeek(link.id, weekStart);
  await store().upsertCheckInAnswer({
    weekId: week.id,
    userId: user.id,
    dimension,
    reflection: reflection || undefined,
    rating: rating === undefined ? undefined : rating,
    shareWithSpouse,
  });

  return getCoupleCheckInForUser(user, weekStart);
}
