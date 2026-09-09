import {
  daysUntilAnniversary,
  shouldShowAnniversaryNudge,
  yearsMarried,
} from "@/lib/couple-anniversary-utils";
import type { PublicMember } from "@/lib/auth-types";
import { getUserByEmail, getUserById } from "@/lib/auth-server";
import type { CoupleLinkRecord, CoupleLinkStatusResponse, CoupleLinkView } from "@/lib/couple-link-types";
import { partnerIdFromLink } from "@/lib/couple-link-utils";
import { useDatabase } from "@/lib/use-database";
import * as coupleLinkDb from "@/lib/stores/couple-link-db";
import * as coupleLinkJson from "@/lib/stores/couple-link-json";

const store = () => (useDatabase() ? coupleLinkDb : coupleLinkJson);

async function toView(link: CoupleLinkRecord, viewerId: string): Promise<CoupleLinkView | null> {
  const partnerId = partnerIdFromLink(link, viewerId);
  if (!partnerId) return null;
  const partner = await getUserById(partnerId);
  if (!partner) return null;
  return {
    id: link.id,
    status: link.status,
    partnerId: partner.id,
    partnerName: partner.name,
    partnerEmail: partner.email,
    requestedBy: link.requestedBy,
    isIncomingInvite: link.status === "pending" && link.requestedBy !== viewerId,
    acceptedAt: link.acceptedAt,
    anniversaryDate: link.anniversaryDate,
  };
}

function anniversaryNudgeForLink(link: CoupleLinkRecord | null | undefined) {
  if (!link?.anniversaryDate || !shouldShowAnniversaryNudge(link.anniversaryDate)) {
    return null;
  }
  const daysUntil = daysUntilAnniversary(link.anniversaryDate);
  if (daysUntil == null) return null;
  return {
    daysUntil,
    yearsMarried: yearsMarried(link.anniversaryDate),
    anniversaryDate: link.anniversaryDate,
  };
}

export async function getCoupleLinkStatus(viewer: PublicMember): Promise<CoupleLinkStatusResponse> {
  const links = await store().getCoupleLinksForUser(viewer.id);
  const active = links.find((link) => link.status === "active");
  if (active) {
    const view = await toView(active, viewer.id);
    return {
      link: view,
      pendingIncoming: null,
      anniversaryNudge: anniversaryNudgeForLink(active),
    };
  }

  const pendingIncoming = links.find(
    (link) => link.status === "pending" && link.requestedBy !== viewer.id,
  );
  const pendingOutgoing = links.find(
    (link) => link.status === "pending" && link.requestedBy === viewer.id,
  );

  const link = pendingOutgoing ? await toView(pendingOutgoing, viewer.id) : null;
  const incoming = pendingIncoming ? await toView(pendingIncoming, viewer.id) : null;
  return { link, pendingIncoming: incoming, anniversaryNudge: null };
}

export async function getActiveCouplePartner(viewer: PublicMember) {
  const active = await store().getActiveCoupleLinkForUser(viewer.id);
  if (!active) return null;
  const partnerId = partnerIdFromLink(active, viewer.id);
  if (!partnerId) return null;
  return getUserById(partnerId);
}

export async function inviteCouplePartner(viewer: PublicMember, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Enter your spouse's email.");
  }

  const partner = await getUserByEmail(normalized);
  if (!partner) {
    throw new Error("No member found with that email.");
  }
  if (partner.id === viewer.id) {
    throw new Error("You cannot link to your own account.");
  }

  const existingActive = await store().getActiveCoupleLinkForUser(viewer.id);
  if (existingActive) {
    throw new Error("You already have a linked spouse account.");
  }

  const partnerActive = await store().getActiveCoupleLinkForUser(partner.id);
  if (partnerActive) {
    throw new Error("That member is already linked to another spouse.");
  }

  const links = await store().getCoupleLinksForUser(viewer.id);
  const duplicate = links.find(
    (link) =>
      link.status !== "declined" &&
      (partnerIdFromLink(link, viewer.id) === partner.id ||
        partnerIdFromLink(link, partner.id) === viewer.id),
  );
  if (duplicate) {
    throw new Error("A link request already exists with that member.");
  }

  return store().createCoupleLink({
    userAId: viewer.id,
    userBId: partner.id,
    requestedBy: viewer.id,
  });
}

export async function respondToCoupleLink(
  viewer: PublicMember,
  linkId: string,
  action: "accept" | "decline",
) {
  const link = await store().getCoupleLinkById(linkId);
  if (!link) {
    throw new Error("Link request not found.");
  }
  if (link.status !== "pending") {
    throw new Error("That request is no longer pending.");
  }

  const partnerId = partnerIdFromLink(link, viewer.id);
  if (!partnerId || link.requestedBy === viewer.id) {
    throw new Error("Only your spouse can accept or decline this invite.");
  }

  if (action === "accept") {
    const existing = await store().getActiveCoupleLinkForUser(viewer.id);
    if (existing) {
      throw new Error("You already have a linked spouse account.");
    }
    return store().updateCoupleLinkStatus(linkId, "active");
  }

  return store().updateCoupleLinkStatus(linkId, "declined");
}

export async function removeCoupleLink(viewer: PublicMember, linkId: string) {
  const link = await store().getCoupleLinkById(linkId);
  if (!link) {
    throw new Error("Link not found.");
  }
  if (link.userAId !== viewer.id && link.userBId !== viewer.id) {
    throw new Error("You are not part of this link.");
  }
  await store().deleteCoupleLink(linkId);
}

export async function getActiveCoupleLinkForUserId(userId: string) {
  return store().getActiveCoupleLinkForUser(userId);
}

export async function getCoupleLinkById(id: string) {
  return store().getCoupleLinkById(id);
}

export async function saveCoupleAnniversary(viewer: PublicMember, anniversaryDate: string) {
  const active = await store().getActiveCoupleLinkForUser(viewer.id);
  if (!active) {
    throw new Error("Link your spouse account first.");
  }
  const trimmed = anniversaryDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("Use a full anniversary date (YYYY-MM-DD).");
  }
  return store().updateCoupleAnniversary(active.id, trimmed);
}

export async function getActiveCoupleLinksInGroup(memberIds: string[]) {
  return store().getActiveCoupleLinksForGroup(memberIds);
}
