import type { PublicMember } from "@/lib/auth-types";
import { getActiveCoupleLinkForUserId } from "@/lib/couple-link-server";
import {
  assertActiveCoupleWorkspace,
  userInActiveCoupleLink,
} from "@/lib/couple-workspace-access-server";
import { getCouplesHubOverview } from "@/lib/couples-hub-server";
import type { CoupleMarriageDevotionalView } from "@/lib/couple-marriage-devotional-types";
import { getDevotionById, getDevotions } from "@/lib/devotion-server";
import { isDevotionPubliclyVisible, pickTodayDevotion } from "@/lib/devotion-utils";
import type { Devotion } from "@/lib/types";
import { useDatabase } from "@/lib/use-database";
import * as coupleMarriageDevotionalDb from "@/lib/stores/couple-marriage-devotional-db";
import * as coupleMarriageDevotionalJson from "@/lib/stores/couple-marriage-devotional-json";

const readStore = () => (useDatabase() ? coupleMarriageDevotionalDb : coupleMarriageDevotionalJson);

function mapChurchDevotionToView(
  devotion: Devotion,
  myReads: Set<string>,
  partnerReads: Set<string>,
): CoupleMarriageDevotionalView {
  const scripture = [devotion.reference?.trim(), devotion.verse?.trim()].filter(Boolean).join("\n");
  const now = new Date().toISOString();
  return {
    id: devotion.id,
    publishDate: devotion.date,
    title: devotion.title,
    scripture,
    teaching: devotion.content ?? "",
    discussion: "",
    assignment: "",
    prayer: devotion.prayer ?? "",
    declaration: "",
    published: isDevotionPubliclyVisible(devotion),
    createdBy: devotion.authorId ?? "",
    createdByName: devotion.authorName ?? "",
    createdAt: devotion.createdAt ?? now,
    updatedAt: devotion.updatedAt ?? now,
    readByMe: myReads.has(devotion.id),
    readBySpouse: partnerReads.has(devotion.id),
  };
}

async function assertCanManage(user: PublicMember) {
  const overview = await getCouplesHubOverview(user);
  if (!overview.canManageMarriageMinistry) {
    throw new Error("Marriage ministry leaders only.");
  }
  return overview;
}

export async function getCoupleMarriageDevotionalsForUser(user: PublicMember) {
  const overview = await getCouplesHubOverview(user);
  const linkRecord = await getActiveCoupleLinkForUserId(user.id);
  const link =
    linkRecord && userInActiveCoupleLink(user.id, linkRecord) ? linkRecord : null;

  if (!link && !overview.canManageMarriageMinistry) {
    throw new Error("Link your spouse account to open your private marriage space.");
  }

  const churchDevotions = await getDevotions({
    includeUnpublished: overview.canManageMarriageMinistry,
  });
  const visibleDevotions = overview.canManageMarriageMinistry
    ? churchDevotions
    : churchDevotions.filter((devotion) => isDevotionPubliclyVisible(devotion));

  const reads = link ? await readStore().listDevotionalReads(link.id) : [];
  const partnerReads = new Set(
    reads.filter((r) => r.readByUserId !== user.id).map((r) => r.devotionalId),
  );
  const myReads = new Set(reads.filter((r) => r.readByUserId === user.id).map((r) => r.devotionalId));

  const items: CoupleMarriageDevotionalView[] = visibleDevotions.map((devotion) =>
    mapChurchDevotionToView(devotion, myReads, partnerReads),
  );

  const today = pickTodayDevotion(visibleDevotions);

  return {
    coupleLinkId: link?.id ?? null,
    devotionals: items,
    todayDevotionalId: today?.id ?? items[0]?.id ?? null,
    usesChurchDevotions: true,
    canManageMarriageMinistry: overview.canManageMarriageMinistry,
  };
}

export async function markCoupleMarriageDevotionalReadForUser(
  user: PublicMember,
  devotionalId: string,
) {
  const link = await assertActiveCoupleWorkspace(user);
  const devotion = await getDevotionById(devotionalId);
  const overview = await getCouplesHubOverview(user);
  if (!devotion) {
    throw new Error("Devotional not found.");
  }
  if (!isDevotionPubliclyVisible(devotion) && !overview.canManageMarriageMinistry) {
    throw new Error("Devotional not found.");
  }

  if (useDatabase()) {
    await coupleMarriageDevotionalDb.markDevotionalRead({
      coupleLinkId: link.id,
      devotionalId,
      readByUserId: user.id,
    });
  } else {
    await coupleMarriageDevotionalJson.markDevotionalRead({
      coupleLinkId: link.id,
      devotionalId,
      readByUserId: user.id,
      readAt: new Date().toISOString(),
    });
  }

  return getCoupleMarriageDevotionalsForUser(user);
}

export async function publishCoupleMarriageDevotionalForUser(
  user: PublicMember,
  _body?: Record<string, unknown>,
) {
  await assertCanManage(user);
  throw new Error("Couples devotionals use the main Devotions library. Publish from Admin → Devotions.");
}

export async function updateCoupleMarriageDevotionalForUser(
  user: PublicMember,
  _devotionalId: string,
  _body: Record<string, unknown>,
) {
  await assertCanManage(user);
  throw new Error("Couples devotionals use the main Devotions library. Edit from Admin → Devotions.");
}
