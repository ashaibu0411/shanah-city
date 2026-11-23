import { sendPushToUsers } from "@/lib/push-server";
import type { KidCheckIn } from "@/lib/member-types";
import type { KidsIncident, KidsLesson } from "@/lib/kids-types";
import { getConfiguredKidsGroupId } from "@/lib/kids-access-server";
import { getGroups } from "@/lib/group-server";
import { isKidsMinistryGroup } from "@/lib/kids-types";

async function getKidsTeamUserIds() {
  const configuredId = getConfiguredKidsGroupId();
  const groups = await getGroups();
  const ids = new Set<string>();

  for (const group of groups) {
    if (group.id === configuredId || isKidsMinistryGroup(group)) {
      for (const memberId of group.memberIds) {
        ids.add(memberId);
      }
    }
  }

  return [...ids];
}

export async function notifyKidsCheckIn(checkIn: KidCheckIn) {
  const userIds = await getKidsTeamUserIds().then((ids) =>
    ids.filter((id) => id !== checkIn.parentUserId),
  );
  const hasAllergy = Boolean(checkIn.allergies?.trim());
  const hasMedical = Boolean(checkIn.medicalNotes?.trim());
  const urgent = hasAllergy || hasMedical;

  // Lock-screen notifications must never contain children's names or medical details.
  const body = urgent
    ? "A child has a safety note requiring staff review. Open the secure Kids Ministry dashboard."
    : "A child has checked in. Open the secure Kids Ministry dashboard for details.";

  return sendPushToUsers(
    userIds,
    {
      title: urgent ? "Kids check-in — safety alert" : "Kids check-in",
      body,
      url: `/kids-ministry?service=${encodeURIComponent(checkIn.service)}`,
    },
    "kids",
  );
}

export async function notifyKidsLessonPublished(lesson: KidsLesson) {
  const userIds = await getKidsTeamUserIds();
  return sendPushToUsers(
    userIds.filter((id) => id !== lesson.createdBy),
    {
      title: "Kids lesson published",
      body: `${lesson.ageGroup}: ${lesson.title}`,
      url: `/kids-ministry?week=${encodeURIComponent(lesson.weekStarting)}`,
    },
    "kids",
  );
}

export async function notifyKidsIncident(incident: KidsIncident) {
  if (!incident.parentUserId) {
    return { sent: 0, skipped: 1, configured: false };
  }

  return sendPushToUsers(
    [incident.parentUserId],
    {
      title: "Kids ministry update",
      body: "Please sign in to review a private Kids Ministry update.",
      url: "/profile",
    },
    "kids",
  );
}

/** Notify the linked guardian without exposing the pickup secret on the lock screen. */
export async function notifyGuardianKidsCheckIn(checkIn: KidCheckIn) {
  if (!checkIn.parentUserId) return { sent: 0, skipped: 1, configured: false };
  return sendPushToUsers(
    [checkIn.parentUserId],
    {
      title: "Shanah Kids — check-in confirmed",
      body: "Check-in confirmed. Sign in to view your private pickup information.",
      url: "/kids-pickup",
    },
    "kids",
  );
}

export async function notifyGuardianKidsCheckOut(checkIn: KidCheckIn) {
  if (!checkIn.parentUserId) return { sent: 0, skipped: 1, configured: false };
  return sendPushToUsers(
    [checkIn.parentUserId],
    {
      title: "Shanah Kids — checkout confirmed",
      body: "Checkout confirmed. Sign in to view your Kids Ministry record.",
      url: "/kids-pickup",
    },
    "kids",
  );
}
