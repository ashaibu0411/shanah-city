import { getUserById } from "@/lib/auth-server";
import type { PublicMember } from "@/lib/auth-types";
import { SHANAH_POWER_COUPLES_GROUP_ID } from "@/lib/church-groups";
import {
  getActiveCoupleLinkForUserId,
  getActiveCoupleLinksInGroup,
  getCoupleLinkById,
} from "@/lib/couple-link-server";
import { assertGroupResourceAccess } from "@/lib/couple-prayer-access-server";
import type {
  CoupleMentorRequestRecord,
  CoupleMentorRequestView,
} from "@/lib/couple-mentor-types";
import { getGroups } from "@/lib/group-server";
import { useDatabase } from "@/lib/use-database";
import * as coupleMentorDb from "@/lib/stores/couple-mentor-db";
import * as coupleMentorJson from "@/lib/stores/couple-mentor-json";

const store = () => (useDatabase() ? coupleMentorDb : coupleMentorJson);

async function coupleLabelForLink(linkId: string) {
  const link = await getCoupleLinkById(linkId);
  if (!link) return "Unknown couple";
  const [userA, userB] = await Promise.all([
    getUserById(link.userAId),
    getUserById(link.userBId),
  ]);
  return `${userA?.name ?? "Member"} & ${userB?.name ?? "Member"}`;
}

async function enrichRequest(
  request: CoupleMentorRequestRecord,
): Promise<CoupleMentorRequestView> {
  const coupleLabel = await coupleLabelForLink(request.coupleLinkId);
  const mentorLabel = request.mentorLinkId
    ? await coupleLabelForLink(request.mentorLinkId)
    : undefined;
  return { ...request, coupleLabel, mentorLabel };
}

export async function getMentorPanelData(groupId: string, viewer: PublicMember | null) {
  await assertGroupResourceAccess(viewer, groupId, "read");
  const groups = await getGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) throw new Error("Group not found.");

  const coupleLinks = await getActiveCoupleLinksInGroup(group.memberIds);
  const linkIds = coupleLinks.map((link) => link.id);
  const requests = await store().listMentorRequestsForCoupleLinks(linkIds);
  const enriched = await Promise.all(requests.map((request) => enrichRequest(request)));

  const activeLink = viewer ? await getActiveCoupleLinkForUserId(viewer.id) : null;
  const myRequest = activeLink
    ? enriched.find((entry) => entry.coupleLinkId === activeLink.id) ?? null
    : null;

  let canManage = false;
  try {
    await assertGroupResourceAccess(viewer, groupId, "write");
    canManage = true;
  } catch {
    canManage = false;
  }

  const mentorOptions = await Promise.all(
    coupleLinks.map(async (link) => ({
      id: link.id,
      label: await coupleLabelForLink(link.id),
    })),
  );

  return {
    canManage,
    canRequest: Boolean(activeLink),
    myRequest,
    requests: canManage ? enriched : myRequest ? [myRequest] : [],
    mentorOptions: canManage ? mentorOptions : [],
  };
}

export async function createMentorRequestForUser(
  viewer: PublicMember,
  groupId: string,
  note?: string,
) {
  await assertGroupResourceAccess(viewer, groupId, "read");
  if (groupId !== SHANAH_POWER_COUPLES_GROUP_ID) {
    throw new Error("Mentor requests are only available in Shanah Power Couples.");
  }

  const activeLink = await getActiveCoupleLinkForUserId(viewer.id);
  if (!activeLink) {
    throw new Error("Link your spouse account before requesting a mentor couple.");
  }

  const existing = await store().getOpenMentorRequestForCouple(activeLink.id);
  if (existing) {
    throw new Error("You already have an open mentor request.");
  }

  await store().createMentorRequest({
    coupleLinkId: activeLink.id,
    requesterId: viewer.id,
    requesterName: viewer.name,
    note,
  });

  return getMentorPanelData(groupId, viewer);
}

export async function matchMentorRequestForLeader(
  viewer: PublicMember,
  groupId: string,
  requestId: string,
  mentorLinkId: string,
) {
  await assertGroupResourceAccess(viewer, groupId, "write");

  const request = await store().getMentorRequestById(requestId);
  if (!request || request.status !== "open") {
    throw new Error("Open mentor request not found.");
  }
  if (request.coupleLinkId === mentorLinkId) {
    throw new Error("Choose a different couple as mentors.");
  }

  const mentorLink = await getCoupleLinkById(mentorLinkId);
  if (!mentorLink || mentorLink.status !== "active") {
    throw new Error("Choose an active linked couple as mentors.");
  }

  await store().matchMentorRequest({
    id: requestId,
    mentorLinkId,
    matchedBy: viewer.id,
    matchedByName: viewer.name,
  });

  return getMentorPanelData(groupId, viewer);
}

export async function closeMentorRequestForLeader(
  viewer: PublicMember,
  groupId: string,
  requestId: string,
) {
  await assertGroupResourceAccess(viewer, groupId, "write");
  await store().closeMentorRequest(requestId);
  return getMentorPanelData(groupId, viewer);
}
