import type { PublicMember } from "@/lib/auth-types";
import { getActiveCoupleLinkForUserId } from "@/lib/couple-link-server";
import {
  assertActiveCoupleWorkspace,
  userInActiveCoupleLink,
} from "@/lib/couple-workspace-access-server";
import { getCouplesHubOverview } from "@/lib/couples-hub-server";
import type { CoupleMarriageDevotionalView } from "@/lib/couple-marriage-devotional-types";
import { useDatabase } from "@/lib/use-database";
import * as coupleMarriageDevotionalDb from "@/lib/stores/couple-marriage-devotional-db";
import * as coupleMarriageDevotionalJson from "@/lib/stores/couple-marriage-devotional-json";

const store = () => (useDatabase() ? coupleMarriageDevotionalDb : coupleMarriageDevotionalJson);

async function assertCanManage(user: PublicMember) {
  const overview = await getCouplesHubOverview(user);
  if (!overview.canManageMarriageMinistry) {
    throw new Error("Marriage ministry leaders only.");
  }
  return overview;
}

function devotionalFields(body: Record<string, unknown>) {
  const title = String(body.title ?? "").trim();
  const publishDate = String(body.publishDate ?? "").trim();
  const scripture = String(body.scripture ?? "").trim();
  const teaching = String(body.teaching ?? "").trim();
  const discussion = String(body.discussion ?? "").trim();
  const assignment = String(body.assignment ?? "").trim();
  const prayer = String(body.prayer ?? "").trim();
  const declaration = String(body.declaration ?? "").trim();

  if (!title || !publishDate) throw new Error("Title and publish date are required.");
  if (!scripture || !teaching) throw new Error("Scripture and teaching are required.");

  return {
    publishDate,
    title,
    scripture,
    teaching,
    discussion,
    assignment,
    prayer,
    declaration,
    published: Boolean(body.published),
  };
}

export async function getCoupleMarriageDevotionalsForUser(user: PublicMember) {
  const overview = await getCouplesHubOverview(user);
  const linkRecord = await getActiveCoupleLinkForUserId(user.id);
  const link =
    linkRecord && userInActiveCoupleLink(user.id, linkRecord) ? linkRecord : null;

  if (!link && !overview.canManageMarriageMinistry) {
    throw new Error("Link your spouse account to open your private marriage space.");
  }

  const devotionals = await store().listMarriageDevotionals({ publishedOnly: !overview.canManageMarriageMinistry });
  const reads = link ? await store().listDevotionalReads(link.id) : [];
  const partnerReads = new Set(
    reads.filter((r) => r.readByUserId !== user.id).map((r) => r.devotionalId),
  );
  const myReads = new Set(reads.filter((r) => r.readByUserId === user.id).map((r) => r.devotionalId));

  const items: CoupleMarriageDevotionalView[] = devotionals.map((devotional) => ({
    ...devotional,
    readByMe: myReads.has(devotional.id),
    readBySpouse: partnerReads.has(devotional.id),
  }));

  return {
    coupleLinkId: link?.id ?? null,
    devotionals: items,
    canManageMarriageMinistry: overview.canManageMarriageMinistry,
  };
}

export async function markCoupleMarriageDevotionalReadForUser(
  user: PublicMember,
  devotionalId: string,
) {
  const link = await assertActiveCoupleWorkspace(user);
  const devotional = await store().getMarriageDevotional(devotionalId);
  if (!devotional || !devotional.published) {
    const overview = await getCouplesHubOverview(user);
    if (!devotional || (!devotional.published && !overview.canManageMarriageMinistry)) {
      throw new Error("Devotional not found.");
    }
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
  body: Record<string, unknown>,
) {
  await assertCanManage(user);
  const fields = devotionalFields(body);

  const record = await store().createMarriageDevotional({
    ...fields,
    createdBy: user.id,
    createdByName: user.name,
  });

  return { devotional: record };
}

export async function updateCoupleMarriageDevotionalForUser(
  user: PublicMember,
  devotionalId: string,
  body: Record<string, unknown>,
) {
  await assertCanManage(user);
  const existing = await store().getMarriageDevotional(devotionalId);
  if (!existing) throw new Error("Devotional not found.");

  const fields = devotionalFields({ ...existing, ...body });
  const record = await store().updateMarriageDevotional(devotionalId, fields);
  return { devotional: record };
}
